/**
 * Durable article automation for Vercel.
 *
 * Auto article jobs live in Postgres (app_state JSON) instead of a process-local
 * Map, so closing the admin page does not stop them. A Vercel Cron invokes the
 * worker every five minutes. The worker reuses the proven manual article
 * generator, keeping the same AI-provider settings and free-model cascade.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { db, appStateTable } from '@workspace/db';
import { eq } from 'drizzle-orm';

const APP_STATE_ID = 1;
const TASK_MAX_AGE_MS = 20 * 60 * 1000;

function cookieValue(cookieHeader, name) {
  const part = String(cookieHeader || '')
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));
  return part ? decodeURIComponent(part.slice(name.length + 1)) : '';
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a), 'utf8');
  const right = Buffer.from(String(b), 'utf8');
  return left.length === right.length && timingSafeEqual(left, right);
}

function verifyAdminCookie(req) {
  const token =
    cookieValue(req.headers.cookie, '__Host-admin_session') ||
    cookieValue(req.headers.cookie, 'admin_session_v2') ||
    cookieValue(req.headers.cookie, 'admin_session');
  if (!token || !token.startsWith('v4.')) return false;

  const value = token.slice(3);
  const separator = value.lastIndexOf('.');
  if (separator <= 0) return false;
  const encoded = value.slice(0, separator);
  const signature = value.slice(separator + 1);
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;
  const expected = createHmac('sha256', secret).update(encoded).digest('base64url');
  if (!safeEqual(expected, signature)) return false;

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    return Boolean(payload?.username && payload?.expiresAt > Math.floor(Date.now() / 1000));
  } catch {
    return false;
  }
}

function buildAdminCookie() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const expiresAt = Math.floor(Date.now() / 1000) + 300;
  const nonce = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const payload = JSON.stringify({ username, expiresAt, nonce });
  const encoded = Buffer.from(payload, 'utf8').toString('base64url');
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET is required for article automation.');
  const signature = createHmac('sha256', secret).update(encoded).digest('base64url');
  return `__Host-admin_session=${encodeURIComponent(`v4.${encoded}.${signature}`)}`;
}

async function readState() {
  const rows = await db.select().from(appStateTable).where(eq(appStateTable.id, APP_STATE_ID)).limit(1);
  if (!rows[0]) throw new Error('app_state row is missing.');
  return { row: rows[0], data: rows[0].data || {} };
}

async function writeState(row, data) {
  await db.update(appStateTable).set({ data, updatedAt: new Date() }).where(eq(appStateTable.id, APP_STATE_ID));
  return data;
}

function getTasks(data) {
  return Array.isArray(data.automationTasks) ? data.automationTasks : [];
}

function isQuotaError(message) {
  return /429|rate.?limit|quota|credits|insufficient|too many requests|capacity/i.test(String(message));
}

function taskSummary(task) {
  return {
    id: task.id,
    status: task.status,
    progress: task.progress || 0,
    stage: task.stage,
    result: task.result,
    error: task.error,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

export async function enqueue(req, res) {
  if (!verifyAdminCookie(req)) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'Authentication required.' }));
    return;
  }

  const body = req.body || {};
  const calculatorId = String(body.calculatorId || '').trim();
  const calculatorName = String(body.calculatorName || calculatorId).trim();
  const keywords = Array.isArray(body.keywords) ? body.keywords.map(String).filter(Boolean) : [];
  const title = String(body.title || '').trim();

  if (!calculatorId || !calculatorName) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'calculatorId and calculatorName are required.' }));
    return;
  }

  const task = {
    id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    status: 'queued',
    progress: 0,
    stage: 'Queued for durable automation worker',
    calculatorId,
    calculatorName,
    keywords,
    title: title || `${calculatorName}: Complete Guide`,
    retryCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const { row, data } = await readState();
  const tasks = getTasks(data);
  tasks.push(task);
  data.automationTasks = tasks.slice(-100);
  await writeState(row, data);

  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ success: true, taskId: task.id }));
}

export async function status(req, res, taskId) {
  if (!verifyAdminCookie(req)) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'Authentication required.' }));
    return;
  }
  const { data } = await readState();
  const task = getTasks(data).find((item) => item.id === taskId);
  if (!task) {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Task not found.' }));
    return;
  }
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(taskSummary(task)));
}

async function claimNextTask() {
  const { row, data } = await readState();
  const tasks = getTasks(data);
  const now = Date.now();
  const queued = tasks.find((task) => task.status === 'queued');
  const stale = tasks.find(
    (task) => task.status === 'running' && now - new Date(task.updatedAt || task.createdAt).getTime() > TASK_MAX_AGE_MS,
  );
  const task = queued || stale;
  if (!task) return null;

  task.status = 'running';
  task.progress = 10;
  task.stage = 'Worker started — sending article to the proven manual generator';
  task.updatedAt = new Date().toISOString();
  await writeState(row, data);
  return task;
}

function buildManualPayload(task) {
  const keyword = task.keywords[0] || task.calculatorName;
  const secondary = task.keywords.slice(1, 8);
  const slug = `${task.calculatorName}-${keyword}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'calculator-guide';

  return {
    keyword,
    primaryKeyword: keyword,
    secondaryKeywords: secondary,
    selectedTitle: task.title,
    intentAnalysis: 'Informational search intent: explain the calculator/topic clearly and help the reader act on the result.',
    outline: [
      { heading: `What Is ${keyword}?`, level: 'h2', subpoints: ['Definition', 'Why it matters', 'Key facts'] },
      { heading: `How to Use ${task.calculatorName}`, level: 'h2', subpoints: ['Step-by-step instructions', 'Inputs and results', 'Practical example'] },
      { heading: 'Practical Examples', level: 'h2', subpoints: ['Real-world example', 'Common scenario', 'Interpretation'] },
      { heading: 'Common Questions', level: 'h2', subpoints: ['Frequently searched questions', 'Common mistakes', 'Best practices'] },
    ],
    metaTitle: task.title.slice(0, 60),
    metaDescription: `Learn how to use ${task.calculatorName}, understand the result, and apply the calculation with practical examples and clear steps.`.slice(0, 160),
    urlSlug: slug,
    lockedKeywords: [keyword, ...secondary],
  };
}

export async function worker(req, res) {
  const expected = process.env.CRON_SECRET;
  const auth = String(req.headers.authorization || '');
  const provided = auth.startsWith('Bearer ') ? auth.slice(7) : String(req.headers['x-cron-secret'] || '');
  if (!expected || !provided || !safeEqual(expected, provided)) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'Unauthorized worker.' }));
    return;
  }

  const task = await claimNextTask();
  if (!task) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true, processed: false, message: 'No queued article jobs.' }));
    return;
  }

  const baseUrl = `https://${req.headers.host}`;
  try {
    const response = await fetch(`${baseUrl}/api/admin/seo-finder/generate-article`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: buildAdminCookie(),
      },
      body: JSON.stringify(buildManualPayload(task)),
      signal: AbortSignal.timeout(120000),
    });

    const raw = await response.text();
    let payload = {};
    try { payload = raw ? JSON.parse(raw) : {}; } catch { payload = { error: raw }; }

    const { row, data } = await readState();
    const current = getTasks(data).find((item) => item.id === task.id);
    if (!current) throw new Error('Automation task disappeared from durable state.');

    if (!response.ok) {
      const message = String(payload?.error || `Manual generator returned HTTP ${response.status}`);
      if (isQuotaError(message)) {
        current.status = 'paused_quota';
        current.stage = 'Paused — free-model quota/rate limit reached. Waiting for the next worker run.';
      } else {
        current.status = 'failed';
        current.stage = 'Generation failed';
      }
      current.error = message;
      current.retryCount = (current.retryCount || 0) + 1;
      current.updatedAt = new Date().toISOString();
      await writeState(row, data);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, taskId: task.id, status: current.status, error: message }));
      return;
    }

    current.status = 'completed';
    current.progress = 100;
    current.stage = 'Done';
    current.result = payload;
    current.error = undefined;
    current.updatedAt = new Date().toISOString();
    await writeState(row, data);

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true, processed: true, taskId: task.id }));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const { row, data } = await readState();
    const current = getTasks(data).find((item) => item.id === task.id);
    if (current) {
      current.status = isQuotaError(message) ? 'paused_quota' : 'failed';
      current.stage = isQuotaError(message)
        ? 'Paused — free-model quota/rate limit reached. Waiting for the next worker run.'
        : 'Generation failed';
      current.error = message;
      current.retryCount = (current.retryCount || 0) + 1;
      current.updatedAt = new Date().toISOString();
      await writeState(row, data);
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, taskId: task.id, status: current?.status || 'failed', error: message }));
  }
}

export async function handle(req, res, pathname) {
  if (req.method === 'POST' && pathname === '/articles/generate-async') return enqueue(req, res);
  if (req.method === 'GET' && pathname.startsWith('/tasks/')) return status(req, res, pathname.slice('/tasks/'.length));
  if ((req.method === 'GET' || req.method === 'POST') && pathname === '/tasks/worker') return worker(req, res);
  return false;
}

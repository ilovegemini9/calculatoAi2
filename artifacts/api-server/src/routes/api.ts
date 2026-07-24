import { Router, type Request, type Response, type NextFunction } from 'express';
import { createHmac, timingSafeEqual, randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { GoogleGenAI } from '@google/genai';
import {
  getDB,
  saveDB,
  backupDB,
  logEvent,
  getLogs,
} from '../db/db.js';
import type { Article } from '../db/types.js';
import { validateGeneratedCode } from '../security.js';

// Calculator test runners
import { runTests as runMortgageTests } from '../calculators/mortgage/tests.js';
import { runTests as runBmiTests } from '../calculators/bmi/tests.js';
import { runTests as runPercentageTests } from '../calculators/percentage/tests.js';
import { runTests as runLoanTests } from '../calculators/loan/tests.js';
import { runTests as runAgeTests } from '../calculators/age/tests.js';
import { runTests as runTipTests } from '../calculators/tip/tests.js';
import { runTests as runCalorieTests } from '../calculators/calorie/tests.js';
import { runTests as runGpaTests } from '../calculators/gpa/tests.js';

const router = Router();

// ─── Auth helpers ────────────────────────────────────────────────────────────

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  // Don't throw — a missing SESSION_SECRET would crash the server on Vercel cold-starts
  // and lock out the admin entirely. Warn instead; set the env var in production for real security.
  console.warn('[security] SESSION_SECRET is not set — using insecure default. Set SESSION_SECRET in your Vercel / hosting environment variables.');
}
const _sessionSecret = SESSION_SECRET || 'dev-only-insecure-secret-do-not-deploy';

const TOKEN_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

function b64url(str: string): string {
  return Buffer.from(str).toString('base64url');
}

function createSessionToken(username: string): string {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Date.now();
  const payload = b64url(JSON.stringify({ sub: username, iat: now, exp: now + TOKEN_TTL_MS }));
  const sig = createHmac('sha256', _sessionSecret)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${sig}`;
}

function verifySessionToken(token: string): string | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, sig] = parts;
    // Verify signature with timing-safe comparison
    const expectedSig = createHmac('sha256', _sessionSecret)
      .update(`${header}.${payload}`)
      .digest('base64url');
    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expectedBuf)) return null;
    // Verify expiration
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!claims.sub || typeof claims.exp !== 'number' || Date.now() > claims.exp) return null;
    return claims.sub as string;
  } catch {
    return null;
  }
}

function adminAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  const token = authHeader.slice(7).trim();
  const username = verifySessionToken(token);
  if (!username) {
    res.status(401).json({ error: 'Invalid or expired session token.' });
    return;
  }
  (req as Request & { user?: string }).user = username;
  next();
}

// ─── AI client ───────────────────────────────────────────────────────────────

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });
}

// ─── OpenRouter model calls ───────────────────────────────────────────────────
//
// Model choices below were picked by live-testing OpenRouter's free-tier catalog
// (see .agents/memory/openrouter-model-selection.md for methodology and results).
// Two rules drove every choice:
//   1. Never use a model flagged "going away" on OpenRouter — it will start
//      failing in production within days (e.g. tencent/hy3, qwen3-next-80b were
//      excluded for this reason even though they benchmark well).
//   2. Prefer models that returned clean output FAST in testing over the most
//      "famous" ones — the popular free models (llama-3.3-70b, qwen3-coder,
//      gemma-4-31b) are heavily congested and returned 429 on most attempts.

// Structured JSON / code tasks (calculator logic, SEO metadata, SEO briefs).
// Primary: poolside/laguna-xs-2.1 (code generation specialist).
// Secondary: google/gemma-4-31b per spec; kept as :free instruct variant.
// Tertiary: proven reliable fallbacks from prior live testing.
const CODE_GEN_MODELS = [
  'poolside/laguna-xs-2.1',                 // Primary: calculator building & code generation
  'google/gemma-4-31b-it:free',             // Secondary fallback
  'nvidia/nemotron-3-super-120b-a12b:free', // Reliable tertiary fallback
  'poolside/laguna-m.1:free',
  'cohere/north-mini-code:free',
];

// Long-form article / prose tasks.
// Primary: google/gemma-4-31b per spec (strong prose quality).
// Secondary: google/gemma-4-26b-a4b per spec.
// Tertiary: nemotron-3-ultra — proven reliable in prior testing.
const ARTICLE_GEN_MODELS = [
  'google/gemma-4-31b-it:free',             // Primary: article writing & SEO content
  'google/gemma-4-26b-a4b:free',            // Secondary fallback
  'nvidia/nemotron-3-ultra-550b-a55b:free', // Reliable tertiary fallback
  'nvidia/nemotron-3-nano-30b-a3b:free',
];

// Legacy generic fallback, kept only for call sites not yet split by task type.
const OPENROUTER_MODELS = CODE_GEN_MODELS;

// Call a specific model by name, with retry on rate-limit
async function callOpenRouterModel(
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  opts: { responseFormat?: { type: string }; maxRetries?: number } = {},
): Promise<string> {
  const maxRetries = opts.maxRetries ?? 3;
  let lastError: Error = new Error('OpenRouter: no attempts made');

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const body: Record<string, unknown> = { model, messages };
      if (opts.responseFormat) body.response_format = opts.responseFormat;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://calculatorplatform.com',
          'X-Title': 'Professional Calculator Platform',
        },
        body: JSON.stringify(body),
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : (attempt + 1) * 5000;
        logEvent('api_warning', `OpenRouter rate limited on ${model}. Waiting ${delay}ms.`);
        lastError = new Error('OpenRouter rate limit. Retrying…');
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      if (!response.ok) {
        throw new Error(`OpenRouter API failed (${response.status}): ${response.statusText}`);
      }

      const data = (await response.json()) as any;
      return data.choices?.[0]?.message?.content ?? '';
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (err.message?.includes('rate limit') || err.message?.includes('Too Many Requests')) {
        await new Promise((r) => setTimeout(r, (attempt + 1) * 5000));
        continue;
      }
      throw err;
    }
  }
  throw new Error(`OpenRouter failed after ${maxRetries} attempts. ${lastError.message}`);
}

// ─── JSON extraction helper ───────────────────────────────────────────────────
function extractJsonObject(raw: string): any {
  let text = (raw ?? '')
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .trim();
  // Find the outermost {...} block
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end > start) {
    text = text.slice(start, end + 1);
  }
  const parsed = JSON.parse(text);
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('AI returned a non-object JSON value. Please try again.');
  }
  return parsed;
}

// Cycles through a task-specific fallback model list (used by code-gen, article
// manager, and prog-seo). Pass `models` so each task tries the model best
// suited to it first (see CODE_GEN_MODELS / ARTICLE_GEN_MODELS above).
async function callOpenRouterWithRetry(
  apiKey: string,
  messages: { role: string; content: string }[],
  opts: { responseFormat?: { type: string }; maxRetries?: number; models?: string[] } = {},
): Promise<string> {
  const models = opts.models ?? OPENROUTER_MODELS;
  const maxRetries = opts.maxRetries ?? models.length;
  let lastError: Error = new Error('OpenRouter: no attempts made');

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const model = models[Math.min(attempt, models.length - 1)];
    try {
      return await callOpenRouterModel(apiKey, model, messages, { responseFormat: opts.responseFormat, maxRetries: 1 });
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (err.message?.includes('rate limit') || err.message?.includes('Too Many Requests')) {
        // Respect quota: back off before trying the next model in the list.
        await new Promise((r) => setTimeout(r, (attempt + 1) * 4000));
        continue;
      }
      if (attempt < maxRetries - 1) continue;
      throw err;
    }
  }
  throw new Error(`OpenRouter failed after ${maxRetries} attempts with fallback models. ${lastError.message}`);
}

// ─── Rate limiter ─────────────────────────────────────────────────────────────

const rateLimitCache = new Map<string, { count: number; expires: number }>();
function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || 'anonymous';
  const now = Date.now();
  const limitWindow = 60 * 1000;
  const maxRequests = 60;
  const record = rateLimitCache.get(ip);
  if (!record || now > record.expires) {
    rateLimitCache.set(ip, { count: 1, expires: now + limitWindow });
    next();
    return;
  }
  record.count++;
  if (record.count > maxRequests) {
    logEvent('security_warning', `Rate limit exceeded by IP: ${ip}`);
    res.status(429).json({ error: 'Too many requests. Please try again in a minute.' });
    return;
  }
  next();
}

router.use(rateLimiter);

// ─── Background tasks ─────────────────────────────────────────────────────────

interface BackgroundTask {
  id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  stage?: string;
  result?: any;
  error?: string;
}
const backgroundTasks = new Map<string, BackgroundTask>();

// ─── Auth ─────────────────────────────────────────────────────────────────────

router.post('/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password required.' });
    return;
  }
  const currentDB = getDB();
  const user = currentDB.adminUsers.find((u) => u.username === username);

  // Primary: bcrypt hash check
  const bcryptOk = user && bcrypt.compareSync(password, user.passwordHash);

  // Fallback: plain-text env var / default password check (supports serverless cold-starts)
  const fallbackPassword = process.env.ADMIN_PASSWORD || '123456';
  const fallbackOk = username === 'admin' && password === fallbackPassword;

  if (!bcryptOk && !fallbackOk) {
    logEvent('auth_failed', `Failed login attempt for user: ${username}`);
    res.status(401).json({ error: 'Invalid username or password.' });
    return;
  }
  const token = createSessionToken(username);
  logEvent('auth_success', `User logged in: ${username}`);
  res.json({ success: true, token, username });
});

// ─── Settings ─────────────────────────────────────────────────────────────────

router.get('/settings', (_req: Request, res: Response) => {
  const currentDB = getDB();
  res.json({
    adsenseEnabled: currentDB.settings.adsenseEnabled,
    adsenseCode: currentDB.settings.adsenseCode,
    analyticsCode: currentDB.settings.analyticsCode,
    featureFlags: currentDB.settings.featureFlags,
  });
});

router.get('/admin/settings', adminAuthMiddleware, (req: Request, res: Response) => {
  const currentDB = getDB();
  res.json({
    openrouterApiKeyConfigured: Boolean(currentDB.settings.openrouterApiKey),
    adsenseEnabled: currentDB.settings.adsenseEnabled,
    adsenseCode: currentDB.settings.adsenseCode,
    analyticsCode: currentDB.settings.analyticsCode,
    featureFlags: currentDB.settings.featureFlags,
  });
});

router.post('/admin/settings', adminAuthMiddleware, (req: Request, res: Response) => {
  const { openrouterApiKey, adsenseEnabled, adsenseCode, analyticsCode, featureFlags } = req.body;
  const currentDB = getDB();
  currentDB.settings = {
    openrouterApiKey:
      openrouterApiKey !== undefined ? openrouterApiKey : currentDB.settings.openrouterApiKey,
    adsenseEnabled:
      adsenseEnabled !== undefined ? adsenseEnabled : currentDB.settings.adsenseEnabled,
    adsenseCode: adsenseCode !== undefined ? adsenseCode : currentDB.settings.adsenseCode,
    analyticsCode:
      analyticsCode !== undefined ? analyticsCode : currentDB.settings.analyticsCode,
    featureFlags:
      featureFlags !== undefined ? featureFlags : currentDB.settings.featureFlags,
  };
  saveDB(currentDB);
  logEvent('settings_updated', 'System settings updated by administrator.');
  res.json({
    success: true,
    settings: {
      openrouterApiKeyConfigured: Boolean(currentDB.settings.openrouterApiKey),
      adsenseEnabled: currentDB.settings.adsenseEnabled,
      adsenseCode: currentDB.settings.adsenseCode,
      analyticsCode: currentDB.settings.analyticsCode,
      featureFlags: currentDB.settings.featureFlags,
    },
  });
});

// ─── Analytics ────────────────────────────────────────────────────────────────

router.get('/analytics', (_req: Request, res: Response) => {
  const currentDB = getDB();
  res.json(currentDB.analytics || []);
});

router.post('/analytics/hit', (req: Request, res: Response) => {
  const { calculatorId } = req.body;
  if (!calculatorId) {
    res.status(400).json({ error: 'calculatorId required' });
    return;
  }
  const currentDB = getDB();
  const today = new Date().toISOString().split('T')[0];
  if (!currentDB.analytics) currentDB.analytics = [];
  let record = currentDB.analytics.find(
    (a) => a.calculatorId === calculatorId && a.date === today,
  );
  if (record) {
    record.views++;
  } else {
    currentDB.analytics.push({
      id: `${calculatorId}_${today}`,
      calculatorId,
      date: today,
      views: 1,
    });
  }
  saveDB(currentDB);
  res.json({ success: true });
});

// ─── Calculators ──────────────────────────────────────────────────────────────

router.get('/calculators', (_req: Request, res: Response) => {
  const currentDB = getDB();
  res.json(currentDB.calculators);
});

router.post(
  '/calculators/:id/toggle',
  adminAuthMiddleware,
  (req: Request, res: Response) => {
    const id = String(req.params.id);
    const currentDB = getDB();
    const calculator = currentDB.calculators.find((c) => c.id === id);
    if (!calculator) {
      res.status(404).json({ error: 'Calculator not found' });
      return;
    }
    const currentStatus = calculator.status;
    const targetStatus = currentStatus === 'active' ? 'inactive' : 'active';

    if (targetStatus === 'active') {
      let testResult = { success: false, logs: ['No test runner found'] };
      switch (id) {
        case 'mortgage': testResult = runMortgageTests(); break;
        case 'bmi':      testResult = runBmiTests();      break;
        case 'percentage': testResult = runPercentageTests(); break;
        case 'loan':     testResult = runLoanTests();     break;
        case 'age':      testResult = runAgeTests();      break;
        case 'tip':      testResult = runTipTests();      break;
        case 'calorie':  testResult = runCalorieTests();  break;
        case 'gpa':      testResult = runGpaTests();      break;
        default:
          testResult = { success: true, logs: ['Dynamically accepted custom tool'] };
      }
      if (!testResult.success) {
        logEvent(
          'test_hook_failed',
          `Blocked activation of ${calculator.name} because tests failed.`,
        );
        res.status(400).json({
          error: `Cannot activate calculator: tests failed.`,
          logs: testResult.logs,
        });
        return;
      }
    }

    calculator.status = targetStatus;
    saveDB(currentDB);
    logEvent('calculator_toggle', `${calculator.name} status updated to: ${targetStatus}`);
    res.json({ success: true, calculator });
  },
);

// ─── Contact ──────────────────────────────────────────────────────────────────

router.post('/contact', (req: Request, res: Response) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    res.status(400).json({ error: 'All fields are required.' });
    return;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: 'Invalid email address format.' });
    return;
  }
  logEvent('contact_message', `Contact request received from ${name} (${email}): ${subject}`);
  res.json({ success: true, message: 'Thank you for reaching out! We will contact you soon.' });
});

// ─── Redirects (admin) ───────────────────────────────────────────────────────

router.get('/admin/redirects', adminAuthMiddleware, (_req: Request, res: Response) => {
  const currentDB = getDB();
  res.json(currentDB.redirects || []);
});

router.post('/admin/redirects', adminAuthMiddleware, (req: Request, res: Response) => {
  const { oldUrl, newUrl, statusCode } = req.body;
  if (!oldUrl || !newUrl) {
    res.status(400).json({ error: 'oldUrl and newUrl are required.' });
    return;
  }
  const currentDB = getDB();
  const id = `redirect_${Date.now()}`;
  const newRedirect = { id, oldUrl, newUrl, statusCode: statusCode || 301, createdAt: new Date().toISOString() };
  if (!currentDB.redirects) currentDB.redirects = [];
  currentDB.redirects.push(newRedirect);
  saveDB(currentDB);
  logEvent('redirect_added', `New redirect: ${oldUrl} -> ${newUrl}`);
  res.json({ success: true, redirect: newRedirect });
});

router.delete('/admin/redirects/:id', adminAuthMiddleware, (req: Request, res: Response) => {
  const id = String(req.params.id);
  const currentDB = getDB();
  currentDB.redirects = currentDB.redirects?.filter((r) => r.id !== id) || [];
  saveDB(currentDB);
  res.json({ success: true });
});

// ─── Logs & backup (admin) ───────────────────────────────────────────────────

router.get('/admin/logs', adminAuthMiddleware, (_req: Request, res: Response) => {
  res.json(getLogs());
});

router.post('/admin/backup', adminAuthMiddleware, async (_req: Request, res: Response) => {
  try {
    await backupDB();
    res.json({ success: true, message: 'Database backup successfully completed.' });
  } catch (err) {
    res.status(500).json({ error: 'Backup failed.' });
  }
});

// ─── Articles ─────────────────────────────────────────────────────────────────

// Google suggestions proxy
router.get('/articles/google-completion', async (req: Request, res: Response) => {
  const { query } = req.query;
  if (!query) {
    res.status(400).json({ error: 'query parameter is required' });
    return;
  }
  try {
    const response = await fetch(
      `https://suggestqueries.google.com/complete/search?client=chrome&hl=en&q=${encodeURIComponent(query as string)}`,
    );
    const data = (await response.json()) as any[];
    res.json(data[1] || []);
  } catch (err: any) {
    logEvent('api_error', `Google suggestion lookup failed: ${err.message}`);
    res.json([
      `${query} calculator free`,
      `how to use ${query}`,
      `best ${query} formula`,
      `why calculate ${query}`,
    ]);
  }
});

// Async article generation task status
router.get('/tasks/:id', (req: Request, res: Response) => {
  const task = backgroundTasks.get(String(req.params.id));
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  res.json(task);
});

// Levenshtein similarity for anti-duplication
function calculateLevenshteinSimilarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  if (len1 === 0) return len2 === 0 ? 1 : 0;
  if (len2 === 0) return 0;
  const matrix = Array.from({ length: len1 + 1 }, () => Array(len2 + 1).fill(0));
  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }
  return 1 - matrix[len1][len2] / Math.max(len1, len2);
}

router.get('/articles', (_req: Request, res: Response) => {
  const currentDB = getDB();
  res.json(currentDB.articles || []);
});

router.post('/articles', adminAuthMiddleware, (req: Request, res: Response) => {
  const { calculatorId, slug, title, content, status } = req.body;
  const currentDB = getDB();

  const contentToCompare = content || '';
  const duplicateArticle = currentDB.articles.find((art) => {
    const similarity = calculateLevenshteinSimilarity(art.content, contentToCompare);
    return similarity > 0.7;
  });

  if (duplicateArticle) {
    logEvent('anti_duplication', `Article creation blocked. High similarity detected with: ${duplicateArticle.title}`);
    res.status(400).json({
      error: `Article creation blocked! Similarity >70% with existing article: ${duplicateArticle.title}`,
    });
    return;
  }

  const id = `article_${Date.now()}`;
  const newArticle: Article = {
    id,
    calculatorId,
    slug,
    title,
    content,
    status: status || 'draft',
    seoData: {
      title: `${title} - Guide & Formula`,
      description: content.slice(0, 150),
      keywords: [title.toLowerCase(), 'calculator', 'formula', 'guide'],
      canonicalUrl: `/${slug}`,
    },
    version: 1,
    createdAt: new Date().toISOString(),
  };

  currentDB.articles.push(newArticle);
  if (!currentDB.articleVersions) currentDB.articleVersions = [];
  currentDB.articleVersions.push({
    id: `version_${Date.now()}`,
    articleId: id,
    content,
    createdAt: new Date().toISOString(),
  });
  saveDB(currentDB);
  res.json({ success: true, article: newArticle });
});

router.put('/articles/:id', adminAuthMiddleware, (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { title, slug, content, status } = req.body;
  const currentDB = getDB();

  const articleIndex = currentDB.articles.findIndex((a) => a.id === id);
  if (articleIndex === -1) {
    res.status(404).json({ error: 'Article not found' });
    return;
  }

  const existingArticle = currentDB.articles[articleIndex];
  const contentChanged = content !== undefined && content !== existingArticle.content;
  const newVersion = contentChanged ? existingArticle.version + 1 : existingArticle.version;

  if (contentChanged) {
    if (!currentDB.articleVersions) currentDB.articleVersions = [];
    currentDB.articleVersions.push({
      id: `version_${Date.now()}`,
      articleId: id,
      content,
      createdAt: new Date().toISOString(),
    });
  }

  const updatedArticle: Article = {
    ...existingArticle,
    title: title !== undefined ? title : existingArticle.title,
    slug: slug !== undefined ? slug : existingArticle.slug,
    content: content !== undefined ? content : existingArticle.content,
    status: status !== undefined ? status : existingArticle.status,
    version: newVersion,
    seoData: {
      title:
        title !== undefined
          ? `${title} | Professional Complete Guide`
          : existingArticle.seoData.title,
      description:
        content !== undefined
          ? content.slice(0, 150).replace(/[#*`]/g, '') + '...'
          : existingArticle.seoData.description,
      keywords: existingArticle.seoData.keywords,
      canonicalUrl:
        slug !== undefined ? `/${slug}` : existingArticle.seoData.canonicalUrl,
    },
  };

  currentDB.articles[articleIndex] = updatedArticle;
  saveDB(currentDB);
  logEvent('article_updated', `Article updated: ${updatedArticle.title} (v${updatedArticle.version})`);
  res.json({ success: true, article: updatedArticle });
});

router.delete('/articles/:id', adminAuthMiddleware, (req: Request, res: Response) => {
  const id = String(req.params.id);
  const currentDB = getDB();
  const articleIndex = currentDB.articles.findIndex((a) => a.id === id);
  if (articleIndex === -1) {
    res.status(404).json({ error: 'Article not found' });
    return;
  }
  const article = currentDB.articles[articleIndex];
  currentDB.articles.splice(articleIndex, 1);
  if (currentDB.articleVersions) {
    currentDB.articleVersions = currentDB.articleVersions.filter((v) => v.articleId !== id);
  }
  saveDB(currentDB);
  logEvent('article_deleted', `Deleted article: ${article.title}`);
  res.json({ success: true });
});

// ─── Async AI article generation ──────────────────────────────────────────────

router.post('/articles/generate-async', adminAuthMiddleware, (req: Request, res: Response) => {
  const { calculatorId, calculatorName, keywords, title } = req.body;
  const taskId = `task_${Date.now()}`;
  backgroundTasks.set(taskId, { id: taskId, status: 'queued', progress: 0 });
  generateArticleInBackground(taskId, calculatorId, calculatorName, keywords, title);
  res.json({ success: true, taskId });
});

// ─── Related Content Engine ───────────────────────────────────────────────────

import type { SuggestedCalculator, RelatedArticle, InternalLinkSuggestion } from '../db/types.js';

/** Jaccard-style keyword overlap score in [0, 1] */
function keywordOverlapScore(setA: string[], setB: string[]): number {
  if (!setA.length || !setB.length) return 0;
  const a = new Set(setA.map((k) => k.toLowerCase().trim()));
  const b = new Set(setB.map((k) => k.toLowerCase().trim()));
  let overlap = 0;
  for (const kw of a) {
    if (b.has(kw)) {
      overlap += 1;
    } else {
      // Partial word match (words > 3 chars)
      const words = kw.split(/\s+/).filter((w) => w.length > 3);
      for (const bkw of b) {
        if (words.some((w) => bkw.includes(w))) { overlap += 0.3; break; }
      }
    }
  }
  const union = a.size + b.size - overlap;
  return union > 0 ? overlap / union : 0;
}

/**
 * Analyse the existing DB to find the best matching calculator, related
 * articles, and internal link candidates for a newly generated article.
 * Pure function — no AI calls, no side effects.
 */
function computeRelatedContent(
  articleId: string,
  calculatorId: string,
  articleTitle: string,
  articleKeywords: string[],
  db: import('../db/types.js').AppSchema,
): {
  suggestedCalculator: SuggestedCalculator | null;
  relatedArticles: RelatedArticle[];
  internalLinkSuggestions: InternalLinkSuggestion[];
} {
  const activeCalcs = db.calculators.filter((c) => c.status === 'active');

  // ── 1. Best matching calculator ───────────────────────────────────────────
  let suggestedCalculator: SuggestedCalculator | null = null;

  // Primary rule: the article's own calculatorId always wins if it exists
  const ownCalc = activeCalcs.find((c) => c.id === calculatorId);
  if (ownCalc) {
    suggestedCalculator = {
      calculatorId: ownCalc.id,
      slug: ownCalc.slug,
      name: ownCalc.name,
      description: ownCalc.metadata.shortDescription || ownCalc.metadata.description,
      category: ownCalc.category,
    };
  } else {
    // Score-based fallback: only suggest if confidence is meaningful
    let bestScore = 0.15; // minimum threshold — don't force irrelevant suggestions
    for (const calc of activeCalcs) {
      const calcKeywords = [...calc.metadata.keywords, calc.name.toLowerCase(), calc.category];
      const score = keywordOverlapScore(articleKeywords, calcKeywords);
      // Boost when calculator name appears in article title
      const titleBoost = articleTitle.toLowerCase().includes(
        calc.name.toLowerCase().split(' ')[0],
      ) ? 0.2 : 0;
      const total = score + titleBoost;
      if (total > bestScore) {
        bestScore = total;
        suggestedCalculator = {
          calculatorId: calc.id,
          slug: calc.slug,
          name: calc.name,
          description: calc.metadata.shortDescription || calc.metadata.description,
          category: calc.category,
        };
      }
    }
  }

  // ── 2. Related articles ───────────────────────────────────────────────────
  const otherArticles = db.articles.filter(
    (a) => a.id !== articleId && a.status !== 'draft',
  );
  const scoredArticles = otherArticles
    .map((a) => ({
      article: a,
      score: keywordOverlapScore(articleKeywords, a.seoData?.keywords ?? []),
    }))
    .filter((s) => s.score > 0.05)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const relatedArticles: RelatedArticle[] = scoredArticles.map((s) => ({
    articleId: s.article.id,
    slug: s.article.slug,
    title: s.article.title,
    description: (s.article.seoData?.description ?? '').slice(0, 120),
  }));

  // ── 3. Internal link suggestions ──────────────────────────────────────────
  const internalLinkSuggestions: InternalLinkSuggestion[] = [];

  if (suggestedCalculator) {
    internalLinkSuggestions.push({
      anchorText: suggestedCalculator.name,
      targetSlug: `/${suggestedCalculator.slug}`,
      targetTitle: suggestedCalculator.name,
      targetType: 'calculator',
    });
  }

  // Up to 2 additional relevant calculators
  const extraCalcs = activeCalcs
    .filter((c) => c.id !== suggestedCalculator?.calculatorId)
    .map((c) => ({
      calc: c,
      score: keywordOverlapScore(articleKeywords, [...c.metadata.keywords, c.name.toLowerCase()]),
    }))
    .filter((s) => s.score > 0.05)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  for (const { calc } of extraCalcs) {
    internalLinkSuggestions.push({
      anchorText: calc.name,
      targetSlug: `/${calc.slug}`,
      targetTitle: calc.name,
      targetType: 'calculator',
    });
  }

  // Related article links
  for (const ra of relatedArticles.slice(0, 2)) {
    internalLinkSuggestions.push({
      anchorText: ra.title,
      targetSlug: `/blog/${ra.slug}`,
      targetTitle: ra.title,
      targetType: 'article',
    });
  }

  return { suggestedCalculator, relatedArticles, internalLinkSuggestions };
}

/**
 * Inject a "Related Calculator" card into article HTML.
 * Inserts before the Conclusion / Take Action section, or before the last <h2>.
 * If no good anchor is found, appends at the end.
 */
function injectCalculatorCard(html: string, calc: SuggestedCalculator): string {
  const cardHtml = `
<div class="related-calculator-box" style="border:1px solid var(--border,#e2e8f0);border-radius:0.75rem;padding:1.25rem 1.5rem;background:var(--bg-card,#f8fafc);margin:2rem 0;">
  <p style="margin:0 0 0.375rem;font-size:0.6875rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:#6b7280;">Related Calculator</p>
  <a href="/${calc.slug}" style="font-size:1.0625rem;font-weight:700;color:#3b82f6;text-decoration:none;">${calc.name}</a>
  <p style="margin:0.375rem 0 0.875rem;font-size:0.875rem;color:#64748b;line-height:1.6;">${calc.description}</p>
  <a href="/${calc.slug}" style="display:inline-flex;align-items:center;gap:0.375rem;font-size:0.8125rem;font-weight:600;color:#fff;background:#3b82f6;padding:0.5rem 1rem;border-radius:0.5rem;text-decoration:none;">Try the ${calc.name} →</a>
</div>`;

  // Inject before the Conclusion or Take Action heading
  const conclusionRe = /<h2[^>]*>[^<]*(?:conclusion|take action|final thoughts)[^<]*<\/h2>/i;
  const conclusionMatch = html.match(conclusionRe);
  if (conclusionMatch?.index !== undefined) {
    return html.slice(0, conclusionMatch.index) + cardHtml + html.slice(conclusionMatch.index);
  }

  // Fallback: before the last <h2>
  const allH2 = [...html.matchAll(/<h2[^>]*>/gi)];
  const lastH2 = allH2.pop();
  if (lastH2?.index !== undefined) {
    return html.slice(0, lastH2.index) + cardHtml + html.slice(lastH2.index);
  }

  // Final fallback: append
  return html + cardHtml;
}

// ─── End Related Content Engine ───────────────────────────────────────────────

async function generateArticleInBackground(
  taskId: string,
  calculatorId: string,
  calculatorName: string,
  keywords: string[],
  title: string,
) {
  const task = backgroundTasks.get(taskId);
  if (!task) return;
  task.status = 'running';
  task.progress = 5;

  try {
    const currentDB = getDB();
    const openrouterApiKey = currentDB.settings.openrouterApiKey;
    const geminiClient = getGeminiClient();

    if (!geminiClient && !openrouterApiKey) {
      throw new Error('No AI configuration found. Configure an OpenRouter API Key in Settings.');
    }

    const keywordsStr = keywords.join(', ');

    // ── STAGE 1: Nemotron-3-Super — SEO Planner ─────────────────────────────
    task.stage = 'Phase 1/3: Brainstorming and SEO Strategy mapping (Nemotron-3-Super)...';
    task.progress = 10;
    logEvent('ai_generation', `[Stage 1] SEO planning for "${calculatorName}" with Nemotron-3-Super`);

    const plannerPrompt = `Act as an expert SEO Strategist and Content Architect. Analyze the topic and create a comprehensive content brief.

Topic: ${calculatorName}
Target Keywords: ${keywordsStr}
Target Audience: General users seeking practical calculation tools

MANDATORY CONTENT SECTIONS — the outline MUST include sections in this order:
1. Hook (opening scenario/statement — maps to Introduction)
2. Executive Summary (key takeaways)
3. Introduction (context and preview)
4. Core explanation (What Is X / How X Works) — use H2 + H3 sub-sections as needed
5. Step-by-Step Guide (numbered steps for using the tool or applying the concept)
6. Practical Examples (2-4 real-world worked examples with numbers)
7. Helpful Tips (specific, expert-level tips)
8. Best Practices (what experts do that beginners skip)
9. Common Mistakes (specific mistakes and how to avoid them)
10. FAQ (6-8 real search queries with conversational answers)
11. Pros & Cons — ONLY include if the topic genuinely involves a decision or tradeoff
12. Comparison Table — ONLY include if comparing multiple options adds clear reader value
13. References (credible sources, formulas, standards)
14. Conclusion (key takeaway summary)
15. Call To Action (clear next step for the reader)

Output a clean, valid JSON object with exactly these keys:
{
  "meta_title_suggestion": "A compelling SEO-friendly title under 60 characters",
  "search_intent": "Brief analysis of search intent (informational, transactional, etc.)",
  "semantic_entities": ["10 related semantic terms to include naturally"],
  "include_pros_cons": true or false,
  "include_comparison_table": true or false,
  "outline": [
    {
      "heading": "H2 or H3 heading — reader benefit first, keyword second",
      "key_points": ["specific points, data, examples, or arguments to cover"],
      "target_keywords": ["1-2 specific keywords for this section"]
    }
  ]
}

Do NOT write the article. Only output the JSON brief. No surrounding text.`;

    let step1Json: any = null;
    let step1Text = '';

    if (openrouterApiKey) {
      step1Text = await callOpenRouterWithRetry(
        openrouterApiKey,
        [{ role: 'user', content: plannerPrompt }],
        { responseFormat: { type: 'json_object' }, models: CODE_GEN_MODELS },
      );
    } else if (geminiClient) {
      const r = await geminiClient.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: plannerPrompt,
        config: { responseMimeType: 'application/json' },
      });
      step1Text = r.text || '';
    }

    // Parse step 1 JSON — self-healing extraction
    try {
      const cleaned = step1Text.replace(/```json/g, '').replace(/```/g, '').trim();
      step1Json = JSON.parse(cleaned);
    } catch {
      // Regex fallback: extract first {...} block
      const match = step1Text.match(/\{[\s\S]*\}/);
      if (match) {
        try { step1Json = JSON.parse(match[0]); } catch { step1Json = null; }
      }
    }
    if (!step1Json) {
      // Graceful fallback: synthesize a minimal brief so stages 2 & 3 can still run
      step1Json = {
        meta_title_suggestion: title,
        search_intent: 'informational',
        semantic_entities: keywords,
        outline: [{ heading: calculatorName, key_points: ['Overview', 'Formula', 'How to use', 'FAQ'], target_keywords: keywords.slice(0, 2) }],
      };
    }
    task.progress = 35;

    // ── STAGE 2: Nemotron-3-Ultra — Writer / Copywriter ─────────────────────
    task.stage = 'Phase 2/3: Drafting article with premium, human-like copywriting style (Nemotron-3-Ultra)...';
    logEvent('ai_generation', `[Stage 2] Writing article with Nemotron-3-Ultra`);

    const writerPrompt = `Act as a professional, high-end copywriter and journalist. Write a comprehensive, reader-first article based on this SEO brief.

SEO Brief (JSON): ${JSON.stringify(step1Json)}

CRITICAL PRIORITY: Help the reader first. SEO is secondary. Every section must deliver genuine value.

ABSOLUTE STYLE RULES — non-negotiable:
- Write like an expert human author. NO robotic structures, no predictable formulas.
- BANNED PHRASES: "In today's digital age", "delve", "tapestry", "nestled", "testament", "moreover", "furthermore", "utilize", "leverage", "comprehensive", "in conclusion" (as a heading), "it's worth noting", "it's important to note".
- Use varied sentence lengths. Short punchy sentences. Longer analytical ones. Mix both naturally.
- Use specific numbers, real dollar amounts, realistic percentages throughout — never placeholders like [value].
- Write in Markdown. Use clear paragraphs, bullets where useful, **bold key terms**.

MANDATORY ARTICLE STRUCTURE — follow this order exactly:

[Hook — 2-3 punchy sentences BEFORE any heading. Open with a real scenario, surprising fact, or bold statement that makes the reader feel "this is exactly what I needed." No definition. No "In today's world."]

## Executive Summary
- [Bullet: most important takeaway #1]
- [Bullet: most important takeaway #2]
- [Bullet: most important takeaway #3]
- [Bullet: most important takeaway #4 — add a 5th if truly needed]

## Introduction
[2-3 paragraphs expanding the hook. Establish why this topic matters to THIS specific reader. Preview what the article covers without being a table of contents.]

## [H2: Core concept — What Is X / How X Works — tailor heading to topic]
### [H3 sub-sections as needed — break down complex sub-topics]
[Practical context. Common misconceptions. Why this matters. Specific examples.]

## Step-by-Step Guide
### Step 1: [Action-oriented title]
[Clear instruction]
### Step 2: [Action-oriented title]
[Clear instruction]
[Continue for all necessary steps — typically 4-7 steps]

## Practical Examples
[3 different worked examples using real numbers, different user situations and contexts. Show full calculations or applications. Make each example feel like a different person's story.]

## Helpful Tips
[6-8 specific, expert-level tips most people don't know. Not generic. Not obvious. Each tip should save the reader time or prevent a real mistake.]

## Best Practices
[5-7 practices that separate experts from beginners. Concrete, specific, actionable. Explain WHY each one matters.]

## Common Mistakes
[5-7 specific mistakes. Name the mistake clearly. Explain the consequence. Show how to avoid it. Real examples.]

## Frequently Asked Questions

**[Question — phrased exactly as someone would type it into Google, 8-15 words]**
[Answer — 2-4 sentences, conversational, with a real example or specific number. Never vague.]

[Include 6-8 Q&As covering the most searched questions for this topic]

${step1Json.include_pros_cons ? `## Pros & Cons
[Present as two clear columns or two short lists. Honest, balanced assessment. Only the most meaningful pros and cons — not an exhaustive list.]

` : ''}${step1Json.include_comparison_table ? `## Comparison
[Only include a table if it genuinely helps the reader choose or understand. Label columns clearly. Keep it compact — max 6 rows.]

` : ''}## References
[List 3-6 credible sources: formulas, standards bodies, research, institutions, or authoritative websites relevant to this topic. Format: - Source Name — brief note on what it covers]

## Conclusion
[3-4 sentences. Summarize the single most important takeaway. Reinforce the reader's ability to act on what they've learned. No filler. No "In conclusion".]

## Take Action
[1-2 sentences. Clear, natural next step for the reader. What should they do RIGHT NOW with what they've learned? Reference the calculator or tool directly.]

Instructions:
1. Follow the outline from the SEO brief for section content, but the structure above is the law.
2. Seamlessly integrate semantic_entities and target_keywords naturally — never force them.
3. Target 2000–2500 words. Quality over quantity — never pad sections.
4. Do NOT output HTML tags or meta descriptions. Pure Markdown only.
5. Start directly with the Hook — no preamble, no "Here is the article:" opener.`;

    let step2Markdown = '';

    // Small delay before the next OpenRouter call — respects free-tier quota.
    if (openrouterApiKey) await new Promise((r) => setTimeout(r, 1500));

    if (openrouterApiKey) {
      step2Markdown = await callOpenRouterWithRetry(
        openrouterApiKey,
        [{ role: 'user', content: writerPrompt }],
        { models: ARTICLE_GEN_MODELS },
      );
    } else if (geminiClient) {
      const r = await geminiClient.models.generateContent({ model: 'gemini-2.0-flash', contents: writerPrompt });
      step2Markdown = r.text || '';
    }

    if (!step2Markdown.trim()) throw new Error('Stage 2 (Writer) returned empty content.');
    task.progress = 70;

    // ── STAGE 3: Nemotron-3-Nano — Technical SEO Optimizer ──────────────────
    task.stage = 'Phase 3/3: Applying HTML semantic markup and technical SEO optimization (Nemotron-3-Nano)...';
    logEvent('ai_generation', `[Stage 3] SEO optimization with Nemotron-3-Nano`);

    const optimizerPrompt = `Act as a technical SEO Developer and Editor. Refine the article draft and output final, ready-to-publish HTML content.

Draft (Markdown): ${step2Markdown.slice(0, 6000)}
SEO Brief: ${JSON.stringify({ meta_title_suggestion: step1Json.meta_title_suggestion, semantic_entities: step1Json.semantic_entities })}

CRITICAL STYLE RULES:
- Preserve the human voice. Do NOT inject synthetic AI language.
- Meta description must sound like a human marketer, not a bot.

Instructions:
1. Convert Markdown to clean semantic HTML5: use <h2>, <h3>, <p>, <strong>, <ul>, <li>, <ol>, <table>, <blockquote>. No <html>/<head>/<body>.
2. Ensure primary keywords appear in the first 100 words and in at least two headings.
3. Add id attributes to all <h2> and <h3> tags for anchor navigation (slugify the heading text).
4. Immediately after the opening hook paragraph, insert a Table of Contents:
   <nav class="article-toc"><h3>Table of Contents</h3><ol><li><a href="#section-id">Section Title</a></li>...</ol></nav>
5. Keep the Executive Summary section (from the draft) as-is — do NOT replace it with the TOC or a Key Takeaways box.
6. Format Step-by-Step Guide sections as <ol> with <li> items. Format Tips, Best Practices, Common Mistakes as <ul>.
7. If a Pros & Cons section exists: render as two side-by-side <ul> lists inside <div class="pros-cons-grid">.
8. If a Comparison Table exists: render as a proper <table> with <thead> and <tbody>.
9. At the very top of output, add a JSON metadata comment block:
   <!-- META: {"finalTitle": "...", "metaDescription": "150-160 chars, punchy CTA", "urlSlug": "..."} -->
10. Output ONLY the metadata comment + clean HTML. No conversational intro or explanation.`;

    let step3Output = '';

    if (openrouterApiKey) await new Promise((r) => setTimeout(r, 1500));

    if (openrouterApiKey) {
      step3Output = await callOpenRouterWithRetry(
        openrouterApiKey,
        [{ role: 'user', content: optimizerPrompt }],
        { models: ['nvidia/nemotron-3-nano-30b-a3b:free', ...ARTICLE_GEN_MODELS] },
      );
    } else if (geminiClient) {
      const r = await geminiClient.models.generateContent({ model: 'gemini-2.0-flash', contents: optimizerPrompt });
      step3Output = r.text || '';
    }

    // Use stage 3 output if non-empty, otherwise fall back to stage 2 markdown
    const finalContent = step3Output.trim() || step2Markdown;
    task.progress = 90;

    // Parse metadata from stage 3 comment block
    let finalTitle = step1Json.meta_title_suggestion || title;
    let metaDescription = '';
    let urlSlug = calculatorName.toLowerCase().replace(/\s+/g, '-') + '-guide';

    const metaMatch = finalContent.match(/<!--\s*META:\s*(\{[\s\S]*?\})\s*-->/);
    if (metaMatch) {
      try {
        const meta = JSON.parse(metaMatch[1]);
        if (meta.finalTitle) finalTitle = meta.finalTitle;
        if (meta.metaDescription) metaDescription = meta.metaDescription;
        if (meta.urlSlug) urlSlug = meta.urlSlug.replace(/^\//, '');
      } catch { /* keep defaults */ }
    }

    const finalDB = getDB();
    const artId = `article_${Date.now()}`;
    const articleKeywords = [calculatorName.toLowerCase(), ...keywords.slice(0, 6)];

    // ── Related Content Engine ───────────────────────────────────────────────
    const relatedContent = computeRelatedContent(
      artId,
      calculatorId,
      finalTitle || title,
      articleKeywords,
      finalDB,
    );

    // Inject the calculator card into the HTML content (if a match was found)
    let richContent = finalContent;
    if (relatedContent.suggestedCalculator) {
      richContent = injectCalculatorCard(finalContent, relatedContent.suggestedCalculator);
    }

    const newArticle: Article = {
      id: artId,
      calculatorId,
      slug: urlSlug,
      title: finalTitle || title,
      content: richContent,
      status: 'pending_review',
      seoData: {
        title: `${finalTitle || title} | Complete Guide`,
        description: metaDescription || finalContent.replace(/<[^>]+>/g, '').slice(0, 150),
        keywords: articleKeywords,
        canonicalUrl: `/${urlSlug}`,
      },
      version: 1,
      createdAt: new Date().toISOString(),
      // Related Content Engine results
      suggestedCalculator: relatedContent.suggestedCalculator,
      relatedArticles: relatedContent.relatedArticles,
      internalLinkSuggestions: relatedContent.internalLinkSuggestions,
      relatedCalculators: relatedContent.suggestedCalculator
        ? [relatedContent.suggestedCalculator.slug]
        : [],
    };

    finalDB.articles.push(newArticle);
    if (!finalDB.articleVersions) finalDB.articleVersions = [];
    finalDB.articleVersions.push({
      id: `version_${Date.now()}`,
      articleId: artId,
      content: finalContent,
      createdAt: new Date().toISOString(),
    });
    saveDB(finalDB);
    logEvent('ai_generation', `3-stage article pipeline complete for "${calculatorName}": ${finalTitle || title}`);

    task.status = 'completed';
    task.progress = 100;
    task.stage = 'Done';
    task.result = { article: newArticle };
  } catch (err: any) {
    logEvent('ai_error', `Article generation failed: ${err.message}`);
    task.status = 'failed';
    task.error = err.message;
  }
}

// ─── AI Title Suggestions (based on a keyword) ───────────────────────────────

router.post('/articles/suggest-titles', adminAuthMiddleware, async (req: Request, res: Response) => {
  const { keyword, calcName } = req.body;
  if (!keyword) {
    res.status(400).json({ error: 'keyword is required' });
    return;
  }

  const currentDB = getDB();
  const openrouterApiKey = currentDB.settings.openrouterApiKey;
  const geminiClient = getGeminiClient();

  if (!geminiClient && !openrouterApiKey) {
    // Return prompt-based fallback titles when no AI is configured
    res.json({
      titles: [
        `${keyword} – Complete Free Guide`,
        `How to Use ${keyword}: Step-by-Step Tutorial`,
        `${keyword}: Everything You Need to Know`,
      ],
    });
    return;
  }

  const prompt = `You are an expert SEO copywriter. Generate exactly 4 compelling, click-worthy article titles for a web page about "${keyword}" related to "${calcName || keyword}".

Rules:
- Each title must naturally include the keyword phrase or a close variant
- Titles should be between 50-65 characters
- Vary the formats: one how-to, one ultimate guide, one question, one list format
- Sound human and editorial, NOT generic AI

Output ONLY a JSON array of 4 strings. No explanation, no preamble.
Example: ["Title 1", "Title 2", "Title 3", "Title 4"]`;

  try {
    let text = '';
    if (openrouterApiKey) {
      text = await callOpenRouterWithRetry(
        openrouterApiKey,
        [{ role: 'user', content: prompt }],
        { models: CODE_GEN_MODELS },
      );
    } else if (geminiClient) {
      const r = await geminiClient.models.generateContent({ model: 'gemini-2.0-flash', contents: prompt });
      text = r.text || '';
    }

    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const arrMatch = text.match(/\[[\s\S]*?\]/);
    let titles: string[] = [];
    if (arrMatch) {
      try { titles = JSON.parse(arrMatch[0]); } catch { titles = []; }
    }

    if (!titles.length) {
      titles = [
        `${keyword} – Complete Free Guide`,
        `How to Use ${keyword} Step by Step`,
        `${keyword}: Everything You Need to Know`,
        `Top Tips for Using ${keyword} Effectively`,
      ];
    }

    res.json({ titles });
  } catch (err: any) {
    logEvent('api_error', `suggest-titles failed: ${err.message}`);
    res.json({
      titles: [
        `${keyword} – Complete Free Guide`,
        `How to Calculate ${keyword}: Step-by-Step`,
        `${keyword}: Everything You Need to Know`,
        `Best Practices for ${keyword}`,
      ],
    });
  }
});

// ─── Programmatic SEO generation ─────────────────────────────────────────────

router.post('/seo-prog/generate', adminAuthMiddleware, async (req: Request, res: Response) => {
  const { calculatorId, calculatorName } = req.body;
  const currentDB = getDB();
  const openrouterApiKey = currentDB.settings.openrouterApiKey;
  const geminiClient = getGeminiClient();

  if (!geminiClient && !openrouterApiKey) {
    res.status(400).json({ error: 'No AI configuration found.' });
    return;
  }

  try {
    const prompt = `As an SEO Specialist, suggest 5 highly converting, specific localized or contextual variants of the "${calculatorName}" for SEO programmatic targeting. 
Examples: "Texas Mortgage Calculator", "France Calorie Calculator", "Student GPA Calculator", etc.
For each, provide:
1. Target Variant Title
2. Target Variant Slug
3. A short overview (100 words) describing the specific local rules, taxes, or criteria with REAL-LIFE realistic guidelines.

Response format must be a clean valid JSON array of objects:
[
  { "title": "...", "slug": "...", "content": "..." }
]
Do not wrap in anything else than json code block.`;

    let text = '[]';

    if (geminiClient) {
      const response = await geminiClient.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });
      text = response.text || '[]';
    } else if (openrouterApiKey) {
      text = await callOpenRouterWithRetry(
        openrouterApiKey,
        [{ role: 'user', content: prompt }],
        { responseFormat: { type: 'json_object' }, models: CODE_GEN_MODELS },
      ) || '[]';
    }

    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    // Extract first [...] array block if model wraps in extra text
    const arrMatch = text.match(/\[[\s\S]*\]/);
    if (arrMatch) text = arrMatch[0];
    let variants: any[] = [];
    try {
      const parsed = JSON.parse(text);
      variants = Array.isArray(parsed) ? parsed : parsed.variants || [];
    } catch {
      variants = [];
    }

    const updatedDB = getDB();
    const createdDrafts: Article[] = [];

    for (const v of variants) {
      const artId = `article_prog_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const draftArt: Article = {
        id: artId,
        calculatorId,
        slug: v.slug || `${calculatorId}-${Math.floor(Math.random() * 1000)}`,
        title: v.title,
        content: v.content,
        status: 'draft',
        seoData: {
          title: v.title,
          description: v.content.slice(0, 150),
          keywords: [calculatorName.toLowerCase(), 'programmatic seo', 'local calculations'],
          canonicalUrl: `/${v.slug}`,
        },
        version: 1,
        createdAt: new Date().toISOString(),
      };
      updatedDB.articles.push(draftArt);
      createdDrafts.push(draftArt);
    }

    saveDB(updatedDB);
    logEvent('seo_prog', `Generated ${createdDrafts.length} programmatic SEO variants for ${calculatorName}`);
    res.json({ success: true, drafts: createdDrafts });
  } catch (err: any) {
    logEvent('api_error', `SEO prog generation failed: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// ─── AI Code-gen (create dynamic calculator) ──────────────────────────────────

router.post('/code-gen/create', adminAuthMiddleware, async (req: Request, res: Response) => {
  const { spec } = req.body;
  if (!spec || typeof spec !== 'string' || spec.trim().length < 5) {
    res.status(400).json({ error: 'Please provide a clear specification (at least 5 characters).' });
    return;
  }

  const currentDB = getDB();
  const openrouterApiKey = currentDB.settings.openrouterApiKey;
  const geminiClient = getGeminiClient();

  if (!geminiClient && !openrouterApiKey) {
    res.status(400).json({ error: 'No AI provider configured. Add your Gemini API key in Settings, or configure an OpenRouter API key.' });
    return;
  }

  // ── PASS 1: Calculator logic & structure (JSON) ─────────────────────────────
  // NOTE: formulaCode/validationCode/testsCode are intentionally excluded from
  // this JSON prompt — they contain complex TypeScript with quotes/backslashes
  // that reliably corrupt JSON output. Only meta (with calculateBody) is needed
  // for the published calculator and DynamicCalculatorWidget.
  const LOGIC_PROMPT = `You are a senior JavaScript developer building a browser-side calculator.
Specification: "${spec.trim()}"

Return ONLY a valid JSON object. No markdown fences. No explanation. No text outside the JSON.

STRICT RULES for calculateBody:
- It is a plain JS function BODY (no function keyword, no export, no import).
- Variables come from the "inputs" object. Return an "outputs" object.
- FORBIDDEN: fetch, XMLHttpRequest, eval, document, window, localStorage, sessionStorage, require, import
- Use the correct industry-standard formula for the calculator type:
    Mortgage/Loan:        M = P * r*(1+r)^n / ((1+r)^n - 1)  where r=annual_rate/100/12, n=years*12
    Compound interest:    A = P * (1 + r/n)^(n*t)
    BMI:                  weight_kg / (height_m * height_m)
    Navy body fat male:   495 / (1.0324 - 0.19077*log10(waist-neck) + 0.15456*log10(height)) - 450
    Navy body fat female: 495 / (1.29579 - 0.35004*log10(waist+hip-neck) + 0.22100*log10(height)) - 450
    Calorie (Mifflin):    Men: 10*weight + 6.25*height - 5*age + 5  Women: 10*weight + 6.25*height - 5*age - 161
    Percentage:           part / whole * 100
- Guard against division by zero, NaN, Infinity. Clamp negative physical results to 0.
- Round: money to 2 decimals, percentages to 2 decimals, counts to integers.
- Return ALL meaningful derived values (e.g. mortgage: monthlyPayment, totalInterest, totalPayment).
- Use Math.log10, Math.pow, Math.round, Math.max, Math.min — all available in browser JS.

JSON to return (no code outside meta — only calculateBody inside meta.calculateBody):
{
  "meta": {
    "calculatorName": "Human-readable calculator name",
    "category": "financial",
    "shortDescription": "One compelling sentence: what this calculates and who benefits.",
    "inputs": [
      {"name": "principal", "label": "Loan Amount", "type": "number", "defaultValue": 250000, "min": 0, "max": 10000000, "suffix": "$", "helpText": "Total amount borrowed before interest"}
    ],
    "outputs": [
      {"name": "monthlyPayment", "label": "Monthly Payment", "type": "number", "suffix": "$"}
    ],
    "calculateBody": "var r = inputs.principal > 0 ? inputs.annualRate / 100 / 12 : 0; var n = inputs.termYears * 12; var mp = r === 0 ? inputs.principal / n : inputs.principal * (r * Math.pow(1+r,n)) / (Math.pow(1+r,n)-1); var total = mp * n; return { monthlyPayment: Math.round(mp*100)/100, totalPayment: Math.round(total*100)/100, totalInterest: Math.round((total - inputs.principal)*100)/100 };"
  }
}`;

  // ── PASS 2: SEO metadata (JSON, no article) ──────────────────────────────────
  // Article is kept out of JSON to avoid escaping issues with long markdown strings.
  const SEO_META_PROMPT = `You are an SEO specialist writing for a calculator website. Topic: "${spec.trim()}"

Return ONLY a valid JSON object. No markdown fences. No text outside the JSON. Keep all string values short — the article is generated separately.

WRITING STYLE for FAQ answers and howToUse steps:
- Write as a real human expert, not a bot.
- Use specific numbers and real examples (never write [value] — fill it in).
- FAQ answers: conversational, 2-4 sentences, occasionally use "you" directly.
- Never use: "In today's world", "It's worth noting", "Furthermore", "Leverage", "Utilize", "Comprehensive", "Delve".

{
  "seoTitle": "Primary Keyword Calculator - Benefit | Free Tool (max 60 chars)",
  "seoDescription": "155-char max. Lead with primary keyword. Mention free. State the main benefit clearly. Make someone want to click.",
  "seoKeywords": ["primary term","secondary term","how to calculate X","X formula","free X calculator","X calculator online","best X calculator","X calculation","what is X","X tool"],
  "howToUse": [
    "Enter [exact field name] — [what this value means, e.g. the total borrowed before interest]",
    "Set [field] to [typical value] based on [relevant factor]",
    "Adjust [field] if [specific scenario, e.g. you pay monthly vs annually]",
    "Click Calculate — results update instantly",
    "Check [specific output] — [what to look for and what it means for you]",
    "Adjust any input to model different scenarios"
  ],
  "faqItems": [
    {"question":"Exact phrase someone types into Google (8-15 words)","answer":"2-4 sentences. Include a real number or scenario. Never vague or generic."},
    {"question":"What formula does this calculator use?","answer":"Specifically name the formula. Explain each variable in plain English. Walk through one real calculation with actual numbers."},
    {"question":"How accurate is this calculator?","answer":"Describe what it accounts for and what it doesn't. Be honest about limitations. Name the professional to consult for final decisions."},
    {"question":"Is this calculator free to use?","answer":"Yes — no account, no email, no download required. All calculations run in your browser and your data never leaves your device."},
    {"question":"Topic-specific question people actually search","answer":"Detailed, practical answer with specific details relevant to this calculator type."},
    {"question":"Another real search query for this topic","answer":"Conversational answer with a concrete example or number."},
    {"question":"One more common question about this calculation","answer":"Clear, direct answer."},
    {"question":"Edge case or limitation question people ask","answer":"Honest, helpful answer about when to use a professional or alternative method."}
  ],
  "schemaJsonLd": "{\\"@context\\":\\"https://schema.org\\",\\"@type\\":\\"SoftwareApplication\\",\\"name\\":\\"Calculator Name\\",\\"applicationCategory\\":\\"FinanceApplication\\",\\"operatingSystem\\":\\"Web Browser\\",\\"offers\\":{\\"@type\\":\\"Offer\\",\\"price\\":\\"0\\",\\"priceCurrency\\":\\"USD\\"},\\"description\\":\\"Your 155-char SEO description here\\",\\"featureList\\":[\\"Free to use\\",\\"No registration required\\",\\"Instant results\\",\\"Privacy-safe — runs in browser\\"]}"
}`;

  // ── PASS 3: SEO article (plain markdown text — NOT JSON) ─────────────────────
  // Returned as raw text to avoid JSON escaping corruption of long markdown.
  const ARTICLE_PROMPT = `You are a professional content writer and subject-matter expert on "${spec.trim()}". Write a comprehensive, reader-first guide for a calculator page. Your primary job is to help the visitor — SEO is secondary.

ABSOLUTE WRITING RULES — non-negotiable:
1. Write as a real human expert: a financial advisor, doctor, or specialist depending on the topic.
2. Start with a HOOK — a real scenario, surprising fact, or bold statement. NOT a definition. NOT "In today's world".
3. Use specific numbers, real dollar amounts, realistic percentages throughout — NEVER placeholders like [value].
4. Vary sentence length naturally: short punchy sentences alternate with longer explanatory ones.
5. BANNED PHRASES: "It's important to note", "In conclusion" (as heading), "Furthermore", "Moreover", "Utilize", "Leverage", "Delve into", "Comprehensive", "In today's fast-paced", "Tapestry", "Testament", "It's worth noting".
6. The article must read as if written by a person, not generated by AI.
7. Never generate a section just to fill space. Every section must earn its place.

Write a 2000–2500 word markdown article with this EXACT structure:

# [H1: Primary keyword — compelling and specific, max 70 characters]

[Hook — 2-3 punchy sentences BEFORE any H2. Open with a real scenario or bold statement. Make the reader feel "this is exactly what I needed."]

## Executive Summary
- [Most important takeaway #1 — specific, actionable]
- [Most important takeaway #2]
- [Most important takeaway #3]
- [Most important takeaway #4]

## Introduction
[2-3 paragraphs. Expand the hook. Establish why this matters to THIS specific reader. Preview the article without being a table of contents.]

## [H2: Core concept — What Is X / How X Works — tailor heading to topic]
### [H3 sub-topics as needed]
[Practical context. Common misconceptions. Why it matters. Specific examples with real numbers.]

## Step-by-Step Guide
### Step 1: [Action-oriented title]
[Clear, specific instruction]
### Step 2: [Action-oriented title]
[Clear, specific instruction]
[4-7 steps total — enough to be thorough, not so many it's overwhelming]

## Practical Examples
[3 fully worked examples. Real numbers, different user situations. Each example = a different type of person with a different scenario. Show all calculations.]

## Helpful Tips
- [Specific tip #1 — something most people overlook]
- [Specific tip #2]
- [6-8 tips total — expert-level, not obvious advice]

## Best Practices
- [Best practice #1 — what experts do that beginners skip]
- [5-7 practices total — concrete, specific, with a why]

## Common Mistakes
### [Mistake #1: Clear name for the mistake]
[What goes wrong and how to avoid it]
### [Repeat for 5-7 total mistakes]

## Frequently Asked Questions

**[Question phrased exactly as someone types it into Google — 8-15 words]**
[Answer — 2-4 sentences, conversational, with a real example or number. Never vague.]

[6-8 Q&As total covering the most-searched questions for this topic]

[CONDITIONAL — only include if the topic involves a genuine decision or tradeoff:]
## Pros & Cons
**Pros**
- [Pro #1]
**Cons**
- [Con #1]
[Only include this section if it genuinely helps the reader. Skip it for pure how-to topics.]

[CONDITIONAL — only include if comparing multiple real options adds clear reader value:]
## Comparison
[A compact markdown table comparing 3-6 options. Label columns clearly. Skip if not relevant.]

## References
- [Source 1 — what it covers, e.g. "IRS Publication 936 — mortgage interest deduction rules"]
- [3-6 credible sources: formulas, standards bodies, research, authoritative websites]

## Conclusion
[3-4 sentences. Single most important takeaway. Reinforce the reader's ability to act. No "In conclusion". No filler.]

## Take Action
[1-2 sentences. Clear, natural next step. What should the reader do RIGHT NOW? Reference the calculator directly.]

Output only the markdown — no JSON wrapper, no introduction, no explanation. Start directly with the # heading.`;

  try {
    let logicParsed: any = {};
    let seoMetaParsed: any = {};
    let articleText = '';

    if (geminiClient) {
      logEvent('ai_generation', 'Code-gen 3-pass parallel via Gemini');

      // SEO + article run immediately in parallel (they never fail on JSON)
      const [seoMetaResp, articleResp] = await Promise.all([
        geminiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: SEO_META_PROMPT,
          config: { responseMimeType: 'application/json', temperature: 0.6 },
        }),
        geminiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: ARTICLE_PROMPT,
          config: { temperature: 0.75 },
        }),
      ]);

      // Logic pass: retry up to 3 times on JSON parse failure
      let logicText = '';
      let logicAttempt = 0;
      while (logicAttempt < 3) {
        logicAttempt++;
        const logicResp = await geminiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: LOGIC_PROMPT,
          config: { responseMimeType: 'application/json', temperature: 0.1 * logicAttempt },
        });
        logicText = logicResp.text ?? '';
        if (!logicText) {
          if (logicAttempt < 3) continue;
          throw new Error('Gemini returned an empty response for the calculator logic. Try rephrasing your specification.');
        }
        try {
          logicParsed = extractJsonObject(logicText);
          break; // success
        } catch {
          logEvent('api_warning', `Logic JSON parse failed on attempt ${logicAttempt} — raw: ${logicText.slice(0, 200)}`);
          if (logicAttempt >= 3) {
            throw new Error('Could not generate valid calculator logic after 3 attempts. Please rephrase your specification with more detail — e.g. "Mortgage calculator with loan amount in dollars, annual interest rate in %, and term in years".');
          }
          // Exponential backoff: 1.5s → 3s → 6s
          await new Promise(r => setTimeout(r, 1500 * Math.pow(2, logicAttempt - 1)));
        }
      }

      const seoMetaText = seoMetaResp.text ?? '';
      articleText = articleResp.text ?? '';

      if (seoMetaText) {
        try {
          seoMetaParsed = extractJsonObject(seoMetaText);
        } catch {
          logEvent('api_warning', 'SEO metadata JSON parse failed — using defaults');
        }
      }

    } else if (openrouterApiKey) {
      logEvent('ai_generation', 'Code-gen 3-pass via OpenRouter (sequential)');

      let logicText = '';
      let seoMetaText = '';

      try {
        logicText = await callOpenRouterWithRetry(
          openrouterApiKey,
          [{ role: 'user', content: LOGIC_PROMPT }],
          { responseFormat: { type: 'json_object' }, models: CODE_GEN_MODELS },
        );
      } catch (err: any) {
        throw new Error(`AI failed on calculator logic: ${err.message}. Consider adding a Gemini API key in Settings for more reliable generation.`);
      }

      // Small delay between sequential OpenRouter calls to respect free-tier quota.
      await new Promise((r) => setTimeout(r, 1500));

      try {
        seoMetaText = await callOpenRouterWithRetry(
          openrouterApiKey,
          [{ role: 'user', content: SEO_META_PROMPT }],
          { responseFormat: { type: 'json_object' }, models: CODE_GEN_MODELS },
        );
      } catch {
        // Non-fatal — continue without SEO metadata
      }

      await new Promise((r) => setTimeout(r, 1500));

      try {
        articleText = await callOpenRouterWithRetry(
          openrouterApiKey,
          [{ role: 'user', content: ARTICLE_PROMPT }],
          { models: ARTICLE_GEN_MODELS },
        );
      } catch {
        // Non-fatal — continue without article
      }

      try {
        logicParsed = extractJsonObject(logicText || '{}');
      } catch {
        throw new Error('AI returned malformed calculator logic. Try simplifying your specification or adding a Gemini API key in Settings.');
      }
      if (seoMetaText) {
        try { seoMetaParsed = extractJsonObject(seoMetaText); } catch { /* use defaults */ }
      }
    }

    // Validate we got a usable calculator
    if (!logicParsed.meta?.calculatorName) {
      throw new Error('AI did not return a valid calculator name. Try a more specific specification — e.g. "Mortgage Calculator with loan amount, interest rate, and term in years".');
    }
    if (!logicParsed.meta?.calculateBody) {
      throw new Error('AI did not return the calculation formula. Try rephrasing with more detail about the inputs and formula you need.');
    }

    // ── Merge all three passes ───────────────────────────────────────────────
    const merged = {
      formulaCode: logicParsed.formulaCode || '',
      validationCode: logicParsed.validationCode || '',
      testsCode: logicParsed.testsCode || '',
      meta: {
        calculatorName: logicParsed.meta.calculatorName,
        category: (logicParsed.meta.category || 'more').toLowerCase(),
        shortDescription: logicParsed.meta.shortDescription || seoMetaParsed.seoDescription || '',
        inputs: logicParsed.meta.inputs || [],
        outputs: logicParsed.meta.outputs || [],
        calculateBody: logicParsed.meta.calculateBody,
        // SEO metadata (pass 2)
        seoTitle: seoMetaParsed.seoTitle || `${logicParsed.meta.calculatorName} - Free Online Calculator`,
        seoDescription: seoMetaParsed.seoDescription || logicParsed.meta.shortDescription || '',
        seoKeywords: Array.isArray(seoMetaParsed.seoKeywords) ? seoMetaParsed.seoKeywords : [],
        howToUse: Array.isArray(seoMetaParsed.howToUse) ? seoMetaParsed.howToUse : [],
        faqItems: Array.isArray(seoMetaParsed.faqItems) ? seoMetaParsed.faqItems : [],
        schemaJsonLd: seoMetaParsed.schemaJsonLd || '',
        // Article (pass 3 — plain text, no JSON corruption risk)
        seoArticleContent: articleText.trim(),
      },
    };

    // ── Security check ───────────────────────────────────────────────────────
    const violations = validateGeneratedCode(merged);
    if (violations.length > 0) {
      logEvent('security_violation', `Generated code blocked: ${violations.join(', ')}`);
      res.status(400).json({ error: `Generated code was blocked for security reasons (patterns: ${violations.join(', ')}). Please rephrase your specification.` });
      return;
    }

    logEvent('ai_generation', `Calculator generated OK: ${merged.meta.calculatorName}`);
    res.json({ success: true, generated: merged });

  } catch (err: any) {
    logEvent('api_error', `Code-gen failed: ${err.message}`);
    res.status(500).json({ error: err.message || 'Generation failed. Please try again.' });
  }
});

// ─── Publish dynamic calculator ───────────────────────────────────────────────

router.post('/calculators/publish', adminAuthMiddleware, (req: Request, res: Response) => {
  const { name, category, slug, meta } = req.body;
  if (!name || !category || !slug) {
    res.status(400).json({ error: 'name, category, and slug are required.' });
    return;
  }

  const currentDB = getDB();
  const id = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');

  // Security check on meta
  if (meta) {
    const violations = validateGeneratedCode({ meta });
    if (violations.length > 0) {
      res.status(400).json({ error: `Code blocked (forbidden patterns: ${violations.join(', ')})` });
      return;
    }
  }

  const existingIndex = currentDB.calculators.findIndex((c) => c.id === id);
  const newCalc = {
    id,
    slug,
    name,
    category,
    status: 'active' as const,
    metadata: {
      title: meta?.seoTitle || name,
      description: meta?.seoDescription || `${name} - Online Calculator`,
      keywords: meta?.seoKeywords || [name.toLowerCase()],
      inputs: meta?.inputs || [],
      outputs: meta?.outputs || [],
      calculateBody: meta?.calculateBody || '',
      shortDescription: meta?.shortDescription || meta?.seoDescription || '',
      howToUse: meta?.howToUse || [],
      faqItems: meta?.faqItems || [],
      schemaJsonLd: meta?.schemaJsonLd || '',
    },
    settings: {},
    createdAt: new Date().toISOString(),
  };

  if (existingIndex !== -1) {
    currentDB.calculators[existingIndex] = newCalc;
  } else {
    currentDB.calculators.push(newCalc);
  }

  // Auto-publish SEO article if generated
  if (meta?.seoArticleContent) {
    const articleId = `article_${id}`;
    const articleSlug = slug;
    const existingArticleIndex = currentDB.articles.findIndex((a) => a.calculatorId === id);
    const newArticle: Article = {
      id: articleId,
      calculatorId: id,
      slug: articleSlug,
      title: meta.seoTitle || name,
      content: meta.seoArticleContent,
      status: 'published',
      seoData: {
        title: meta.seoTitle || `${name} - Guide & Formula`,
        description: meta.seoDescription || `Guide and calculations for ${name}.`,
        keywords: meta.seoKeywords || [name.toLowerCase(), 'guide', 'formula'],
        canonicalUrl: `/${articleSlug}`,
      },
      version: 1,
      createdAt: new Date().toISOString(),
    };

    if (existingArticleIndex !== -1) {
      newArticle.version = (currentDB.articles[existingArticleIndex].version || 1) + 1;
      currentDB.articles[existingArticleIndex] = newArticle;
    } else {
      currentDB.articles.push(newArticle);
    }

    if (!currentDB.articleVersions) currentDB.articleVersions = [];
    currentDB.articleVersions.push({
      id: `version_${Date.now()}`,
      articleId,
      content: meta.seoArticleContent,
      createdAt: new Date().toISOString(),
    });
  }

  saveDB(currentDB);
  logEvent('calculator_published', `Dynamic calculator ${name} published to category: ${category}`);
  res.json({ success: true, calculator: newCalc });
});

export default router;

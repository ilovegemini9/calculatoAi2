import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { GoogleGenAI } from '@google/genai';
import { 
  initDB, 
  getDB, 
  saveDB, 
  backupDB, 
  logEvent, 
  getLogs, 
  Calculator, 
  Article, 
  Redirect, 
  SystemSettings 
} from './src/db/db';

// Import all tests dynamically for Hook de Test verification
import { runTests as runMortgageTests } from './src/calculators/mortgage/tests';
import { runTests as runBmiTests } from './src/calculators/bmi/tests';
import { runTests as runPercentageTests } from './src/calculators/percentage/tests';
import { runTests as runLoanTests } from './src/calculators/loan/tests';
import { runTests as runAgeTests } from './src/calculators/age/tests';
import { runTests as runTipTests } from './src/calculators/tip/tests';
import { runTests as runCalorieTests } from './src/calculators/calorie/tests';
import { runTests as runGpaTests } from './src/calculators/gpa/tests';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const SESSION_SECRET = process.env.SESSION_SECRET || 'change-me-in-production';

function createSessionToken(username: string) {
  const payload = `${username}:${Date.now()}:${SESSION_SECRET}`;
  return Buffer.from(payload).toString('base64');
}

function verifySessionToken(token: string): string | null {
  if (!token) return null;
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [username, , secret] = decoded.split(':');
    if (!username || secret !== SESSION_SECRET) return null;
    return username;
  } catch {
    return null;
  }
}

const adminAuthMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const token = authHeader.slice(7).trim();
  const username = verifySessionToken(token);
  if (!username) {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }

  (req as express.Request & { user?: string }).user = username;
  next();
};

// Initialize database
const db = initDB();
logEvent('system', 'Professional Calculator Platform backend started.');

// Setup Google GenAI Helper
const getGeminiClient = (): GoogleGenAI | null => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log('GEMINI_API_KEY env variable is not set.');
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

// Rate Limiter implementation to prevent scraping/abuse
const rateLimitCache = new Map<string, { count: number; expires: number }>();
function rateLimiter(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = req.ip || 'anonymous';
  const now = Date.now();
  const limitWindow = 60 * 1000; // 1 minute
  const maxRequests = 60; // 60 requests per minute

  const record = rateLimitCache.get(ip);
  if (!record || now > record.expires) {
    rateLimitCache.set(ip, { count: 1, expires: now + limitWindow });
    return next();
  }

  record.count++;
  if (record.count > maxRequests) {
    logEvent('security_warning', `Rate limit exceeded by IP: ${ip}`);
    return res.status(429).json({ error: 'Too many requests. Please try again in a minute.' });
  }

  next();
}

app.use('/api/', rateLimiter);

// 301 Redirects Interception Middleware (Step 10 redirects)
app.use((req, res, next) => {
  // Check redirects
  const currentDB = getDB();
  const matchingRedirect = currentDB.redirects?.find(
    (r) => r.oldUrl === req.originalUrl || r.oldUrl === req.path
  );

  if (matchingRedirect) {
    logEvent('redirect', `301 Redirect intercepted: ${matchingRedirect.oldUrl} -> ${matchingRedirect.newUrl}`);
    return res.redirect(matchingRedirect.statusCode || 301, matchingRedirect.newUrl);
  }
  next();
});

// Admin authentication endpoints (Step 1)
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required.' });
  }

  const currentDB = getDB();
  const user = currentDB.adminUsers.find(u => u.username === username);

  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    logEvent('auth_failed', `Failed login attempt for user: ${username}`);
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  const token = createSessionToken(username);
  logEvent('auth_success', `User logged in: ${username}`);
  res.json({ success: true, token, username });
});

app.use('/api/admin', adminAuthMiddleware);

// Settings Management (Step 6)
app.get('/api/settings', (req, res) => {
  const currentDB = getDB();
  // Strip sensitive OpenRouter API key for public settings
  const publicSettings = {
    adsenseEnabled: currentDB.settings.adsenseEnabled,
    adsenseCode: currentDB.settings.adsenseCode,
    analyticsCode: currentDB.settings.analyticsCode,
    featureFlags: currentDB.settings.featureFlags
  };
  res.json(publicSettings);
});

app.get('/api/admin/settings', (req, res) => {
  const currentDB = getDB();
  res.json({
    openrouterApiKeyConfigured: Boolean(currentDB.settings.openrouterApiKey),
    adsenseEnabled: currentDB.settings.adsenseEnabled,
    adsenseCode: currentDB.settings.adsenseCode,
    analyticsCode: currentDB.settings.analyticsCode,
    featureFlags: currentDB.settings.featureFlags,
  });
});

app.post('/api/admin/settings', (req, res) => {
  const { openrouterApiKey, adsenseEnabled, adsenseCode, analyticsCode, featureFlags } = req.body;
  const currentDB = getDB();

  currentDB.settings = {
    openrouterApiKey: openrouterApiKey !== undefined ? openrouterApiKey : currentDB.settings.openrouterApiKey,
    adsenseEnabled: adsenseEnabled !== undefined ? adsenseEnabled : currentDB.settings.adsenseEnabled,
    adsenseCode: adsenseCode !== undefined ? adsenseCode : currentDB.settings.adsenseCode,
    analyticsCode: analyticsCode !== undefined ? analyticsCode : currentDB.settings.analyticsCode,
    featureFlags: featureFlags !== undefined ? featureFlags : currentDB.settings.featureFlags,
  };

  saveDB(currentDB);
  logEvent('settings_updated', 'System settings updated by administrator.');
  res.json({ success: true, settings: {
    openrouterApiKeyConfigured: Boolean(currentDB.settings.openrouterApiKey),
    adsenseEnabled: currentDB.settings.adsenseEnabled,
    adsenseCode: currentDB.settings.adsenseCode,
    analyticsCode: currentDB.settings.analyticsCode,
    featureFlags: currentDB.settings.featureFlags,
  } });
});

// Analytics tracking (Step 6)
app.get('/api/analytics', (req, res) => {
  const currentDB = getDB();
  res.json(currentDB.analytics || []);
});

app.post('/api/analytics/hit', (req, res) => {
  const { calculatorId } = req.body;
  if (!calculatorId) return res.status(400).json({ error: 'calculatorId required' });

  const currentDB = getDB();
  const today = new Date().toISOString().split('T')[0];

  if (!currentDB.analytics) currentDB.analytics = [];

  let record = currentDB.analytics.find(a => a.calculatorId === calculatorId && a.date === today);
  if (record) {
    record.views++;
  } else {
    currentDB.analytics.push({
      id: `${calculatorId}_${today}`,
      calculatorId,
      date: today,
      views: 1
    });
  }

  saveDB(currentDB);
  res.json({ success: true });
});

// Calculators Catalog (Step 6 & 10 Hook)
app.get('/api/calculators', (req, res) => {
  const currentDB = getDB();
  res.json(currentDB.calculators);
});

app.post('/api/calculators/:id/toggle', adminAuthMiddleware, (req, res) => {
  const { id } = req.params;
  const currentDB = getDB();
  const calculator = currentDB.calculators.find(c => c.id === id);

  if (!calculator) {
    return res.status(404).json({ error: 'Calculator not found' });
  }

  const currentStatus = calculator.status;
  const targetStatus = currentStatus === 'active' ? 'inactive' : 'active';

  // Step 10: Hook de Test verification before activation!
  if (targetStatus === 'active') {
    let testResult = { success: false, logs: ['No test runner found'] };
    switch (id) {
      case 'mortgage': testResult = runMortgageTests(); break;
      case 'bmi': testResult = runBmiTests(); break;
      case 'percentage': testResult = runPercentageTests(); break;
      case 'loan': testResult = runLoanTests(); break;
      case 'age': testResult = runAgeTests(); break;
      case 'tip': testResult = runTipTests(); break;
      case 'calorie': testResult = runCalorieTests(); break;
      case 'gpa': testResult = runGpaTests(); break;
      default:
        // For dynamically generated tools
        testResult = { success: true, logs: ['Dynamically accepted custom tool'] };
    }

    if (!testResult.success) {
      logEvent('test_hook_failed', `Blocked activation of ${calculator.name} because its 'tests.ts' suite failed.`);
      return res.status(400).json({ 
        error: `Cannot activate calculator: 'tests.ts' suite failed.`, 
        logs: testResult.logs 
      });
    }
  }

  calculator.status = targetStatus;
  saveDB(currentDB);
  logEvent('calculator_toggle', `${calculator.name} status updated to: ${targetStatus}`);
  res.json({ success: true, calculator });
});

// Dynamic XML Sitemap (Step 2)
app.get('/sitemap.xml', (req, res) => {
  const currentDB = getDB();
  const activeCalculators = currentDB.calculators.filter(c => c.status === 'active');
  const domain = process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://calculatorplatform.com');

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Home Page
  xml += `  <url>\n    <loc>${domain}/</loc>\n    <priority>1.0</priority>\n    <changefreq>daily</changefreq>\n  </url>\n`;

  // Static Pages
  const statics = ['/about-us', '/privacy-policy', '/terms-of-use', '/contact'];
  statics.forEach(path => {
    xml += `  <url>\n    <loc>${domain}${path}</loc>\n    <priority>0.5</priority>\n    <changefreq>monthly</changefreq>\n  </url>\n`;
  });

  // Categories
  const categories = ['/financial-calculators', '/fitness-calculators', '/math-calculators'];
  categories.forEach(path => {
    xml += `  <url>\n    <loc>${domain}${path}</loc>\n    <priority>0.7</priority>\n    <changefreq>weekly</changefreq>\n  </url>\n`;
  });

  // Active Calculators
  activeCalculators.forEach(calc => {
    xml += `  <url>\n    <loc>${domain}/${calc.slug}</loc>\n    <priority>0.9</priority>\n    <changefreq>weekly</changefreq>\n  </url>\n`;
  });

  xml += '</urlset>';
  res.header('Content-Type', 'application/xml');
  res.send(xml);
});

app.get('/robots.txt', (req, res) => {
  const domain = process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://calculatorplatform.com');
  res.header('Content-Type', 'text/plain');
  res.send(`User-agent: *\nAllow: /\nSitemap: ${domain}/sitemap.xml\n`);
});

// Contact Submission API (Step 4)
app.post('/api/contact', (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address format.' });
  }

  logEvent('contact_message', `Contact request received from ${name} (${email}): ${subject}`);
  res.json({ success: true, message: 'Thank you for reaching out! We will contact you soon.' });
});

// 301 Redirects CRUD (Step 10)
app.get('/api/admin/redirects', (req, res) => {
  const currentDB = getDB();
  res.json(currentDB.redirects || []);
});

app.post('/api/admin/redirects', (req, res) => {
  const { oldUrl, newUrl, statusCode } = req.body;
  if (!oldUrl || !newUrl) return res.status(400).json({ error: 'Old URL and New URL required' });

  const currentDB = getDB();
  const id = `redirect_${Date.now()}`;
  const newRedirect: Redirect = {
    id,
    oldUrl,
    newUrl,
    statusCode: statusCode || 301,
    createdAt: new Date().toISOString()
  };

  if (!currentDB.redirects) currentDB.redirects = [];
  currentDB.redirects.push(newRedirect);
  saveDB(currentDB);

  logEvent('redirect_added', `New redirect rules added: ${oldUrl} -> ${newUrl}`);
  res.json({ success: true, redirect: newRedirect });
});

app.delete('/api/admin/redirects/:id', (req, res) => {
  const { id } = req.params;
  const currentDB = getDB();
  currentDB.redirects = currentDB.redirects?.filter(r => r.id !== id) || [];
  saveDB(currentDB);
  res.json({ success: true });
});

// Database Backups and logs (Step 6)
app.get('/api/admin/logs', (req, res) => {
  res.json(getLogs());
});

app.post('/api/admin/backup', (req, res) => {
  backupDB();
  res.json({ success: true, message: 'Database backup successfully initiated and completed.' });
});

// Google suggestion query proxy (Step 7)
app.get('/api/articles/google-completion', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'query parameter is required' });

  try {
    const response = await fetch(`https://suggestqueries.google.com/complete/search?client=chrome&hl=en&q=${encodeURIComponent(query as string)}`);
    const data = await response.json();
    // Google completion format is: [original_query, [suggestions_array], ...]
    res.json(data[1] || []);
  } catch (err: any) {
    logEvent('api_error', `Google suggestion lookup failed: ${err.message}`);
    // Fallback static suggestions based on standard queries
    res.json([
      `${query} calculator free`,
      `how to use ${query}`,
      `best ${query} formula`,
      `why calculate ${query}`
    ]);
  }
});

// Simple Levenshtein distance for Anti-Duplication check (Step 9)
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
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  return 1 - distance / maxLen;
}

// Articles CRUD & Generation (Step 7 & 8 & 9)
app.get('/api/articles', (req, res) => {
  const currentDB = getDB();
  res.json(currentDB.articles || []);
});

app.post('/api/articles', adminAuthMiddleware, (req, res) => {
  const { calculatorId, slug, title, content, status } = req.body;
  const currentDB = getDB();

  // Step 9: Similarity Check
  const contentToCompare = content || '';
  const duplicateArticle = currentDB.articles.find(art => {
    const similarity = calculateLevenshteinSimilarity(art.content, contentToCompare);
    return similarity > 0.70;
  });

  if (duplicateArticle) {
    logEvent('anti_duplication', `Article creation blocked. High similarity (>70%) detected with existing article: ${duplicateArticle.title}`);
    return res.status(400).json({ 
      error: 'Article creation blocked! Similarity of more than 70% with existing article: ' + duplicateArticle.title 
    });
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
      canonicalUrl: `/${slug}`
    },
    version: 1,
    createdAt: new Date().toISOString()
  };

  currentDB.articles.push(newArticle);

  // Versioning
  if (!currentDB.articleVersions) currentDB.articleVersions = [];
  currentDB.articleVersions.push({
    id: `version_${Date.now()}`,
    articleId: id,
    content,
    createdAt: new Date().toISOString()
  });

  saveDB(currentDB);
  res.json({ success: true, article: newArticle });
});

app.put('/api/articles/:id', adminAuthMiddleware, (req, res) => {
  const { id } = req.params;
  const { title, slug, content, status } = req.body;
  const currentDB = getDB();

  const articleIndex = currentDB.articles.findIndex(a => a.id === id);
  if (articleIndex === -1) {
    return res.status(404).json({ error: 'Article not found' });
  }

  const existingArticle = currentDB.articles[articleIndex];
  
  // If content changed, we do a version increment and save version
  const contentChanged = content !== undefined && content !== existingArticle.content;
  const newVersion = contentChanged ? existingArticle.version + 1 : existingArticle.version;

  if (contentChanged) {
    if (!currentDB.articleVersions) currentDB.articleVersions = [];
    currentDB.articleVersions.push({
      id: `version_${Date.now()}`,
      articleId: id,
      content: content,
      createdAt: new Date().toISOString()
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
      title: title !== undefined ? `${title} | Professional Complete Guide` : existingArticle.seoData.title,
      description: content !== undefined ? content.slice(0, 150).replace(/[#*`]/g, '') + '...' : existingArticle.seoData.description,
      keywords: existingArticle.seoData.keywords,
      canonicalUrl: slug !== undefined ? `/${slug}` : existingArticle.seoData.canonicalUrl
    }
  };

  currentDB.articles[articleIndex] = updatedArticle;
  saveDB(currentDB);
  logEvent('article_updated', `Article updated: ${updatedArticle.title} (Status: ${updatedArticle.status}, Version: ${updatedArticle.version})`);
  res.json({ success: true, article: updatedArticle });
});

app.delete('/api/articles/:id', adminAuthMiddleware, (req, res) => {
  const { id } = req.params;
  const currentDB = getDB();

  const articleIndex = currentDB.articles.findIndex(a => a.id === id);
  if (articleIndex === -1) {
    return res.status(404).json({ error: 'Article not found' });
  }

  const article = currentDB.articles[articleIndex];
  currentDB.articles.splice(articleIndex, 1);
  
  // Clean up versions
  if (currentDB.articleVersions) {
    currentDB.articleVersions = currentDB.articleVersions.filter(v => v.articleId !== id);
  }

  saveDB(currentDB);
  logEvent('article_deleted', `Deleted article: ${article.title}`);
  res.json({ success: true });
});

// OpenRouter AI Article generation queue & jobs status (Step 7 & 10)
interface BackgroundTask {
  id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  result?: any;
  error?: string;
}
const backgroundTasks = new Map<string, BackgroundTask>();

app.get('/api/tasks/:id', (req, res) => {
  const task = backgroundTasks.get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

app.post('/api/articles/generate-async', adminAuthMiddleware, (req, res) => {
  const { calculatorId, calculatorName, keywords, title } = req.body;
  const taskId = `task_${Date.now()}`;
  
  backgroundTasks.set(taskId, {
    id: taskId,
    status: 'queued',
    progress: 0
  });

  // Run generation asynchronously in background
  generateArticleInBackground(taskId, calculatorId, calculatorName, keywords, title);

  res.json({ success: true, taskId });
});

async function generateArticleInBackground(
  taskId: string, 
  calculatorId: string, 
  calculatorName: string, 
  keywords: string[], 
  title: string
) {
  const task = backgroundTasks.get(taskId);
  if (!task) return;

  task.status = 'running';
  task.progress = 20;

  try {
    const currentDB = getDB();
    const openrouterApiKey = currentDB.settings.openrouterApiKey;
    const geminiClient = getGeminiClient();

    task.progress = 40;

    const keywordsStr = keywords.join(', ');
    const prompt = `Write a professional, fully English-language article about "${calculatorName}". The primary title of the article MUST be exactly: "${title}".

Write like an experienced human expert, not like an AI assistant. Avoid generic AI phrasing, avoid overly balanced or list-like structures, vary sentence rhythm, and include specific concrete details and realistic examples. Start with a direct, useful answer that a reader could cite immediately, then build the rest of the article around practical context, formula explanations, common mistakes, and real-world scenarios.

Target word count: 1500 to 2500 words. The article should feel like a premium editorial guide rather than a templated AI write-up.

Requirements:
- Optimize for classic SEO and AEO: include a clear answer in the opening paragraphs, a logical H2/H3 structure, natural keyword usage, and a FAQ section that mirrors how people actually search.
- Include at least one comparison table and one step-by-step worked example with realistic numbers.
- Mention the calculator's purpose, the underlying formula, the practical use cases, and a short internal linking suggestion section that points readers to related calculators.
- Use natural English, varied sentence lengths, and concrete details. Avoid clichés such as "In today's world", "It's important to note", "In conclusion", or other generic AI phrasing.

Output ONLY the Markdown content without any conversational introduction or closing remarks. Start directly with the markdown content.`;

    let generatedMarkdown = '';

    if (geminiClient) {
      logEvent('ai_generation', `Generating guide using native Gemini API (gemini-3.5-flash) for ${calculatorName}`);
      const response = await geminiClient.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });
      generatedMarkdown = response.text || '';
    } else if (openrouterApiKey) {
      logEvent('ai_generation', `Generating guide using OpenRouter for ${calculatorName}`);
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openrouterApiKey}`,
          'HTTP-Referer': 'https://calculatorplatform.com',
          'X-Title': 'Professional Calculator Platform'
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.3-70b-instruct:free',
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        const errorMsg = await response.text();
        throw new Error(`OpenRouter API call failed: ${response.statusText} (${errorMsg})`);
      }

      const data = await response.json();
      generatedMarkdown = data.choices?.[0]?.message?.content || '';
    } else {
      throw new Error('No AI configuration found. Configure OpenRouter API Key in the Settings Panel or ensure GEMINI_API_KEY environment variable is present.');
    }

    task.progress = 70;

    if (!generatedMarkdown) {
      throw new Error('AI returned an empty message.');
    }

    task.progress = 90;

    // Create a pending review article
    const finalDB = getDB();
    const artId = `article_${Date.now()}`;
    const slug = calculatorName.toLowerCase().replace(/\s+/g, '-') + '-guide';

    const newArticle: Article = {
      id: artId,
      calculatorId,
      slug,
      title,
      content: generatedMarkdown,
      status: 'pending_review',
      seoData: {
        title: `${title} | Professional Complete Guide`,
        description: generatedMarkdown.slice(0, 150).replace(/[#*`]/g, '') + '...',
        keywords: keywords,
        canonicalUrl: `/${slug}`
      },
      version: 1,
      createdAt: new Date().toISOString()
    };

    finalDB.articles.push(newArticle);

    // Save version
    if (!finalDB.articleVersions) finalDB.articleVersions = [];
    finalDB.articleVersions.push({
      id: `version_${Date.now()}`,
      articleId: artId,
      content: generatedMarkdown,
      createdAt: new Date().toISOString()
    });

    saveDB(finalDB);
    logEvent('article_generated', `AI generated article for ${calculatorName}: ${title}`);

    task.status = 'completed';
    task.progress = 100;
    task.result = newArticle;

  } catch (err: any) {
    task.status = 'failed';
    task.error = err.message;
    logEvent('generation_error', `AI Article Generation failed: ${err.message}`);
  }
}

// Step 8: Programmatic SEO Variants Generation
app.post('/api/seo-prog/generate', adminAuthMiddleware, async (req, res) => {
  const { calculatorId, calculatorName } = req.body;
  const currentDB = getDB();
  const openrouterApiKey = currentDB.settings.openrouterApiKey;
  const geminiClient = getGeminiClient();

  if (!geminiClient && !openrouterApiKey) {
    return res.status(400).json({ error: 'No AI configuration found. Configure OpenRouter API Key in the Settings Panel or ensure GEMINI_API_KEY is present.' });
  }

  try {
    const prompt = `As an SEO Specialist, suggest 5 highly converting, specific localized or contextual variants of the "${calculatorName}" for SEO programmatic targeting. 
Examples: "Texas Mortgage Calculator", "France Calorie Calculator", "Student GPA Calculator", etc.
For each, provide:
1. Target Variant Title
2. Target Variant Slug
3. A short overview (100 words) describing the specific local rules, taxes, or criteria (e.g. state-specific rules in Texas, or metric system defaults in France) with REAL-LIFE realistic guidelines (no duplication, actual value).

Response format must be a clean valid JSON array of objects:
[
  { "title": "...", "slug": "...", "content": "..." }
]
Do not wrap in anything else than json code block.`;

    let text = '[]';

    if (geminiClient) {
      logEvent('ai_generation', `Generating Programmatic SEO variants using native Gemini API (gemini-3.5-flash) for ${calculatorName}`);
      const response = await geminiClient.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });
      text = response.text || '[]';
    } else if (openrouterApiKey) {
      logEvent('ai_generation', `Generating Programmatic SEO variants using OpenRouter for ${calculatorName}`);
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openrouterApiKey}`,
          'HTTP-Referer': 'https://calculatorplatform.com',
          'X-Title': 'Professional Calculator Platform'
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.3-70b-instruct:free',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API failed: ${response.statusText}`);
      }

      const data = await response.json();
      text = data.choices?.[0]?.message?.content || '[]';
    }

    // Clean codeblock markdown markers if present
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let variants = [];
    try {
      const parsed = JSON.parse(text);
      variants = Array.isArray(parsed) ? parsed : (parsed.variants || []);
    } catch {
      variants = [];
    }

    // Add variants as draft articles
    const updatedDB = getDB();
    const createdDrafts = [];

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
          canonicalUrl: `/${v.slug}`
        },
        version: 1,
        createdAt: new Date().toISOString()
      };

      updatedDB.articles.push(draftArt);
      createdDrafts.push(draftArt);
    }

    saveDB(updatedDB);
    logEvent('seo_prog_generated', `Generated ${createdDrafts.length} programmatic SEO variants for ${calculatorName}`);
    res.json({ success: true, variants: createdDrafts });

  } catch (err: any) {
    logEvent('api_error', `Programmatic SEO generation failed: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// Step 10: Dynamic Code Generator for new Modular Calculators
app.post('/api/code-gen/create', adminAuthMiddleware, async (req, res) => {
  const { spec } = req.body;
  if (!spec) return res.status(400).json({ error: 'specifications are required' });

  const currentDB = getDB();
  const openrouterApiKey = currentDB.settings.openrouterApiKey;
  const geminiClient = getGeminiClient();

  if (!geminiClient && !openrouterApiKey) {
    return res.status(400).json({ error: 'No AI configuration found. Configure OpenRouter API Key in the Settings Panel or ensure GEMINI_API_KEY environment variable is present.' });
  }

  try {
    const prompt = `You are an Elite Staff Engineer and Senior TypeScript Developer.
Based on these specifications: "${spec}", generate a modular client-side calculator matching our exact folder architecture.

You MUST format your response as a single, valid JSON object containing exactly the keys "formulaCode", "validationCode", "testsCode", and "meta".
No explanation, no thought block, no prefix or suffix, no surrounding text other than valid JSON.

JSON Schema to strictly follow:
{
  "formulaCode": "string (Valid, clean, heavily commented TypeScript code for formula.ts)",
  "validationCode": "string (Valid, clean, heavily commented TypeScript code for validation.ts)",
  "testsCode": "string (Valid, clean, heavily commented TypeScript code for tests.ts, exporting runTests function returning { success: boolean, logs: string[] })",
  "meta": {
    "calculatorName": "string (e.g. Texas Mortgage Calculator)",
    "category": "string (MUST be one of 'financial', 'fitness', 'math', 'more', or a new suitable category name matching the tool's focus, lowercased)",
    "seoTitle": "string (e.g. Texas Mortgage Calculator - Instant PITI & Homestead Exemption Estimator)",
    "seoDescription": "string (e.g. Calculate your Texas mortgage payments with school district tax reductions, regional weather insurance hazards, and PITI results.)",
    "seoKeywords": ["texas mortgage calculator", "texas homestead exemption", "piti calculator"],
    "seoArticleContent": "string (A comprehensive, professional, 100/100 SEO & AEO optimized guide written in English. It must explain the calculator's purpose, the exact formulas used, step-by-step calculations with sample numbers, a formatted markdown comparison table, and a dedicated FAQ section with 5 to 10 practical questions. Write like an experienced human expert, not like an AI assistant; vary sentence rhythm, include concrete details, and avoid generic AI phrasing. Keep the tone authoritative and natural. Word count should be 1200-2000 words.)",
    "inputs": [
      { "name": "string (valid camelCase JS key)", "label": "string", "type": "number", "defaultValue": 1000, "min": 0, "max": 100000000, "suffix": "string (e.g. '$', '%', 'years', etc.)", "helpText": "string" }
    ],
    "outputs": [
      { "name": "string (valid camelCase JS key)", "label": "string", "type": "number", "suffix": "string" }
    ],
    "calculateBody": "string (A complete, valid JavaScript function body executing the formula using the 'inputs' parameter and returning an object matching the keys defined in outputs. Ensure to handle division by zero, floating point precision, and perform calculations accurately according to the specified rules. Example: 'const P = inputs.principal; const r = (inputs.interest / 100) / 12; const n = inputs.months; const monthly = (P * r) / (1 - Math.pow(1 + r, -n)); return { monthlyPayment: Math.round(monthly * 100) / 100, totalInterest: Math.round(((monthly * n) - P) * 100) / 100 };')"
  }
}`;

    let text = '{}';

    if (geminiClient) {
      logEvent('ai_generation', `Generating modular calculator using native Gemini API (gemini-3.5-flash)`);
      const response = await geminiClient.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });
      text = response.text || '{}';
    } else if (openrouterApiKey) {
      logEvent('ai_generation', `Generating modular calculator using OpenRouter (deepseek/deepseek-r1-distill-llama-70b:free)`);
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openrouterApiKey}`,
          'HTTP-Referer': 'https://calculatorplatform.com',
          'X-Title': 'Professional Calculator Code Generator'
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-r1-distill-llama-70b:free',
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter Code Generator failed: ${response.statusText}`);
      }

      const data = await response.json();
      text = data.choices?.[0]?.message?.content || '{}';
    }

    // Clean up thought tags or codeblocks if any
    if (text.includes('</thought>')) {
      text = text.split('</thought>')[1] || text;
    }
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    let parsedResult: any = { formulaCode: '', validationCode: '', testsCode: '', meta: null };
    try {
      parsedResult = JSON.parse(text);
    } catch (e: any) {
      console.error('Failed to parse AI JSON response:', e, 'Raw response text:', text);
      // Try to extract JSON between { and } if any
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        try {
          parsedResult = JSON.parse(text.slice(firstBrace, lastBrace + 1));
        } catch {
          throw new Error('AI returned an invalid JSON block. Try regenerating.');
        }
      } else {
        throw new Error('AI returned an invalid JSON block. Try regenerating.');
      }
    }

    logEvent('code_generator_success', `AI modular code files and metadata generated for ${parsedResult.meta?.calculatorName || 'Custom Calculator'}`);
    res.json({ success: true, code: parsedResult });

  } catch (err: any) {
    logEvent('api_error', `Code Generation failed: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

function validateGeneratedCode(payload: { formulaCode?: string; validationCode?: string; testsCode?: string; meta?: { calculateBody?: string } }) {
  const forbiddenPatterns = [
    { pattern: /\bfetch\s*\(/, label: 'fetch' },
    { pattern: /\bXMLHttpRequest\b/, label: 'XMLHttpRequest' },
    { pattern: /\bdocument\./, label: 'document.' },
    { pattern: /\bwindow\./, label: 'window.' },
    { pattern: /\beval\s*\(/, label: 'eval' },
    { pattern: /\bimport\b/, label: 'import' },
    { pattern: /\brequire\s*\(/, label: 'require' },
    { pattern: /\blocalStorage\b/, label: 'localStorage' },
    { pattern: /\bsessionStorage\b/, label: 'sessionStorage' },
    { pattern: /\bcookies?\b/, label: 'cookie' }
  ];

  const snippets = [payload.formulaCode, payload.validationCode, payload.testsCode, payload.meta?.calculateBody]
    .filter((value): value is string => Boolean(value))
    .join('\n');

  return forbiddenPatterns.filter(({ pattern }) => pattern.test(snippets)).map(({ label }) => label);
}

// Endpoint to publish a modular calculator live to its category
app.post('/api/calculators/publish', adminAuthMiddleware, (req, res) => {
  const { id, name, category, formulaCode, validationCode, testsCode, meta } = req.body;
  if (!id || !name || !category) {
    return res.status(400).json({ error: 'id, name, and category are required' });
  }

  const reviewIssues = validateGeneratedCode({ formulaCode, validationCode, testsCode, meta: { calculateBody: meta?.calculateBody } });
  if (reviewIssues.length > 0) {
    return res.status(400).json({
      error: 'Generated code failed review. Remove unsafe patterns before publishing.',
      issues: reviewIssues
    });
  }

  const currentDB = getDB();
  const slug = `${id}-calculator`;

  const existingCalcIndex = currentDB.calculators.findIndex(c => c.id === id);
  const newCalc: Calculator = {
    id,
    slug,
    name,
    category,
    status: 'active',
    metadata: {
      title: meta?.seoTitle || `${name} - Professional Calculator`,
      description: meta?.seoDescription || `Calculate metrics for ${name} instantly.`,
      keywords: meta?.seoKeywords || [name.toLowerCase(), 'calculator', 'formula'],
      inputs: meta?.inputs || [],
      outputs: meta?.outputs || [],
      calculateBody: meta?.calculateBody || ''
    },
    settings: {
      customFormula: formulaCode || ''
    },
    createdAt: new Date().toISOString()
  };

  if (existingCalcIndex !== -1) {
    currentDB.calculators[existingCalcIndex] = newCalc;
  } else {
    currentDB.calculators.push(newCalc);
  }

  // Auto-publish SEO article if generated
  if (meta?.seoArticleContent) {
    const articleId = `article_${id}`;
    const articleSlug = slug;

    const existingArticleIndex = currentDB.articles.findIndex(a => a.calculatorId === id);
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
        canonicalUrl: `/${articleSlug}`
      },
      version: 1,
      createdAt: new Date().toISOString()
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
      createdAt: new Date().toISOString()
    });
  }

  saveDB(currentDB);
  logEvent('calculator_published', `Dynamic calculator ${name} was successfully published live to category: ${category}`);
  res.json({ success: true, calculator: newCalc });
});

// Ads.txt serving (Step 9)
app.get('/ads.txt', (req, res) => {
  res.header('Content-Type', 'text/plain');
  res.send('google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0');
});

// Serve frontend build static files & SPA middleware
const distPath = path.resolve(__dirname, 'dist');
const indexPath = path.resolve(__dirname, 'index.html');

if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });
  app.use(vite.middlewares);
} else {
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // Fallback if build hasn't happened yet
    app.use(express.static(__dirname));
    app.get('*', (req, res) => {
      res.sendFile(indexPath);
    });
  }
}

const PORT = Number(process.env.PORT) || 3000;
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
  });
}

export default app;

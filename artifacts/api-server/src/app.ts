import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import { getDB, logEvent, whenReady } from "./db/db.js";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database (Postgres-backed) before handling any request. This
// runs once per process — on Replit that's once at server boot; on Vercel
// serverless it's once per cold start (subsequent invocations reuse it).
const dbReadyPromise = whenReady()
  .then(() => {
    logEvent("system", "Professional Calculator Platform backend started.");
  })
  .catch((err) => {
    console.error("[app] Database failed to initialize", err);
  });

app.use((_req: Request, res: Response, next) => {
  dbReadyPromise.then(() => next()).catch(() => {
    res.status(503).json({ error: "Database is not ready yet, please retry." });
  });
});

// 301 Redirects interception middleware
app.use((req: Request, res: Response, next) => {
  try {
    const currentDB = getDB();
    const matchingRedirect = currentDB.redirects?.find(
      (r) => r.oldUrl === req.originalUrl || r.oldUrl === req.path,
    );
    if (matchingRedirect) {
      logEvent(
        "redirect",
        `${matchingRedirect.statusCode} Redirect: ${matchingRedirect.oldUrl} -> ${matchingRedirect.newUrl}`,
      );
      res.redirect(matchingRedirect.statusCode || 301, matchingRedirect.newUrl);
      return;
    }
  } catch {
    // DB not ready yet — skip redirect check
  }
  next();
});

// Sitemap, robots, ads served at root level (outside /api)
app.get("/sitemap.xml", (_req: Request, res: Response) => {
  try {
    const currentDB = getDB();
    const activeCalculators = currentDB.calculators.filter((c) => c.status === "active");
    const domain =
      process.env.APP_URL ||
      (process.env.REPLIT_DOMAINS
        ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
        : "https://calculatorplatform.com");

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    xml += `  <url>\n    <loc>${domain}/</loc>\n    <priority>1.0</priority>\n    <changefreq>daily</changefreq>\n  </url>\n`;

    const statics = ["/about-us", "/privacy-policy", "/terms-of-use", "/contact"];
    statics.forEach((p) => {
      xml += `  <url>\n    <loc>${domain}${p}</loc>\n    <priority>0.5</priority>\n    <changefreq>monthly</changefreq>\n  </url>\n`;
    });

    const categories = ["/financial-calculators", "/fitness-calculators", "/math-calculators"];
    categories.forEach((p) => {
      xml += `  <url>\n    <loc>${domain}${p}</loc>\n    <priority>0.7</priority>\n    <changefreq>weekly</changefreq>\n  </url>\n`;
    });

    // Deduplicate by slug before generating URLs
    const seenSlugs = new Set<string>();
    activeCalculators.forEach((calc) => {
      if (!calc.slug || seenSlugs.has(calc.slug)) return;
      seenSlugs.add(calc.slug);
      xml += `  <url>\n    <loc>${domain}/${calc.slug}</loc>\n    <priority>0.9</priority>\n    <changefreq>weekly</changefreq>\n  </url>\n`;
    });

    xml += "</urlset>";
    res.header("Content-Type", "application/xml");
    res.send(xml);
  } catch {
    res.status(500).send("<?xml version=\"1.0\"?><urlset/>");
  }
});

app.get("/robots.txt", (_req: Request, res: Response) => {
  const domain =
    process.env.APP_URL ||
    (process.env.REPLIT_DOMAINS
      ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
      : "https://calculatorplatform.com");
  res.header("Content-Type", "text/plain");
  res.send(`User-agent: *\nAllow: /\nSitemap: ${domain}/sitemap.xml\n`);
});

app.get("/ads.txt", (_req: Request, res: Response) => {
  res.header("Content-Type", "text/plain");
  res.send("google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0");
});

app.use("/api", router);

export default app;

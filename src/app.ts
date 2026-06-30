import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { clerkMiddleware } from "@clerk/express";

import userModuleRoutes from "./modules/users/user.routes";
import subscriptionRoutes from "./modules/subscription/subscription.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import threatsRoutes from "./modules/threats/threats.routes";
import scannerRoutes from "./routes/scan.routes";
import reportRoutes from "./routes/report.routes";
import comparisonRoutes from "./routes/comparison.routes";
import trendRoutes from "./routes/trend.routes";
import timelineRoutes from "./routes/timeline.routes";
import attackSurfaceRoutes from "./routes/attack-surface.routes";
import securityScoreRoutes from "./routes/security-score.routes";
import riskHeatmapRoutes from "./routes/risk-heatmap.routes";
import remediationRoadmapRoutes from "./routes/remediation-roadmap.routes";
import pdfReportRoutes from "./routes/pdf-report.routes";
import executiveInsightsRoutes from "./routes/executive-insights.routes";
import domainValidationRoutes from "./routes/domain-validation.routes";
import networkShieldRoutes from "./routes/network-shield.routes";
import vaultRoutes from "./routes/vault.routes";
import clerkWebhookRoutes from "./routes/clerk-webhook.routes";
import notificationsRoutes from "./routes/notifications.routes";
import deployPatchRoutes from "./modules/deploy patch/deploy-patch.routes";
import contactRoutes from "./routes/contact.routes";
import analyticsRoutes from "./modules/analytics/analytics.routes";
import telemetryRoutes from "./modules/telemetry/telemetry.routes";
import aiTerminalRoutes from "./modules/ai terminal/ai-terminal.routes";
import { validateBody, scanTargetSchema } from "./middleware/validate";

const app = express();

app.set("etag", false);
app.disable("x-powered-by"); // hides "X-Powered-By: Express" header

const allowedOrigins = [
  "https://sentinel-ai-frontend.vercel.app",
  "http://localhost:3001",
  "https://sentinel-ai.me",
  "https://www.sentinel-ai.me",
];

app.use(cors({ origin: allowedOrigins, credentials: true }));

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https://*.supabase.co"],
        connectSrc: [
          "'self'",
          "https://*.clerk.accounts.dev",
          "https://*.supabase.co",
        ],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
);

app.use(morgan("dev"));

// CRITICAL: Clerk webhook route MUST be mounted BEFORE express.json().
// Svix needs the RAW body to verify signatures.
app.use("/api", clerkWebhookRoutes);

// JSON parser applies to everything AFTER the webhook route
app.use(express.json());

app.use(clerkMiddleware());

// Limiters defined OUTSIDE the production-only block so they always
// exist as variables (avoids "scanLimiter is not defined" crashes in
// dev mode), but are only attached to routes when NODE_ENV=production.
const checkoutLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

const scanLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Scan rate limit exceeded. Please try again later." },
});

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "AI request rate limit exceeded." },
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);

  app.use("/api/subscription", checkoutLimiter);
  app.use("/api/scanner", scanLimiter);
  app.use("/api/scans", scanLimiter);
  app.use("/api/ai-terminal", aiLimiter);
  app.use(generalLimiter);
}

app.get("/api/health", (_req, res) => {
  res.status(200).json({ success: true, message: "Backend is running" });
});

app.use("/api/users", userModuleRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/threats", threatsRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/telemetry", telemetryRoutes);

// SSRF validation now wired BEFORE the scanner route handler runs
app.use("/api/scanner", validateBody(scanTargetSchema), scannerRoutes);

app.use("/api/reports", reportRoutes);
app.use("/api/scans", comparisonRoutes);
app.use("/api/scans", trendRoutes);
app.use("/api/scans", timelineRoutes);
app.use("/api/scans", attackSurfaceRoutes);
app.use("/api/scans", securityScoreRoutes);
app.use("/api/scans", riskHeatmapRoutes);
app.use("/api/scans", remediationRoadmapRoutes);
app.use("/api/reports", pdfReportRoutes);
app.use("/api", executiveInsightsRoutes);
app.use("/api/scanner", domainValidationRoutes);
app.use("/api/network-shield", networkShieldRoutes);
app.use("/api/vault", vaultRoutes);
app.use("/api/ai-terminal", aiTerminalRoutes);
app.use("/api/deploy-patch", deployPatchRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/contact", contactRoutes);

app.use("*", (_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

export default app;
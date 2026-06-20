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

import notificationsRoutes from "./routes/notifications.routes";

import deployPatchRoutes from "./modules/deploy patch/deploy-patch.routes";

import contactRoutes from "./routes/contact.routes";

// Analytics
import analyticsRoutes from "./modules/analytics/analytics.routes";

// Telemetry
import telemetryRoutes from "./modules/telemetry/telemetry.routes";

// AI Terminal
import aiTerminalRoutes from "./modules/ai terminal/ai-terminal.routes";

const app = express();

/*
|--------------------------------------------------------------------------
| Disable ETag
|--------------------------------------------------------------------------
| Express auto-generates ETags on every response. Browsers then send
| If-None-Match on the next request, and Express replies 304 Not Modified
| even when Cache-Control: no-store is set elsewhere. This was causing
| /api/dashboard/stats to return stale cached data instead of fresh data
| after a new scan. Disabling etag globally forces fresh 200 responses.
|--------------------------------------------------------------------------
*/

app.set("etag", false);

/*
|--------------------------------------------------------------------------
| Global Middlewares
|--------------------------------------------------------------------------
*/

app.use(express.json());

const allowedOrigins = [
  "https://sentinel-ai-frontend.vercel.app",
  "http://localhost:3001",
  "https://sentinel-ai.me",        // ← add karo
  "https://www.sentinel-ai.me",    // ← add karo
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(helmet());

app.use(morgan("dev"));

app.use(clerkMiddleware());

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);

  const checkoutLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
  });
  app.use("/api/subscription", checkoutLimiter);

  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
  });
  app.use(generalLimiter);
}


/*
|--------------------------------------------------------------------------
| Health Route
|--------------------------------------------------------------------------
*/

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is running",
  });
});

/*
|--------------------------------------------------------------------------
| Module Routes
|--------------------------------------------------------------------------
*/

app.use("/api/users", userModuleRoutes);

app.use(
  "/api/subscription",
  subscriptionRoutes
);

app.use(
  "/api/dashboard",
  dashboardRoutes
);

app.use(
  "/api/threats",
  threatsRoutes
);

app.use(
  "/api/analytics",
  analyticsRoutes
);

app.use(
  "/api/telemetry",
  telemetryRoutes
);

app.use(
  "/api/scanner",
  scannerRoutes
);

app.use(
  "/api/reports",
  reportRoutes
);

app.use(
  "/api/scans",
  comparisonRoutes
);

app.use(
  "/api/scans",
  trendRoutes
);

app.use(
  "/api/scans",
  timelineRoutes
);

app.use(
  "/api/scans",
  attackSurfaceRoutes
);

app.use(
  "/api/scans",
  securityScoreRoutes
);

app.use(
  "/api/scans",
  riskHeatmapRoutes
);

app.use(
  "/api/scans",
  remediationRoadmapRoutes
);

app.use(
  "/api/reports",
  pdfReportRoutes
);

app.use(
  "/api",
   executiveInsightsRoutes);

app.use(
  "/api/scanner",
  domainValidationRoutes
);

app.use(
  "/api/network-shield",
  networkShieldRoutes
);


app.use(
  "/api/vault", 
  vaultRoutes
);

app.use(
  "/api/ai-terminal",
  aiTerminalRoutes
);

app.use(
  "/api/deploy-patch",
  deployPatchRoutes
);

app.use(
  "/api/notifications",
   notificationsRoutes
);


app.use(
  "/api/contact", 
  contactRoutes
);

/*
|--------------------------------------------------------------------------
| 404 Handler
|--------------------------------------------------------------------------
*/

app.use("*", (_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

export default app;

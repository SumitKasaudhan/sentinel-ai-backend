import { Router } from "express";
import authMiddleware from "../../middleware/auth.middleware";

import {
  getThreatTrends,
  getSeverityDistribution,
  getCountryAnalytics,
} from "./analytics.controller";

const router = Router();

router.use(authMiddleware);

router.get("/trends", getThreatTrends);
router.get("/severity", getSeverityDistribution);
router.get("/countries", getCountryAnalytics);

export default router;
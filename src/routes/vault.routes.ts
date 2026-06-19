import { Router } from "express";

import requireAuth from "../middleware/auth.middleware";

import {
  getOverview,
  getReports,
  getScans,
} from "../controllers/vault.controller";

const router = Router();

router.get(
  "/overview",
  requireAuth,
  getOverview
);

router.get(
  "/reports",
  requireAuth,
  getReports
);

router.get(
  "/scans",
  requireAuth,
  getScans
);

export default router;
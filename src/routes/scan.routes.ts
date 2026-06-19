import { Router } from "express";

import requireAuth from "../middleware/auth.middleware";

import { scanTarget } from "../controllers/scan.controller";
import {
  getScanHistory,
  deleteScanHistory,
} from "../controllers/history.controller";
import { getScanById } from "../controllers/scans.controller";
import { getTimeline } from "../controllers/timeline.controller";

const router = Router();

router.get("/test", (_req, res) => {
  res.json({
    success: true,
    message: "SCAN ROUTES WORKING",
  });
});

router.post(
  "/scan",
  requireAuth,
  scanTarget
);

router.get(
  "/history",
  requireAuth,
  getScanHistory
);

router.delete(
  "/history/:id",
  requireAuth,
  deleteScanHistory
);

router.get(
  "/:id/timeline",
  requireAuth,
  getTimeline
);

/*
  IMPORTANT:
  Keep this below /history and /history/:id
*/
router.get(
  "/:id",
  requireAuth,
  getScanById
);

export default router;
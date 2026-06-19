import { Router } from "express";

import authMiddleware from "../../middleware/auth.middleware";

import {
  getThreatsController,
  getThreatByIdController,
  createThreatController,
  deleteThreatController,
  updateThreatStatusController,
  analyzeThreatController,
} from "./threats.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", getThreatsController);
router.get("/:id", getThreatByIdController);
router.post("/", createThreatController);
router.patch("/:id/status", updateThreatStatusController);
router.post("/:id/analyze", analyzeThreatController);
router.delete("/:id", deleteThreatController);

export default router;
import { Router } from "express";
import requireAuth from "../middleware/auth.middleware";

import {
  getReportSummary,
} from "../controllers/report-summary.controller";

import {
  getReportsCharts,
  getReportsList,
  createReport,
  deleteReport,
  getReportsOverview,
} from "../controllers/reports.controller";

const router = Router();

router.get("/charts", requireAuth, getReportsCharts);
router.get("/list", requireAuth, getReportsList);
router.post("/list", requireAuth, createReport);
router.delete("/list", requireAuth, deleteReport);
router.get("/overview", requireAuth, getReportsOverview);

router.get("/:id/summary", getReportSummary);

export default router;
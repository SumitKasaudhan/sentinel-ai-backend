import { Router } from "express";
import { getExecutiveInsights } from "../controllers/executive-insights.controller";

const router = Router();

router.get(
  "/reports/:id/executive-insights",
  getExecutiveInsights
);

export default router;
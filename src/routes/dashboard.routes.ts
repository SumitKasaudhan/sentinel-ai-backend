import { Router } from "express";
import { dashboardStats } from "../controllers/dashboard.controller";
import requireAuth from "../middleware/auth.middleware";

const router = Router();

router.get("/stats", requireAuth, dashboardStats);

export default router;
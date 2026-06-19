import { Router } from "express";
import requireAuth from "../middleware/auth.middleware";
import { getOverview } from "../controllers/network-shield.controller";

const router = Router();

router.get("/overview", requireAuth, getOverview);

export default router;
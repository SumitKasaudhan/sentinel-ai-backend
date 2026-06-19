import { Router } from "express";
import authMiddleware from "../../middleware/auth.middleware";
import { getPreview, executePatches } from "./deploy-patch.controller";

const router = Router();
router.use(authMiddleware);
router.get("/preview", getPreview);
router.post("/execute", executePatches);   // ← NEW

export default router;
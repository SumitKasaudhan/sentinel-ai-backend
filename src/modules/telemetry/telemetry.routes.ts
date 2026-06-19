import { Router } from "express";
import authMiddleware from "../../middleware/auth.middleware";
import { getTelemetry } from "./telemetry.controller";

const router = Router();

// Previously UNPROTECTED → returning all users' combined telemetry
// Now scoped to req.auth().userId (clerkId)
router.use(authMiddleware);

router.get("/", getTelemetry);

export default router;
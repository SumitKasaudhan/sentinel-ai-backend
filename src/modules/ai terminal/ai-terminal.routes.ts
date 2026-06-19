import { Router } from "express";

import authMiddleware from "../../middleware/auth.middleware";

import {
  sendCommand,
  getMetrics,
  getActivity,
  getConversations,
  getMessages,
} from "./ai-terminal.controller";

const router = Router();

router.use(authMiddleware);

router.post("/command", sendCommand);
router.get("/metrics", getMetrics);
router.get("/activity", getActivity);
router.get("/conversations", getConversations);
router.get("/conversations/:conversationId/messages", getMessages);

export default router;
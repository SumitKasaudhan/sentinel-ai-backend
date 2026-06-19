import { Response } from "express";

import {
  processCommand,
  getModelMetrics,
  getConversationMessages,
} from "./ai-terminal.service";
import { getUserConversations } from "./conversation.service";
import { getRecentActivity } from "./activity.service";

export const sendCommand = async (req: any, res: Response) => {
  try {
    const clerkId = req.auth()?.userId;

    if (!clerkId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { message, conversationId } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    const result = await processCommand(clerkId, message, conversationId);

    return res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    console.error("AI TERMINAL COMMAND ERROR:", error);

    // Gemini-specific errors should not crash the terminal — return a
    // friendly assistant reply instead of a 500.
    if (error.message?.startsWith("AI engine")) {
      return res.status(200).json({
        success: true,
        data: {
          conversationId: req.body.conversationId || null,
          reply:
            "AI analysis is temporarily unavailable (rate limit or quota reached on the AI provider). Please try again in a minute, or use a direct command like 'show threats' or 'show dashboard stats'.",
          intent: "ai_error",
        },
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const getMetrics = async (req: any, res: Response) => {
  try {
    const clerkId = req.auth()?.userId;

    if (!clerkId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const metrics = await getModelMetrics(clerkId);

    return res.status(200).json({ success: true, data: metrics });
  } catch (error: any) {
    console.error("AI TERMINAL METRICS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const getActivity = async (req: any, res: Response) => {
  try {
    const clerkId = req.auth()?.userId;

    if (!clerkId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const activity = await getRecentActivity(clerkId, 10);

    return res.status(200).json({ success: true, data: activity });
  } catch (error: any) {
    console.error("AI TERMINAL ACTIVITY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const getConversations = async (req: any, res: Response) => {
  try {
    const clerkId = req.auth()?.userId;

    if (!clerkId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const conversations = await getUserConversations(clerkId);

    return res.status(200).json({ success: true, data: conversations });
  } catch (error: any) {
    console.error("AI TERMINAL CONVERSATIONS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const getMessages = async (req: any, res: Response) => {
  try {
    const clerkId = req.auth()?.userId;

    if (!clerkId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { conversationId } = req.params;

    const messages = await getConversationMessages(clerkId, conversationId);

    return res.status(200).json({ success: true, data: messages });
  } catch (error: any) {
    console.error("AI TERMINAL MESSAGES ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
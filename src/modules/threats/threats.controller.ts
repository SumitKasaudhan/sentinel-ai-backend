import { Response } from "express";

import {
  getThreatsService,
  getThreatByIdService,
  createThreatService,
  deleteThreatService,
  updateThreatStatusService,
  analyzeThreatService,
} from "./threats.service";

import { logActivity } from "../ai terminal/activity.service";

export const getThreatsController = async (req: any, res: Response) => {
  try {
    const clerkId = req.auth()?.userId;
    if (!clerkId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const threats = await getThreatsService(clerkId);
    return res.status(200).json({ success: true, data: threats });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to fetch threats" });
  }
};

export const getThreatByIdController = async (req: any, res: Response) => {
  try {
    const clerkId = req.auth()?.userId;
    if (!clerkId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const threat = await getThreatByIdService(req.params.id, clerkId);

    // FIX: getThreatByIdService now returns null (instead of throwing) when
    // the id doesn't match any row — e.g. a scan id was passed in by mistake.
    if (!threat) {
      return res.status(404).json({ success: false, message: "Threat not found" });
    }

    return res.status(200).json({ success: true, data: threat });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to fetch threat" });
  }
};

export const createThreatController = async (req: any, res: Response) => {
  try {
    const clerkId = req.auth()?.userId;
    if (!clerkId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const threat = await createThreatService(req.body, clerkId);
    return res.status(201).json({ success: true, data: threat });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to create threat" });
  }
};

export const deleteThreatController = async (req: any, res: Response) => {
  try {
    const clerkId = req.auth()?.userId;
    if (!clerkId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    await deleteThreatService(req.params.id, clerkId);
    await logActivity(clerkId, "threat_deleted", "Threat deleted from intelligence database", "safe");
    return res.status(200).json({ success: true, message: "Threat deleted successfully" });
  } catch (error: any) {
    console.error(error);
    if (error?.message === "Threat not found or access denied") {
      return res.status(404).json({ success: false, message: "Threat not found or access denied" });
    }
    return res.status(500).json({ success: false, message: "Failed to delete threat" });
  }
};

// ── NEW: Update threat status ────────────────────────────────────────────────

export const updateThreatStatusController = async (req: any, res: Response) => {
  try {
    const clerkId = req.auth()?.userId;
    if (!clerkId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required" });
    }

    const threat = await updateThreatStatusService(req.params.id, clerkId, { status });

    await logActivity(
      clerkId,
      "threat_status_updated",
      `Threat status changed to ${status}`,
      status === "resolved" ? "safe" : "warning"
    );

    return res.status(200).json({ success: true, data: threat });
  } catch (error: any) {
    console.error(error);
    if (error?.message === "Threat not found or access denied") {
      return res.status(404).json({ success: false, message: "Threat not found or access denied" });
    }
    return res.status(500).json({ success: false, message: "Failed to update threat status" });
  }
};

// ── NEW: AI threat analysis ──────────────────────────────────────────────────

export const analyzeThreatController = async (req: any, res: Response) => {
  try {
    const clerkId = req.auth()?.userId;
    if (!clerkId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const analysis = await analyzeThreatService(req.params.id, clerkId);
    return res.status(200).json({ success: true, data: analysis });
  } catch (error: any) {
    console.error(error);
    // FIX: analyzeThreatService now throws this specific message when the
    // threat doesn't exist — map it to 404 instead of a generic 500.
    if (error?.message === "Threat not found or access denied") {
      return res.status(404).json({ success: false, message: "Threat not found or access denied" });
    }
    return res.status(500).json({ success: false, message: "Failed to analyze threat" });
  }
};
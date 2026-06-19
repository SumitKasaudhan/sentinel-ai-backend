import { Response } from "express";
import { getDeployPatchPreview, executeDeployPatch } from "./deploy-patch.service";

export const getPreview = async (req: any, res: Response) => {
  try {
    const clerkId = req.auth()?.userId;
    if (!clerkId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const preview = await getDeployPatchPreview(clerkId);
    return res.status(200).json({ success: true, data: preview });
  } catch (error: any) {
    console.error("DEPLOY PATCH PREVIEW ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};

export const executePatches = async (req: any, res: Response) => {
  try {
    const clerkId = req.auth()?.userId;
    if (!clerkId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { threatIds } = req.body;
    if (!Array.isArray(threatIds) || threatIds.length === 0) {
      return res.status(400).json({ success: false, message: "threatIds array is required and must be non-empty." });
    }

    const result = await executeDeployPatch(clerkId, threatIds);
    return res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    console.error("DEPLOY PATCH EXECUTE ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};
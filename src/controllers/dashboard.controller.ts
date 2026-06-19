import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { getDashboardStats } from "../services/dashboard.service";

export const dashboardStats = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    console.log("[dashboard] userId from getAuth:", userId);

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const data = await getDashboardStats(userId);
    console.log("[dashboard] securityScore:", data.securityScore);

    res.set("Cache-Control", "no-store");
    res.json({ success: true, data });
  } catch (err) {
    console.error("[dashboard] stats error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import {
  getThreatTrendsService,
  getSeverityDistributionService,
  getCountryAnalyticsService,
} from "./analytics.service";

// ── GET /api/analytics/trends ────────────────────────────────────────────

export const getThreatTrends = async (req: Request, res: Response) => {
  try {
    const { userId: clerkId } = getAuth(req);

    if (!clerkId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const data = await getThreatTrendsService(clerkId);
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error("GET /analytics/trends error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ── GET /api/analytics/severity ──────────────────────────────────────────

export const getSeverityDistribution = async (req: Request, res: Response) => {
  try {
    const { userId: clerkId } = getAuth(req);

    if (!clerkId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const data = await getSeverityDistributionService(clerkId);
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error("GET /analytics/severity error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ── GET /api/analytics/countries ─────────────────────────────────────────

export const getCountryAnalytics = async (req: Request, res: Response) => {
  try {
    const { userId: clerkId } = getAuth(req);

    if (!clerkId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const data = await getCountryAnalyticsService(clerkId);
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error("GET /analytics/countries error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
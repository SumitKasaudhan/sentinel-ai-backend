import { Response } from "express";

import {
  getDashboardStats
} from "./dashboard.service";

export const getStats = async (
  req: any,
  res: Response
) => {

  try {

    const auth = req.auth();

    const clerkId = auth.userId;

    if (!clerkId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const stats =
      await getDashboardStats(clerkId);

    return res.status(200).json({
      success: true,
      data: stats,
    });

  } catch (error: any) {

    console.error(
      "DASHBOARD STATS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Internal Server Error",
    });
  }
}
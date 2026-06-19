import { Request, Response } from "express";

import { getUserProfile } from "./user.service";

export const getProfile = async (
  req: any,
  res: Response
) => {
  try {
    const auth = req.auth();

    const userId = auth.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const profile = await getUserProfile(userId);

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error: any) {
    console.error("GET PROFILE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
import { Response } from "express";
import { getNetworkOverview } from "../services/network-shield.service";

export const getOverview = async (
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

    const data = await getNetworkOverview(clerkId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
import { Response } from "express";
import {
  getVaultOverview,
  getVaultReports,
  getVaultScans,
} from "../services/vault.service";

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

    const data = await getVaultOverview(clerkId);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getReports = async (
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

    const reports = await getVaultReports(clerkId);
    res.status(200).json({
      success: true,
      reports,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getScans = async (
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

    const scans = await getVaultScans(clerkId);
    res.status(200).json({
      success: true,
      scans,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
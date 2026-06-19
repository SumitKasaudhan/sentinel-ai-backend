import { Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase";

export const getScanHistory = async (
  req: Request,
  res: Response
) => {
  try {
    const { data, error } =
      await supabaseAdmin
        .from("scans")
        .select("*")
        .order("created_at", {
          ascending: false,
        })
        .limit(20);

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      scans: data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        "Failed to load history",
    });
  }
};
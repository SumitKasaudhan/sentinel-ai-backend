import { Response } from "express";
import { supabaseAdmin } from "../config/supabase";

export const getScanHistory = async (
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

    const { data, error } = await supabaseAdmin
      .from("scans")
      .select("*")
      .eq("clerk_id", clerkId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "History Fetch Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch scan history",
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      scans: data || [],
    });

  } catch (error: any) {
    console.error(
      "History Controller Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const deleteScanHistory = async (
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

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Scan ID is required",
      });
    }

    // Ownership is enforced directly in the delete query —
    // a row only gets deleted if it belongs to this clerk_id.
    // This prevents one user from deleting another user's scan
    // even if they somehow learn its id.
    const { data, error } = await supabaseAdmin
      .from("scans")
      .delete()
      .eq("id", id)
      .eq("clerk_id", clerkId)
      .select();

    if (error) {
      console.error(
        "Delete Scan Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to delete scan",
        error: error.message,
      });
    }

    if (!data || data.length === 0) {
      // Either the scan doesn't exist, or it belongs to a
      // different user — don't reveal which, just 404.
      return res.status(404).json({
        success: false,
        message: "Scan not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Scan deleted successfully",
      deletedScan: data[0],
    });

  } catch (error: any) {
    console.error(
      "Delete Controller Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
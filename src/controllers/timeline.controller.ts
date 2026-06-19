import { Response } from "express";

import { supabaseAdmin }
from "../config/supabase";

import { generateThreatTimeline }
from "../services/threat-timeline.service";

export const getTimeline =
  async (
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

      const { data: scan, error } =
        await supabaseAdmin
          .from("scans")
          .select("*")
          .eq("id", id)
          .eq("clerk_id", clerkId)
          .single();

      if (error || !scan) {
        return res.status(404).json({
          success: false,
          message: "Scan not found",
        });
      }

      const timeline =
        generateThreatTimeline(scan);

      return res.json({
        success: true,
        timeline,
      });

    } catch (error: any) {

      return res.status(500).json({
        success: false,
        message: error.message,
      });

    }
  };
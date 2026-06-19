import { Request, Response } from "express";
import validator from "validator";

import { supabaseAdmin } from "../config/supabase";

import { getFindingsByScanId }
from "../services/findings.service";

import { generateSecuritySummary }
from "../services/ai-summary.service";

export const getReportSummary =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const { id: rawId } = req.params;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;

      if (!validator.isUUID(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid scan id",
        });
      }

      const { data: scan, error } =
        await supabaseAdmin
          .from("scans")
          .select("*")
          .eq("id", id)
          .single();

      if (error || !scan) {
        return res.status(404).json({
          success: false,
          message: "Scan not found",
        });
      }

      const findings =
        await getFindingsByScanId(id);

      const summary =
        generateSecuritySummary(
          scan,
          findings
        );

      return res.status(200).json({
        success: true,
        ...summary,
      });

    } catch (error: any) {

      console.error(
        "SUMMARY ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });

    }

  };
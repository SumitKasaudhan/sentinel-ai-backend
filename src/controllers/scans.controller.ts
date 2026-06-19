import { Response } from "express";
import validator from "validator";

import { supabaseAdmin } from "../config/supabase";

import { getFindingsByScanId } from "../services/findings.service";
import { getSecurityGrade } from "../services/security-grade.service";

export const getScanById = async (
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

    if (!validator.isUUID(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid scan id",
      });
    }

    const { data: scan, error: scanError } =
      await supabaseAdmin
        .from("scans")
        .select("*")
        .eq("id", id)
        .eq("clerk_id", clerkId)
        .single();

    if (scanError || !scan) {
      // Either doesn't exist, or belongs to someone else —
      // same response either way, so we don't leak existence.
      return res.status(404).json({
        success: false,
        message: "Scan not found",
      });
    }

    const findings =
      await getFindingsByScanId(id);

    const severityCounts = {
      critical: findings.filter(
        (finding) =>
          finding.severity?.toLowerCase() ===
          "critical"
      ).length,

      high: findings.filter(
        (finding) =>
          finding.severity?.toLowerCase() ===
          "high"
      ).length,

      medium: findings.filter(
        (finding) =>
          finding.severity?.toLowerCase() ===
          "medium"
      ).length,

      low: findings.filter(
        (finding) =>
          finding.severity?.toLowerCase() ===
          "low"
      ).length,
    };

    const recommendations = [
      ...new Map(
        findings.map((finding) => [
          finding.title,
          {
            title: finding.title,
            remediation:
              finding.remediation,
            severity:
              finding.severity,
            category:
              finding.category,
            impact: `-${finding.risk_points} Risk Score`,
          },
        ])
      ).values(),
    ];

    const securityGrade =
      getSecurityGrade(
        scan.risk_score || 0
      );

    return res.status(200).json({
      success: true,

      scan,

      findings,

      severityCounts,

      recommendations,

      securityGrade,
    });
  } catch (error: any) {
    console.error(
      "Get Scan By Id Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
import { supabaseAdmin } from "../config/supabase";

import {
  getFindingsByScanId,
} from "./findings.service";

export const compareScans =
  async (scanId: string) => {

    const {
      data: currentScan,
      error,
    } = await supabaseAdmin
      .from("scans")
      .select("*")
      .eq("id", scanId)
      .single();

    if (error || !currentScan) {
      throw new Error(
        "Current scan not found"
      );
    }

    console.log(
      "CURRENT SCAN:",
      currentScan
    );

    const currentScore =
      Number(
        currentScan.risk_score
      ) || 0;

    const {
      data: previousScans,
    } = await supabaseAdmin
      .from("scans")
      .select("*")
      .eq(
        "target",
        currentScan.target
      )
      .lt(
        "created_at",
        currentScan.created_at
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      )
      .limit(1);

    const previousScan =
      previousScans?.[0];

    if (!previousScan) {

      return {
        currentScore,

        previousScore:
          null,

        scoreDelta: 0,

        resolvedFindings: 0,

        newFindings: 0,

        firstScan: true,
      };
    }

    const previousScore =
      Number(
        previousScan.risk_score
      ) || 0;

    const currentFindings =
      (await getFindingsByScanId(
        currentScan.id
      )) || [];

    const previousFindings =
      (await getFindingsByScanId(
        previousScan.id
      )) || [];

    const currentTitles =
      new Set(
        currentFindings.map(
          (finding) =>
            finding.title
        )
      );

    const previousTitles =
      new Set(
        previousFindings.map(
          (finding) =>
            finding.title
        )
      );

    const resolvedFindings =
      previousFindings.filter(
        (finding) =>
          !currentTitles.has(
            finding.title
          )
      ).length;

    const newFindings =
      currentFindings.filter(
        (finding) =>
          !previousTitles.has(
            finding.title
          )
      ).length;

    const scoreDelta =
      previousScore -
      currentScore;

    return {

      currentScore,

      previousScore,

      scoreDelta,

      resolvedFindings,

      newFindings,

      firstScan: false,

    };

  };
import { supabaseAdmin } from "../config/supabase";

export interface Finding {
  scan_id?: string;

  severity:
    | "CRITICAL"
    | "HIGH"
    | "MEDIUM"
    | "LOW";

  category: string;

  title: string;

  description: string;

  remediation: string;

  risk_points: number;
}

export const saveFindings = async (
  findings: Finding[],
  scanId: string
) => {
  if (!findings.length) {
    return;
  }

  const payload = findings.map(
    (finding) => ({
      scan_id: scanId,

      severity: finding.severity,

      category: finding.category,

      title: finding.title,

      description:
        finding.description,

      remediation:
        finding.remediation,

      risk_points:
        finding.risk_points,
    })
  );

  const { error } =
    await supabaseAdmin
      .from("findings")
      .insert(payload);

  if (error) {
    console.error(
      "SAVE FINDINGS ERROR:",
      error
    );

    throw error;
  }

  console.log(
    `${payload.length} findings saved`
  );
};

export const getFindingsByScanId =
  async (scanId: string) => {
    const { data, error } =
      await supabaseAdmin
        .from("findings")
        .select("*")
        .eq("scan_id", scanId)
        .order("risk_points", {
          ascending: false,
        });

    if (error) {
      console.error(
        "GET FINDINGS ERROR:",
        error
      );

      throw error;
    }

    return data;
  };

export const getFindingsCount =
  async (scanId: string) => {
    const { count, error } =
      await supabaseAdmin
        .from("findings")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("scan_id", scanId);

    if (error) {
      throw error;
    }

    return count || 0;
  };

export const calculateFindingsScore =
  (findings: Finding[]) => {
    return findings.reduce(
      (
        total,
        finding
      ) =>
        total +
        finding.risk_points,
      0
    );
  };

export const getSeverityCounts = (
  findings: Finding[]
) => {
  return {
    critical: findings.filter(
      (f) =>
        f.severity ===
        "CRITICAL"
    ).length,

    high: findings.filter(
      (f) =>
        f.severity ===
        "HIGH"
    ).length,

    medium: findings.filter(
      (f) =>
        f.severity ===
        "MEDIUM"
    ).length,

    low: findings.filter(
      (f) =>
        f.severity ===
        "LOW"
    ).length,
  };
};

export const generateRecommendations =
  (findings: Finding[]) => {
    return findings.map(
      (finding) => ({
        title:
          finding.remediation,

        severity:
          finding.severity,

        impact:
          `-${finding.risk_points} Risk Score`,

        category:
          finding.category,
      })
    );
  };
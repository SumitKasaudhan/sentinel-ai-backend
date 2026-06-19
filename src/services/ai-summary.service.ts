interface SummaryResult {
  riskLevel: string;
  summary: string;
  businessImpact: string;
  recommendations: string[];
}

export function generateSecuritySummary(
  scan: any,
  findings: any[]
): SummaryResult {

  const score =
    Number(scan?.risk_score) || 0;

  let riskLevel = "LOW";

  if (score >= 71) {
    riskLevel = "HIGH";
  } else if (score >= 41) {
    riskLevel = "MEDIUM";
  }

  const criticalCount =
    findings.filter(
      (f) =>
        f.severity?.toUpperCase() ===
        "CRITICAL"
    ).length;

  const highCount =
    findings.filter(
      (f) =>
        f.severity?.toUpperCase() ===
        "HIGH"
    ).length;

  const mediumCount =
    findings.filter(
      (f) =>
        f.severity?.toUpperCase() ===
        "MEDIUM"
    ).length;

  const lowCount =
    findings.filter(
      (f) =>
        f.severity?.toUpperCase() ===
        "LOW"
    ).length;

  const missingHeaders = findings
    .filter((f) =>
      f.title
        ?.toLowerCase()
        .includes("missing")
    )
    .map((f) => f.title);

  const openPortFindings =
    findings.filter(
      (f) =>
        f.category
          ?.toLowerCase()
          .includes("port")
    );

  const recommendations = [
    ...new Set(
      findings.map(
        (finding) =>
          finding.title
      )
    ),
  ].slice(0, 5);

  let summary =
    `The target asset received a ${riskLevel} security rating with an overall risk score of ${score}. `;

  if (
    criticalCount > 0 ||
    highCount > 0
  ) {
    summary +=
      `The assessment identified ${criticalCount} critical and ${highCount} high severity findings requiring immediate attention. `;
  }

  if (
    mediumCount > 0 ||
    lowCount > 0
  ) {
    summary +=
      `Additionally, ${mediumCount} medium and ${lowCount} low severity issues were observed. `;
  }

  if (
    missingHeaders.length > 0
  ) {
    summary +=
      `Several security headers are missing which may increase exposure to client-side attacks and security policy bypasses. `;
  }

  if (
    openPortFindings.length > 0
  ) {
    summary +=
      `Network exposure was detected through publicly accessible services and open ports. `;
  }

  let businessImpact = "";

  switch (riskLevel) {

    case "HIGH":

      businessImpact =
        "High business risk. The environment may be exposed to attack vectors including cross-site scripting, clickjacking, insecure service exposure, information disclosure, and exploitation of weak security controls.";

      break;

    case "MEDIUM":

      businessImpact =
        "Moderate business risk. While no critical compromise indicators were detected, multiple weaknesses reduce the overall security posture and should be remediated to prevent future exploitation.";

      break;

    default:

      businessImpact =
        "Low business risk. The target demonstrates an acceptable security posture with only minor hardening improvements recommended.";

      break;
  }

  return {
    riskLevel,
    summary,
    businessImpact,
    recommendations:
      recommendations.length > 0
        ? recommendations
        : [
            "No major remediation actions required",
          ],
  };
}
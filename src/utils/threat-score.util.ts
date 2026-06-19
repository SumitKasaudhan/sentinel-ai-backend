export interface ThreatLike {
  severity?: string | null;
}

export const computeRiskScore = (threats: ThreatLike[]): number => {
  const total = threats.length;
  if (total === 0) return 0;

  const critical = threats.filter((i) => i.severity?.toLowerCase() === "critical").length;
  const high     = threats.filter((i) => i.severity?.toLowerCase() === "high").length;
  const medium   = threats.filter((i) => i.severity?.toLowerCase() === "medium").length;
  const low      = threats.filter((i) => i.severity?.toLowerCase() === "low").length;

  const weightedRisk = critical * 5 + high * 3 + medium * 2 + low;

  return Math.min(Math.round((weightedRisk / Math.max(total, 1)) * 20), 100);
};

export const computeSecurityScore = (threats: ThreatLike[]): number => {
  return 100 - computeRiskScore(threats);
};
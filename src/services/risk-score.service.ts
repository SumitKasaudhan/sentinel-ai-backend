export interface RiskInput {
  sslValid: boolean;

  csp: boolean;

  hsts: boolean;

  xFrameOptions: boolean;

  xContentTypeOptions: boolean;
}

export interface RiskResult {
  score: number;

  level:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL";

  breakdown: {
    title: string;
    points: number;
  }[];
}

export const calculateRiskScore = (
  input: RiskInput
): RiskResult => {
  let score = 0;

  const breakdown: {
    title: string;
    points: number;
  }[] = [];

  if (!input.sslValid) {
    score += 25;

    breakdown.push({
      title:
        "Invalid SSL Certificate",
      points: 25,
    });
  }

  if (!input.csp) {
    score += 20;

    breakdown.push({
      title:
        "Missing Content Security Policy",
      points: 20,
    });
  }

  if (!input.hsts) {
    score += 20;

    breakdown.push({
      title:
        "Missing HSTS Header",
      points: 20,
    });
  }

  if (!input.xFrameOptions) {
    score += 15;

    breakdown.push({
      title:
        "Missing X-Frame-Options",
      points: 15,
    });
  }

  if (!input.xContentTypeOptions) {
    score += 10;

    breakdown.push({
      title:
        "Missing X-Content-Type-Options",
      points: 10,
    });
  }

  let level:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL" = "LOW";

  if (score >= 70) {
    level = "CRITICAL";
  } else if (score >= 40) {
    level = "HIGH";
  } else if (score >= 20) {
    level = "MEDIUM";
  }

  return {
    score,
    level,
    breakdown,
  };
};
import { supabaseAdmin }
from "../config/supabase";

export async function getScoreBreakdown(
  scanId: string
) {

  const { data: scan, error } =
    await supabaseAdmin
      .from("scans")
      .select("*")
      .eq("id", scanId)
      .single();

  if (error || !scan) {
    throw new Error("Scan not found");
  }

  const breakdown: any[] = [];

  let score = 100;

  const headers =
    scan.securityHeaders ||
    scan.headers ||
    {};

  const ports =
    scan.openPorts ||
    scan.ports ||
    [];

  const ssl =
    scan.ssl ||
    {};

  /* ==========================
     SECURITY HEADERS
  ========================== */

  if (!headers["content-security-policy"]) {

    breakdown.push({
      factor: "Missing CSP Header",
      impact: 15,
      type: "negative",
    });

    score -= 15;
  }

  if (!headers["strict-transport-security"]) {

    breakdown.push({
      factor: "Missing HSTS Header",
      impact: 15,
      type: "negative",
    });

    score -= 15;
  }

  if (!headers["x-frame-options"]) {

    breakdown.push({
      factor: "Missing X-Frame-Options",
      impact: 10,
      type: "negative",
    });

    score -= 10;
  }

  if (!headers["x-content-type-options"]) {

    breakdown.push({
      factor: "Missing X-Content-Type",
      impact: 10,
      type: "negative",
    });

    score -= 10;
  }

  /* ==========================
     PORT ANALYSIS
  ========================== */

  let portList: any[] = [];

  if (Array.isArray(ports)) {
    portList = ports;
  } else {
    portList = Object.values(ports);
  }

  portList.forEach((port: any) => {

    const portNumber =
      typeof port === "number"
        ? port
        : port?.port ||
          port?.number ||
          parseInt(port);

    switch (portNumber) {

      case 21:

        breakdown.push({
          factor: "FTP Port Open",
          impact: 20,
          type: "negative",
        });

        score -= 20;

        break;

      case 22:

        breakdown.push({
          factor: "SSH Port Open",
          impact: 10,
          type: "negative",
        });

        score -= 10;

        break;

      case 23:

        breakdown.push({
          factor: "Telnet Port Open",
          impact: 25,
          type: "negative",
        });

        score -= 25;

        break;
    }
  });

  /* ==========================
     SSL
  ========================== */

  if (ssl.valid === true) {

    breakdown.push({
      factor: "Valid SSL Certificate",
      impact: -10,
      type: "positive",
    });

    score += 10;
  }

  if (ssl.valid === false) {

    breakdown.push({
      factor: "Invalid SSL Certificate",
      impact: 20,
      type: "negative",
    });

    score -= 20;
  }

  score =
    Math.max(
      0,
      Math.min(100, score)
    );

  let grade = "F";

  if (score >= 90) grade = "A";
  else if (score >= 80) grade = "B";
  else if (score >= 70) grade = "C";
  else if (score >= 60) grade = "D";

  return {
    finalScore: score,
    grade,
    breakdown,
  };
}
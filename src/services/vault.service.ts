import { supabaseAdmin } from "../config/supabase";

type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

function deriveRiskLevel(score: number): RiskLevel {
  if (score >= 9) return "CRITICAL";
  if (score >= 7) return "HIGH";
  if (score >= 4) return "MEDIUM";
  return "LOW";
}

export const getVaultOverview = async (clerkId: string) => {
  const { data: scans, error } = await supabaseAdmin
    .from("scans")
    .select("id, domain, risk_score, risk_level, ssl, created_at")
    .eq("clerk_id", clerkId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const results = scans || [];
  const total   = results.length;

  const savedReports = total;

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const archivedScans = results.filter(
    (s: any) => new Date(s.created_at).getTime() < thirtyDaysAgo
  ).length;

  const criticalAssets = results.filter(
    (s: any) => s.risk_level === "CRITICAL" || s.risk_level === "HIGH"
  ).length;

  const exportsGenerated = 0;

  const latestScan = results.length > 0 ? results[0].domain : null;

  const highestRisk = results.reduce<any | null>(
    (max, s: any) => (!max || s.risk_score > max.risk_score ? s : max),
    null
  );
  const highestRiskAsset = highestRisk?.domain ?? null;

  const averageRiskScore =
    total > 0
      ? Number(
          (
            results.reduce((sum, s: any) => sum + (s.risk_score ?? 0), 0) /
            total
          ).toFixed(1)
        )
      : 0;

  const domainsWithSSL = results.filter(
    (s: any) => s.ssl?.valid === true
  ).length;

  return {
    savedReports,
    archivedScans,
    criticalAssets,
    exportsGenerated,
    latestScan,
    highestRiskAsset,
    averageRiskScore,
    domainsWithSSL,
  };
};

export const getVaultReports = async (clerkId: string) => {
  const { data: scans, error } = await supabaseAdmin
    .from("scans")
    .select("*")
    .eq("clerk_id", clerkId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (scans || []).map((scan: any) => {
    let missingCSP  = false;
    let missingHSTS = false;

    if (scan.headers_missing) {
      const missing =
        typeof scan.headers_missing === "string"
          ? scan.headers_missing
          : JSON.stringify(scan.headers_missing);
      missingCSP  = missing.toLowerCase().includes("content-security-policy");
      missingHSTS = missing.toLowerCase().includes("strict-transport-security");
    }

    let openPorts: number[] = [];
    if (scan.open_ports) {
      if (Array.isArray(scan.open_ports)) {
        openPorts = scan.open_ports.map(Number).filter((n: number) => !isNaN(n));
      } else if (typeof scan.open_ports === "string") {
        openPorts = scan.open_ports
          .split(",")
          .map((s: string) => parseInt(s.trim(), 10))
          .filter((n: number) => !isNaN(n));
      }
    }

    return {
      id:         scan.id,
      scanId:     scan.id,
      domain:     scan.domain ?? "unknown",
      riskScore:  scan.risk_score ?? 0,
      riskLevel:  (scan.risk_level as RiskLevel) ?? deriveRiskLevel(scan.risk_score ?? 0),
      sslStatus:  scan.ssl_valid ?? false,
      missingCSP,
      missingHSTS,
      openPorts,
      scanDate:   scan.created_at ?? new Date().toISOString(),
      bookmarked: scan.bookmarked ?? false,
    };
  });
};

export const getVaultScans = async (clerkId: string) => {
  const { data: scans, error } = await supabaseAdmin
    .from("scans")
    .select("id, domain, risk_score, risk_level, created_at")
    .eq("clerk_id", clerkId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(error.message);
  }

  return (scans || []).map((scan: any) => ({
    id:           scan.id,
    domain:       scan.domain ?? "unknown",
    riskScore:    scan.risk_score ?? 0,
    riskLevel:    (scan.risk_level as RiskLevel) ?? deriveRiskLevel(scan.risk_score ?? 0),
    lastScanDate: scan.created_at ?? new Date().toISOString(),
  }));
};
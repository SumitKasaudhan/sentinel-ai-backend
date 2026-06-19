import { supabaseAdmin } from "../config/supabase";

export const getNetworkOverview = async (clerkId: string) => {
  const { data: scans, error } = await supabaseAdmin
    .from("scans")
    .select("*")
    .eq("clerk_id", clerkId);

  if (error) {
    throw new Error(error.message);
  }

  const safeScans = scans || [];

  const totalAssets = safeScans.length;

  const averageRiskScore =
    totalAssets > 0
      ? Math.round(
          safeScans.reduce(
            (sum, scan) => sum + (scan.risk_score || 0),
            0
          ) / totalAssets
        )
      : 0;

  const sslEnabledCount = safeScans.filter(
    (scan) =>
      scan.ssl_enabled === true ||
      scan.ssl?.valid === true
  ).length;

  const sslCoverage =
    totalAssets > 0
      ? Math.round(
          (sslEnabledCount / totalAssets) * 100
        )
      : 0;

  const criticalAssets = safeScans.filter(
    (scan) => (scan.risk_score || 0) >= 80
  ).length;

  const recentScans = safeScans.slice(0, 15);

  const activityFeed: any[] = [];

  safeScans.slice(0, 10).forEach((scan) => {
    activityFeed.push({
      id: `${scan.id}-scan`,
      type: "info",
      message: `${scan.domain} scanned`,
      time: scan.created_at || new Date().toISOString(),
    });

    if (
      scan.ssl_enabled === true ||
      scan.ssl?.valid === true
    ) {
      activityFeed.push({
        id: `${scan.id}-ssl`,
        type: "safe",
        message: "SSL certificate verified",
        time: scan.created_at || new Date().toISOString(),
      });
    } else {
      activityFeed.push({
        id: `${scan.id}-ssl-missing`,
        type: "danger",
        message: "SSL certificate missing",
        time: scan.created_at || new Date().toISOString(),
      });
    }

    if (
      scan.security_headers &&
      scan.security_headers.csp === false
    ) {
      activityFeed.push({
        id: `${scan.id}-csp`,
        type: "danger",
        message: "Missing CSP header",
        time: scan.created_at || new Date().toISOString(),
      });
    }

    if (
      scan.security_headers &&
      scan.security_headers.hsts === false
    ) {
      activityFeed.push({
        id: `${scan.id}-hsts`,
        type: "danger",
        message: "Missing HSTS header",
        time: scan.created_at || new Date().toISOString(),
      });
    }

    if (
      scan.open_ports &&
      Array.isArray(scan.open_ports)
    ) {
      scan.open_ports.forEach((port: number) => {
        activityFeed.push({
          id: `${scan.id}-${port}`,
          type: "info",
          message: `Port ${port} detected`,
          time: scan.created_at || new Date().toISOString(),
        });
      });
    }
  });

  return {
    totalAssets,
    averageRiskScore,
    sslCoverage,
    criticalAssets,
    recentScans,
    activityFeed: activityFeed.slice(0, 20),
  };
};
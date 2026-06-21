import { supabaseAdmin } from "../../config/supabase";

export const getDashboardStats = async (clerkId: string) => {
  // Use the admin client so RLS never silently filters out rows for this user.
  const { data, error } = await supabaseAdmin
    .from("threats")
    .select("*")
    .eq("clerk_id", clerkId);

  if (error) {
    console.error("DASHBOARD STATS - SUPABASE ERROR:", error);
    throw new Error(error.message);
  }

  const threats = data || [];

  const totalThreats = threats.length;

  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const ONE_WEEK_MS = 7 * ONE_DAY_MS;
  const now = Date.now();

  // "Blocked today" — only count blocked threats from the last 24h.
  const blockedThreats = threats.filter((item) => {
    if (item.status?.toLowerCase() !== "blocked") return false;
    if (!item.created_at) return false;
    return now - new Date(item.created_at).getTime() <= ONE_DAY_MS;
  }).length;

  const criticalThreats = threats.filter(
    (item) => item.severity?.toLowerCase() === "critical"
  ).length;

  /*
   * Premium Risk Formula — reusable so we can compute it for any
   * subset of threats (current vs. last-week baseline).
   */
  const computeRiskScore = (list: typeof threats) => {
    const total = list.length;
    if (total === 0) return 0;

    const critical = list.filter((i) => i.severity?.toLowerCase() === "critical").length;
    const high     = list.filter((i) => i.severity?.toLowerCase() === "high").length;
    const medium   = list.filter((i) => i.severity?.toLowerCase() === "medium").length;
    const low      = list.filter((i) => i.severity?.toLowerCase() === "low").length;

    const weightedRisk = critical * 5 + high * 3 + medium * 2 + low;

    return Math.min(Math.round((weightedRisk / Math.max(total, 1)) * 20), 100);
  };

const riskScore = computeRiskScore(threats);

  // No threats recorded yet = user hasn't scanned. Don't fake a 100 score.
  const hasScanned = totalThreats > 0;

  // Security Score is the inverse of Risk Score (100 = fully secure, 0 = max risk).
  const securityScore = hasScanned ? 100 - riskScore : null;

  // Weekly delta — compare current Security Score against the score
  // computed from threats older than 7 days (a real "baseline").
  const baselineThreats = threats.filter((item) => {
    if (!item.created_at) return false;
    return now - new Date(item.created_at).getTime() > ONE_WEEK_MS;
  });

  const baselineSecurityScore = hasScanned
    ? (baselineThreats.length > 0 ? 100 - computeRiskScore(baselineThreats) : securityScore)
    : null;

  const weeklyScoreDelta =
    hasScanned && securityScore !== null && baselineSecurityScore !== null
      ? Math.round((securityScore - baselineSecurityScore) * 10) / 10
      : 0;
      
  /*
   * Active Devices — distinct, non-null devices seen across this user's
   * threats. Null/empty device values are NOT counted as a device.
   * Mirrors the calculation in telemetry.service.ts so both cards stay
   * consistent.
   */
  const activeDevices = new Set(
    threats.map((item) => item.device).filter(Boolean)
  ).size;

  /*
   * Daily Trends — used for sparklines on the dashboard cards.
   * Replaces the old hardcoded BARS_BLUE/RED/PURPLE arrays.
   *
   * NOTE: real threat data is often seeded/imported with old or clustered
   * `created_at` timestamps, so bucketing strictly "by calendar day" can
   * end up with every bucket empty (all-zero sparklines). Instead, we sort
   * all threats chronologically (oldest → newest) and split them into
   * TREND_BUCKETS equal-sized chronological buckets. This always reflects
   * the real distribution of the user's data, however it's dated.
   *
   * - threatsPerDay        → threat count per bucket             (Cloud Threats)
   * - criticalPerDay       → critical/high threat count per bucket (Critical Threats)
   * - securityScorePerDay  → cumulative security score through each bucket (Security Score)
   * - devicesPerDay        → cumulative distinct devices through each bucket (Assets Monitored)
   */
  const TREND_BUCKETS = 10;

  const sortedThreats = [...threats].sort((a, b) => {
    const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
    const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
    return ta - tb;
  });

  const bucketSize = Math.max(Math.ceil(sortedThreats.length / TREND_BUCKETS), 1);
  const buckets: (typeof threats)[] = [];
  for (let i = 0; i < TREND_BUCKETS; i++) {
    buckets.push(sortedThreats.slice(i * bucketSize, (i + 1) * bucketSize));
  }

  const threatsPerDay = buckets.map((b) => b.length);

  const criticalPerDay = buckets.map(
    (b) =>
      b.filter(
        (item) =>
          item.severity?.toLowerCase() === "critical" ||
          item.severity?.toLowerCase() === "high"
      ).length
  );

  const securityScorePerDay: number[] = [];
  const devicesPerDay: number[] = [];
  let cumulativeThreats: typeof threats = [];
  const cumulativeDevices = new Set<string>();

  for (const bucket of buckets) {
    cumulativeThreats = cumulativeThreats.concat(bucket);

    securityScorePerDay.push(
      cumulativeThreats.length > 0 ? 100 - computeRiskScore(cumulativeThreats) : 100
    );

    bucket.forEach((item) => {
      if (item.device) cumulativeDevices.add(item.device);
    });
    devicesPerDay.push(cumulativeDevices.size);
  }

  const dailyTrends = {
    threatsPerDay,
    criticalPerDay,
    securityScorePerDay,
    devicesPerDay,
  };

  return {
    totalThreats,
    blockedThreats,
    criticalThreats,
    activeDevices,
    riskScore,
    securityScore,
    weeklyScoreDelta,
    dailyTrends,

    networkHealth:
      riskScore <= 25
        ? "safe"
        : riskScore <= 50
        ? "warning"
        : riskScore <= 75
        ? "high risk"
        : "critical",
  };
};
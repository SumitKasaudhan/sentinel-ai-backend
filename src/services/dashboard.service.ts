import { supabase } from "../config/supabase";

export const getDashboardStats = async (clerkId: string) => {
  const { count: totalThreats } = await supabase
    .from("scans")
    .select("*", { count: "exact", head: true })
    .eq("clerk_id", clerkId);

  const { count: criticalThreats } = await supabase
    .from("scans")
    .select("*", { count: "exact", head: true })
    .eq("clerk_id", clerkId)
    .eq("risk_level", "HIGH");

  const { count: blockedThreats } = await supabase
    .from("scans")
    .select("*", { count: "exact", head: true })
    .eq("clerk_id", clerkId)
    .eq("risk_level", "MEDIUM");

  const { count: cleanTargets } = await supabase
    .from("scans")
    .select("*", { count: "exact", head: true })
    .eq("clerk_id", clerkId)
    .eq("risk_level", "LOW");

  const { data: scoreData } = await supabase
    .from("scans")
    .select("risk_score")
    .eq("clerk_id", clerkId);

  const hasScans = scoreData && scoreData.length > 0;

  const averageRisk = hasScans
    ? Math.round(scoreData.reduce((sum, item) => sum + item.risk_score, 0) / scoreData.length)
    : null;

  const securityScore = averageRisk !== null
    ? Math.max(0, 100 - averageRisk)
    : null; // null = new user, no scans yet

  return {
    totalThreats:    totalThreats    ?? 0,
    criticalThreats: criticalThreats ?? 0,
    blockedThreats:  blockedThreats  ?? 0,
    cleanTargets:    cleanTargets    ?? 0,
    averageRisk:     averageRisk     ?? 0,
    securityScore,
    weeklyScoreDelta: 0,
    networkHealth:   hasScans ? "monitored" : "no_data",
    activeDevices:   totalThreats    ?? 0,
    dailyTrends: {
      threatsPerDay:       [],
      criticalPerDay:      [],
      securityScorePerDay: [],
      devicesPerDay:       [],
    },
  };
};
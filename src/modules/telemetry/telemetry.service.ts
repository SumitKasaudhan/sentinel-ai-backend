import { supabaseAdmin } from "../../config/supabase";

export const getTelemetryService = async (clerkId: string) => {
  // All counts scoped to this user's threats only
  const { data, error } = await supabaseAdmin
    .from("threats")
    .select("severity, status, device, created_at")
    .eq("clerk_id", clerkId);

  if (error) throw new Error(error.message);

  const rows = data || [];

  const threatsNeutralized = rows.filter((r) =>
    r.status?.toLowerCase() === "resolved" ||
    r.status?.toLowerCase() === "blocked"
  ).length;

  const criticalAlerts = rows.filter((r) =>
    r.severity?.toLowerCase() === "critical" ||
    r.severity?.toLowerCase() === "high"
  ).length;

  // Distinct active devices — only count rows with a real device value.
  // (No more `|| rows.length` fallback that returned the threat count.)
  const activeDevices = new Set(
    rows.map((r) => r.device).filter(Boolean)
  ).size;

  // Network load: % of unresolved threats out of total (0–100)
  const unresolved = rows.filter((r) =>
    r.status?.toLowerCase() !== "resolved"
  ).length;
  const networkLoad = rows.length > 0
    ? Math.round((unresolved / rows.length) * 100)
    : 0;

  // Most recent threat timestamp — used to render "Last Full Scan" / X ago
  const latestThreatAt = rows
    .map((r) => r.created_at)
    .filter(Boolean)
    .sort((a, b) => new Date(b as string).getTime() - new Date(a as string).getTime())[0] ?? null;

  return {
    threatsNeutralized,
    criticalAlerts,
    activeDevices,
    networkLoad,
    latestThreatAt,
  };
};
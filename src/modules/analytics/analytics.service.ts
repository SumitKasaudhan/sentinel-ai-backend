import { supabaseAdmin } from "../../config/supabase";

// ── Threat Trends (30-day daily count) ──────────────────────────────────────

export const getThreatTrendsService = async (clerkId: string) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data, error } = await supabaseAdmin
    .from("threats")
    .select("created_at")
    .eq("clerk_id", clerkId)
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  // Group by day
  const grouped: Record<string, number> = {};
  (data || []).forEach((row) => {
    const day = new Date(row.created_at).toISOString().split("T")[0];
    grouped[day] = (grouped[day] || 0) + 1;
  });

  // Fill in all 30 days (including zeroes)
  const result = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    result.push({ date: key, count: grouped[key] || 0 });
  }

  return result;
};

// ── Severity Distribution ─────────────────────────────────────────────────

export const getSeverityDistributionService = async (clerkId: string) => {
  const { data, error } = await supabaseAdmin
    .from("threats")
    .select("severity")
    .eq("clerk_id", clerkId);

  if (error) throw new Error(error.message);

  const counts = { critical: 0, high: 0, medium: 0, low: 0 };

  (data || []).forEach((row) => {
    const sev = row.severity?.toLowerCase();
    if (sev === "critical") counts.critical++;
    else if (sev === "high")     counts.high++;
    else if (sev === "medium")   counts.medium++;
    else if (sev === "low")      counts.low++;
  });

  return counts;
};

// ── Country Analytics ─────────────────────────────────────────────────────

export const getCountryAnalyticsService = async (clerkId: string) => {
  const { data, error } = await supabaseAdmin
    .from("threats")
    .select("country")
    .eq("clerk_id", clerkId)
    .not("country", "is", null);

  if (error) throw new Error(error.message);

  const counts: Record<string, number> = {};
  (data || []).forEach((row) => {
    if (row.country) {
      counts[row.country] = (counts[row.country] || 0) + 1;
    }
  });

  return Object.entries(counts)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 7);
};
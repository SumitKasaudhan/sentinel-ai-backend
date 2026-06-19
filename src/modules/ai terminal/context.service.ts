import { supabaseAdmin } from "../../config/supabase";
import { getDashboardStats } from "../dashboard/dashboard.service";

interface ThreatFilters {
  severity?: string;
  status?: string;
  threatType?: string;
}

export const getThreatsForUser = async (
  clerkId: string,
  filters: ThreatFilters = {},
  limit = 200
) => {
  let query = supabaseAdmin
    .from("threats")
    .select("*")
    .eq("clerk_id", clerkId);

  // Case-insensitive matching — handles "Critical", "CRITICAL", "critical" etc.
  if (filters.severity) query = query.ilike("severity", filters.severity);
  if (filters.status) query = query.ilike("status", filters.status);
  if (filters.threatType) {
    query = query.ilike("threat_type", `%${filters.threatType}%`);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return data || [];
};

export const getScansForUser = async (clerkId: string, limit = 10) => {
  const { data, error } = await supabaseAdmin
    .from("scans")
    .select("id, target, domain, risk_score, risk_level, created_at")
    .eq("clerk_id", clerkId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return data || [];
};

export const getCountryBreakdown = async (clerkId: string) => {
  const { data, error } = await supabaseAdmin
    .from("threats")
    .select("country")
    .eq("clerk_id", clerkId);

  if (error) throw new Error(error.message);

  const counts: Record<string, number> = {};

  (data || []).forEach((row) => {
    const country = row.country || "Unknown";
    counts[country] = (counts[country] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count);
};

export const buildPostureContext = async (clerkId: string) => {
  const [stats, threats, scans, countries] = await Promise.all([
    getDashboardStats(clerkId),
    getThreatsForUser(clerkId, {}, 50),
    getScansForUser(clerkId, 5),
    getCountryBreakdown(clerkId),
  ]);

  return { stats, threats, scans, countries };
};

export { getDashboardStats };
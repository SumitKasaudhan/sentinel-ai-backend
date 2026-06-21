import { supabaseAdmin } from "../../config/supabase";
import { ThreatGroup } from "./deploy-patch.types";

export const UNRESOLVED_STATUSES = ["active", "blocked", "detected"];

export const getUnresolvedThreats = async (clerkId: string) => {
  const { data, error } = await supabaseAdmin
    .from("threats").select("*").eq("clerk_id", clerkId).in("status", UNRESOLVED_STATUSES);
  if (error) throw new Error(error.message);
  return data || [];
};

export const getAllThreats = async (clerkId: string) => {
  const { data, error } = await supabaseAdmin
    .from("threats").select("*").eq("clerk_id", clerkId);
  if (error) throw new Error(error.message);
  return data || [];
};

export const groupThreatsByType = (threats: any[]): ThreatGroup[] => {
  const map = new Map<string, ThreatGroup>();
  for (const t of threats) {
    const type = t.threat_type || "Unknown";
    if (!map.has(type)) {
      map.set(type, { threatType: type, count: 0, severityBreakdown: { critical: 0, high: 0, medium: 0, low: 0 }, threatIds: [] });
    }
    const group = map.get(type)!;
    group.count += 1;
    group.threatIds.push(t.id);
    const sev = (t.severity || "").toLowerCase();
    if (sev === "critical") group.severityBreakdown.critical += 1;
    else if (sev === "high") group.severityBreakdown.high += 1;
    else if (sev === "medium") group.severityBreakdown.medium += 1;
    else if (sev === "low") group.severityBreakdown.low += 1;
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
};

// ── NEW: Phase 2 additions ──────────────────────────────────────────────────

export const resolveThreats = async (clerkId: string, threatIds: string[]) => {
  const { error } = await supabaseAdmin
    .from("threats")
    .update({ status: "resolved" })
    .eq("clerk_id", clerkId)
    .in("id", threatIds);
  if (error) throw new Error(error.message);
};

export const insertPatchOperation = async (payload: {
  clerkId: string;
  operationId: string;
  threatsResolved: number;
  riskReduction: number;
  scoreBefore: number;
  scoreAfter: number;
  details: object;
}) => {
  const { error } = await supabaseAdmin.from("patch_operations").insert({
    clerk_id: payload.clerkId,
    operation_id: payload.operationId,
    threats_resolved: payload.threatsResolved,
    risk_reduction: payload.riskReduction,
    score_before: payload.scoreBefore,
    score_after: payload.scoreAfter,
    status: "completed",
    details: payload.details,
  });
  if (error) throw new Error(error.message);
};

export const logPatchActivity = async (
  clerkId: string,
  operationId: string,
  threatsResolved: number,
  scoreBefore: number,
  scoreAfter: number
) => {
  const { error } = await supabaseAdmin.from("activity_log").insert({
    clerk_id: clerkId,
    action: "patch_deployed",
    description: `${threatsResolved} threat(s) patched via Deploy Patch Engine (Op: ${operationId})`,
    type: "safe",
    metadata: { operation_id: operationId, threats_resolved: threatsResolved, score_before: scoreBefore, score_after: scoreAfter },
  });
  if (error) console.error("Activity log insert failed:", error.message);
  // Non-fatal — don't throw
};
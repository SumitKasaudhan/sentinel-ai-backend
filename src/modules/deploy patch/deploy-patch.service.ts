import {
  getUnresolvedThreats, getAllThreats, groupThreatsByType,
  resolveThreats, insertPatchOperation, logPatchActivity,
} from "./deploy-patch.repository";
import { computeSecurityScore } from "../../utils/threat-score.util";
import { generateRemediationPlan } from "./geminiRemediation.service";
import { DeployPatchPreview, ExecuteResult } from "./deploy-patch.types";

export const getDeployPatchPreview = async (clerkId: string): Promise<DeployPatchPreview> => {
  const allThreats = await getAllThreats(clerkId);
  const unresolvedThreats = await getUnresolvedThreats(clerkId);
  const scoreBefore = computeSecurityScore(allThreats);

  if (unresolvedThreats.length === 0) {
    return {
      groups: [], totalThreats: 0, scoreBefore, scoreAfter: scoreBefore,
      riskReductionPercent: 0,
      aiPlan: { summary: "No unresolved threats found. Your environment is currently fully remediated.", actions: [], riskReduction: 0, scoreImprovement: 0 },
      threatIds: [],
    };
  }

  const groups = groupThreatsByType(unresolvedThreats);
  const unresolvedIds = new Set(unresolvedThreats.map((t) => t.id));
  const simulatedThreats = allThreats.filter((t) => !unresolvedIds.has(t.id));
  const scoreAfter = computeSecurityScore(simulatedThreats);
  const riskBefore = 100 - scoreBefore;
  const riskAfter = 100 - scoreAfter;
  const riskReductionPercent = riskBefore > 0 ? Math.round(((riskBefore - riskAfter) / riskBefore) * 100) : 0;
  const aiPlan = await generateRemediationPlan(groups, scoreBefore, scoreAfter);

  return {
    groups, totalThreats: unresolvedThreats.length, scoreBefore, scoreAfter,
    riskReductionPercent: Math.min(Math.max(riskReductionPercent, 0), 100),
    aiPlan, threatIds: unresolvedThreats.map((t) => t.id),
  };
};

// ── NEW: Phase 2 ────────────────────────────────────────────────────────────

export const executeDeployPatch = async (
  clerkId: string,
  threatIds: string[]
): Promise<ExecuteResult> => {
  if (!threatIds || threatIds.length === 0) {
    throw new Error("No threat IDs provided for patching.");
  }

  // Score BEFORE
  const allBefore = await getAllThreats(clerkId);
  const scoreBefore = computeSecurityScore(allBefore);

  // Resolve in DB
  await resolveThreats(clerkId, threatIds);

  // FIX: Score AFTER — same simulation logic as preview
  // resolved IDs ko filter out karo, baaki pe score compute karo
  const resolvedSet = new Set(threatIds);
  const remainingThreats = allBefore.filter((t) => !resolvedSet.has(t.id));
  const scoreAfter = computeSecurityScore(remainingThreats);

  const riskBefore = 100 - scoreBefore;
  const riskAfter  = 100 - scoreAfter;
  const riskReductionPercent = riskBefore > 0
    ? Math.min(Math.round(((riskBefore - riskAfter) / riskBefore) * 100), 100)
    : 0;

  const operationId = `DPL-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  try {
    await insertPatchOperation({
      clerkId, operationId,
      threatsResolved: threatIds.length,
      riskReduction: riskReductionPercent,
      scoreBefore, scoreAfter,
      details: { threat_ids: threatIds },
    });
  } catch (e: any) {
    console.error("patch_operations insert failed:", e.message);
  }

  await logPatchActivity(clerkId, operationId, threatIds.length, scoreBefore, scoreAfter);

  return { operationId, threatsResolved: threatIds.length, scoreBefore, scoreAfter, riskReductionPercent };
};
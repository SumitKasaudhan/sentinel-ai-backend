import { askGemini } from "../ai terminal/gemini.service";
import { ThreatGroup, AIRemediationPlan } from "./deploy-patch.types";

export const generateRemediationPlan = async (
  groups: ThreatGroup[],
  scoreBefore: number,
  scoreAfter: number
): Promise<AIRemediationPlan> => {
  const systemPrompt = `You are a cybersecurity remediation planning AI for Sentinel AI. Given the JSON list of threat groups (grouped by threat type with counts and severity breakdowns), generate a remediation plan.

Respond with ONLY valid JSON, no markdown, no code fences, in this exact shape:
{
  "summary": "2-3 sentence summary of the overall remediation plan",
  "actions": [
    { "threatType": "string", "action": "string (concise remediation action)", "threatsAffected": number }
  ]
}

One action per threat type provided. Do not invent threat types not present in the data. Be specific and technical (e.g. "Deploy email filtering policy update and enforce DMARC/DKIM").`;

  const payload = {
    threatGroups: groups.map((g) => ({
      threatType: g.threatType,
      count: g.count,
      severityBreakdown: g.severityBreakdown,
    })),
    securityScoreBefore: scoreBefore,
    securityScoreProjectedAfter: scoreAfter,
  };

  const fallbackPlan = (): AIRemediationPlan => ({
    summary:
      "AI-generated remediation plan is temporarily unavailable. Showing a default remediation plan based on threat categories.",
    actions: groups.map((g) => ({
      threatType: g.threatType,
      action: `Review and remediate ${g.count} ${g.threatType.toLowerCase()} threat(s) — prioritize ${
        g.severityBreakdown.critical > 0 ? "critical" : "high"
      } severity items first.`,
      threatsAffected: g.count,
    })),
    riskReduction: Math.max(0, scoreAfter - scoreBefore),
    scoreImprovement: Math.max(0, scoreAfter - scoreBefore),
  });

  try {
    const raw = await askGemini(systemPrompt, JSON.stringify(payload));

    const cleaned = raw.replace(/```json|```/g, "").trim();

    const parsed = JSON.parse(cleaned);

    if (!parsed.summary || !Array.isArray(parsed.actions)) {
      throw new Error("Malformed AI response");
    }

    return {
      summary: parsed.summary,
      actions: parsed.actions,
      riskReduction: Math.max(0, scoreAfter - scoreBefore),
      scoreImprovement: Math.max(0, scoreAfter - scoreBefore),
    };
  } catch (err: any) {
    console.error("REMEDIATION PLAN ERROR:", err.message);
    return fallbackPlan();
  }
};
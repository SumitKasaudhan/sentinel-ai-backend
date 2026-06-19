export interface ThreatGroup {
  threatType: string;
  count: number;
  severityBreakdown: { critical: number; high: number; medium: number; low: number };
  threatIds: string[];
}

export interface RemediationAction {
  threatType: string;
  action: string;
  threatsAffected: number;
}

export interface AIRemediationPlan {
  summary: string;
  actions: RemediationAction[];
  riskReduction: number;
  scoreImprovement: number;
}

export interface DeployPatchPreview {
  groups: ThreatGroup[];
  totalThreats: number;
  scoreBefore: number;
  scoreAfter: number;
  riskReductionPercent: number;
  aiPlan: AIRemediationPlan;
  threatIds: string[];
}

export interface ExecuteResult {
  operationId: string;
  threatsResolved: number;
  scoreBefore: number;
  scoreAfter: number;
  riskReductionPercent: number;
}
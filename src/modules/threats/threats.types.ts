export interface Threat {
  id: string;
  threat_type: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "blocked" | "active" | "resolved";
  country: string;
  ip_address: string | null;
  device: string | null;
  domain?: string | null;
  created_at: string;
}

export interface CreateThreatPayload {
  threat_type: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "blocked" | "active" | "resolved";
  country: string;
  ip_address?: string | null;
  device?: string | null;
  domain?: string | null;
}

export interface UpdateThreatStatusPayload {
  status: "blocked" | "active" | "resolved";
}

export interface ThreatAnalysis {
  threatName: string;
  riskLevel: "Critical" | "High" | "Medium" | "Low";
  summary: string;
  attackVector: string;
  indicators: string[];
  immediateActions: string[];
  longTermRemediation: string[];
  affectedSystems: string[];
  confidence: number;
}
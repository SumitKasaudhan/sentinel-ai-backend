export type IntentType =
  | "show_threats"
  | "show_critical_threats"
  | "show_active_threats"
  | "show_resolved_threats"
  | "show_threats_by_type"
  | "show_dashboard_stats"
  | "show_security_score"
  | "show_recent_activity"
  | "show_countries"
  | "show_trends"
  | "show_scan_history"
  | "run_scan"
  | "analyze_threat"
  | "summarize_posture"
  | "generate_executive_report"
  | "generate_soc_report"
  | "explain_security_score"
  | "help"
  | "unknown";

export interface DetectedIntent {
  type: IntentType;
  params?: Record<string, any>;
}

export const detectIntent = (message: string): DetectedIntent => {
  const msg = message.trim().toLowerCase();

  if (/^help$/.test(msg)) return { type: "help" };

  if (msg.includes("critical") && msg.includes("threat")) {
    return { type: "show_critical_threats" };
  }

  if (msg.includes("active") && msg.includes("threat")) {
    return { type: "show_active_threats" };
  }

  if (msg.includes("resolved") && msg.includes("threat")) {
    return { type: "show_resolved_threats" };
  }

  const typeMatch = msg.match(
    /show (phishing|malware|ddos|ransomware|brute[\s-]?force|sql injection|xss)\s*threats?/
  );
  if (typeMatch) {
    return { type: "show_threats_by_type", params: { threatType: typeMatch[1] } };
  }

  if (msg.includes("threat") && (msg.includes("show") || msg.includes("list"))) {
    return { type: "show_threats" };
  }

  if (msg.includes("dashboard") && msg.includes("stat")) {
    return { type: "show_dashboard_stats" };
  }

  if (msg.includes("why") && msg.includes("security score")) {
    return { type: "explain_security_score" };
  }

  if (msg.includes("security score")) {
    return { type: "show_security_score" };
  }

  if (msg.includes("recent activity") || msg.includes("activity feed")) {
    return { type: "show_recent_activity" };
  }

  if (msg.includes("countr")) {
    return { type: "show_countries" };
  }

  if (msg.includes("trend")) {
    return { type: "show_trends" };
  }

  if (msg.includes("scan history") || msg.includes("show scans")) {
    return { type: "show_scan_history" };
  }

  const scanMatch =
    msg.match(/run scan\s+(?:on\s+)?(\S+)/) ||
    msg.match(/^scan\s+(\S+)/);

  if (scanMatch) {
    return { type: "run_scan", params: { target: scanMatch[1] } };
  }

  if (msg.includes("run scan") || msg === "scan") {
    return { type: "run_scan" };
  }

  const analyzeMatch = msg.match(/analyze threat\s+([a-f0-9-]{8,})/);
  if (analyzeMatch) {
    return { type: "analyze_threat", params: { threatId: analyzeMatch[1] } };
  }

  if (msg.includes("summarize") && (msg.includes("posture") || msg.includes("security"))) {
    return { type: "summarize_posture" };
  }

  if (msg.includes("executive report")) {
    return { type: "generate_executive_report" };
  }

  if (msg.includes("soc report")) {
    return { type: "generate_soc_report" };
  }

  return { type: "unknown" };
};
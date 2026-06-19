import axios from "axios";

import env from "../../config/env";
import { detectIntent } from "./intent.service";
import { askGemini } from "./gemini.service";
import {
  getThreatsForUser,
  getScansForUser,
  getCountryBreakdown,
  buildPostureContext,
  getDashboardStats,
} from "./context.service";
import { getRecentActivity, logActivity } from "./activity.service";
import {
  getOrCreateConversation,
  saveMessage,
  getConversationHistory,
  setConversationTitle,
} from "./conversation.service";
import { supabaseAdmin } from "../../config/supabase";

const HELP_TEXT = `Available commands:
  show threats
  show critical threats
  show active threats
  show resolved threats
  show <type> threats        (e.g. show phishing threats)
  show dashboard stats
  show security score
  show recent activity
  show countries
  show trends
  show scan history
  run scan <domain>
  analyze threat <id>
  summarize security posture
  generate executive report
  generate soc report
  why is my security score low
  help`;

const formatThreatList = (threats: any[]) => {
  if (threats.length === 0) return "No threats found.";

  return threats
    .slice(0, 15)
    .map(
      (t) =>
        `[${(t.severity || "unknown").toUpperCase()}] ${t.threat_type} — ${t.status} — ${
          t.country || "Unknown"
        } — ${new Date(t.created_at).toLocaleString()}`
    )
    .join("\n");
};

export const processCommand = async (
  clerkId: string,
  message: string,
  conversationId?: string
) => {
  const conversation = await getOrCreateConversation(clerkId, conversationId);

  await saveMessage(conversation.id, "user", message);

  // Auto-set conversation title from first message (no-op if already set)
  await setConversationTitle(conversation.id, message);

  const intent = detectIntent(message);

  let reply = "";

  switch (intent.type) {
    case "help":
      reply = HELP_TEXT;
      break;

    case "show_threats": {
      const threats = await getThreatsForUser(clerkId);
      reply = `Found ${threats.length} threat(s):\n${formatThreatList(threats)}`;
      break;
    }

    case "show_critical_threats": {
      const threats = await getThreatsForUser(clerkId, { severity: "critical" });
      reply = `Found ${threats.length} critical threat(s):\n${formatThreatList(threats)}`;
      break;
    }

    case "show_active_threats": {
      const threats = await getThreatsForUser(clerkId, { status: "active" });
      reply = `Found ${threats.length} active threat(s):\n${formatThreatList(threats)}`;
      break;
    }

    case "show_resolved_threats": {
      const threats = await getThreatsForUser(clerkId, { status: "resolved" });
      reply = `Found ${threats.length} resolved threat(s):\n${formatThreatList(threats)}`;
      break;
    }

    case "show_threats_by_type": {
      const threatType = intent.params?.threatType;
      const threats = await getThreatsForUser(clerkId, { threatType });
      reply = `Found ${threats.length} ${threatType} threat(s):\n${formatThreatList(threats)}`;
      break;
    }

    case "show_dashboard_stats": {
      const stats = await getDashboardStats(clerkId);
      reply = [
        `Total Threats: ${stats.totalThreats}`,
        `Blocked (24h): ${stats.blockedThreats}`,
        `Critical Threats: ${stats.criticalThreats}`,
        `Active Devices: ${stats.activeDevices}`,
        `Security Score: ${stats.securityScore}/100`,
        `Risk Score: ${stats.riskScore}/100`,
        `Network Health: ${stats.networkHealth}`,
        `Weekly Score Delta: ${stats.weeklyScoreDelta}`,
      ].join("\n");
      break;
    }

    case "show_security_score": {
      const stats = await getDashboardStats(clerkId);
      reply = `Security Score: ${stats.securityScore}/100 (Risk Score: ${stats.riskScore}/100, Network Health: ${stats.networkHealth})`;
      break;
    }

    case "show_recent_activity": {
      const activity = await getRecentActivity(clerkId, 10);
      reply = activity.length
        ? activity
            .map(
              (a) =>
                `[${new Date(a.created_at).toLocaleTimeString()}] ${a.description}`
            )
            .join("\n")
        : "No recent activity recorded.";
      break;
    }

    case "show_countries": {
      const countries = await getCountryBreakdown(clerkId);
      reply = countries.length
        ? countries.map((c) => `${c.country}: ${c.count} threat(s)`).join("\n")
        : "No country data available.";
      break;
    }

    case "show_trends": {
      const stats = await getDashboardStats(clerkId);
      reply = [
        `Threats per period: ${stats.dailyTrends.threatsPerDay.join(", ")}`,
        `Critical/High per period: ${stats.dailyTrends.criticalPerDay.join(", ")}`,
        `Security Score trend: ${stats.dailyTrends.securityScorePerDay.join(", ")}`,
        `Devices monitored trend: ${stats.dailyTrends.devicesPerDay.join(", ")}`,
      ].join("\n");
      break;
    }

    case "show_scan_history": {
      const scans = await getScansForUser(clerkId, 10);
      reply = scans.length
        ? scans
            .map(
              (s) =>
                `${s.domain || s.target} — Risk Score: ${s.risk_score} (${s.risk_level}) — ${new Date(
                  s.created_at
                ).toLocaleString()}`
            )
            .join("\n")
        : "No scans found.";
      break;
    }

    case "run_scan": {
      if (!intent.params?.target) {
        reply = `Please specify a target. Usage: run scan <domain>`;
        break;
      }

      try {
        const scanRes = await axios.post(
          `http://localhost:${env.PORT}/api/scanner/scan`,
          { target: intent.params.target, clerkId }
        );

        const result = scanRes.data;

        if (!result.success) {
          reply = `Scan failed: ${result.message || "Unknown error"}`;
          break;
        }

        reply = [
          `SCAN COMPLETE: ${result.domain}`,
          `Risk Score: ${result.riskScore?.score}/100 (${result.riskScore?.level})`,
          `Findings: ${result.findings?.length ?? 0}`,
          `  Critical: ${result.severityCounts?.critical ?? 0}`,
          `  High: ${result.severityCounts?.high ?? 0}`,
          `  Medium: ${result.severityCounts?.medium ?? 0}`,
          `  Low: ${result.severityCounts?.low ?? 0}`,
        ].join("\n");

        await logActivity(
          clerkId,
          "scan_completed",
          `Scan completed for ${result.domain} — Risk Score ${result.riskScore?.score}/100`,
          "info"
        );
      } catch (err: any) {
        console.error("AI TERMINAL SCAN ERROR:", err?.response?.data || err.message);
        reply = `Scan failed: ${err?.response?.data?.message || err.message}`;
      }

      break;
    }

    case "analyze_threat": {
      const { data: threat, error } = await supabaseAdmin
        .from("threats")
        .select("*")
        .eq("id", intent.params?.threatId)
        .eq("clerk_id", clerkId)
        .single();

      if (error || !threat) {
        reply = "Threat not found or access denied.";
        break;
      }

      const systemPrompt = `You are a cybersecurity analyst. Analyze this threat record and explain in 3-4 sentences: what it likely means, why its severity is justified, and one recommended remediation step. Be concise and factual. Do not invent any data not present in the JSON.`;

      reply = await askGemini(systemPrompt, JSON.stringify(threat));
      break;
    }

    case "summarize_posture": {
      const context = await buildPostureContext(clerkId);

      const systemPrompt = `You are a cybersecurity analyst AI embedded in Sentinel AI, an enterprise security dashboard. Using ONLY the JSON data provided, write a concise security posture summary (5-8 sentences) covering: overall risk level, the most pressing threats, and 1-2 recommended actions. Do not invent any numbers not present in the data.`;

      reply = await askGemini(systemPrompt, JSON.stringify(context));
      break;
    }

    case "generate_executive_report": {
      const context = await buildPostureContext(clerkId);

      const systemPrompt = `You are generating an executive-level security report for Sentinel AI. Using ONLY the JSON data provided, produce a structured report with sections: Overview, Key Risks, Trend Analysis, Recommendations. Keep it under 300 words, business-focused, non-technical language. Do not invent any numbers not present in the data.`;

      reply = await askGemini(systemPrompt, JSON.stringify(context));

      await logActivity(clerkId, "report_generated", "Executive report generated", "info");
      break;
    }

    case "generate_soc_report": {
      const context = await buildPostureContext(clerkId);

      const systemPrompt = `You are generating a SOC (Security Operations Center) report for Sentinel AI. Using ONLY the JSON data provided, produce a structured technical report with sections: Threat Summary, Severity Breakdown, Active Incidents, Scan Findings, Recommended Actions. Be technical and precise. Do not invent any numbers not present in the data.`;

      reply = await askGemini(systemPrompt, JSON.stringify(context));

      await logActivity(clerkId, "report_generated", "SOC report generated", "info");
      break;
    }

    case "explain_security_score": {
      const stats = await getDashboardStats(clerkId);
      const threats = await getThreatsForUser(clerkId, {}, 50);

      const systemPrompt = `You are a cybersecurity analyst. The user's current security score is ${stats.securityScore}/100 (risk score ${stats.riskScore}/100). Using the threat data JSON provided, explain in 3-5 sentences WHY the score is at this level, referencing specific severity counts. Do not invent any numbers not present in the data.`;

      reply = await askGemini(systemPrompt, JSON.stringify({ stats, threats }));
      break;
    }

    default:
      reply = `Command not recognized. Type "help" to see available commands.`;
  }

  await saveMessage(conversation.id, "assistant", reply);

  return { conversationId: conversation.id, reply, intent: intent.type };
};

export const getModelMetrics = async (clerkId: string) => {
  const stats = await getDashboardStats(clerkId);
  const threats = await getThreatsForUser(clerkId, {}, 1000);
  const scans = await getScansForUser(clerkId, 100);

  const totalThreats = threats.length;

  const resolvedOrBlocked = threats.filter(
    (t) => t.status === "resolved" || t.status === "blocked"
  ).length;

  const detectionCoverage =
    totalThreats > 0 ? Math.round((resolvedOrBlocked / totalThreats) * 100) : 100;

  const totalScans = scans.length;

  const successfulScans = scans.filter(
    (s) => typeof s.risk_score === "number"
  ).length;

  const scanSuccessRate =
    totalScans > 0 ? Math.round((successfulScans / totalScans) * 100) : 100;

  return {
    threatsAnalyzed: totalThreats,
    activeThreats: threats.filter((t) => t.status === "active").length,
    criticalThreats: stats.criticalThreats,
    detectionCoverage,
    scanSuccessRate,
    securityScore: stats.securityScore,
  };
};

export const getConversationMessages = async (
  clerkId: string,
  conversationId: string
) => {
  const conversation = await getOrCreateConversation(clerkId, conversationId);
  return getConversationHistory(conversation.id);
};
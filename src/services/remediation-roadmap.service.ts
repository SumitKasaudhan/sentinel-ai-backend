import { supabaseAdmin } from "../config/supabase";

export async function getRemediationRoadmap(
  scanId: string
) {

  const { data: scan, error } =
    await supabaseAdmin
      .from("scans")
      .select("*")
      .eq("id", scanId)
      .single();

  if (error || !scan) {
    throw new Error("Scan not found");
  }

  const roadmap = [];

  roadmap.push({
    phase: "Week 1",
    priority: "CRITICAL",
    title: "Fix Security Headers",
    tasks: [
      "Implement CSP",
      "Enable HSTS",
      "Add X-Frame-Options"
    ],
    impact: "+40 Security Score"
  });

  roadmap.push({
    phase: "Week 2",
    priority: "HIGH",
    title: "Reduce Attack Surface",
    tasks: [
      "Close FTP Port 21",
      "Restrict SSH Access"
    ],
    impact: "+30 Security Score"
  });

  roadmap.push({
    phase: "Week 3",
    priority: "MEDIUM",
    title: "Strengthen Monitoring",
    tasks: [
      "Enable Logging",
      "Add Threat Detection"
    ],
    impact: "+15 Security Score"
  });

  roadmap.push({
    phase: "Week 4",
    priority: "LOW",
    title: "Optimization",
    tasks: [
      "Review DNS Records",
      "Update Documentation"
    ],
    impact: "+5 Security Score"
  });

  return {
    currentScore:
      scan.riskScore || 65,

    projectedScore: 90,

    roadmap,
  };
}
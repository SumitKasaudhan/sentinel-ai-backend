import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { supabaseAdmin } from "../config/supabase";

const CATEGORY_COLORS: Record<string, string> = {
  Malware: "#22D3EE", Phishing: "#60A5FA", DDoS: "#F59E0B",
  Intrusion: "#EF4444", Ransomware: "#F97316", SQLi: "#34D399",
  XSS: "#FB7185", Other: "#64748B",
};

const SEVERITY_SCORE: Record<string, number> = {
  critical: 90, high: 75, medium: 55, low: 30,
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function countryToRegion(country: string): string {
  const map: Record<string, string> = {
    US: "N. America", CA: "N. America", MX: "N. America",
    GB: "Europe", DE: "Europe", FR: "Europe", RU: "Europe", PL: "Europe", NL: "Europe",
    CN: "Asia", JP: "Asia", IN: "Asia", KR: "Asia", VN: "Asia", ID: "Asia",
    BR: "S. America", AR: "S. America", CO: "S. America",
    NG: "Africa", ZA: "Africa", EG: "Africa",
    AU: "Oceania", NZ: "Oceania",
  };
  return map[country?.toUpperCase()] ?? "Other";
}

function normalizeCategory(raw: string | null | undefined): string {
  if (!raw) return "Other";
  const s = raw.toLowerCase();
  if (s.includes("malware") || s.includes("virus") || s.includes("trojan")) return "Malware";
  if (s.includes("phish")) return "Phishing";
  if (s.includes("ddos") || s.includes("dos")) return "DDoS";
  if (s.includes("intru") || s.includes("brute") || s.includes("ssh")) return "Intrusion";
  if (s.includes("ransom")) return "Ransomware";
  if (s.includes("sql")) return "SQLi";
  if (s.includes("xss")) return "XSS";
  return "Other";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

function timeUntil(dateStr: string | null): string {
  if (!dateStr) return "N/A";
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return "Now";
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return h > 0 ? `in ${h}h ${m}m` : `in ${m}m`;
}

function lastGenLabel(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const d = new Date(dateStr);
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / 3_600_000;
  if (diffH < 24 && d.getDate() === now.getDate()) {
    return `${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} Today`;
  }
  if (diffH < 48) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function wowChange(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? `+${current * 100}%` : "+0%";
  const pct = ((current - previous) / previous) * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
}

const VALID_TYPES = ["Weekly", "Audit", "Incident", "Compliance", "Forensic"] as const;

// ─────────────────────────────────────────────────────────
// GET /api/reports/charts
// ─────────────────────────────────────────────────────────
export async function getReportsCharts(req: Request, res: Response) {
  try {
    const { userId } = getAuth(req);

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3_600_000).toISOString();

    const { data: threats, error } = await supabaseAdmin
      .from("threats")
      .select("status, threat_type, severity, country, created_at")
      .eq("clerk_id", userId)
      .gte("created_at", sevenDaysAgo)
      .order("created_at", { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    const rows = threats ?? [];

    const activityMap: Record<string, { detected: number; blocked: number }> = {};
    const last7: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 3_600_000);
      const label = DAY_LABELS[d.getDay()];
      last7.push(label);
      if (!activityMap[label]) activityMap[label] = { detected: 0, blocked: 0 };
    }
    for (const t of rows) {
      const label = DAY_LABELS[new Date(t.created_at).getDay()];
      if (!activityMap[label]) continue;
      activityMap[label].detected++;
      if (t.status === "blocked") activityMap[label].blocked++;
    }
    const weeklyActivity = last7
      .filter((v, i, arr) => arr.lastIndexOf(v) === i)
      .map((day) => ({
        day,
        detected: activityMap[day]?.detected ?? 0,
        blocked: activityMap[day]?.blocked ?? 0,
      }));

    const categoryCount: Record<string, number> = {};
    for (const t of rows) {
      const cat = normalizeCategory(t.threat_type);
      categoryCount[cat] = (categoryCount[cat] ?? 0) + 1;
    }
    const total = rows.length || 1;
    const threatCategories = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        value: Math.round((count / total) * 100),
        color: CATEGORY_COLORS[name] ?? CATEGORY_COLORS.Other,
      }));
    if (threatCategories.length > 0) {
      const sum = threatCategories.reduce((s, c) => s + c.value, 0);
      threatCategories[0].value += 100 - sum;
    }

    const riskByDay: Record<string, { total: number; count: number }> = {};
    for (const t of rows) {
      if (!t.severity) continue;
      const score = SEVERITY_SCORE[t.severity.toLowerCase()] ?? 50;
      const label = DAY_LABELS[new Date(t.created_at).getDay()];
      if (!riskByDay[label]) riskByDay[label] = { total: 0, count: 0 };
      riskByDay[label].total += score;
      riskByDay[label].count++;
    }
    const riskTrend = last7
      .filter((v, i, arr) => arr.lastIndexOf(v) === i)
      .filter((day) => riskByDay[day]?.count > 0)
      .slice(-6)
      .map((day) => ({
        day,
        score: Math.round(riskByDay[day].total / riskByDay[day].count),
      }));
    const latestScore = riskTrend.at(-1)?.score ?? 0;
    const prevScore = riskTrend.at(-2)?.score ?? latestScore;
    const riskDelta = latestScore - prevScore;

    const regionCount: Record<string, number> = {};
    for (const t of rows) {
      const region = countryToRegion(t.country ?? "");
      regionCount[region] = (regionCount[region] ?? 0) + 1;
    }
    const REGION_ORDER = ["N. America", "Europe", "Asia", "S. America", "Africa", "Oceania", "Other"];
    const regionIncidents = REGION_ORDER
      .filter((r) => regionCount[r] != null)
      .map((region) => ({ region, incidents: regionCount[region] }));

    return res.json({
      weeklyActivity,
      threatCategories,
      riskTrend,
      riskMeta: {
        latestScore,
        delta: `${riskDelta >= 0 ? "+" : ""}${riskDelta} pts`,
      },
      regionIncidents,
    });
  } catch (err) {
    console.error("[reports.getReportsCharts]", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

// ─────────────────────────────────────────────────────────
// GET /api/reports/list
// ─────────────────────────────────────────────────────────
export async function getReportsList(req: Request, res: Response) {
  try {
    const { userId } = getAuth(req);

    const type = (req.query.type as string) ?? "All";
    const page = Math.max(1, parseInt((req.query.page as string) ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt((req.query.limit as string) ?? "20", 10)));
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from("reports")
      .select("id, title, report_id, type, severity, generated_at, file_size, file_url", {
        count: "exact",
      })
      .eq("user_id", userId)
      .order("generated_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (type !== "All" && VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
      query = query.eq("type", type);
    }

    const { data, count, error } = await query;
    if (error) return res.status(500).json({ error: error.message });

    const reports = (data ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      reportId: r.report_id,
      type: r.type,
      severity: r.severity as "Critical" | "High" | "Medium" | "Low",
      generated: formatDate(r.generated_at),
      size: r.file_size,
      fileUrl: r.file_url ?? null,
    }));

    return res.json({
      reports,
      pagination: {
        total: count ?? 0,
        page,
        limit,
        pages: Math.ceil((count ?? 0) / limit),
      },
    });
  } catch (err) {
    console.error("[reports.getReportsList]", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

// ─────────────────────────────────────────────────────────
// POST /api/reports/list
// ─────────────────────────────────────────────────────────
export async function createReport(req: Request, res: Response) {
  try {
    const { userId } = getAuth(req);
    const { title, type, severity, file_size, file_url, metadata } = req.body;

    if (!title || !type || !severity) {
      return res.status(400).json({ error: "title, type and severity are required" });
    }

    const reportId = `RPT-${Date.now().toString().slice(-4)}`;

    const { data, error } = await supabaseAdmin
      .from("reports")
      .insert({
        user_id: userId,
        title,
        report_id: reportId,
        type,
        severity,
        file_size: file_size ?? "0 KB",
        file_url: file_url ?? null,
        metadata: metadata ?? null,
        generated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ report: data });
  } catch (err) {
    console.error("[reports.createReport]", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

// ─────────────────────────────────────────────────────────
// DELETE /api/reports/list?id=xxx
// ─────────────────────────────────────────────────────────
export async function deleteReport(req: Request, res: Response) {
  try {
    const { userId } = getAuth(req);
    const id = req.query.id as string | undefined;

    if (!id) return res.status(400).json({ error: "id is required" });

    const { error } = await supabaseAdmin
      .from("reports")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  } catch (err) {
    console.error("[reports.deleteReport]", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

// ─────────────────────────────────────────────────────────
// GET /api/reports/overview
// ─────────────────────────────────────────────────────────
export async function getReportsOverview(req: Request, res: Response) {
  try {
    const { userId } = getAuth(req);

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 3_600_000).toISOString();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 3_600_000).toISOString();

    const [
      schedulesRes,
      lastGenRes,
      nextRunRes,
      totalReportsRes,
      reportsThisWeekRes,
      reportsLastWeekRes,
      criticalThisWeekRes,
      criticalLastWeekRes,
      threatsThisWeekRes,
      threatsLastWeekRes,
    ] = await Promise.all([
      supabaseAdmin.from("report_schedules").select("id", { count: "exact", head: true })
        .eq("user_id", userId).eq("status", "active"),

      supabaseAdmin.from("reports").select("generated_at")
        .eq("user_id", userId).order("generated_at", { ascending: false }).limit(1).single(),

      supabaseAdmin.from("report_schedules").select("next_run")
        .eq("user_id", userId).eq("status", "active")
        .gt("next_run", now.toISOString()).order("next_run", { ascending: true }).limit(1).single(),

      supabaseAdmin.from("reports").select("id", { count: "exact", head: true })
        .eq("user_id", userId),

      supabaseAdmin.from("reports").select("id", { count: "exact", head: true })
        .eq("user_id", userId).gte("generated_at", weekAgo),

      supabaseAdmin.from("reports").select("id", { count: "exact", head: true })
        .eq("user_id", userId).gte("generated_at", twoWeeksAgo).lt("generated_at", weekAgo),

      supabaseAdmin.from("reports").select("id", { count: "exact", head: true })
        .eq("user_id", userId).eq("severity", "Critical").gte("generated_at", weekAgo),

      supabaseAdmin.from("reports").select("id", { count: "exact", head: true })
        .eq("user_id", userId).eq("severity", "Critical")
        .gte("generated_at", twoWeeksAgo).lt("generated_at", weekAgo),

      supabaseAdmin.from("threats").select("id", { count: "exact", head: true })
        .eq("clerk_id", userId).eq("status", "blocked").gte("created_at", weekAgo),

      supabaseAdmin.from("threats").select("id", { count: "exact", head: true })
        .eq("clerk_id", userId).eq("status", "blocked")
        .gte("created_at", twoWeeksAgo).lt("created_at", weekAgo),
    ]);

    const activeSchedules = schedulesRes.count ?? 0;
    const lastGenDate = lastGenRes.data?.generated_at ?? null;
    const nextRunDate = nextRunRes.data?.next_run ?? null;
    const totalReports = totalReportsRes.count ?? 0;
    const reportsThisWeek = reportsThisWeekRes.count ?? 0;
    const reportsLastWeek = reportsLastWeekRes.count ?? 0;
    const criticalFindings = criticalThisWeekRes.count ?? 0;
    const criticalLastWeek = criticalLastWeekRes.count ?? 0;
    const threatsThisWeek = threatsThisWeekRes.count ?? 0;
    const threatsLastWeek = threatsLastWeekRes.count ?? 0;

    const storageMB = totalReports * 2;
    const storageLabel = storageMB >= 1024
      ? `${(storageMB / 1024).toFixed(1)} GB`
      : `${storageMB} MB`;

    return res.json({
      heroStats: {
        activeSchedules: `${activeSchedules} Running`,
        lastGenerated: lastGenLabel(lastGenDate),
        nextReport: timeUntil(nextRunDate),
        storageUsed: storageLabel,
        retentionPolicy: "90 Days",
      },
      kpis: {
        reportsGenerated: { value: totalReports, change: wowChange(reportsThisWeek, reportsLastWeek) },
        criticalFindings: { value: criticalFindings, change: wowChange(criticalFindings, criticalLastWeek) },
        threatsMitigated: { value: threatsThisWeek, change: wowChange(threatsThisWeek, threatsLastWeek) },
        avgResponseTime: { value: 1.8, change: "-0.4s" },
      },
      meta: {
        activeScheduleCount: activeSchedules,
        hasFailedJobs: false,
        nextRunIso: nextRunDate,
        lastGenIso: lastGenDate,
      },
    });
  } catch (err) {
    console.error("[reports.getReportsOverview]", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
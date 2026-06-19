import { supabaseAdmin } from "../config/supabase";

interface Finding {
  title: string;
  severity: string;
  category?: string;
}

interface ScanRecord {
  id: string;
  clerk_id: string;
  domain: string;
}

// Trigger sirf 'Critical' / 'High' (Title Case) par fire hota hai,
// isliye severity ko exact format me convert karna zaroori hai.
const toTitleCaseSeverity = (severity: string) => {
  const s = (severity || "low").toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const parseDevice = (userAgent: string = "") => {
  let os = "Unknown OS";
  let browser = "Unknown Browser";

  if (/windows/i.test(userAgent)) os = "Windows";
  else if (/mac os/i.test(userAgent)) os = "macOS";
  else if (/android/i.test(userAgent)) os = "Android";
  else if (/iphone|ipad/i.test(userAgent)) os = "iOS";
  else if (/linux/i.test(userAgent)) os = "Linux";

  if (/edg\//i.test(userAgent)) browser = "Edge";
  else if (/chrome/i.test(userAgent)) browser = "Chrome";
  else if (/firefox/i.test(userAgent)) browser = "Firefox";
  else if (/safari/i.test(userAgent)) browser = "Safari";

  return `${browser} on ${os}`;
};

export const syncThreatsFromScan = async (
  scan: ScanRecord,
  findings: Finding[],
  ipAddress: string,
  country: string,
  userAgent: string
) => {
  const device = parseDevice(userAgent);
  const currentTitles = findings.map((f) => f.title);

  // Step 1: Purane active threats jo is baar nahi mile -> resolved mark karo
  let resolveQuery = supabaseAdmin
    .from("threats")
    .update({ status: "resolved" })
    .eq("clerk_id", scan.clerk_id)
    .eq("domain", scan.domain)
    .eq("status", "active");

  if (currentTitles.length > 0) {
    resolveQuery = resolveQuery.not(
      "threat_type",
      "in",
      `(${currentTitles.map((t) => `"${t}"`).join(",")})`
    );
  }

  const { error: resolveError } = await resolveQuery;
  if (resolveError) {
    console.error("THREAT SYNC - RESOLVE ERROR:", resolveError);
  }

  // Step 2: Current findings ko upsert karo
  for (const finding of findings) {
    const { data: existing, error: selectError } = await supabaseAdmin
      .from("threats")
      .select("id")
      .eq("clerk_id", scan.clerk_id)
      .eq("domain", scan.domain)
      .eq("threat_type", finding.title)
      .maybeSingle();

    if (selectError) {
      console.error("THREAT SYNC - SELECT ERROR:", selectError);
      continue;
    }

    const payload = {
      clerk_id: scan.clerk_id,
      domain: scan.domain,
      scan_id: scan.id,
      threat_type: finding.title,
      severity: toTitleCaseSeverity(finding.severity),
      status: "active",
      ip_address: ipAddress,
      country,
      device,
    };

    if (existing) {
      const { error: updateError } = await supabaseAdmin
        .from("threats")
        .update(payload)
        .eq("id", existing.id);

      if (updateError) {
        console.error("THREAT SYNC - UPDATE ERROR:", updateError);
      }
    } else {
      const { error: insertError } = await supabaseAdmin
        .from("threats")
        .insert(payload);

      if (insertError) {
        console.error("THREAT SYNC - INSERT ERROR:", insertError);
      }
    }
  }
};
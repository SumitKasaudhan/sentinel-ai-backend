import { Response } from "express";

import { getDnsInfo } from "../services/dns.service";
import {
  getSSLInfo,
  generateSSLFindings,
} from "../services/ssl.service";

import { getWhoisInfo } from "../services/whois.service";

import {
  getSecurityHeaders,
  generateHeaderFindings,
} from "../services/headers.service";

import { calculateRiskScore } from "../services/risk-score.service";

import { saveScan } from "../services/save-scan.service";

import {
  saveFindings,
  getSeverityCounts,
  generateRecommendations,
} from "../services/findings.service";

import { extractDomain } from "../modules/scanner/utils/extractDomain";

import { scanPorts } from "../services/port-scan.service";

import { getVirusTotalData } from "../services/virustotal.service";

import { getAbuseIPData } from "../services/abuseipdb.service";

import { getGeoIPInfo } from "../services/geoip.service";

import { syncThreatsFromScan } from "../services/sync-threats.service";

import { getSubscriptionStatus } from "../modules/subscription/subscription.service"; // path apne structure ke hisab se confirm kar lena
import { supabaseAdmin } from "../config/supabase";

const FREE_SCAN_LIMIT = 3;

export const scanTarget = async (
  req: any,
  res: Response
) => {
  try {
    const auth = req.auth();
    const userId = auth.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // ── Free-tier scan limit gate ──
    // Pro user check + lifetime scan-count check, dono auth ke baad,
    // target validate hone se pehle (taaki limit-hit user ka quota
    // bekaar request pe na lage).
    const subscription = await getSubscriptionStatus(userId);
    const isPro =
      !!subscription &&
      subscription.plan === "pro" &&
      subscription.status === "active";

    if (!isPro) {
      const { count } = await supabaseAdmin
        .from("scans")
        .select("*", { count: "exact", head: true })
        .eq("clerk_id", userId);

      if ((count ?? 0) >= FREE_SCAN_LIMIT) {
        return res.status(403).json({
          success: false,
          code: "SCAN_LIMIT_REACHED",
          message: `Free plan allows up to ${FREE_SCAN_LIMIT} scans. Upgrade to Pro for unlimited scans.`,
        });
      }
    }

    const { target } = req.body;

    if (!target) {
      return res.status(400).json({
        success: false,
        message: "Target is required",
      });
    }

    const domain = extractDomain(target);

    const dnsInfo = await getDnsInfo(domain);
    const geoInfo = await getGeoIPInfo(domain);
    const ip = dnsInfo.ip;

    const [
      sslInfo,
      whoisInfo,
      securityHeaders,
      virusTotalInfo,
      portInfo,
      abuseInfo,
    ] = await Promise.all([
      getSSLInfo(domain),
      getWhoisInfo(domain),
      getSecurityHeaders(domain),
      getVirusTotalData(domain),
      scanPorts(domain),
      getAbuseIPData(ip),
    ]);

const findings: Parameters<typeof getSeverityCounts>[0] = [
      ...generateHeaderFindings(securityHeaders),
      ...generateSSLFindings(sslInfo),
    ] as any;
    
    const severityCounts = getSeverityCounts(findings);
    const recommendations = generateRecommendations(findings);

    const riskScore = calculateRiskScore({
      sslValid: sslInfo.valid,
      csp: securityHeaders.csp,
      hsts: securityHeaders.hsts,
      xFrameOptions: securityHeaders.xFrameOptions,
      xContentTypeOptions: securityHeaders.xContentTypeOptions,
    });

    const savedScan = await saveScan({
      clerk_id: userId,
      target,
      domain,
      risk_score: riskScore.score,
      risk_level: riskScore.level,
      dns: dnsInfo,
      ssl: sslInfo,
      whois: whoisInfo,
      security_headers: securityHeaders,
      virus_total: virusTotalInfo,
      ports: portInfo,
      abuse_ip: abuseInfo,
      geoip: geoInfo,
    });

    await saveFindings(findings, savedScan.id);

    // Dashboard / Activity feed ke liye threats table sync karo
    try {
      await syncThreatsFromScan(
        savedScan,
        findings,
        ip,
        geoInfo?.country,
        req.headers["user-agent"]
      );
    } catch (syncError) {
      console.error("THREAT SYNC ERROR:", syncError);
    }

    return res.status(200).json({
      success: true,
      target,
      domain,
      dns: dnsInfo,
      ssl: sslInfo,
      whois: whoisInfo,
      securityHeaders,
      virusTotal: virusTotalInfo,
      ports: portInfo,
      abuseIP: abuseInfo,
      geoIP: geoInfo,
      riskScore,
      findings,
      severityCounts,
      recommendations,
    });
  } catch (error: any) {
    console.error("FULL SCANNER ERROR:", error);

    // FIX: this used to send `details: error` straight into res.json().
    // Node errors from TLS/DNS/socket failures (like a cert hostname
    // mismatch) carry circular references — e.g. cert.issuerCertificate
    // .issuerCertificate... — and JSON.stringify throws on that. That throw
    // happened *inside* this catch block with nothing left to catch it,
    // which is an unhandled rejection and can take the whole server down.
    // Only send back safe, serializable fields.
    return res.status(500).json({
      success: false,
      message: "Scan failed",
      error: error?.message || "Unknown error",
      code: error?.code || null,
    });
  }
};
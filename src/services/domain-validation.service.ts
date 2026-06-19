import dns from "dns";
import { promisify } from "util";
import net from "net";
import https from "https";
import http from "http";

// IMPORTANT: dns.lookup() uses the OS-level resolver (getaddrinfo) —
// same as what the browser/curl use. dns.resolve4()/resolve6() use
// Node's own c-ares resolver which sends raw UDP queries directly to
// a DNS server, and on many Windows machines (VPN, firewall, certain
// routers) those raw queries get ECONNREFUSED even though the OS
// resolver works fine. lookup() is the reliable cross-platform choice.
const lookup = promisify(dns.lookup);

// RFC-1035 hostname — unlimited subdomain depth supported (tv.apple.com, a.b.example.co.in, etc.)
const FQDN_REGEX =
  /^(?=.{1,253}$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/;

const HTTP_CHECK_TIMEOUT_MS = 5000;

// SSRF guard — scanner ko apne internal infra pe point nahi hone dena
const isPrivateOrReservedIP = (ip: string): boolean => {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    return false;
  }
  if (net.isIPv6(ip)) {
    const l = ip.toLowerCase();
    return l === "::1" || l.startsWith("fe80") || l.startsWith("fc") || l.startsWith("fd");
  }
  return false;
};

// Real HTTP reachability check — DNS+SSL hone ke bawjood koi domain
// "dead" ho sakta hai (server down, parked nameserver jo sirf DNS
// record hold karta hai par koi server response nahi deta). Hum
// HTTPS try karte hai, fail hone par HTTP fallback — jo bhi pehle
// koi valid response de (status code aaye, chahe 4xx/5xx ho — server
// zinda hai matlab), use "reachable" maante hai. Sirf connection-level
// failure (timeout, ECONNREFUSED, DNS-level fail dobara) ko "dead"
// maanenge.
const checkHttpReachable = (hostname: string): Promise<boolean> => {
  const tryProtocol = (mod: typeof https | typeof http, port: number): Promise<boolean> =>
    new Promise((resolve) => {
      const req = mod.request(
        {
          hostname,
          port,
          method: "HEAD",
          path: "/",
          timeout: HTTP_CHECK_TIMEOUT_MS,
          // SSL cert mismatch/self-signed pe bhi server "alive" hai —
          // hum sirf reachability check kar rahe hai, cert validity
          // alag se SSL findings me already check ho rahi hai.
          rejectUnauthorized: false,
        },
        (res) => {
          res.resume(); // drain response body
          resolve(true); // koi bhi status code aaya matlab server zinda hai
        }
      );

      req.on("timeout", () => {
        req.destroy();
        resolve(false);
      });

      req.on("error", () => resolve(false));
      req.end();
    });

  return tryProtocol(https, 443).then((ok) =>
    ok ? true : tryProtocol(http, 80)
  );
};

export interface DomainValidationResult {
  valid: boolean;
  message: string;
  domain?: string;
  resolvedIp?: string;
}

export class DomainValidationService {
  static async validateDomain(rawInput: string): Promise<DomainValidationResult> {
    const input = (rawInput || "").trim();
    if (!input) return { valid: false, message: "Domain is required" };

    let hostname: string;
    try {
      const withProtocol = /^https?:\/\//i.test(input) ? input : `https://${input}`;
      hostname = new URL(withProtocol).hostname.replace(/^www\./i, "").toLowerCase();
    } catch {
      return { valid: false, message: "Invalid domain format" };
    }

    // 1. Format
    if (!FQDN_REGEX.test(hostname)) {
      return { valid: false, message: "Invalid domain format" };
    }

    // 2. Raw IP allowed nahi is endpoint se
    if (net.isIP(hostname)) {
      return { valid: false, message: "Enter a domain name, not an IP address" };
    }

    // 3. DNS existence check
    let resolvedIp: string | undefined;
    try {
      const result = await lookup(hostname);
      resolvedIp = result?.address;
    } catch (err: any) {
      console.error("[domain-validation] lookup failed:", hostname, err?.code || err?.message);
      return { valid: false, message: "Domain does not resolve — check spelling" };
    }
    if (!resolvedIp) {
      return { valid: false, message: "Domain does not resolve" };
    }

    // 4. SSRF block
    if (isPrivateOrReservedIP(resolvedIp)) {
      return { valid: false, message: "This target cannot be scanned" };
    }

    // 5. Live HTTP reachability — DNS record hone ke bawjood agar
    //    koi server respond nahi karta, to scan karne ka koi matlab nahi.
    const reachable = await checkHttpReachable(hostname);
    if (!reachable) {
      return {
        valid: false,
        message: "Domain resolves but is not reachable — site may be down or parked",
      };
    }

    return { valid: true, message: "Domain is valid", domain: hostname, resolvedIp };
  }
}
import axios from "axios";

export interface HeaderScan {
  csp: boolean;
  hsts: boolean;
  xFrameOptions: boolean;
  xContentTypeOptions: boolean;
}

export interface HeaderFinding {
  severity: string;
  category: string;
  title: string;
  description: string;
  remediation: string;
  risk_points: number;
}

export const getSecurityHeaders = async (
  domain: string
): Promise<HeaderScan> => {
  try {
    const response = await axios.get(
      `https://${domain}`,
      {
        timeout: 10000,
      }
    );

    const headers = response.headers;

    return {
      csp: !!headers["content-security-policy"],

      hsts:
        !!headers["strict-transport-security"],

      xFrameOptions:
        !!headers["x-frame-options"],

      xContentTypeOptions:
        !!headers["x-content-type-options"],
    };
  } catch {
    return {
      csp: false,
      hsts: false,
      xFrameOptions: false,
      xContentTypeOptions: false,
    };
  }
};

export const generateHeaderFindings = (
  headers: HeaderScan
): HeaderFinding[] => {
  const findings: HeaderFinding[] = [];

  if (!headers.hsts) {
    findings.push({
      severity: "HIGH",
      category: "Headers",
      title: "Missing HSTS Header",
      description:
        "Strict-Transport-Security header is missing.",
      remediation:
        "Enable HSTS to enforce HTTPS connections.",
      risk_points: 15,
    });
  }

  if (!headers.csp) {
    findings.push({
      severity: "HIGH",
      category: "Headers",
      title: "Missing CSP Header",
      description:
        "Content Security Policy is not configured.",
      remediation:
        "Implement a strong Content Security Policy.",
      risk_points: 15,
    });
  }

  if (!headers.xFrameOptions) {
    findings.push({
      severity: "MEDIUM",
      category: "Headers",
      title: "Missing X-Frame-Options",
      description:
        "Website may be vulnerable to clickjacking attacks.",
      remediation:
        "Set X-Frame-Options to DENY or SAMEORIGIN.",
      risk_points: 10,
    });
  }

  if (!headers.xContentTypeOptions) {
    findings.push({
      severity: "MEDIUM",
      category: "Headers",
      title: "Missing X-Content-Type-Options",
      description:
        "Browser MIME sniffing protection is disabled.",
      remediation:
        "Set X-Content-Type-Options to nosniff.",
      risk_points: 10,
    });
  }

  return findings;
};
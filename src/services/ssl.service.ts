import tls from "tls";

export interface SSLInfo {
  valid: boolean;
  issuer: string;
  expiresAt: string;
}

export interface SSLFinding {
  severity: string;
  category: string;
  title: string;
  description: string;
  remediation: string;
  risk_points: number;
}

export const getSSLInfo = (
  domain: string
): Promise<SSLInfo> => {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(
      443,
      domain,
      {
        servername: domain,
      },
      () => {
        try {
          const cert =
            socket.getPeerCertificate();

          resolve({
            valid:
              socket.authorized,
issuer:
  (Array.isArray(cert.issuer?.O)
    ? cert.issuer.O[0]
    : cert.issuer?.O) || "Unknown",
            expiresAt:
              cert.valid_to ||
              "Unknown",
          });

          socket.end();
        } catch (error) {
          reject(error);
        }
      }
    );

    socket.on("error", reject);
  });
};

export const generateSSLFindings = (
  ssl: SSLInfo
): SSLFinding[] => {
  const findings: SSLFinding[] = [];

  if (!ssl.valid) {
    findings.push({
      severity: "CRITICAL",
      category: "SSL",
      title: "Invalid SSL Certificate",
      description:
        "SSL certificate validation failed.",
      remediation:
        "Install a valid trusted SSL certificate.",
      risk_points: 25,
    });
  }

  if (
    ssl.issuer.toLowerCase().includes(
      "self"
    )
  ) {
    findings.push({
      severity: "HIGH",
      category: "SSL",
      title: "Self-Signed Certificate",
      description:
        "Website uses a self-signed SSL certificate.",
      remediation:
        "Use a certificate issued by a trusted Certificate Authority.",
      risk_points: 15,
    });
  }

  try {
    const expiryDate = new Date(
      ssl.expiresAt
    );

    const today = new Date();

    const diffDays = Math.ceil(
      (expiryDate.getTime() -
        today.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (diffDays <= 30) {
      findings.push({
        severity: "HIGH",
        category: "SSL",
        title: "SSL Certificate Expiring Soon",
        description: `SSL certificate expires in ${diffDays} days.`,
        remediation:
          "Renew SSL certificate before expiration.",
        risk_points: 10,
      });
    }

    if (diffDays <= 7) {
      findings.push({
        severity: "CRITICAL",
        category: "SSL",
        title: "SSL Certificate Critical Expiry",
        description: `SSL certificate expires in ${diffDays} days.`,
        remediation:
          "Renew SSL certificate immediately.",
        risk_points: 20,
      });
    }
  } catch {
    // ignore invalid date
  }

  return findings;
};
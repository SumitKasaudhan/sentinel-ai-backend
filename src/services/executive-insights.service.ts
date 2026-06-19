import { supabaseAdmin } from "../config/supabase";

export async function generateExecutiveInsights(
scanId: string
) {
const { data: scan, error } = await supabaseAdmin
.from("scans")
.select("*")
.eq("id", scanId)
.single();

if (error || !scan) {
throw new Error("Scan not found");
}

const headers =
scan.securityHeaders ||
scan.headers ||
{};

const ssl =
scan.ssl ||
{};

let ports: any[] = [];

try {
if (Array.isArray(scan.openPorts)) {
ports = scan.openPorts;
} else if (
scan.openPorts &&
typeof scan.openPorts === "object"
) {
ports = Object.values(scan.openPorts);
} else if (Array.isArray(scan.ports)) {
ports = scan.ports;
} else if (
scan.ports &&
typeof scan.ports === "object"
) {
ports = Object.values(scan.ports);
}


ports = ports.flat(Infinity);

ports = ports.filter(
  (port) =>
    port !== null &&
    port !== undefined &&
    port !== ""
);


} catch (err) {
console.error(
"Port normalization error:",
err
);


ports = [];


}

let riskScore = 100;

for (const port of ports) {
const portNumber =
typeof port === "number"
? port
: Number(
port?.port ??
port?.number ??
port
);


if (isNaN(portNumber)) {
  continue;
}

switch (portNumber) {
  case 21:
    riskScore -= 20;
    break;

  case 22:
    riskScore -= 10;
    break;

  case 23:
    riskScore -= 25;
    break;

  case 80:
    riskScore -= 10;
    break;

  case 3306:
    riskScore -= 15;
    break;

  case 5432:
    riskScore -= 15;
    break;

  case 8080:
    riskScore -= 10;
    break;

  default:
    break;
}


}

if (!headers["content-security-policy"]) {
riskScore -= 15;
}

if (!headers["strict-transport-security"]) {
riskScore -= 15;
}

if (!headers["x-frame-options"]) {
riskScore -= 10;
}

if (ssl.valid === false) {
riskScore -= 20;
}

riskScore = Math.max(
0,
Math.min(100, riskScore)
);

let businessRisk:
| "LOW"
| "MEDIUM"
| "HIGH"
| "CRITICAL";

if (riskScore <= 25) {
businessRisk = "CRITICAL";
} else if (riskScore <= 50) {
businessRisk = "HIGH";
} else if (riskScore <= 75) {
businessRisk = "MEDIUM";
} else {
businessRisk = "LOW";
}

const grade =
riskScore >= 90
? "A"
: riskScore >= 80
? "B"
: riskScore >= 70
? "C"
: riskScore >= 50
? "D"
: "F";

let financialImpact = "$10,000+";

if (ports.length >= 10) {
financialImpact = "$250,000+";
} else if (ports.length >= 5) {
financialImpact = "$125,000+";
} else if (ports.length >= 2) {
financialImpact = "$50,000+";
}

const criticalActions: string[] = [];

if (ports.length > 0) {
criticalActions.push(
"Reduce publicly exposed services"
);
}

if (ssl.valid === false) {
criticalActions.push(
"Renew or configure SSL certificate"
);
}

if (!headers["content-security-policy"]) {
criticalActions.push(
"Implement Content Security Policy"
);
}

if (!headers["strict-transport-security"]) {
criticalActions.push(
"Enable HSTS protection"
);
}

if (!headers["x-frame-options"]) {
criticalActions.push(
"Enable clickjacking protection"
);
}

const securityTrend =
riskScore >= 80
? "Improving"
: riskScore <= 50
? "Declining"
: "Stable";

const executiveSummary = `Sentinel AI identified ${ports.length} exposed services and multiple missing security controls.
The current security posture is classified as ${businessRisk}, with an estimated
financial exposure of ${financialImpact}. Immediate remediation should focus on
reducing attack surface exposure, eliminating unnecessary internet-facing services,
and strengthening security controls across critical assets.
 `
.replace(/\s+/g, " ")
.trim();

const boardRecommendation =
businessRisk === "CRITICAL"
? "Immediate executive oversight is recommended. Critical vulnerabilities should be remediated within 14 days."
: businessRisk === "HIGH"
? "Prioritize remediation of critical findings and exposed services within 30 days."
: businessRisk === "MEDIUM"
? "Continue risk reduction efforts and monitor remediation progress."
: "Maintain current security posture and continue proactive monitoring.";

return {
grade,
businessRisk,
financialImpact,
securityTrend,
executiveSummary,
boardRecommendation,
criticalActions,
riskScore,
totalExposedServices: ports.length,
};
}

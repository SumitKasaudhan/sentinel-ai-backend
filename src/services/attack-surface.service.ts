import { supabaseAdmin }
from "../config/supabase";

export async function getAttackSurface(
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

console.log("SCAN DATA:");
console.log(JSON.stringify(scan, null, 2));

let attackSurfaceScore = 100;

const exposedServices: string[] = [];

const headers =
scan.securityHeaders ||
scan.headers ||
{};

const ssl =
scan.ssl ||
{};

let ports: any[] = [];

if (Array.isArray(scan.openPorts)) {
ports = scan.openPorts;
}
else if (Array.isArray(scan.ports)) {
ports = scan.ports;
}
else if (scan.openPorts) {
ports = Object.values(scan.openPorts);
}
else if (scan.ports) {
ports = Object.values(scan.ports);
}

console.log("PORTS:", ports);

ports.forEach((port: any) => {

const portNumber =
  typeof port === "number"
    ? port
    : port?.port ||
      port?.number ||
      parseInt(port);

switch (portNumber) {

  case 21:
    attackSurfaceScore -= 20;
    exposedServices.push("FTP");
    break;

  case 22:
    attackSurfaceScore -= 10;
    exposedServices.push("SSH");
    break;

  case 23:
    attackSurfaceScore -= 25;
    exposedServices.push("TELNET");
    break;

  case 80:
    attackSurfaceScore -= 10;
    exposedServices.push("HTTP");
    break;

  case 443:
    attackSurfaceScore -= 2;
    exposedServices.push("HTTPS");
    break;

  default:
    break;
}

});

if (
!headers["content-security-policy"]
) {
attackSurfaceScore -= 15;
}

if (
!headers["strict-transport-security"]
) {
attackSurfaceScore -= 15;
}

if (
!headers["x-frame-options"]
) {
attackSurfaceScore -= 10;
}

if (ssl.valid === true) {
attackSurfaceScore += 5;
}

if (ssl.valid === false) {
attackSurfaceScore -= 20;
}

attackSurfaceScore =
Math.max(
0,
Math.min(
100,
attackSurfaceScore
)
);

let internetExposure:
| "LOW"
| "MEDIUM"
| "HIGH";

if (attackSurfaceScore >= 80) {
internetExposure = "LOW";
}
else if (attackSurfaceScore >= 50) {
internetExposure = "MEDIUM";
}
else {
internetExposure = "HIGH";
}

return {
attackSurfaceScore,
internetExposure,
openServices:
exposedServices.length,
exposedServices,
externalFacingAssets: 1,
riskLevel:
internetExposure,
};
}

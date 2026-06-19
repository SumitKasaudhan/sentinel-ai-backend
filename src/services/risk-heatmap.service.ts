import { supabaseAdmin }
from "../config/supabase";

export async function getRiskHeatmap(
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

  const headers =
    scan.securityHeaders ||
    scan.headers ||
    {};

  const ssl =
    scan.ssl ||
    {};

  const ports =
    scan.openPorts ||
    scan.ports ||
    [];

  const heatmap: any[] = [];

  /* ==========================
     HEADERS
  ========================== */

  let headerRisk = 0;

  if (!headers["content-security-policy"])
    headerRisk += 25;

  if (!headers["strict-transport-security"])
    headerRisk += 25;

  if (!headers["x-frame-options"])
    headerRisk += 20;

  if (!headers["x-content-type-options"])
    headerRisk += 20;

  heatmap.push({
    category: "Security Headers",
    score: headerRisk,
    risk:
      headerRisk >= 80
        ? "CRITICAL"
        : headerRisk >= 60
        ? "HIGH"
        : headerRisk >= 30
        ? "MEDIUM"
        : "LOW",
  });

  /* ==========================
     PORTS
  ========================== */

  let portRisk = 0;

  let portList: any[] = [];

  if (Array.isArray(ports)) {
    portList = ports;
  } else {
    portList = Object.values(ports);
  }

  portList.forEach((port: any) => {

    const portNumber =
      typeof port === "number"
        ? port
        : port?.port ||
          port?.number ||
          parseInt(port);

    switch (portNumber) {

      case 21:
        portRisk += 30;
        break;

      case 22:
        portRisk += 15;
        break;

      case 23:
        portRisk += 40;
        break;

      case 80:
        portRisk += 10;
        break;
    }

  });

  heatmap.push({
    category: "Ports",
    score: portRisk,
    risk:
      portRisk >= 80
        ? "CRITICAL"
        : portRisk >= 60
        ? "HIGH"
        : portRisk >= 30
        ? "MEDIUM"
        : "LOW",
  });

  /* ==========================
     SSL
  ========================== */

  let sslRisk = 0;

  if (ssl.valid === false) {
    sslRisk = 80;
  }

  heatmap.push({
    category: "SSL",
    score: sslRisk,
    risk:
      sslRisk >= 80
        ? "CRITICAL"
        : sslRisk >= 60
        ? "HIGH"
        : sslRisk >= 30
        ? "MEDIUM"
        : "LOW",
  });

  /* ==========================
     DNS
  ========================== */

  heatmap.push({
    category: "DNS",
    score: 10,
    risk: "LOW",
  });

  /* ==========================
     WHOIS
  ========================== */

  heatmap.push({
    category: "WHOIS",
    score: 15,
    risk: "LOW",
  });

  /* ==========================
     ATTACK SURFACE
  ========================== */

  let attackSurfaceRisk = 0;

  attackSurfaceRisk =
    headerRisk +
    portRisk;

  if (attackSurfaceRisk > 100) {
    attackSurfaceRisk = 100;
  }

  heatmap.push({
    category: "Attack Surface",
    score: attackSurfaceRisk,
    risk:
      attackSurfaceRisk >= 80
        ? "CRITICAL"
        : attackSurfaceRisk >= 60
        ? "HIGH"
        : attackSurfaceRisk >= 30
        ? "MEDIUM"
        : "LOW",
  });

  return {
    heatmap,
  };
}
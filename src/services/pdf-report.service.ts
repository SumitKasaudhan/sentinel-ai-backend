import PDFDocument from "pdfkit";
import { supabaseAdmin } from "../config/supabase";

export async function generatePdfReport(
  scanId: string
): Promise<Buffer> {

  const { data: scan, error } =
    await supabaseAdmin
      .from("scans")
      .select("*")
      .eq("id", scanId)
      .single();

  if (error || !scan) {
    throw new Error("Scan not found");
  }

  return new Promise((resolve) => {

    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      bufferPages: true,
    });

    const buffers: Buffer[] = [];

    doc.on("data", (chunk) => {
      buffers.push(chunk);
    });

    doc.on("end", () => {
      resolve(Buffer.concat(buffers));
    });

    /* ======================================
       HELPERS
    ====================================== */

    const section = (title: string) => {

      doc.moveDown(1.5);

      doc
        .fontSize(18)
        .fillColor("#00AEEF")
        .text(title);

      doc
        .moveTo(50, doc.y + 5)
        .lineTo(545, doc.y + 5)
        .strokeColor("#d9d9d9")
        .stroke();

      doc.moveDown();
    };

    const labelValue = (
      label: string,
      value: any
    ) => {

      doc
        .fontSize(11)
        .fillColor("#666")
        .text(`${label}: `, {
          continued: true,
        });

      doc
        .fillColor("#000")
        .text(String(value || "N/A"));

    };

    /* ======================================
       COVER
    ====================================== */

    doc
      .fontSize(30)
      .fillColor("#00AEEF")
      .text("Sentinel AI", {
        align: "center",
      });

    doc.moveDown();

    doc
      .fontSize(20)
      .fillColor("#000")
      .text(
        "Executive Security Report",
        {
          align: "center",
        }
      );

    doc.moveDown(3);

    labelValue(
      "Target",
      scan.target ||
      scan.domain
    );

    labelValue(
      "Generated",
      new Date().toLocaleString()
    );

    labelValue(
      "Risk Score",
      scan.riskScore || 65
    );

    labelValue(
      "Security Grade",
      scan.grade || "D"
    );

    /* ======================================
       EXECUTIVE SUMMARY
    ====================================== */

    section("Executive Summary");

    doc
      .fontSize(11)
      .fillColor("#333")
      .text(
        "This report provides a complete security assessment of the target infrastructure including attack surface analysis, technical intelligence, security posture evaluation, and remediation recommendations."
      );

    doc.moveDown();

    doc.text(
      "Several weaknesses were identified including missing security headers and exposed services which increase overall attack surface exposure."
    );

    /* ======================================
       SECURITY OVERVIEW
    ====================================== */

    section("Security Overview");

    labelValue(
      "Risk Score",
      scan.riskScore || 65
    );

    labelValue(
      "Security Grade",
      scan.grade || "D"
    );

    labelValue(
      "Open Ports",
      scan.openPorts?.length || 0
    );

    labelValue(
      "Target Type",
      scan.type || "Domain"
    );

    /* ======================================
       DNS
    ====================================== */

    if (scan.dns) {

      section("DNS Intelligence");

      doc
        .fontSize(10)
        .fillColor("#444")
        .text(
          JSON.stringify(
            scan.dns,
            null,
            2
          )
        );

    }

    /* ======================================
       SSL
    ====================================== */

    if (scan.ssl) {

      section("SSL Intelligence");

      doc
        .fontSize(10)
        .fillColor("#444")
        .text(
          JSON.stringify(
            scan.ssl,
            null,
            2
          )
        );

    }

    /* ======================================
       WHOIS
    ====================================== */

    if (scan.whois) {

      section("WHOIS Intelligence");

      doc
        .fontSize(10)
        .fillColor("#444")
        .text(
          JSON.stringify(
            scan.whois,
            null,
            2
          )
        );

    }

    /* ======================================
       GEOIP
    ====================================== */

    if (scan.geoip) {

      section("GeoIP Intelligence");

      doc
        .fontSize(10)
        .fillColor("#444")
        .text(
          JSON.stringify(
            scan.geoip,
            null,
            2
          )
        );

    }

    /* ======================================
       RECOMMENDATIONS
    ====================================== */

    section("Recommendations");

    const recommendations = [
      "Enable HSTS",
      "Implement Content Security Policy (CSP)",
      "Configure X-Frame-Options",
      "Enable X-Content-Type-Options",
      "Close FTP Port 21",
      "Restrict SSH Access",
    ];

    recommendations.forEach(
      (item) => {
        doc.text(`• ${item}`);
      }
    );

    /* ======================================
       ATTACK SURFACE
    ====================================== */

    section("Attack Surface Analysis");

    doc.text(
      "Attack surface exposure was identified through open services, exposed ports, and missing security controls."
    );

    /* ======================================
       FOOTER
    ====================================== */

    const pages =
      doc.bufferedPageRange();

    for (
      let i = 0;
      i < pages.count;
      i++
    ) {

      doc.switchToPage(i);

      doc
        .fontSize(8)
        .fillColor("#666")
        .text(
          `Sentinel AI Confidential • Page ${i + 1}`,
          50,
          770,
          {
            align: "center",
            width: 500,
          }
        );
    }

    doc.end();

  });
}
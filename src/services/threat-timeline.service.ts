export const generateThreatTimeline =
  (scan: any) => {

    const timeline = [];

    timeline.push({
      step: "DNS Resolution",
      status: "completed",
      timestamp: scan.created_at,
      description:
        "Target domain resolved successfully",
    });

    if (scan.ssl) {
      timeline.push({
        step: "SSL Inspection",
        status: "completed",
        timestamp: scan.created_at,
        description:
          "SSL certificate analyzed",
      });
    }

    if (scan.whois) {
      timeline.push({
        step: "WHOIS Analysis",
        status: "completed",
        timestamp: scan.created_at,
        description:
          "Domain registration data collected",
      });
    }

    if (scan.virus_total) {
      timeline.push({
        step: "VirusTotal Scan",
        status: "completed",
        timestamp: scan.created_at,
        description:
          "Threat intelligence checked",
      });
    }

    if (scan.security_headers) {
      timeline.push({
        step: "Security Headers",
        status: "completed",
        timestamp: scan.created_at,
        description:
          "HTTP security headers evaluated",
      });
    }

    if (scan.ports) {
      timeline.push({
        step: "Port Intelligence",
        status: "completed",
        timestamp: scan.created_at,
        description:
          "Open ports analyzed",
      });
    }

    timeline.push({
      step: "Risk Assessment",
      status: "completed",
      timestamp: scan.created_at,
      description:
        `Risk Score ${scan.risk_score} generated`,
    });

    timeline.push({
      step: "Report Generated",
      status: "completed",
      timestamp: scan.created_at,
      description:
        "Executive report created",
    });

    return timeline;
  };
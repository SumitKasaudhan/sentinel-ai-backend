import axios from "axios";

export const getVirusTotalData = async (
  domain: string
) => {
  try {
    const response = await axios.get(
      `https://www.virustotal.com/api/v3/domains/${domain}`,
      {
        headers: {
          "x-apikey":
            process.env.VIRUSTOTAL_API_KEY!,
        },
      }
    );

    const stats =
      response.data.data.attributes
        .last_analysis_stats;

    return {
      harmless: stats.harmless,
      malicious: stats.malicious,
      suspicious: stats.suspicious,
      undetected: stats.undetected,
    };
  } catch (error) {
    console.error(
      "VirusTotal Error:",
      error
    );

    return {
      harmless: 0,
      malicious: 0,
      suspicious: 0,
      undetected: 0,
    };
  }
};
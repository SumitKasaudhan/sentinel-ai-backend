import axios from "axios";

export const getAbuseIPData = async (
  ip: string
) => {
  try {
    const response = await axios.get(
      "https://api.abuseipdb.com/api/v2/check",
      {
        headers: {
          Key:
            process.env.ABUSEIPDB_API_KEY!,
          Accept:
            "application/json",
        },

        params: {
          ipAddress: ip,
          maxAgeInDays: 90,
        },
      }
    );

    const data =
      response.data.data;

    return {
      abuseConfidenceScore:
        data.abuseConfidenceScore,

      countryCode:
        data.countryCode,

      isp:
        data.isp,

      totalReports:
        data.totalReports,

      domain:
        data.domain,
    };
  } catch (error) {
    console.error(
      "AbuseIPDB Error:",
      error
    );

    return null;
  }
};
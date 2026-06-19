import geoip from "geoip-lite";
import dns from "dns/promises";

export const getGeoIPInfo = async (
  domain: string
) => {
  try {
    const result =
  await dns.lookup(domain, {
    family: 4,
  });

    const geo =
      geoip.lookup(result.address);

    return {
      ip: result.address,
      country:
        geo?.country || "Unknown",
      region:
        geo?.region || "Unknown",
      city:
        geo?.city || "Unknown",
      timezone:
        geo?.timezone || "Unknown",
    };
  } catch (error) {
    return {
      ip: "Unknown",
      country: "Unknown",
      region: "Unknown",
      city: "Unknown",
      timezone: "Unknown",
    };
  }
};
import dns from "dns/promises";

export const getDnsInfo = async (
  domain: string
) => {
  try {
    const result = await dns.lookup(domain);

    return {
      ip: result.address,
      family: result.family,
    };
  } catch (error) {
    throw new Error(
      "DNS lookup failed"
    );
  }
};
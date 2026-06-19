import whois from "whois-json";

export interface WhoisInfo {
  registrar: string;
  creationDate: string;
  expirationDate: string;
}

export const getWhoisInfo = async (
  domain: string
): Promise<WhoisInfo> => {
  try {
    const data = await whois(domain);

    return {
      registrar:
        data.registrar || "Unknown",

      creationDate:
        data.creationDate ||
        data.createdDate ||
        "Unknown",

      expirationDate:
        data.registryExpiryDate ||
        data.expirationDate ||
        "Unknown",
    };
  } catch (error) {
    return {
      registrar: "Unknown",
      creationDate: "Unknown",
      expirationDate: "Unknown",
    };
  }
};
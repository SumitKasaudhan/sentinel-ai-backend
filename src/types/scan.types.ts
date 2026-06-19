export interface ScanResult {
  target: string;
  ip: string;

  ssl: {
    valid: boolean;
    issuer: string;
    expiresAt: string;
  };

  whois: {
    registrar: string;
    creationDate: string;
    expirationDate: string;
  };

  threatScore: number;
}
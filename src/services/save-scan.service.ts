import { supabaseAdmin } from "../config/supabase";

interface SaveScanInput {
  clerk_id: string;

  target: string;

  domain: string;

  risk_score: number;

  risk_level: string;

  dns: any;

  ssl: any;

  whois: any;

  security_headers: any;

  virus_total: any;

  ports: any;

  abuse_ip: any;

  geoip: any;
}

export const saveScan = async (
  scan: SaveScanInput
) => {
  const { data, error } =
    await supabaseAdmin
      .from("scans")
      .insert(scan)
      .select()
      .single();

  if (error) {
    console.error(
      "SCAN SAVE ERROR:",
      error
    );

    throw error;
  }

  console.log(
    "SCAN SAVED:",
    data
  );

  return data;
};
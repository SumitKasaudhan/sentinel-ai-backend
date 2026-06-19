import { supabaseAdmin } from "../config/supabase";

export const getTrendHistory =
  async (scanId: string) => {

    const { data: currentScan, error } =
      await supabaseAdmin
        .from("scans")
        .select("*")
        .eq("id", scanId)
        .single();

    if (error || !currentScan) {
      throw new Error(
        "Scan not found"
      );
    }

    const { data: scans, error: scansError } =
      await supabaseAdmin
        .from("scans")
        .select("*")
        .eq(
          "target",
          currentScan.target
        )
        .order("created_at", {
          ascending: true,
        });

    if (scansError) {
      throw scansError;
    }

    const history =
      scans.map((scan) => ({
        date:
          new Date(
            scan.created_at
          ).toLocaleDateString(),

        score:
          scan.risk_score || 0,
      }));

    return {
      target:
        currentScan.target,

      history,
    };
  };
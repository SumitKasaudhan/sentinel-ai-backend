import { supabaseAdmin } from "../../config/supabase";

export type ActivityType = "safe" | "info" | "danger" | "warning";

export const logActivity = async (
  clerkId: string,
  action: string,
  description: string,
  type: ActivityType = "info",
  metadata?: Record<string, any>
) => {
  const { error } = await supabaseAdmin
    .from("activity_log")
    .insert({ clerk_id: clerkId, action, description, type, metadata });

  if (error) console.error("ACTIVITY LOG ERROR:", error.message);
};

export const getRecentActivity = async (clerkId: string, limit = 10) => {
  const { data, error } = await supabaseAdmin
    .from("activity_log")
    .select("*")
    .eq("clerk_id", clerkId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return data || [];
};
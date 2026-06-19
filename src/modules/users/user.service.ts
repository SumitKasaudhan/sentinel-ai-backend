import { supabaseAdmin } from "../../config/supabase";

export const getUserProfile = async (
  userId: string
) => {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("clerk_id", userId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};
import { supabaseAdmin } from "../../config/supabase";

export const getOrCreateConversation = async (
  clerkId: string,
  conversationId?: string
) => {
  if (conversationId) {
    const { data, error } = await supabaseAdmin
      .from("ai_conversations")
      .select("*")
      .eq("id", conversationId)
      .eq("clerk_id", clerkId)
      .single();

    if (!error && data) return data;
  }

  const { data, error } = await supabaseAdmin
    .from("ai_conversations")
    .insert({ clerk_id: clerkId, title: "New Conversation" })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data;
};

export const saveMessage = async (
  conversationId: string,
  role: "user" | "assistant" | "system",
  content: string
) => {
  const { error } = await supabaseAdmin
    .from("ai_messages")
    .insert({ conversation_id: conversationId, role, content });

  if (error) throw new Error(error.message);
};

export const getConversationHistory = async (
  conversationId: string,
  limit = 50
) => {
  const { data, error } = await supabaseAdmin
    .from("ai_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);

  return data || [];
};

export const getUserConversations = async (clerkId: string) => {
  const { data, error } = await supabaseAdmin
    .from("ai_conversations")
    .select("*")
    .eq("clerk_id", clerkId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return data || [];
};

export const setConversationTitle = async (
  conversationId: string,
  firstMessage: string
) => {
  const title =
    firstMessage.length > 50
      ? firstMessage.slice(0, 50) + "..."
      : firstMessage;

  const { error } = await supabaseAdmin
    .from("ai_conversations")
    .update({ title })
    .eq("id", conversationId)
    .eq("title", "New Conversation");

  if (error) console.error("CONVERSATION TITLE ERROR:", error.message);
};
import { supabaseAdmin } from "../../config/supabase";
import { GoogleGenAI } from "@google/genai";
import {
  CreateThreatPayload,
  UpdateThreatStatusPayload,
  ThreatAnalysis,
} from "./threats.types";

// ─────────────────────────────────────────────────────────────────────────────
// All queries use supabaseAdmin (service-role key) so Supabase RLS never
// silently blocks writes.  Tenant isolation is enforced manually via
// .eq("clerk_id", clerkId) on every query — no cross-user access is possible.
// ─────────────────────────────────────────────────────────────────────────────

export const getThreatsService = async (clerkId: string) => {
  const { data, error } = await supabaseAdmin
    .from("threats")
    .select("*")
    .eq("clerk_id", clerkId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return data || [];
};

export const getThreatByIdService = async (
  id: string,
  clerkId: string
) => {
  // FIX: was .single() — that throws "Cannot coerce the result to a single
  // JSON object" whenever the id doesn't exist (e.g. a scan id gets passed
  // in by mistake), which surfaces as an ugly 500. maybeSingle() returns
  // null cleanly instead, so the controller can send a proper 404.
  const { data, error } = await supabaseAdmin
    .from("threats")
    .select("*")
    .eq("id", id)
    .eq("clerk_id", clerkId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data; // null if no matching threat — caller decides how to respond
};

export const createThreatService = async (
  payload: CreateThreatPayload,
  clerkId: string
) => {
  const { data, error } = await supabaseAdmin
    .from("threats")
    .insert([{ ...payload, clerk_id: clerkId }])
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data;
};

export const deleteThreatService = async (
  id: string,
  clerkId: string
) => {
  const { error, count } = await supabaseAdmin
    .from("threats")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("clerk_id", clerkId);

  if (error) throw new Error(error.message);

  if (count === 0) {
    throw new Error("Threat not found or access denied");
  }

  return true;
};

// ── Update threat status ─────────────────────────────────────────────────────

export const updateThreatStatusService = async (
  id: string,
  clerkId: string,
  payload: UpdateThreatStatusPayload
) => {
  // FIX: same .single() issue as above — a non-matching id used to throw
  // the opaque Postgrest error before the `if (!data)` check below ever
  // got a chance to run.
  const { data, error } = await supabaseAdmin
    .from("threats")
    .update({ status: payload.status })
    .eq("id", id)
    .eq("clerk_id", clerkId)
    .select()
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Threat not found or access denied");

  return data;
};

// ── AI threat analysis via Gemini ────────────────────────────────────────────

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const analyzeThreatService = async (
  id: string,
  clerkId: string
): Promise<ThreatAnalysis> => {
  // 1. Fetch the threat row
  const threat = await getThreatByIdService(id, clerkId);

  // FIX: getThreatByIdService can now return null instead of throwing —
  // handle that here so we don't crash on threat.threat_type below.
  if (!threat) {
    throw new Error("Threat not found or access denied");
  }

  // 2. Build Gemini prompt
  const prompt = `
You are a senior cybersecurity analyst. Analyze the following threat and return ONLY a JSON object — no markdown, no backticks, no preamble.

Threat Data:
- Type: ${threat.threat_type}
- Severity: ${threat.severity}
- Status: ${threat.status}
- Source IP: ${threat.ip_address || "Unknown"}
- Country: ${threat.country || "Unknown"}
- Device/Host: ${threat.device || "Unknown"}
- Domain: ${threat.domain || "Unknown"}
- Detected At: ${threat.created_at}

Return this exact JSON structure:
{
  "threatName": "specific threat name (e.g. LockBit 3.0, Emotet.Gen)",
  "riskLevel": "Critical|High|Medium|Low",
  "summary": "2-3 sentence technical summary of this threat",
  "attackVector": "how this threat likely entered or operates",
  "indicators": ["IOC 1", "IOC 2", "IOC 3", "IOC 4"],
  "immediateActions": ["action 1", "action 2", "action 3"],
  "longTermRemediation": ["step 1", "step 2", "step 3"],
  "affectedSystems": ["system 1", "system 2"],
  "confidence": 85
}
`;

  // 3. Call Gemini
  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  const text = result.text ?? "";

  // 4. Parse response (strip any accidental fences)
  const clean = text.replace(/```json|```/g, "").trim();
  const analysis: ThreatAnalysis = JSON.parse(clean);

  return analysis;
};
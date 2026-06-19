import { Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase";

export async function createContactSubmission(req: Request, res: Response) {
  try {
    const { name, organization, inquiry_type, message, website } = req.body;

    // Honeypot field — real visitors never see or fill this input
    // (it's visually hidden in the frontend). Bots that auto-fill every
    // field on a form will fill this one too, which is how we catch them.
    if (website) {
      console.warn(
        "[contact.createContactSubmission] honeypot triggered, ip:",
        req.ip
      );
      // Return a normal success response so the bot doesn't learn it was caught.
      return res.status(200).json({ success: true });
    }

    if (!name || !organization || !message) {
      return res
        .status(400)
        .json({ error: "name, organization and message are required" });
    }

    if (typeof message === "string" && message.length > 5000) {
      return res.status(400).json({ error: "message is too long" });
    }

    const { data, error } = await supabaseAdmin
      .from("contact_submissions")
      .insert({
        operator_name: name,
        organization,
        inquiry_type: inquiry_type ?? "Technical Diagnostics",
        message,
        ip_address: req.ip,
        user_agent: req.get("user-agent") ?? null,
      })
      .select("id")
      .single();

    if (error) return res.status(500).json({ error: error.message });

    return res.status(201).json({ success: true, submission: data });
  } catch (err) {
    console.error("[contact.createContactSubmission]", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
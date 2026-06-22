import { Router, Request, Response } from "express";
import { Webhook } from "svix";
import { createClient } from "@supabase/supabase-js";

const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

router.post(
  "/webhooks/clerk",
  async (req: Request, res: Response) => {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    if (!WEBHOOK_SECRET) {
      return res.status(500).json({ success: false, message: "Webhook secret not configured" });
    }

    const svix_id = req.headers["svix-id"] as string;
    const svix_timestamp = req.headers["svix-timestamp"] as string;
    const svix_signature = req.headers["svix-signature"] as string;

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return res.status(400).json({ success: false, message: "Missing svix headers" });
    }

    let payload: any;
    try {
      const wh = new Webhook(WEBHOOK_SECRET);
      payload = wh.verify(JSON.stringify(req.body), {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: "Invalid webhook signature" });
    }

    const { type, data } = payload;

    try {
      if (type === "user.created") {
        const { id, email_addresses, first_name, last_name } = data;
        const email = email_addresses?.[0]?.email_address ?? null;

        const { error } = await supabase.from("users").upsert(
          {
            clerk_id: id,
            email,
            first_name: first_name ?? null,
            last_name: last_name ?? null,
            plan: "free",
            created_at: new Date().toISOString(),
          },
          { onConflict: "clerk_id" }
        );

        if (error) {
          console.error("Supabase upsert error:", error);
          return res.status(500).json({ success: false, message: "DB error" });
        }
      }

      if (type === "user.updated") {
        const { id, email_addresses, first_name, last_name } = data;
        const email = email_addresses?.[0]?.email_address ?? null;

        await supabase
          .from("users")
          .update({ email, first_name, last_name })
          .eq("clerk_id", id);
      }

if (type === "user.deleted") {
  const { id } = data;
  await supabase.from("subscriptions").delete().eq("clerk_id", id);
  await supabase.from("users").delete().eq("clerk_id", id);
}

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("Webhook handler error:", err);
      return res.status(500).json({ success: false, message: "Internal error" });
    }
  }
);

export default router;
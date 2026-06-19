import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { supabaseAdmin } from "../config/supabase";

export async function getNotifications(req: Request, res: Response) {
  try {
    const { userId } = getAuth(req);

    const { data, error } = await supabaseAdmin
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return res.status(500).json({ error: error.message });

    const unreadCount = (data ?? []).filter((n) => !n.read).length;
    return res.json({ notifications: data ?? [], unreadCount });
  } catch (err) {
    console.error("[notifications.getNotifications]", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function createNotification(req: Request, res: Response) {
  try {
    const { userId } = getAuth(req);
    const { title, description, type = "info" } = req.body;
    if (!title) return res.status(400).json({ error: "title required" });

    const { data, error } = await supabaseAdmin
      .from("notifications")
      .insert({ user_id: userId, title, description: description ?? null, type })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ notification: data });
  } catch (err) {
    console.error("[notifications.createNotification]", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function markAllRead(req: Request, res: Response) {
  try {
    const { userId } = getAuth(req);

    const { error } = await supabaseAdmin
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  } catch (err) {
    console.error("[notifications.markAllRead]", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function deleteNotification(req: Request, res: Response) {
  try {
    const { userId } = getAuth(req);
    const { id } = req.query;

    let query = supabaseAdmin.from("notifications").delete().eq("user_id", userId);
    if (id) query = query.eq("id", id as string);

    const { error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  } catch (err) {
    console.error("[notifications.deleteNotification]", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
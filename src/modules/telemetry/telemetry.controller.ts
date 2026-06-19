import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { getTelemetryService } from "./telemetry.service";

export const getTelemetry = async (req: Request, res: Response) => {
  try {
    const { userId: clerkId } = getAuth(req);

    if (!clerkId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const data = await getTelemetryService(clerkId);
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error("GET /telemetry error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
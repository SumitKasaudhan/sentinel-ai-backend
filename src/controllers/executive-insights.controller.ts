import { Request, Response } from "express";
import { generateExecutiveInsights } from "../services/executive-insights.service";

export const getExecutiveInsights = async (
  req: Request,
  res: Response
) => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    const result = await generateExecutiveInsights(
      id
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error("Executive Insights Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate executive insights",
    });
  }
};
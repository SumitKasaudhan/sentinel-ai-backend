import { Request, Response }
from "express";

import {
  getRiskHeatmap,
}
from "../services/risk-heatmap.service";

export const getHeatmap =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const { id: rawId } =
        req.params;

      const id = Array.isArray(rawId) ? rawId[0] : rawId;

      const result =
        await getRiskHeatmap(id);

      return res.json({
        success: true,
        ...result,
      });

    } catch (
      error: any
    ) {

      return res
        .status(500)
        .json({
          success: false,
          message:
            error.message,
        });

    }
  };
import { Request, Response }
from "express";

import {
  getScoreBreakdown,
}
from "../services/security-score.service";

export const getSecurityScore =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const { id: rawId } =
        req.params;

      const id = Array.isArray(rawId) ? rawId[0] : rawId;

      const result =
        await getScoreBreakdown(id);

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
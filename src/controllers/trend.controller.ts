import { Request, Response }
from "express";

import validator from "validator";

import {
  getTrendHistory,
} from "../services/trend.service";

export const getScanTrend =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const { id: rawId } =
        req.params;

      const id = Array.isArray(rawId) ? rawId[0] : rawId;

      if (
        !validator.isUUID(id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid scan id",
        });
      }

      const trend =
        await getTrendHistory(
          id
        );

      return res.status(200).json({
        success: true,
        ...trend,
      });

    } catch (error: any) {

      console.error(
        "TREND ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message,
      });

    }

  };
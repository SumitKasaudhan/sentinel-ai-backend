import { Request, Response }
from "express";

import validator from "validator";

import {
  compareScans,
} from "../services/scan-comparison.service";

export const getScanComparison =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const { id: rawId } = req.params;
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

      const comparison =
        await compareScans(id);

      return res.status(200).json({
        success: true,
        ...comparison,
      });

    } catch (error: any) {

      console.error(
        "COMPARE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message,
      });

    }

  };
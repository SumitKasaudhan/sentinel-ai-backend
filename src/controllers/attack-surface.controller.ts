import { Request, Response }
from "express";

import {
  getAttackSurface
}
from "../services/attack-surface.service";

export const getAttackSurfaceController =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const { id: rawId } =
        req.params;

      const id = Array.isArray(rawId) ? rawId[0] : rawId;

      const result =
        await getAttackSurface(id);

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
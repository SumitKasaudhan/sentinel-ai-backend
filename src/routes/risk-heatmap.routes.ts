import { Router }
from "express";

import {
  getHeatmap,
}
from "../controllers/risk-heatmap.controller";

const router =
  Router();

router.get(
  "/:id/risk-heatmap",
  getHeatmap
);

export default router;
import { Router }
from "express";

import {
  getScanTrend,
} from "../controllers/trend.controller";

const router = Router();

router.get(
  "/:id/trends",
  getScanTrend
);

export default router;
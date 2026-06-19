import { Router }
from "express";

import {
  getScanComparison,
} from "../controllers/scan-comparison.controller";

const router = Router();

router.get(
  "/:id/compare",
  getScanComparison
);

export default router;
import { Router }
from "express";

import {
  getSecurityScore,
}
from "../controllers/security-score.controller";

const router =
  Router();

router.get(
  "/:id/score-breakdown",
  getSecurityScore
);

export default router;
import { Router }
from "express";

import {
  getRoadmap
}
from "../controllers/remediation-roadmap.controller";

const router =
  Router();

router.get(
  "/:id/remediation-roadmap",
  getRoadmap
);

export default router;
import { Router }
from "express";

import {
  getAttackSurfaceController
}
from "../controllers/attack-surface.controller";

const router =
  Router();

router.get(
  "/:id/attack-surface",
  getAttackSurfaceController
);

export default router;
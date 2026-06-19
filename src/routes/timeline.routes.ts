import { Router } from "express";

import {
  getTimeline,
} from "../controllers/timeline.controller";

const router = Router();

router.get(
  "/:id/timeline",
  getTimeline
);

export default router;
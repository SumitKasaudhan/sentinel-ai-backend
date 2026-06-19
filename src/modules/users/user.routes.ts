import { Router } from "express";

import requireAuth from "../../middleware/auth.middleware";

import { getProfile } from "./user.controller";

const router = Router();

router.get(
  "/profile",
  requireAuth,
  getProfile
);

export default router;
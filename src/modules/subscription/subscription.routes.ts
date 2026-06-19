import { Router } from "express";

import requireAuth from "../../middleware/auth.middleware";

import requireProPlan
from "../../middleware/subscription.middleware";

import { getStatus, createCheckout } from "./subscription.controller";

const router = Router();

router.get(
  "/status",
  requireAuth,
  getStatus
);

router.post(
  "/create-checkout",
  requireAuth,
  createCheckout
);

router.get(
  "/pro-feature",
  requireAuth,
  requireProPlan,
  async (_req, res) => {
    return res.status(200).json({
      success: true,
      message:
        "Welcome to Pro Feature",
    });
  }
);

export default router;
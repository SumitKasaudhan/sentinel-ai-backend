import { Router } from "express";
import requireAuth from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/me",
  requireAuth,
  async (req: any, res) => {
    try {
      const auth = req.auth();

      return res.status(200).json({
        success: true,
        userId: auth.userId,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  }
);

export default router;
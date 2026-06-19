import { Router } from "express";
import requireAuth from "../middleware/auth.middleware";
import {
  getNotifications,
  createNotification,
  markAllRead,
  deleteNotification,
} from "../controllers/notifications.controller";

const router = Router();

router.use(requireAuth);

router.get("/", getNotifications);
router.post("/", createNotification);
router.patch("/", markAllRead);
router.delete("/", deleteNotification);

export default router;
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { createContactSubmission } from "../controllers/contact.controller";

const router = Router();

// Dedicated limiter for this route. Runs in every environment (not just
// production like the global limiter in app.ts), because this endpoint
// has no auth layer to fall back on — anyone on the internet can hit it.
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 submissions per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many submissions. Please try again later." },
});

router.post("/", contactLimiter, createContactSubmission);

export default router;
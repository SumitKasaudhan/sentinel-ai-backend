import { Router } from "express";
import { validateDomain } from "../controllers/domain-validation.controller";

const router = Router();

router.post("/validate-domain", validateDomain);

export default router;
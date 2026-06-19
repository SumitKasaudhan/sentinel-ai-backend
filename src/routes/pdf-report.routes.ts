import { Router }
from "express";

import {
  exportPdfReport,
}
from "../controllers/pdf-report.controller";

const router =
  Router();

router.get(
  "/:id/export-pdf",
  exportPdfReport
);

export default router;
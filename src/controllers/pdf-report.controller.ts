import {
  Request,
  Response,
} from "express";

import {
  generatePdfReport,
} from "../services/pdf-report.service";

export const exportPdfReport =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const { id: rawId } =
        req.params;

      const id = Array.isArray(rawId) ? rawId[0] : rawId;

      const pdfBuffer =
        await generatePdfReport(
          id
        );

      res.setHeader(
        "Content-Type",
        "application/pdf"
      );

      res.setHeader(
        "Content-Disposition",
        `attachment; filename=sentinel-report-${id}.pdf`
      );

      return res.send(
        pdfBuffer
      );

    } catch (
      error: any
    ) {

      return res
        .status(500)
        .json({
          success: false,
          message:
            error.message,
        });

    }

  };
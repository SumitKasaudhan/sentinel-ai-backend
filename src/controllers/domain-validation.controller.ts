import { Request, Response } from "express";
import { DomainValidationService } from "../services/domain-validation.service";

export const validateDomain = async (
  req: Request,
  res: Response
) => {
  try {
    const { domain } = req.body;

    if (!domain) {
      return res.status(400).json({
        valid: false,
        message: "Domain is required"
      });
    }

    const result =
      await DomainValidationService.validateDomain(domain);

    return res.status(result.valid ? 200 : 400).json(result);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      valid: false,
      message: "Internal server error"
    });
  }
};
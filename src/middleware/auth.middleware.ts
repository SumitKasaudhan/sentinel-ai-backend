import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";

export default function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const auth = getAuth(req);

  if (!auth?.userId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  next();
}
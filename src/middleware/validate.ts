// FILE: src/middleware/validate.ts (NEW FILE)
//
// Your package.json already has `zod` and `validator` installed but I
// couldn't see if input validation is wired up on your routes (e.g. the
// scan-target submission endpoint). This is a critical gap for a security
// scanning product — if "target URL" input isn't validated server-side,
// it's vulnerable to SSRF (server-side request forgery): an attacker could
// submit "http://169.254.169.254/" or "http://localhost:6379" as a "target"
// and trick YOUR server into scanning its own internal network/cloud metadata.

import { z } from 'zod'
import validator from 'validator'
import type { Request, Response, NextFunction } from 'express'

// ────────────────────────────────────────────────────────
// Schema for scan target submission — adjust field names to match yours
// ────────────────────────────────────────────────────────
export const scanTargetSchema = z.object({
  target: z.string().url().refine((url) => {
    // Block private/internal IP ranges to prevent SSRF
    const hostname = new URL(url).hostname
    const isPrivate =
      hostname === 'localhost' ||
      hostname.startsWith('127.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('169.254.') ||           // cloud metadata endpoint
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname) ||
      hostname === '0.0.0.0' ||
      hostname.endsWith('.internal')
    return !isPrivate
  }, { message: 'Scanning private/internal network addresses is not permitted.' }),
})

// ────────────────────────────────────────────────────────
// Generic validation middleware factory
// ────────────────────────────────────────────────────────
export function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.flatten().fieldErrors,
      })
    }
    req.body = result.data
    next()
  }
}

// ────────────────────────────────────────────────────────
// Email validation helper (using `validator`, already in your deps)
// ────────────────────────────────────────────────────────
export function isValidEmail(email: string): boolean {
  return validator.isEmail(email)
}

// ────────────────────────────────────────────────────────
// USAGE in your routes:
//
//   import { validateBody, scanTargetSchema } from './middleware/validate'
//
//   app.post('/api/scan', strictRateLimit, validateBody(scanTargetSchema), scanController)
//
// This blocks SSRF attempts before they ever reach your scan logic.
// ────────────────────────────────────────────────────────
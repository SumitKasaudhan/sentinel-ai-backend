import { z } from 'zod'
import validator from 'validator'
import type { Request, Response, NextFunction } from 'express'

export const scanTargetSchema = z.object({
  target: z
    .string()
    .transform((val) => {
      // Auto-add https:// if missing
      if (!val.startsWith('http://') && !val.startsWith('https://')) {
        return `https://${val}`;
      }
      return val;
    })
    .pipe(
      z.string().url().refine((url) => {
        // Block private/internal IP ranges to prevent SSRF
        const hostname = new URL(url).hostname
        const isPrivate =
          hostname === 'localhost' ||
          hostname.startsWith('127.') ||
          hostname.startsWith('10.') ||
          hostname.startsWith('192.168.') ||
          hostname.startsWith('169.254.') ||
          /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname) ||
          hostname === '0.0.0.0' ||
          hostname.endsWith('.internal')
        return !isPrivate
      }, { message: 'Scanning private/internal network addresses is not permitted.' })
    ),
})

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

export function isValidEmail(email: string): boolean {
  return validator.isEmail(email)
}
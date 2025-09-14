import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export function withValidation<T>(
  schema: z.ZodSchema<T>,
  handler: (request: NextRequest, validatedData: T) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      const body = await request.json()
      
      const validation = schema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { 
            error: 'Invalid input data',
            details: validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
          },
          { status: 400 }
        )
      }

      return await handler(request, validation.data)
    } catch (error) {
      if (error instanceof SyntaxError) {
        return NextResponse.json(
          { error: 'Invalid JSON format' },
          { status: 400 }
        )
      }
      
      console.error('API validation error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

// Rate limiting helper
const requestCounts = new Map<string, { count: number; resetTime: number }>()

export function withRateLimit(
  maxRequests: number = 10,
  windowMs: number = 60000, // 1 minute
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    const now = Date.now()
    
    const userRequests = requestCounts.get(ip)
    
    if (!userRequests || now > userRequests.resetTime) {
      requestCounts.set(ip, { count: 1, resetTime: now + windowMs })
      return await handler(request)
    }
    
    if (userRequests.count >= maxRequests) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }
    
    userRequests.count++
    return await handler(request)
  }
}

// Input sanitization
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
}

// Common validation schemas
export const commonSchemas = {
  email: z.string().email().max(254),
  name: z.string().min(1).max(100),
  message: z.string().min(1).max(5000),
  id: z.number().positive(),
  uuid: z.string().uuid(),
}

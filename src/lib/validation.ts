import { z } from 'zod'

// Assessment validation
export const assessmentSchema = z.object({
  responses: z.record(z.number().min(1).max(10)),
  assessment_type: z.enum(['virtue', 'character']),
})

// Feedback validation
export const feedbackSchema = z.object({
  name: z.string().max(100).optional(),
  show_name: z.boolean(),
  testing_time: z.string().min(1),
  completed_assessment: z.string().min(1),
  overall_ux: z.number().min(1).max(5).optional(),
  ai_relevance: z.number().min(1).max(5).optional(),
  likely_to_use: z.number().min(1).max(5).optional(),
  biggest_missing: z.string().max(1000).optional(),
  additional_feedback: z.string().max(2000).optional(),
  technical_issues: z.array(z.string()).optional(),
})

// Journal validation
export const journalSchema = z.object({
  content: z.string().min(1).max(10000),
  mood: z.enum(['great', 'good', 'okay', 'difficult', 'struggling']).optional(),
})

// Memo validation
export const memoSchema = z.object({
  memo_text: z.string().max(50000),
  stage_number: z.number().min(1).max(3),
  virtue_id: z.number().min(1),
})

// Support ticket validation
export const supportTicketSchema = z.object({
  subject: z.string().min(1).max(200),
  message: z.string().min(10).max(5000),
})

// Chat message validation
export const chatMessageSchema = z.object({
  message_text: z.string().min(1).max(2000),
  connection_id: z.number().min(1),
})

// Validation helper
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const result = schema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      }
    }
    return { success: false, errors: ['Invalid input'] }
  }
}

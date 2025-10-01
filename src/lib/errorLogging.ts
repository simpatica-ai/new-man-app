import { supabase } from '@/lib/supabaseClient'

export interface ErrorLog {
  id?: number
  error_message: string
  error_code?: string
  context: string
  user_id?: string
  user_agent?: string
  url?: string
  stack_trace?: string
  created_at?: string
}

export async function logError(
  error: unknown,
  context: string,
  userId?: string,
  additionalData?: Record<string, unknown>
) {
  try {
    const errorLog: Omit<ErrorLog, 'id' | 'created_at'> = {
      error_message: error instanceof Error ? error.message : String(error),
      error_code: (error as { code?: string })?.code || 'UNKNOWN',
      context,
      user_id: userId,
      user_agent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      stack_trace: error instanceof Error ? error.stack : undefined,
      ...additionalData
    }

    await supabase.from('error_logs').insert(errorLog)
  } catch (logError) {
    // Fallback to console if database logging fails
    console.error('Failed to log error to database:', logError)
    console.error('Original error:', error)
  }
}

export async function getErrorStats(days = 7) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await supabase
    .from('error_logs')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getErrorSummary(days = 7) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await supabase
    .rpc('get_error_summary', { days_back: days })

  if (error) {
    // Fallback query if RPC doesn't exist
    const { data: fallbackData } = await supabase
      .from('error_logs')
      .select('context, error_code, error_message')
      .gte('created_at', startDate.toISOString())

    // Group by context and error_code
    const summary = (fallbackData || []).reduce((acc: Record<string, { context: string; error_code: string; error_message: string; count: number }>, log) => {
      const key = `${log.context}:${log.error_code}`
      if (!acc[key]) {
        acc[key] = {
          context: log.context,
          error_code: log.error_code,
          error_message: log.error_message,
          count: 0
        }
      }
      acc[key].count++
      return acc
    }, {})

    return Object.values(summary)
  }

  return data || []
}

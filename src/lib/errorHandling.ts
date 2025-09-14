import { addToast } from '@/components/Toast'
import { logError } from '@/lib/errorLogging'

export interface AppError {
  message: string
  code?: string
  details?: any
}

export function createError(message: string, code?: string, details?: any): AppError {
  return { message, code, details }
}

export function handleError(error: unknown, context?: string, userId?: string): AppError {
  console.error(`Error in ${context || 'unknown context'}:`, error)
  
  // Log error to database
  if (context) {
    logError(error, context, userId).catch(console.error)
  }
  
  // Supabase errors
  if (error && typeof error === 'object' && 'message' in error) {
    const supabaseError = error as any
    
    if (supabaseError.code === '23505') {
      return createError('This record already exists', 'DUPLICATE_RECORD')
    }
    
    if (supabaseError.code === 'PGRST116') {
      return createError('No data found', 'NOT_FOUND')
    }
    
    if (supabaseError.message) {
      return createError(supabaseError.message, supabaseError.code)
    }
  }
  
  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return createError('Network connection failed. Please check your internet connection.', 'NETWORK_ERROR')
  }
  
  // Generic error
  if (error instanceof Error) {
    return createError(error.message, 'GENERIC_ERROR')
  }
  
  return createError('An unexpected error occurred', 'UNKNOWN_ERROR')
}

export function showErrorToast(error: unknown, context?: string, userId?: string) {
  const appError = handleError(error, context, userId)
  addToast('error', appError.message)
}

export function showSuccessToast(message: string) {
  addToast('success', message)
}

export function showWarningToast(message: string) {
  addToast('warning', message)
}

export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string,
  showToast = true,
  userId?: string
): Promise<T | null> {
  try {
    return await operation()
  } catch (error) {
    if (showToast) {
      showErrorToast(error, context, userId)
    } else {
      handleError(error, context, userId)
    }
    return null
  }
}

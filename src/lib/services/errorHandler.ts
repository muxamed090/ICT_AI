import { ActionResult } from './types'

export function handleActionError<T>(error: unknown): ActionResult<T> {
  console.error("Action execution error:", error)

  if (error instanceof Error) {
    const err = error as unknown as Record<string, unknown>
    if (err.code && typeof err.code === 'string') {
      return {
        success: false,
        error: {
          type: 'database',
          message: typeof err.message === 'string' ? err.message : 'A database validation constraint failed.',
          details: err
        }
      }
    }

    return {
      success: false,
      error: {
        type: 'unexpected',
        message: error.message,
      }
    }
  }

  return {
    success: false,
    error: {
      type: 'unexpected',
      message: typeof error === 'string' ? error : 'An unexpected error occurred.'
    }
  }
}

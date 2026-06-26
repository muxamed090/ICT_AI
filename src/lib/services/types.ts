export interface ActionResult<T> {
  success: boolean
  data?: T
  error?: {
    type: 'database' | 'validation' | 'auth' | 'unexpected'
    message: string
    details?: unknown
  }
}

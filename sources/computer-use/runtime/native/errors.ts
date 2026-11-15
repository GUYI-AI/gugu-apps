// Retained native transport error contract; no dependency on the host's mac helper.
export class NativeCallError extends Error {
  readonly code: string
  readonly details?: unknown
  constructor(code: string, message: string, details?: unknown) {
    super(message)
    this.code = code
    this.details = details
    this.name = 'NativeCallError'
  }
}

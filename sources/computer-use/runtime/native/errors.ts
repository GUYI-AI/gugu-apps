// Retained native transport error contract; no dependency on the host's mac helper.
export class NativeCallError extends Error {
  constructor(readonly code: string, message: string, readonly details?: unknown) {
    super(message)
    this.name = 'NativeCallError'
  }
}

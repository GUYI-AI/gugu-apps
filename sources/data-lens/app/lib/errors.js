/** A message a person or an agent can act on, with a stable code for the page to branch on. */
export class DataError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

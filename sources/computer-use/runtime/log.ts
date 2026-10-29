/** Program diagnostics go to stderr; stdout is reserved for MCP. */
export function programLogger(component: string) {
  const write = (fields: Record<string, unknown>, message: string) => {
    process.stderr.write(JSON.stringify({ component, message, ...fields }) + '\n')
  }
  return { info: write, warn: write }
}

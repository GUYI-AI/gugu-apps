/** A name as SQL reads it: "double quoted", quotes doubled. */
export function quote(identifier) {
  return `"${String(identifier).replaceAll('"', '""')}"`
}

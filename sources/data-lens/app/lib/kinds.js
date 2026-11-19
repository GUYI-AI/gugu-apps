// Which files Data Lens reads, by name — apart from engine.js so a page can ask without loading the engine.
const KINDS = { sqlite: ['.sqlite', '.sqlite3', '.db'], workbook: ['.xlsx', '.xlsm', '.xls', '.ods'], csv: ['.csv', '.tsv'] }

export const SUFFIXES = Object.values(KINDS).flat()

/** 'sqlite' | 'workbook' | 'csv' | null, by the file's name. */
export function kindOf(name) {
  const lower = String(name ?? '').toLowerCase()
  for (const [kind, suffixes] of Object.entries(KINDS)) if (suffixes.some((s) => lower.endsWith(s))) return kind
  return null
}

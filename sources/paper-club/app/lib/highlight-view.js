// Presentation of the existing notes and chat references; it writes neither source.
export function highlightView(data, discussed, userId, filter = 'all') {
  const comments = new Map()
  for (const comment of Object.values(data?.comments ?? {})) {
    const thread = comments.get(comment.on) ?? []
    thread.push(comment)
    comments.set(comment.on, thread)
  }
  const rows = Object.entries(data?.highlights ?? {})
    .sort(([, a], [, b]) => a.page - b.page || (a.rects?.[0]?.[1] ?? 0) - (b.rects?.[0]?.[1] ?? 0))
    .map(([id, highlight]) => ({
      id, highlight,
      comments: (comments.get(id) ?? []).sort((a, b) => String(a.at).localeCompare(String(b.at))),
      messages: discussed.get(id) ?? [],
    }))
  const matches = {
    all: () => true,
    mine: ({ highlight }) => Boolean(userId) && highlight.by === userId,
    discussed: ({ comments, messages }) => comments.length > 0 || messages.length > 0,
  }
  const counts = Object.fromEntries(Object.entries(matches).map(([key, match]) => [key, rows.filter(match).length]))
  return { rows: rows.filter(matches[filter]), counts }
}

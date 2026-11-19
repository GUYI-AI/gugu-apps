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

/** A card's one discussion count, at the end of its meta line: how often the chat cited it, and — while the card is
 * folded — how many comments it holds (an open card shows the comments themselves). */
export function discussionLabel({ messages = 0, comments = 0, selected = false }, t, fmt) {
  const parts = []
  if (messages) parts.push(fmt(t.discussed, { n: messages }))
  if (comments && !selected) parts.push(fmt(t.commentCount, { n: comments }))
  return parts.join(' · ')
}

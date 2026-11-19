// App-owned geometry migrated from gugu@6886d91538 (final #1606 behavior).
export interface Bounds { x: number; y: number; width: number; height: number }
export const COMPUTER_HEAD_WIDTH = 236
export const COMPUTER_HEAD_HEIGHT = 44
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

/** Never use array order to choose between an App's several visible windows. */
export function resolveComputerWindow(data: unknown, target: { pid: number; windowId?: number }): { windowId: number; bounds: Bounds } | null {
  if (!record(data) || !Array.isArray(data.windows)) return null
  const windows = data.windows.filter((w): w is Record<string, unknown> => record(w)
    && w.pid === target.pid && w.is_on_screen === true && w.on_current_space !== false
    && (target.windowId !== undefined ? w.window_id === target.windowId : (w.layer ?? 0) === 0))
  if (windows.length !== 1) return null
  const windowId = windows[0]?.window_id, bounds = windows[0]?.bounds
  if (!finite(windowId) || !Number.isSafeInteger(windowId) || windowId <= 0) return null
  if (!record(bounds) || !finite(bounds.x) || !finite(bounds.y) || !finite(bounds.width) || !finite(bounds.height)
    || bounds.width <= 0 || bounds.height <= 0) return null
  return { windowId, bounds: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height } }
}

export function computerBarBounds(target: Bounds, area: Bounds): Bounds | null {
  const left = Math.max(target.x, area.x), top = Math.max(target.y, area.y)
  const right = Math.min(target.x + target.width, area.x + area.width)
  const bottom = Math.min(target.y + target.height, area.y + area.height)
  const width = Math.min(COMPUTER_HEAD_WIDTH, Math.floor(right - left - 16)), height = COMPUTER_HEAD_HEIGHT
  if (width < 120 || bottom - top < height) return null
  const y = target.y - height + 1 >= area.y ? Math.round(target.y - height + 1) : Math.ceil(top)
  return { x: Math.round(Math.max(left + 8, Math.min(right - width - 8, left + (right - left) * .44 - width / 2))), y, width, height }
}

// Migrated from computer.ts: per-owner snapshot and window identity tracking.
import { str, type Args } from './types'
const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const targetPid = (args: Args): number | undefined => isRecord(args.target) && isNum(args.target.pid) ? args.target.pid : isNum(args.pid) ? args.pid : undefined
export function createAppDirectory() {
  const described = new Map<number, string>()
  const windowNames = new Map<number, string>()
  const titles = new Map<number, string>()
  const fileNames = new Map<number, string>()
  const listed = new Map<number, string>()
  const snapshots = new Map<string, { pid: number; windowId?: number }>()
  const askedWindows = new Set<number>()
  const askedDescription = new Set<number>()
  const isFileName = (name: string) => /\.exe$/i.test(name)
  const learnOne = (entry: unknown) => {
    if (!isRecord(entry) || !isNum(entry.pid)) return
    if (typeof entry.app_name === 'string' && entry.app_name) (isFileName(entry.app_name) ? fileNames : windowNames).set(entry.pid, entry.app_name)
    if (typeof entry.title === 'string' && entry.title.trim() && !titles.has(entry.pid)) titles.set(entry.pid, entry.title.trim())
    if (typeof entry.name === 'string' && entry.name && !listed.has(entry.pid)) listed.set(entry.pid, entry.name)
  }
  const once = (asked: Set<number>, pid: number) => {
    if (asked.has(pid)) return false
    asked.add(pid)
    return true
  }
  return {
    pidOf(session: string, args: Args): number | undefined {
      const pid = targetPid(args)
      if (pid !== undefined) return pid
      const token = typeof args.element_token === 'string' ? args.element_token : ''
      const snapshot = token.includes(':') ? token.slice(0, token.lastIndexOf(':')) : ''
      return snapshot ? snapshots.get(`${session}|${snapshot}`)?.pid : undefined
    },
    windowOf(session: string, args: Args): number | undefined {
      const target = isRecord(args.target) ? args.target : args
      if (isNum(target.window_id)) return target.window_id
      const token = typeof args.element_token === 'string' ? args.element_token : ''
      const snapshot = token.includes(':') ? token.slice(0, token.lastIndexOf(':')) : ''
      const known = snapshots.get(`${session}|${snapshot}`)
      return known && (targetPid(args) === undefined || targetPid(args) === known.pid) ? known.windowId : undefined
    },
    nameOf: (pid: number) => described.get(pid) ?? windowNames.get(pid) ?? titles.get(pid) ?? fileNames.get(pid) ?? listed.get(pid),
    /** 还没从窗口上读到过系统语言的名字、也还没问过:该问 cua 一次它的窗口(顺带拿到窗口标题)。 */
    shouldAskWindows: (pid: number) => !described.has(pid) && !windowNames.has(pid) && once(askedWindows, pid),
    /** Windows:还没读过这个进程 exe 的 FileDescription。 */
    shouldAskDescription: (pid: number) => !described.has(pid) && once(askedDescription, pid),
    describe(pid: number, description: string) {
      if (description) described.set(pid, description)
    },
    learn(session: string, data: unknown, args: Args = {}) {
      if (!isRecord(data)) return
      const pid = isNum(data.pid) ? data.pid : targetPid(args)
      const target = isRecord(args.target) ? args.target : args
      const windowId = isNum(data.window_id) ? data.window_id : isNum(target.window_id) ? target.window_id : undefined
      if (pid !== undefined && typeof data.snapshot_id === 'string') snapshots.set(`${session}|${data.snapshot_id}`, { pid, ...(windowId !== undefined ? { windowId } : {}) })
      learnOne(data)
      for (const list of [data.windows, data.apps]) if (Array.isArray(list)) list.forEach(learnOne)
    },
  }
}
type AppDirectory = ReturnType<typeof createAppDirectory>

/** Windows:这个进程 exe 版本信息里的 FileDescription(系统语言的 App 名,资源管理器里看到的就是它)。读不到回空串。 */

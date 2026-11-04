import type { AppDirectory } from './app-directory'
import type { ComputerControl } from './control'
import type { CuaClient } from './native/cua-client'
import { resolveComputerWindow } from './placement'
import { stepsOf } from './policy'
import type { Args } from './types'

const record = (v: unknown): v is Args => !!v && typeof v === 'object' && !Array.isArray(v)
const number = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const lower = (v: unknown) => typeof v === 'string' ? v.trim().toLowerCase() : ''
type Target = { pid?: number; windowId?: number; stopped?: string }

/** Final #1606 target semantics: identify input independently of bar placement. */
export async function resolveCallTargets(input: {
  name: string; args: Args; owner: string; apps: AppDirectory; control?: ComputerControl
  native: CuaClient; signal?: AbortSignal
}) {
  const launching = input.name === 'launch_app'
  const named = new Map<string, Promise<Target>>()
  const targetOf = async (args: Args): Promise<Target> => {
    const explicit = record(args.target) && number(args.target.pid) ? args.target.pid : number(args.pid) ? args.pid : undefined
    if (!launching && input.control && lower(args.app) && explicit === undefined && typeof args.element_token !== 'string') {
      const key = JSON.stringify([args.app, args.window])
      let pending = named.get(key)
      if (!pending) {
        pending = (async () => {
          const options = { signal: input.signal, timeoutMs: 5_000, lane: input.owner }
          try {
            const listed = await input.native.callTool('list_windows', { app: args.app, on_screen_only: true }, options)
            const raw = listed.structuredContent
            if (!listed.isError && record(raw) && Array.isArray(raw.windows)) {
              const data = { ...raw, windows: raw.windows.filter(w => !lower(args.window) || (record(w) && lower(w.title).includes(lower(args.window)))) }
              const pids = new Set(data.windows.flatMap(w => record(w) && number(w.pid) && w.pid > 0 ? [w.pid] : []))
              if (pids.size === 1) {
                const pid = [...pids][0]!
                input.apps.learn(input.owner, data, args)
                const window = resolveComputerWindow(data, { pid, ...(number(args.window_id) ? { windowId: args.window_id } : {}) })
                return { pid, ...(window ? { windowId: window.windowId } : {}) }
              }
            }
          } catch { /* An unavailable window is not permission to ignore a Stop. */ }
          try {
            const listed = await input.native.callTool('list_apps', {}, options)
            const raw = listed.structuredContent
            if (!listed.isError && record(raw) && Array.isArray(raw.apps)) {
              const matched = raw.apps.filter(app => record(app) && [app.name, app.app_name, app.bundle_id].some(name => lower(name) === lower(args.app)))
              const pids = new Set(matched.flatMap(app => record(app) && number(app.pid) && app.pid > 0 ? [app.pid] : []))
              if (pids.size === 1) {
                const pid = [...pids][0]!
                input.apps.learn(input.owner, { ...raw, pid, apps: matched }, args)
                return { pid }
              }
            }
          } catch { /* Unknown identity does not turn display failure into an input gate. */ }
          const known = input.apps.pidOf(input.owner, args)
          const stopped = known !== undefined ? input.control?.stoppedFor(known) : null
          return stopped ? { stopped } : {}
        })()
        named.set(key, pending)
      }
      return pending
    }
    return { pid: input.apps.pidOf(input.owner, args), windowId: input.apps.windowOf(input.owner, args) }
  }
  const targets = input.name === 'run_steps'
    ? await Promise.all(stepsOf(input.args).map(step => targetOf(
      ['target', 'pid', 'app', 'element_token'].some(key => step.args[key] !== undefined)
        ? step.args : { ...input.args, ...step.args })))
    : [await targetOf(input.args)]
  const first = targets[0]
  const app = first && targets.every(other => other.pid === first.pid) ? first : undefined
  return {
    pid: app?.pid ?? (launching ? input.apps.pidOf(input.owner, { app: input.args.name ?? input.args.bundle_id }) : undefined),
    windowId: app && targets.every(other => other.windowId === app.windowId) ? app.windowId : undefined,
    targetPids: [...new Set(targets.flatMap(target => target.pid !== undefined ? [target.pid] : []))],
    stopped: targets.find(target => target.stopped)?.stopped,
  }
}

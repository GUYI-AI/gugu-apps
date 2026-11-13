import type { AppDirectory } from './app-directory'
import type { CuaClient } from './native/cua-client'
import { stepsOf } from './policy'
import type { Args } from './types'

const record = (value: unknown): value is Args => !!value && typeof value === 'object' && !Array.isArray(value)
const lower = (value: unknown) => typeof value === 'string' ? value.toLowerCase() : ''
const pidNumber = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value > 0
const command = new Set(['cmd', 'command', 'meta', 'super', 'win'])
const modifiers = new Set([...command, 'shift', 'option', 'alt', 'ctrl', 'control', 'fn'])
const windowKeys = ['pid', 'window_id', 'app', 'window'] as const

function locationShortcut(name: string, args: Args): boolean {
  if (name !== 'hotkey' || lower(args.delivery_mode) === 'foreground' || !Array.isArray(args.keys)) return false
  const keys = args.keys.filter((key): key is string => typeof key === 'string').map(lower)
  // Match the driver's modifier split and last non-modifier, including duplicate command aliases.
  const held = keys.filter(key => modifiers.has(key))
  return keys.filter(key => !modifiers.has(key)).at(-1) === 'l' && held.length > 0 && held.every(key => command.has(key))
}

function windowSelector(args: Args): Args {
  const nested = record(args.target) ? args.target : {}
  return Object.fromEntries(windowKeys.flatMap(key => {
    const value = nested[key] ?? args[key]
    return value === undefined ? [] : [[key, value]]
  }))
}

function candidates(name: string, args: Args): Array<{ args: Args; step?: number }> {
  if (name !== 'run_steps') return locationShortcut(name, args) ? [{ args }] : []
  let context = windowSelector(args)
  const result: Array<{ args: Args; step?: number }> = []
  for (const [index, raw] of (Array.isArray(args.steps) ? args.steps : []).entries()) {
    if (!record(raw)) continue
    // The native batch inherits windows from wait_for, previous actions, and actionless expect checks.
    if (record(raw.wait_for)) {
      const selector = windowSelector(raw.wait_for)
      if (Object.keys(selector).length) context = selector
    }
    const action = stepsOf({ steps: [raw] })[0]
    if (action) {
      const selector = windowSelector(action.args)
      if (Object.keys(selector).length) context = selector
      const effective = { ...context, ...action.args, delivery_mode: action.args.delivery_mode ?? args.delivery_mode }
      if (locationShortcut(action.tool, effective)) result.push({ args: effective, step: index + 1 })
    } else {
      const checks = Array.isArray(raw.expect) ? raw.expect : [raw.expect]
      for (const check of checks.filter(record)) {
        const selector = windowSelector(check)
        if (Object.keys(selector).length) context = selector
      }
    }
  }
  return result
}

function chromiumBundle(bundle: string): boolean {
  // Use the running process's bundle identity, never a caller-supplied app name.
  // Keep the driver's Chromium identity tokens, plus browsers with distinct bundle names.
  return bundle.split(/[^a-z0-9]+/).some(part => ['chrome', 'chromium', 'brave', 'edgemac', 'vivaldi', 'opera', 'thorium'].includes(part))
    || ['company.thebrowser.browser', 'com.operasoftware.operagx', 'com.operasoftware.operanext', 'com.operasoftware.operadeveloper'].includes(bundle)
}

type Refusal = { code: string; message: string }
const unavailable = (): Refusal => ({ code: 'unavailable', message: 'The shortcut target could not be verified from the native process list. Read its window again before retrying.' })
const blocked = (): Refusal => ({ code: 'background_unavailable', message: 'Background Cmd+L is unavailable for this Chromium app. Use Browser Use for webpage navigation; address-bar control needs explicitly approved foreground (interrupts the person).' })

/** Preflight the complete native call before any input, including steps before a blocked batch shortcut. */
export async function backgroundLocationShortcut(input: {
  name: string; args: Args; owner: string; lane: string; apps: AppDirectory; native: CuaClient
  signal?: AbortSignal; remainingMs?: () => number
}): Promise<Refusal | null> {
  const pending = candidates(input.name, input.args)
  if (!pending.length) return null
  const options = { lane: input.lane, signal: input.signal, timeoutMs: 5_000,
    ...(input.remainingMs ? { remainingMs: input.remainingMs } : {}) }
  try {
    const listed = await input.native.callTool('list_apps', {}, options)
    if (listed.isError || !record(listed.structuredContent) || !Array.isArray(listed.structuredContent.apps)) return unavailable()
    const running = listed.structuredContent.apps.filter(record).filter(app => pidNumber(app.pid) && app.running === true)
    const windows = new Map<string, Promise<Args[] | null>>()
    const resolvePid = async (args: Args): Promise<number | undefined> => {
      const selector = windowSelector(args)
      if (pidNumber(selector.pid)) return selector.pid
      if (typeof args.element_token === 'string' && !Object.keys(selector).length) return input.apps.pidOf(input.owner, args)
      const app = typeof selector.app === 'string' ? selector.app : ''
      const key = JSON.stringify(selector)
      let read = windows.get(key)
      if (!read) {
        read = input.native.callTool('list_windows', { ...(app ? { app } : {}), on_screen_only: false }, options).then(value => {
          const data = value.structuredContent
          if (value.isError || !record(data) || !Array.isArray(data.windows)) return null
          return data.windows.filter(record).filter(window =>
            (selector.window_id === undefined || window.window_id === selector.window_id)
            && (!selector.window || lower(window.title).includes(lower(selector.window))))
        })
        windows.set(key, read)
      }
      const found = await read
      const pids = new Set(found?.flatMap(window => pidNumber(window.pid) ? [window.pid] : []))
      return pids.size === 1 ? [...pids][0] : undefined
    }
    for (const candidate of pending) {
      const pid = await resolvePid(candidate.args)
      const identities = new Set(running.filter(app => app.pid === pid).map(app => lower(app.bundle_id)).filter(Boolean))
      const bundle = identities.size === 1 ? [...identities][0] : undefined
      const refusal = !bundle ? unavailable() : chromiumBundle(bundle) ? blocked() : null
      if (refusal) return { ...refusal, message: `${candidate.step ? `Step ${candidate.step}: ` : ''}${refusal.message}` }
    }
    return null
  } catch {
    return input.signal?.aborted ? { code: 'cancelled', message: 'This operation was cancelled before input.' } : unavailable()
  }
}

import { createHash } from 'node:crypto'
import { createAppDirectory } from './app-directory'
import { TOOLS, checkCall, descriptionOf } from './policy'
import type { ComputerControl } from './control'
import type { CuaClient, CuaToolResult } from './native/cua-client'
import type { Args, SelfApp } from './types'
import { resolveCallTargets } from './targets'
import { resolveComputerWindow } from './placement'
import { linuxScreen } from './native/linux-display'

type NativeSpec = { name: string; description?: string; input_schema?: Args; inputSchema?: Args }
export type ToolCaller = { agent: string; session: string; name?: string; taskTitle?: string; signal?: AbortSignal; remainingMs?: () => number; preview?: boolean; humanViewer?: string }
// The message goes in the structured result too: some harnesses (Codex) show an agent only structuredContent, and a
// bare code left it unable to tell a missing permission from a broken App, so it fell back to other computer tools.
const failure = (code: string, message: string): CuaToolResult => ({ isError: true, content: [{ type: 'text', text: message }], structuredContent: { code, message } })
const object = (v: unknown): v is Args => !!v && typeof v === 'object' && !Array.isArray(v)

function permissionState(result: CuaToolResult): Args | null {
  if (result.isError) return null
  if (object(result.structuredContent)) return result.structuredContent
  for (const block of result.content ?? []) {
    if (block.type !== 'text' || typeof block.text !== 'string') continue
    try { const state: unknown = JSON.parse(block.text); if (object(state)) return state } catch { /* Native text may not be JSON. */ }
  }
  return null
}

function fileCapture(args: unknown): boolean {
  return object(args) && (typeof args.screenshot_out_file === 'string' || typeof args.debug_image_out === 'string')
}

function needsScreen(name: string, args: Args): boolean {
  return fileCapture(args) || name === 'get_desktop_state' || name === 'zoom'
    || (name === 'get_window_state' && args.include_screenshot !== false)
    || (name === 'verify_state' && args.include_screenshot === true)
    || (name === 'run_steps' && (
      fileCapture(args.observe) || (object(args.observe) && args.observe.include_screenshot === true)
      || (Array.isArray(args.steps) && args.steps.some(step => object(step) && Object.values(step).some(fileCapture)))
    ))
}

/** Called by the App's MCP adapter with gateway-stamped caller identity, never tool arguments. */
const hasScreen = (env: { DISPLAY?: string; WAYLAND_DISPLAY?: string }) => Boolean(env.DISPLAY || env.WAYLAND_DISPLAY)

export function createComputerTools(input: {
  cua: CuaClient
  specs: NativeSpec[]
  platform: NodeJS.Platform
  /** Display variables seen by the driver; defaults to this process environment. */
  display?: { DISPLAY?: string; WAYLAND_DISPLAY?: string }
  protectedHost(): Promise<SelfApp> | SelfApp
  control?: ComputerControl
  observed?(value: { caller: ToolCaller; owner: string; name: string; args: Args; pid?: number; windowId?: number; result: CuaToolResult }): void
}) {
  const specs = new Map(input.specs.map(spec => [spec.name, spec]))
  const definitions = new Map(TOOLS.map(tool => {
    const native = specs.get(tool.cua)
    if (!native) throw new Error(`Native tool documentation is missing: ${tool.cua}`)
    const schema = native.input_schema ?? native.inputSchema
    if (!object(schema) || schema.type !== 'object' || !object(schema.properties)) throw new Error(`Invalid native tool schema: ${tool.cua}`)
    const properties = { ...schema.properties }
    delete properties.session
    if (tool.confirm) properties.confirmed = { type: 'boolean', description: 'Set true only after the person explicitly approved this foreground or destructive action through the agent’s existing conversation. This flag is not approval by the App.' }
    const required = Array.isArray(schema.required) ? schema.required.filter(key => key !== 'session') : []
    return [tool.cua, { tool, native, schema, public: { name: tool.cua, description: descriptionOf(tool, native), inputSchema: { ...schema, properties, required }, annotations: { readOnlyHint: tool.kind === 'look', destructiveHint: tool.cua === 'kill_app' } } }] as const
  }))
  const apps = createAppDirectory()
  return {
    list: () => [...definitions.values()].map(value => value.public),
    async call(name: string, args: Args, caller: ToolCaller): Promise<CuaToolResult> {
      const definition = definitions.get(name)
      if (!definition) return failure('not_found', 'This App does not expose that native tool.')
      if (!caller.agent || !caller.session) return failure('not_granted', 'An agent and its bound task are required.')
      if (input.platform !== 'darwin' && input.platform !== 'win32' && input.platform !== 'linux') return failure('unsupported', 'This platform has no supported Computer Use driver.')
      if (input.platform === 'linux' && !hasScreen(input.display ?? { ...process.env, ...linuxScreen(process.env) })) return failure('unavailable', 'This computer has no screen (no X11 or Wayland display). Start a desktop or virtual display session for the account running Gugu, then retry. No input was sent.')
      if (['session', 'device', 'device_id', 'agent'].some(key => key in args)) return failure('invalid_args', 'Caller and machine identity cannot be supplied as tool arguments.')
      const { confirmed, ...forwardArgs } = args
      if (caller.signal?.aborted) return failure('cancelled', 'This operation was cancelled before it was sent.')
      const self = await input.protectedHost()
      if (!self.pids.size || !self.names.size) return failure('unavailable', 'The protected host identity could not be checked.')
      const checked = checkCall(name, forwardArgs, self, input.platform)
      if (checked.refused) return failure('invalid_args', checked.refused)
      const tool = definition.tool
      if ((tool.confirm === 'always' || checked.foreground) && confirmed !== true) {
        const question = tool.question?.(forwardArgs) ?? checked.question ?? 'This will bring the target window to the foreground and may interrupt the person’s pointer or keyboard focus.'
        return failure('needs_confirmation', `${question} Ask the person using AskUserQuestion or the existing conversation. Only after their explicit approval retry with confirmed: true. No input was sent; this tool does not wait for an answer.`)
      }
      if (caller.signal?.aborted) return failure('cancelled', 'This operation was cancelled before it was sent.')
      const owner = 'gugu-' + createHash('sha256').update(caller.agent + '\0' + caller.session).digest('hex').slice(0, 20)
      // The App's source callback owns this viewer id; it is never accepted from tool arguments.
      // Disconnecting a person's input cannot retire an agent's or another viewer's native lane.
      const lane = caller.humanViewer ? owner + '-human-' + createHash('sha256').update(caller.humanViewer).digest('hex').slice(0, 12)
        : caller.preview ? owner + '-preview' : owner
      const launching = name === 'launch_app'
      const target = await resolveCallTargets({ name, args: forwardArgs, owner, apps, native: input.cua, signal: caller.signal,
        ...(tool.kind === 'act' ? { control: input.control } : {}) })
      if (target.stopped) return failure('revoked', target.stopped)
      const { pid, windowId, targetPids } = target
      if ([pid, ...targetPids].some(pid => pid !== undefined && self.pids.has(pid))) return failure('invalid_args', 'The target belongs to the protected host.')
      const identity = { sessionId: caller.session, ...(caller.name ? { callerName: caller.name } : {}), ...(caller.taskTitle ? { taskTitle: caller.taskTitle } : {}) }
      let handle = tool.kind === 'act' ? input.control?.begin({
        ...identity,
        ...(launching ? { deferAttachment: true } : {}),
        ...(pid === undefined ? {} : { pid, appName: apps.nameOf(pid) }),
        ...(targetPids.some(target => target !== pid) ? { targetPids } : {}), windowId,
      }) : undefined
      if (handle && 'refused' in handle) return failure('revoked', handle.refused)
      const signal = handle ? caller.signal ? AbortSignal.any([caller.signal, handle.signal]) : handle.signal : caller.signal
      try {
        if (input.platform === 'darwin') {
          // Only the process that executes native operations can authorize them.
          // A helper's TCC status can belong to a different responsible process.
          const state = permissionState(await input.cua.callTool('check_permissions', { prompt: false }, { signal, lane, timeoutMs: 15_000, ...(caller.remainingMs ? { remainingMs: caller.remainingMs } : {}) }))
          if (!state || typeof state.accessibility !== 'boolean' || typeof state.screen_recording !== 'boolean') return failure('unavailable', 'The native driver could not check its system permissions. No input was sent.')
          const missing = [...(!state.accessibility ? ['Accessibility'] : []), ...(!state.screen_recording ? ['Screen Recording'] : [])]
          if (!state.accessibility || (!state.screen_recording && needsScreen(name, forwardArgs))) {
            return failure('os_permission', `${missing.join(' and ')} permission is missing on this computer. The person must grant it in System Settings before this operation can continue. No permission prompt or input was sent by this tool. Tell the person what is blocked using the existing conversation, then retry after they report completion.`)
          }
        }
        if (handle?.signal.aborted) return failure('revoked', String(handle.signal.reason))
        if (signal?.aborted) return failure('cancelled', 'This operation was cancelled before it was sent.')
        const forward = object(definition.schema.properties) && 'session' in definition.schema.properties ? { ...forwardArgs, session: lane } : forwardArgs
        const result = await input.cua.callTool(name, forward, { signal, lane, ...(caller.remainingMs ? { remainingMs: caller.remainingMs } : {}), timeoutMs: caller.preview ? 10_000 : tool.timeoutMs?.(args) ?? 60_000 })
        if (handle?.signal.aborted) return failure('revoked', String(handle.signal.reason))
        if (result.isError !== true) {
          apps.learn(owner, result.structuredContent, launching ? { ...forwardArgs, app: forwardArgs.name ?? forwardArgs.bundle_id ?? forwardArgs.app } : forwardArgs)
          if (launching && input.control && object(result.structuredContent)) {
            const launchedPid = apps.pidOf(owner, result.structuredContent)
            if (launchedPid !== undefined) {
              const window = resolveComputerWindow(result.structuredContent, { pid: launchedPid })
              handle?.end()
              const attached = input.control.begin({ ...identity, pid: launchedPid, appName: apps.nameOf(launchedPid), ...(window ? { windowId: window.windowId } : {}) })
              if ('refused' in attached) return failure('revoked', attached.refused)
              handle = attached
            }
          }
        }
        // Observation is presentation only; it never changes an operation's result.
        if (!caller.preview) {
          try { input.observed?.({ caller, owner, name, args: forwardArgs, pid, windowId, result }) } catch { /* The preview may be unavailable. */ }
        }
        return result
      } catch (error) {
        if (handle?.signal.aborted) return failure('revoked', String(handle.signal.reason))
        throw error
      } finally { handle?.end() }
    },
  }
}

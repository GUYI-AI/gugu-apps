import { createHash } from 'node:crypto'
import { createAppDirectory } from './app-directory'
import { TOOLS, checkCall, descriptionOf } from './policy'
import type { ComputerControl } from './control'
import type { CuaClient, CuaToolResult } from './native/cua-client'
import type { Args, SelfApp } from './types'

type NativeSpec = { name: string; description?: string; input_schema?: Args; inputSchema?: Args }
export type ToolCaller = { agent: string; session: string; name?: string; signal?: AbortSignal; remainingMs?: () => number }
type Consent = 'completed' | 'cancelled' | 'timeout' | 'pending'
const failure = (code: string, message: string): CuaToolResult => ({ isError: true, content: [{ type: 'text', text: message }], structuredContent: { code } })
const object = (v: unknown): v is Args => !!v && typeof v === 'object' && !Array.isArray(v)

/** Called by the App's MCP adapter with gateway-stamped caller identity, never tool arguments. */
export function createComputerTools(input: {
  cua: CuaClient
  specs: NativeSpec[]
  platform: NodeJS.Platform
  protectedHost(): Promise<SelfApp> | SelfApp
  permissions?(): Promise<{ permissions: { accessibility: boolean; screen: boolean } }>
  control?: ComputerControl
  requestHuman?(request: { title: string; detail: string }, caller: ToolCaller): Promise<Consent>
}) {
  const specs = new Map(input.specs.map(spec => [spec.name, spec]))
  const definitions = new Map(TOOLS.map(tool => {
    const native = specs.get(tool.cua)
    if (!native) throw new Error(`Native tool documentation is missing: ${tool.cua}`)
    const schema = native.input_schema ?? native.inputSchema
    if (!object(schema) || schema.type !== 'object' || !object(schema.properties)) throw new Error(`Invalid native tool schema: ${tool.cua}`)
    const properties = { ...schema.properties }
    delete properties.session
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
      if (input.platform !== 'darwin' && input.platform !== 'win32') return failure('unsupported', 'This platform has no supported Computer Use driver.')
      if (['session', 'device', 'device_id', 'agent', 'confirmed'].some(key => key in args)) return failure('invalid_args', 'Caller, machine and confirmation identity cannot be supplied as tool arguments.')
      if (caller.signal?.aborted) return failure('cancelled', 'This operation was cancelled before it was sent.')
      const self = await input.protectedHost()
      if (!self.pids.size || !self.names.size) return failure('unavailable', 'The protected host identity could not be checked.')
      const checked = checkCall(name, args, self, input.platform)
      if (checked.refused) return failure('invalid_args', checked.refused)
      if (input.platform === 'darwin') {
        if (!input.permissions) return failure('unavailable', 'The permission probe is not available.')
        const state = await input.permissions()
        if (!state.permissions.accessibility) return failure('os_permission', 'Accessibility permission is missing. Open the Computer Use App to check this computer’s system permissions.')
      }
      const tool = definition.tool
      if (tool.confirm === 'always' || checked.foreground) {
        if (!input.requestHuman) return failure('needs_confirmation', 'The person must approve this operation in the App before it can run.')
        const consent = await input.requestHuman({ title: tool.question?.(args) ?? checked.question ?? '允许把目标窗口切到前台？', detail: 'This may interrupt the person’s window or pointer. Only approval of this request allows it to continue.' }, caller)
        if (consent !== 'completed') return failure(consent, consent === 'pending' ? 'The request is still waiting for the person; no input was sent.' : 'The person’s request did not approve this operation; no input was sent.')
      }
      if (caller.signal?.aborted) return failure('cancelled', 'This operation was cancelled before it was sent.')
      const owner = 'gugu-' + createHash('sha256').update(caller.agent + '\0' + caller.session).digest('hex').slice(0, 20)
      const pid = apps.pidOf(owner, args)
      if (pid !== undefined && self.pids.has(pid)) return failure('invalid_args', 'The target belongs to the protected host.')
      const handle = input.control?.begin({ ...(pid === undefined ? {} : { pid }), ...(caller.name ? { callerName: caller.name } : {}), windowId: apps.windowOf(owner, args) })
      if (handle && 'refused' in handle) return failure('revoked', handle.refused)
      const signal = handle ? caller.signal ? AbortSignal.any([caller.signal, handle.signal]) : handle.signal : caller.signal
      try {
        const forward = object(definition.schema.properties) && 'session' in definition.schema.properties ? { ...args, session: owner } : args
        const result = await input.cua.callTool(name, forward, { signal, lane: owner, ...(caller.remainingMs ? { remainingMs: caller.remainingMs } : {}), timeoutMs: tool.timeoutMs?.(args) ?? 60_000 })
        if (result.isError !== true) apps.learn(owner, result.structuredContent, args)
        return result
      } finally { handle?.end() }
    },
  }
}

import { createHash } from 'node:crypto'
import { createAppDirectory } from './app-directory'
import { TOOLS, checkCall, descriptionOf } from './policy'
import type { ComputerControl } from './control'
import type { CuaClient, CuaToolResult } from './native/cua-client'
import type { Args, SelfApp } from './types'

type NativeSpec = { name: string; description?: string; input_schema?: Args; inputSchema?: Args }
export type ToolCaller = { agent: string; session: string; name?: string; signal?: AbortSignal; remainingMs?: () => number }
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
      if (input.platform !== 'darwin' && input.platform !== 'win32') return failure('unsupported', 'This platform has no supported Computer Use driver.')
      if (['session', 'device', 'device_id', 'agent'].some(key => key in args)) return failure('invalid_args', 'Caller and machine identity cannot be supplied as tool arguments.')
      const { confirmed, ...forwardArgs } = args
      if (caller.signal?.aborted) return failure('cancelled', 'This operation was cancelled before it was sent.')
      const self = await input.protectedHost()
      if (!self.pids.size || !self.names.size) return failure('unavailable', 'The protected host identity could not be checked.')
      const checked = checkCall(name, forwardArgs, self, input.platform)
      if (checked.refused) return failure('invalid_args', checked.refused)
      if (input.platform === 'darwin') {
        if (!input.permissions) return failure('unavailable', 'The permission probe is not available.')
        const state = await input.permissions()
        if (!state.permissions.accessibility) {
          const missing = ['Accessibility', ...(!state.permissions.screen ? ['Screen Recording'] : [])].join(' and ')
          return failure('os_permission', `${missing} permission is missing on this computer. The person must grant it in System Settings before this operation can continue. No permission prompt or input was sent by this tool. Tell the person what is blocked using the existing conversation, then retry after they report completion.`)
        }
      }
      const tool = definition.tool
      if ((tool.confirm === 'always' || checked.foreground) && confirmed !== true) {
        const question = tool.question?.(forwardArgs) ?? checked.question ?? 'This will bring the target window to the foreground and may interrupt the person’s pointer or keyboard focus.'
        return failure('needs_confirmation', `${question} Ask the person using AskUserQuestion or the existing conversation. Only after their explicit approval retry with confirmed: true. No input was sent; this tool does not wait for an answer.`)
      }
      if (caller.signal?.aborted) return failure('cancelled', 'This operation was cancelled before it was sent.')
      const owner = 'gugu-' + createHash('sha256').update(caller.agent + '\0' + caller.session).digest('hex').slice(0, 20)
      const pid = apps.pidOf(owner, forwardArgs)
      if (pid !== undefined && self.pids.has(pid)) return failure('invalid_args', 'The target belongs to the protected host.')
      const handle = input.control?.begin({ ...(pid === undefined ? {} : { pid }), ...(caller.name ? { callerName: caller.name } : {}), windowId: apps.windowOf(owner, forwardArgs) })
      if (handle && 'refused' in handle) return failure('revoked', handle.refused)
      const signal = handle ? caller.signal ? AbortSignal.any([caller.signal, handle.signal]) : handle.signal : caller.signal
      try {
        const forward = object(definition.schema.properties) && 'session' in definition.schema.properties ? { ...forwardArgs, session: owner } : forwardArgs
        const result = await input.cua.callTool(name, forward, { signal, lane: owner, ...(caller.remainingMs ? { remainingMs: caller.remainingMs } : {}), timeoutMs: tool.timeoutMs?.(args) ?? 60_000 })
        if (result.isError !== true) apps.learn(owner, result.structuredContent, forwardArgs)
        return result
      } finally { handle?.end() }
    },
  }
}

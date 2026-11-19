/** App-owned tool policy vocabulary. No device-action registry or host implementation. */
export type Args = Record<string, unknown>
export type DeviceActionRisk = 'low' | 'medium' | 'high'
export interface SelfApp { pids: ReadonlySet<number>; names: ReadonlySet<string> }
export const str = (args: Args, key: string): string => typeof args[key] === 'string' ? args[key].trim() : ''
export const num = (args: Args, key: string): number | undefined => typeof args[key] === 'number' && Number.isFinite(args[key]) ? args[key] : undefined

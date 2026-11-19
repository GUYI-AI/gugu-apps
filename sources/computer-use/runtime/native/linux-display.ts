import fs from 'node:fs'
import path from 'node:path'

type Env = Record<string, string | undefined>
type Fs = Pick<typeof fs, 'readdirSync' | 'statSync'>

/**
 * A Gugu started over SSH or as a background service has no DISPLAY even when the same
 * account has a screen running (a desktop login or a virtual display). Use that account's
 * own screen: an X socket or Wayland socket owned by this user. Never another user's.
 */
export function linuxScreen(source: Env, deps: { uid?: number; fs?: Fs } = {}): Env {
  if (source.DISPLAY || source.WAYLAND_DISPLAY) return {}
  const uid = deps.uid ?? process.getuid?.()
  if (uid === undefined) return {}
  const files = deps.fs ?? fs
  const owned = (file: string) => { try { const stat = files.statSync(file); return stat.uid === uid && stat.isSocket() } catch { return false } }
  const list = (dir: string) => { try { return files.readdirSync(dir) as string[] } catch { return [] } }
  const runtime = source.XDG_RUNTIME_DIR || `/run/user/${uid}`
  const bus = path.join(runtime, 'bus')
  const session = source.DBUS_SESSION_BUS_ADDRESS || !owned(bus) ? {} : { DBUS_SESSION_BUS_ADDRESS: `unix:path=${bus}` }
  const x = list('/tmp/.X11-unix').map(name => /^X(\d+)$/.exec(name)?.[1]).filter((n): n is string => n !== undefined)
    .map(Number).sort((a, b) => a - b).find(n => owned(`/tmp/.X11-unix/X${n}`))
  if (x !== undefined) return { DISPLAY: `:${x}`, ...session }
  const wayland = list(runtime).filter(name => /^wayland-\d+$/.test(name)).sort().find(name => owned(path.join(runtime, name)))
  if (wayland) return { WAYLAND_DISPLAY: wayland, XDG_RUNTIME_DIR: runtime, ...session }
  return {}
}

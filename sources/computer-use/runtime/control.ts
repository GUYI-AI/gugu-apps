// Migrated from OpenDCAI/gugu@1f8cd5f3a81df091d25a81f6838f186c33504a95: apps/desktop/electron/device-actions/computer-control.ts
import { programLogger } from './log'

/**
 * #7199 Control indicator and human takeover are per application, rather than
 * the whole computer (owner decision, October 15).
 *
 * - Only input registers control. Inspection neither shows nor refreshes the
 *   advisory, non-activating host surface. Display failure never admits or
 *   refuses input. Untargeted input also replaces the active subject so Stop
 *   reaches the current action. The indicator hides 30 seconds after work ends.
 * - Ordinary human activity does not interrupt the agent: background driver
 *   operations do not take the person's real pointer or foreground window.
 * - Stop cancels in-flight work for the displayed application and refuses later
 *   input until Continue; other applications remain usable. Stopping an
 *   untargeted action stops computer control as a whole.
 */

/** Advisory surface; tests record deliveries. An absent app means an untargeted operation; an absent name means an unnamed app. */
export interface ComputerControlView {
  show(view: { state: 'driving' | 'paused'; sessionId?: string; callerName?: string; taskTitle?: string; app?: { pid: number; name?: string; windowId?: number } }): unknown
  hide(): unknown
}

/** An action's application identity; untargeted actions have no PID. */
export interface ComputerCall {
  /** Presentation is deferred for a cold launch; cancellation admission is not. */
  deferAttachment?: boolean
  sessionId?: string
  callerName?: string
  taskTitle?: string
  pid?: number
  targetPids?: readonly number[]
  windowId?: number
  appName?: string
}

export type ComputerCallHandle = { refused: string } | { signal: AbortSignal; end(): void }

export interface ComputerControl {
  /** Refuse a paused subject; otherwise register cancellable work and return its signal and cleanup handle. */
  begin(call: ComputerCall): ComputerCallHandle
  /**
   * #7317 Inspect pause state without registering input or showing an indicator.
   * Return the same refusal as begin, or null if this subject may proceed.
   */
  stoppedFor(pid: number | undefined): string | null
  /** A person on a task page targets its observed App, never whichever bar was shown last. */
  setTargetPaused(call: ComputerCall & { pid: number }, pause: boolean): string | null
  /** The control bar's Stop action. */
  stop(): void
  /** The control bar's Continue action. */
  resume(): void
  dispose(): void
}

export function appStopped(appName: string | undefined): string {
  const app = appName ? `"${appName}"` : 'that app'
  return `The person pressed Stop for ${app} on its window's control bar: they are taking ${app} over. Do not operate ${app} until they press "继续 / Continue" on that bar; other apps are not affected. Tell them what you did in ${app} and what is left.`
}

export const COMPUTER_STOPPED = 'The person pressed Stop on the bar at the bottom of their screen. Do not use computer.* until they press "继续 / Continue" on that bar. Tell them what you have done and what is left.'

const LINGER_MS = 30_000
const PAUSED_BAR_MS = 2 * 60_000
const log = programLogger('control-display')

/** Pause subject: one application PID, or computer control as a whole. */
type Subject = number | 'computer'

export function createComputerControl(input: { view: ComputerControlView; lingerMs?: number; onViewError?(error: unknown): void }): ComputerControl {
  let disposed = false
  const lingerMs = input.lingerMs ?? LINGER_MS
  /** Retain the paused subject's observed name for later agent refusals. */
  const paused = new Map<Subject, { appName?: string; windowId?: number }>()
  const inFlight = new Map<Subject, Set<AbortController>>()
  let shown: { subject: Subject; sessionId?: string; appName?: string; windowId?: number; callerName?: string; taskTitle?: string; state: 'driving' | 'paused' } | null = null
  let hideTimer: ReturnType<typeof setTimeout> | null = null

  // Display delivery is advisory. Neither an exception, a rejection nor a
  // never-settling surface update can become an action permission decision.
  const reportViewError = (error: unknown) => {
    try {
      if (input.onViewError) input.onViewError(error)
      else log.warn({ error: String(error) }, 'Computer Use display failed')
    } catch { /* A display error reporter cannot prevent input or cancellation. */ }
  }
  const display = (work: () => unknown) => {
    try { void Promise.resolve(work()).catch(reportViewError) }
    catch (error) { reportViewError(error) }
  }
  const hide = () => display(() => input.view.hide())

  const clearHide = () => {
    if (hideTimer) clearTimeout(hideTimer)
    hideTimer = null
  }
  const hideAfter = (ms: number) => {
    clearHide()
    hideTimer = setTimeout(() => {
      shown = null
      hide()
    }, ms)
    ;(hideTimer as { unref?: () => void }).unref?.()
  }
  const show = (next: NonNullable<typeof shown>) => {
    shown = next
    clearHide()
    display(() => input.view.show({
      state: next.state,
      ...(next.sessionId ? { sessionId: next.sessionId } : {}),
      ...(next.callerName ? { callerName: next.callerName } : {}),
      ...(next.taskTitle ? { taskTitle: next.taskTitle } : {}),
      ...(next.subject === 'computer' ? {} : { app: { pid: next.subject, ...(next.appName ? { name: next.appName } : {}), ...(next.windowId !== undefined ? { windowId: next.windowId } : {}) } }),
    }))
  }
  const busy = () => [...inFlight.values()].some((set) => set.size > 0)

  return {
    begin(call) {
      if (disposed) return { refused: 'Computer Use App 已停止，不能接受新的操作。' }
      const identity = { ...(call.sessionId ? { sessionId: call.sessionId } : {}), ...(call.callerName ? { callerName: call.callerName } : {}), ...(call.taskTitle ? { taskTitle: call.taskTitle } : {}) }
      const subject: Subject = call.pid ?? 'computer'
      const subjects = new Set<Subject>([subject, ...(call.targetPids ?? [])])
      const blockedBy = paused.has('computer') ? 'computer' : [...subjects].find(target => paused.has(target)) ?? null
      if (blockedBy !== null) {
        // Re-show a paused subject's indicator so the person can choose Continue.
        const appName = blockedBy === 'computer' ? undefined : (paused.get(blockedBy)?.appName ?? (call.pid === blockedBy ? call.appName : undefined))
        const windowId = blockedBy === 'computer' ? undefined : ((call.pid === blockedBy ? call.windowId : undefined) ?? paused.get(blockedBy)?.windowId)
        show({ subject: blockedBy, ...identity, ...(appName ? { appName } : {}), ...(windowId !== undefined ? { windowId } : {}), state: 'paused' })
        hideAfter(PAUSED_BAR_MS)
        return { refused: blockedBy === 'computer' ? COMPUTER_STOPPED : appStopped(appName) }
      }
      const controller = new AbortController()
      const sets = [...subjects].map(target => {
        const set = inFlight.get(target) ?? new Set<AbortController>()
        set.add(controller)
        inFlight.set(target, set)
        return { target, set }
      })
      const windowId = call.windowId
      if (!call.deferAttachment) show({ subject, ...identity, ...(call.appName ? { appName: call.appName } : {}), ...(windowId !== undefined ? { windowId } : {}), state: 'driving' })
      let ended = false
      return {
        signal: controller.signal,
        end() {
          if (ended) return
          ended = true
          for (const { target, set } of sets) {
            set.delete(controller)
            if (set.size === 0 && inFlight.get(target) === set) inFlight.delete(target)
          }
          if (!busy() && shown?.state === 'driving') hideAfter(lingerMs)
        },
      }
    },
    stoppedFor(pid) {
      if (disposed) return 'Computer Use App 已停止'
      if (paused.has('computer')) return COMPUTER_STOPPED
      return pid !== undefined && paused.has(pid) ? appStopped(paused.get(pid)?.appName) : null
    },
    setTargetPaused(call, pause) {
      if (disposed) return 'Computer Use App 已停止'
      if (!Number.isSafeInteger(call.pid) || call.pid <= 0) throw new Error('A known application is required')
      if (paused.has('computer')) return COMPUTER_STOPPED
      if (!pause) {
        // A task-specific Continue cannot undo a whole-computer Stop.
        paused.delete(call.pid)
        if (shown?.subject === call.pid && shown.state === 'paused') {
          shown = null; clearHide(); hide()
        }
        return null
      }
      paused.set(call.pid, { appName: call.appName, windowId: call.windowId })
      const reason = appStopped(call.appName)
      for (const controller of inFlight.get(call.pid) ?? []) controller.abort(reason)
      show({ subject: call.pid, sessionId: call.sessionId, callerName: call.callerName, taskTitle: call.taskTitle,
        appName: call.appName, windowId: call.windowId, state: 'paused' })
      hideAfter(PAUSED_BAR_MS)
      return reason
    },
    stop() {
      if (disposed) return
      if (!shown || shown.state !== 'driving') return
      const prior = shown
      const { subject, appName, windowId } = shown
      paused.set(subject, { ...(appName ? { appName } : {}), ...(windowId !== undefined ? { windowId } : {}) })
      const reason = subject === 'computer' ? COMPUTER_STOPPED : appStopped(appName)
      for (const [s, set] of inFlight) {
        if (subject !== 'computer' && s !== subject) continue
        for (const controller of set) controller.abort(reason)
      }
      show({ ...prior, state: 'paused' })
      hideAfter(PAUSED_BAR_MS)
    },
    resume() {
      if (disposed) return
      if (!shown || shown.state !== 'paused') return
      paused.delete(shown.subject)
      shown = null
      clearHide()
      hide()
    },
    dispose() {
      disposed = true
      for (const controllers of inFlight.values()) for (const controller of controllers) controller.abort('Computer Use App 已停止')
      inFlight.clear()
      paused.clear()
      shown = null
      clearHide()
      hide()
    },
  }
}

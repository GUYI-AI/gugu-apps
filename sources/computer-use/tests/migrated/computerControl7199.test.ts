// Regression suite migrated from gugu@5ecc5f06; execution belongs to the Computer Use App.
// #7199 Human takeover is per application (owner decision, October 15).
// begin registers input only. Untargeted input uses the foreground indicator,
// but Stop covers all computer control. Inspections do not enter the controller.
// Stop cancels the displayed application's work until Continue; other apps remain usable.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { COMPUTER_STOPPED, appStopped, createComputerControl } from '../../runtime/control'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-15T08:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

function setup() {
  const views: string[] = []
  const view = {
    show: vi.fn((v: { state: string; callerName?: string; app?: { name?: string } }) => {
      views.push(`${v.state}:${v.callerName ?? ''}:${v.app ? (v.app.name ?? '?') : '-'}`)
    }),
    hide: vi.fn(() => { views.push('hide') }),
  }
  const control = createComputerControl({ view, lingerMs: 30_000 })
  return { control, views }
}

const calc = { callerName: '云端助理', pid: 77, appName: '计算器' }
const notes = { callerName: '云端助理', pid: 88, appName: '备忘录' }
const untargetedAct = { callerName: '云端助理' }

function begun(handle: ReturnType<ReturnType<typeof createComputerControl>['begin']>) {
  if ('refused' in handle) throw new Error(`refused: ${handle.refused}`)
  return handle
}

describe('control indicator', () => {
  it('does not infer the window of a later app-only call from the previously shown target', () => {
    const show = vi.fn()
    const control = createComputerControl({ view: { show, hide: vi.fn() } })
    begun(control.begin({ ...calc, windowId: 501, taskTitle: 'Task A' })).end()
    begun(control.begin({ ...calc, callerName: 'Agent B', taskTitle: 'Task B' })).end()
    expect(show).toHaveBeenLastCalledWith({ state: 'driving', callerName: 'Agent B', taskTitle: 'Task B', app: { pid: 77, name: '计算器' } })
    control.dispose()
  })

  it('keeps Agent/task identity with its shown window and does not reuse an absent task title', () => {
    const show = vi.fn()
    const control = createComputerControl({ view: { show, hide: vi.fn() } })
    begun(control.begin({ ...calc, taskTitle: 'Task A', windowId: 501 })).end()
    begun(control.begin({ callerName: 'Another Agent', taskTitle: 'Unresolved input' })).end()
    control.stop()
    expect(show).toHaveBeenLastCalledWith({ state: 'paused', callerName: 'Another Agent', taskTitle: 'Unresolved input' })
    control.resume()
    begun(control.begin({ ...notes, callerName: 'Agent B' })).end()
    expect(show).toHaveBeenLastCalledWith({ state: 'driving', callerName: 'Agent B', app: { pid: 88, name: '备忘录' } })
    control.dispose()
  })

  it('retains the target window through Stop and a later refused app call, but switches between windows of the same app', () => {
    const show = vi.fn()
    const control = createComputerControl({ view: { show, hide: vi.fn() } })
    begun(control.begin({ ...calc, windowId: 501 })).end()
    begun(control.begin({ ...calc, windowId: 502 })).end()
    expect(show).toHaveBeenLastCalledWith({ state: 'driving', callerName: calc.callerName, app: { pid: 77, name: '计算器', windowId: 502 } })
    control.stop()
    expect(show).toHaveBeenLastCalledWith({ state: 'paused', callerName: calc.callerName, app: { pid: 77, name: '计算器', windowId: 502 } })
    vi.advanceTimersByTime(120_001)
    expect(control.begin(calc)).toEqual({ refused: appStopped('计算器') })
    expect(show).toHaveBeenLastCalledWith({ state: 'paused', callerName: calc.callerName, app: { pid: 77, name: '计算器', windowId: 502 } })
    control.dispose()
  })

  it('shows the latest act subject, including unresolved input, until the last act finishes', () => {
    const { control, views } = setup()
    begun(control.begin(untargetedAct)).end()
    expect(views).toEqual(['driving:云端助理:-'])
    const a = begun(control.begin(calc))
    expect(views.at(-1)).toBe('driving:云端助理:计算器')
    const b = begun(control.begin(untargetedAct))
    expect(views.at(-1)).toBe('driving:云端助理:-')
    a.end()
    b.end()
    vi.advanceTimersByTime(29_000)
    expect(views.at(-1)).toBe('driving:云端助理:-')
    vi.advanceTimersByTime(2_000)
    expect(views.at(-1)).toBe('hide')
  })

  it('tracks an unnamed application separately; the surface supplies its display label', () => {
    const { control, views } = setup()
    begun(control.begin({ pid: 99 })).end()
    expect(views.at(-1)).toBe('driving::?')
  })
})

describe('Stop affects only its application', () => {
  it('cancels in-flight input with an agent-facing reason, refuses later input and resumes after Continue without affecting other apps', () => {
    const { control, views } = setup()
    const inCalc = begun(control.begin(calc))
    control.stop()
    expect(inCalc.signal.aborted).toBe(true)
    expect(inCalc.signal.reason).toBe(appStopped('计算器'))
    expect(views.at(-1)).toBe('paused:云端助理:计算器')
    inCalc.end()

    expect(control.begin(calc)).toEqual({ refused: appStopped('计算器') })
    // This explicit controller entry also refuses a subject the person took over.
    expect(control.begin({ pid: 77 })).toEqual({ refused: appStopped('计算器') })
    // Other applications and untargeted input remain usable.
    const inNotes = begun(control.begin(notes))
    expect(inNotes.signal.aborted).toBe(false)
    expect(views.at(-1)).toBe('driving:云端助理:备忘录')
    inNotes.end()
    begun(control.begin(untargetedAct)).end()
    expect(views.at(-1)).toBe('driving:云端助理:-')

    // A refused retry re-shows the paused indicator so the person can Continue.
    expect('refused' in control.begin(calc)).toBe(true)
    expect(views.at(-1)).toBe('paused:云端助理:计算器')
    control.resume()
    expect(views.at(-1)).toBe('hide')
    begun(control.begin(calc)).end()
  })

  it('lets unresolved input be stopped after an App pause without clearing that App pause', () => {
    const { control, views } = setup()
    begun(control.begin(calc))
    control.stop()
    const unresolved = begun(control.begin(untargetedAct))
    expect(views.at(-1)).toBe('driving:云端助理:-')
    control.stop()
    expect(unresolved.signal.aborted).toBe(true)
    control.resume()
    expect(control.begin(calc)).toHaveProperty('refused')
    control.resume()
    unresolved.end()
    begun(control.begin(calc)).end()
  })

  it('checks every batch App independently of the displayed window and retains the paused App identity', () => {
    const show = vi.fn()
    const control = createComputerControl({ view: { show, hide: vi.fn() } })
    begun(control.begin({ ...calc, windowId: 501 })).end()
    control.stop()
    expect(control.begin({ ...notes, windowId: 601, targetPids: [77, 88] })).toEqual({ refused: appStopped('计算器') })
    expect(show).toHaveBeenLastCalledWith({ state: 'paused', callerName: notes.callerName, app: { pid: 77, name: '计算器', windowId: 501 } })
    control.dispose()
  })

  it('cancels a running multi-App batch when the person stops either participating App', () => {
    const { control } = setup()
    const batch = begun(control.begin({ targetPids: [77, 88] }))
    const other = begun(control.begin({ pid: 99 }))
    const inCalc = begun(control.begin(calc))
    control.stop()
    expect(batch.signal.reason).toBe(appStopped('计算器'))
    expect(inCalc.signal.aborted).toBe(true)
    expect(other.signal.aborted).toBe(false)
    batch.end()
    inCalc.end()
    other.end()
    control.resume()
    begun(control.begin({ targetPids: [77, 88] })).end()
    control.dispose()
  })

  it('stopping Calculator does not cancel in-flight Notes work', () => {
    const { control } = setup()
    const inNotes = begun(control.begin(notes))
    const inCalc = begun(control.begin(calc))
    control.stop()
    expect(inCalc.signal.aborted).toBe(true)
    expect(inNotes.signal.aborted).toBe(false)
  })

  it('stops unresolved input even when an earlier App act still has a visible indicator', () => {
    const { control, views } = setup()
    const previous = begun(control.begin(calc))
    const looking = begun(control.begin(untargetedAct))
    control.stop()
    expect(looking.signal.reason).toBe(COMPUTER_STOPPED)
    expect(previous.signal.reason).toBe(COMPUTER_STOPPED)
    expect(views.at(-1)).toBe('paused:云端助理:-')
    expect(control.begin(calc)).toEqual({ refused: COMPUTER_STOPPED })
    expect(control.begin(untargetedAct)).toEqual({ refused: COMPUTER_STOPPED })
    control.resume()
    begun(control.begin(calc)).end()
  })

  it('hides a paused indicator after two minutes and re-shows it on a refused retry', () => {
    const { control, views } = setup()
    begun(control.begin(calc))
    control.stop()
    vi.advanceTimersByTime(2 * 60_000 + 1)
    expect(views.at(-1)).toBe('hide')
    expect(control.begin(calc)).toEqual({ refused: appStopped('计算器') })
    expect(views.at(-1)).toBe('paused:云端助理:计算器')
  })

  it('allows ordinary human activity and switching applications until Stop is explicitly pressed', () => {
    const { control } = setup()
    for (let i = 0; i < 20; i++) {
      const h = begun(control.begin(i % 2 ? calc : notes))
      expect(h.signal.aborted).toBe(false)
      h.end()
    }
  })
})

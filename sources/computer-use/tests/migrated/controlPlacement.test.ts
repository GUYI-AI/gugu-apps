// Pure geometry regressions migrated from gugu@5ecc5f06; no Electron window belongs to this App.
import { describe, expect, it } from 'vitest'
import { computerBarBounds, resolveComputerWindow } from '../../runtime/placement'
const area = { x: 0, y: 0, width: 1440, height: 900 }
const window = (window_id = 11, x = 100) => ({ pid: 7, window_id, is_on_screen: true, on_current_space: true,
  bounds: { x, y: 100, width: 600, height: 400 } })
describe('App-owned control geometry', () => {
  it('matches an exact valid visible window and never guesses among windows of one App', () => {
    expect(resolveComputerWindow({ windows: [window(11), window(12, 800)] }, { pid: 7, windowId: 12 })?.bounds.x).toBe(800)
    expect(resolveComputerWindow({ windows: [window(11), window(12)] }, { pid: 7 })).toBeNull()
    for (const change of [{ is_on_screen: false }, { on_current_space: false }, { pid: 8 }, { window_id: 12 }, { bounds: { x: NaN, y: 0, width: 10, height: 10 } }]) {
      expect(resolveComputerWindow({ windows: [{ ...window(), ...change }] }, { pid: 7, windowId: 11 })).toBeNull()
    }
  })
  it('anchors on negative-origin displays and narrows within a partially offscreen window', () => {
    expect(computerBarBounds({ x: -1200, y: -800, width: 700, height: 500 }, { x: -1440, y: -900, width: 1440, height: 900 }))
      .toEqual({ x: -1010, y: -843, width: 236, height: 44 })
    expect(computerBarBounds({ x: -50, y: 10, width: 300, height: 200 }, area)).toEqual({ x: 8, y: 10, width: 234, height: 44 })
    expect(computerBarBounds({ x: 0, y: 0, width: 100, height: 100 }, area)).toBeNull()
  })
})

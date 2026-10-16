import { installJsdomCanvasStub } from './jsdom-canvas-stub'

// The browser's gaps in jsdom, for the files that ask for it (`// @vitest-environment jsdom`); node has no window.
if (typeof window !== 'undefined') {
  // jsdom has no ResizeObserver; a real Chromium always has one.
  class ResizeObserverMock {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver

  const storage = new Map<string, string>()
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      get length() {
        return storage.size
      },
      key(index: number) {
        return Array.from(storage.keys())[index] ?? null
      },
      getItem(key: string) {
        return storage.get(key) ?? null
      },
      setItem(key: string, value: string) {
        storage.set(key, value)
      },
      removeItem(key: string) {
        storage.delete(key)
      },
      clear() {
        storage.clear()
      },
    },
  })

  // jsdom's canvas has no 2D context; why and what the stub answers is in its header.
  installJsdomCanvasStub()
}

import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

// 咕咕办公's tests: the page and the skill's scripts in node / jsdom (a file wanting a DOM says so on its first line,
// `// @vitest-environment jsdom`), and two that need a real Chromium (test/browser/).
// Waits are on facts (test/support/awaitCondition.ts), never on a clock: no case has a time limit but the browser cases'
// one cap, which only says where a case got stuck when a fact never comes.
const BROWSER_CASE_CAP_MS = 60_000;

export default defineConfig({
  test: {
    testTimeout: 0,
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'node',
          setupFiles: ['test/support/setup.ts'],
          include: ['test/*.test.ts'],
        },
      },
      {
        test: {
          name: 'browser',
          testTimeout: BROWSER_CASE_CAP_MS,
          hookTimeout: BROWSER_CASE_CAP_MS,
          fileParallelism: false,
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium', name: 'browser-chromium' }],
          },
          include: ['test/browser/*.test.ts'],
        },
      },
    ],
  },
});

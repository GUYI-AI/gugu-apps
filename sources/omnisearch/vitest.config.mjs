import { defineConfig } from 'vitest/config';

// 全能搜索's tests: launch.mjs, the layer between gugu and the search program, run as gugu runs it. Waits are on facts
// (test/support/awaitFact.ts): no case has a time limit.
export default defineConfig({
  test: {
    testTimeout: 0,
    environment: 'node',
    include: ['test/*.test.ts'],
  },
});

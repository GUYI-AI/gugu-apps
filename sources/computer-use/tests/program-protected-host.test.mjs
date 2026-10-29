import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createProtectedHost } from '../app/program/program-core.mjs';
test('protect the host main above its runtime helper and preserve actual package names', async () => {
  const probe = createProtectedHost({ platform: 'darwin', pid: 80, parent: 70, run: async () => ({ stdout: ' 80 70 /Gugu.app/Contents/Frameworks/Helper.app/Contents/MacOS/Helper\n 70 60 /Gugu.app/Contents/Frameworks/Helper.app/Contents/MacOS/Helper\n 60 1 /Gugu.app/Contents/MacOS/Gugu\n' }), read: async () => '<key>CFBundleIdentifier</key><string>app.gugu.test</string>' });
  const value = await probe(); assert.deepEqual([...value.pids], [80, 70, 60]); assert(value.names.has('app.gugu.test')); assert(value.names.has('gugu'));
});
test('missing or changed process ancestry fails closed instead of protecting a guessed PID', async () => {
  for (const stdout of ['80 1 /node\n', '80 70 /node\n70 60 /helper\n']) {
    await assert.rejects(createProtectedHost({ platform: 'darwin', pid: 80, parent: 70, run: async () => ({ stdout }) })(), /owner|ancestry/);
  }
});
test('Windows ancestry uses the same protected owner chain without command interpolation', async () => {
  const value = await createProtectedHost({ platform: 'win32', pid: 80, parent: 70, run: async (command, args) => { assert.equal(command, 'powershell.exe'); assert(args.includes('-NonInteractive')); return { stdout: JSON.stringify([{ ProcessId: 80, ParentProcessId: 70, ExecutablePath: 'C:\\Gugu\\helper.exe' }, { ProcessId: 70, ParentProcessId: 1, ExecutablePath: 'C:\\Gugu\\Gugu.exe' }]) }; } })();
  assert.deepEqual([...value.pids], [80, 70]); assert(value.names.has('gugu'));
});

test('binary host plists are decoded before admission rather than dropping the bundle identity', async () => {
  const value = await createProtectedHost({ platform: 'darwin', pid: 80, parent: 70,
    run: async (command, args) => {
      if (command === '/bin/ps') { assert(args.includes('-ww')); return { stdout: '80 70 /Gugu.app/Contents/MacOS/Gugu\n70 1 /usr/libexec/parent\n' }; }
      assert.equal(command, '/usr/bin/plutil'); assert.equal(args.at(-1), '/Gugu.app/Contents/Info.plist'); return { stdout: 'app.gugu.binary\n' };
    }, read: async () => 'bplist00' })();
  assert(value.names.has('app.gugu.binary'));
});

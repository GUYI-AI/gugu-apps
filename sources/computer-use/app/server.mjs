import { runServer } from './launch.mjs';

try {
  const child = runServer(JSON.parse(process.env.GUGU_APP_SETTINGS ?? '{}'));
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => child.kill(signal));
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}

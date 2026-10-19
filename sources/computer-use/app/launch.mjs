import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { isAbsolute, join } from 'node:path';
import { spawn } from 'node:child_process';

export function launchConfig(settings, { platform = process.platform, home = homedir(), exists = existsSync } = {}) {
  if (settings.command !== undefined && typeof settings.command !== 'string') throw new Error('MCP 程序必须是字符串。');
  let command = settings.command?.trim() ?? '';
  if (!command) {
    if (platform !== 'darwin') {
      throw new Error('这台电脑上没有可自动查找的 Computer Use 客户端：自动查找只支持 macOS 上的 Codex Computer Use。'
        + '请在 App 配置页的「MCP 程序」中填写本机 Computer Use MCP 程序的路径，并按它的说明填写「启动参数」。');
    }
    const installed = join(home, '.codex/computer-use/Codex Computer Use.app/Contents/SharedSupport/SkyComputerUseClient.app/Contents/MacOS/SkyComputerUseClient');
    if (!exists(installed)) {
      throw new Error('这台电脑上没有安装 Codex Computer Use 客户端。请先按 Codex 的说明安装它；'
        + '或在 App 配置页的「MCP 程序」中填写本机其他 Computer Use MCP 程序的路径。');
    }
    command = installed;
  }
  if (command.startsWith('~/')) command = join(home, command.slice(2));
  if (isAbsolute(command) && !exists(command)) throw new Error(`找不到配置的 MCP 程序：${command}`);
  let args;
  try { args = JSON.parse(settings.arguments ?? '["mcp"]'); }
  catch { throw new Error('启动参数必须是 JSON 字符串数组，例如 ["mcp"]。'); }
  if (!Array.isArray(args) || args.some((arg) => typeof arg !== 'string')) throw new Error('启动参数必须是 JSON 字符串数组。');
  return { command, args };
}

/** Byte-for-byte stdio relay. No shell, no protocol rewriting, no credentials bundled with the App. */
export function runServer(settings, { env = process.env, input = process.stdin, output = process.stdout, error = process.stderr,
  spawnChild = spawn, onExit = (code) => { process.exitCode = code; } } = {}) {
  const { command, args } = launchConfig(settings);
  const childEnv = { ...env };
  // The MCP program is its own executable; gugu's Node-mode switch belongs only to this adapter.
  delete childEnv.ELECTRON_RUN_AS_NODE;
  const child = spawnChild(command, args, { env: childEnv, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true, shell: false });
  input.pipe(child.stdin);
  child.stdout.pipe(output, { end: false });
  child.stderr.pipe(error, { end: false });
  child.stdin.on('error', (cause) => { if (cause.code !== 'EPIPE') error.write(`${cause.message}\n`); });
  child.once('error', (cause) => { error.write(`Computer Use MCP 启动失败：${cause.message}\n`); onExit(1); });
  child.once('exit', (code, signal) => { input.unpipe(child.stdin); input.pause(); onExit(code ?? (signal ? 1 : 0)); });
  return child;
}

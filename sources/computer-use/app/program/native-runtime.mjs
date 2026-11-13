// Computer Use App native runtime. See native/PROVENANCE.md for migrated source and licenses.

// runtime/native/cua-client.ts
import { spawn as nodeSpawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs2 from "node:fs";
import net2 from "node:net";
import os from "node:os";
import path2 from "node:path";
import readline2 from "node:readline";
import { stripVTControlCharacters } from "node:util";

// runtime/native/errors.ts
var NativeCallError = class extends Error {
  constructor(code, message, details) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = "NativeCallError";
  }
};

// runtime/native/cua-daemon-lease.ts
import net from "node:net";
import readline from "node:readline";
var CUA_CANCEL_UNCONFIRMED = "\u5DF2\u8BF7\u6C42\u53D6\u6D88\uFF1B\u64CD\u4F5C\u53EF\u80FD\u90E8\u5206\u6267\u884C\uFF0C\u7ED3\u679C\u672A\u786E\u8BA4\uFF0C\u8BF7\u5148\u68C0\u67E5\u7A97\u53E3";
var MUTATIONS = /* @__PURE__ */ new Set(["click", "double_click", "right_click", "drag", "scroll", "type_text", "type_text_chars", "press_key", "hotkey", "set_value", "move_cursor", "set_window_frame", "invoke_menu", "bring_to_front", "launch_app", "kill_app", "mouse_button_down", "mouse_button_up"]);
function cuaMutates(name, args) {
  if (name !== "run_steps") return MUTATIONS.has(name);
  return Array.isArray(args.steps) && args.steps.some((step) => {
    if (!step || typeof step !== "object") return false;
    if (typeof step.tool === "string") return MUTATIONS.has(step.tool);
    return Object.keys(step).some((tool) => MUTATIONS.has(tool));
  });
}
async function openCuaDaemonLease(options) {
  const connections = /* @__PURE__ */ new Set();
  let closed = false;
  let control = null;
  const unavailable2 = () => new NativeCallError("execution_failed", "\u7535\u8111\u63A7\u5236\u7684\u8FDE\u63A5\u5DF2\u7ED3\u675F\uFF0C\u8BF7\u91CD\u65B0\u83B7\u53D6\u7A97\u53E3\u540E\u518D\u8BD5");
  const close = () => {
    if (closed) return;
    closed = true;
    control?.destroy();
    for (const connection of connections) connection.destroy();
    options.onClosed();
  };
  const exchange = (request, call = {}, mutation = false) => {
    if (closed) return Promise.reject(unavailable2());
    if (call.signal?.aborted) return Promise.reject(new NativeCallError("execution_failed", "\u5DF2\u53D6\u6D88"));
    return new Promise((resolve, reject) => {
      const connection = net.createConnection(options.socket);
      connections.add(connection);
      const lines = readline.createInterface({ input: connection });
      let settled = false;
      let sent = false;
      const finish = (error, value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        call.signal?.removeEventListener("abort", abort);
        connections.delete(connection);
        lines.close();
        connection.destroy();
        if (error) reject(error);
        else resolve(value);
      };
      const cancel = (code) => {
        if (settled) return;
        const retireOwner = mutation && sent;
        const message = code === "timeout" ? "\u7535\u8111\u63A7\u5236\u8BF7\u6C42\u8D85\u65F6\uFF0C\u7ED3\u679C\u672A\u786E\u8BA4" : "\u7535\u8111\u63A7\u5236\u8BF7\u6C42\u5DF2\u53D6\u6D88\uFF0C\u7ED3\u679C\u672A\u786E\u8BA4";
        finish(new NativeCallError(code, retireOwner ? CUA_CANCEL_UNCONFIRMED : message));
        if (retireOwner) close();
      };
      const abort = () => cancel("execution_failed");
      const timer = setTimeout(() => cancel("timeout"), call.timeoutMs ?? options.timeoutMs);
      call.signal?.addEventListener("abort", abort, { once: true });
      connection.once("connect", () => {
        if (settled) return;
        sent = true;
        connection.write(`${JSON.stringify(request)}
`);
      });
      connection.once("error", (error) => finish(new NativeCallError("execution_failed", error.message)));
      connection.once("close", () => finish(unavailable2()));
      lines.once("line", (line) => {
        try {
          const result = JSON.parse(line);
          if (typeof result.ok !== "boolean") throw new Error("Invalid cua-driver response");
          finish(void 0, result);
        } catch (error) {
          finish(new NativeCallError("execution_failed", String(error)));
        }
      });
    });
  };
  try {
    const metadata = await exchange({ method: "metadata" }, { signal: options.signal });
    const identity = metadata.result;
    if (!metadata.ok || identity?.embedded !== true || !identity.driver_version || options.hostBundleId && identity.host_bundle_id !== options.hostBundleId) {
      throw new NativeCallError("execution_failed", "\u7535\u8111\u63A7\u5236\u670D\u52A1\u7684\u5BBF\u4E3B\u8EAB\u4EFD\u4E0D\u5339\u914D");
    }
    if (options.signal?.aborted) throw unavailable2();
    await new Promise((resolve, reject) => {
      control = net.createConnection(options.socket);
      const lines = readline.createInterface({ input: control });
      let acknowledged = false;
      const finish = (error) => {
        clearTimeout(timer);
        options.signal?.removeEventListener("abort", abort);
        if (error) {
          reject(error);
          close();
        } else resolve();
      };
      const abort = () => finish(unavailable2());
      const timer = setTimeout(() => finish(new NativeCallError("timeout", "\u7535\u8111\u63A7\u5236\u4F1A\u8BDD\u672A\u80FD\u542F\u52A8")), options.timeoutMs);
      options.signal?.addEventListener("abort", abort, { once: true });
      control.once("connect", () => control.write(`${JSON.stringify({ method: "session_begin", session_id: options.owner })}
`));
      control.once("error", (error) => finish(error));
      control.once("close", () => {
        clearTimeout(timer);
        lines.close();
        if (!acknowledged) finish(unavailable2());
        close();
      });
      lines.once("line", (line) => {
        try {
          const response = JSON.parse(line);
          if (!response.ok || response.result?.session_begin !== true) throw unavailable2();
          acknowledged = true;
          finish();
        } catch (error) {
          finish(error);
        }
      });
    });
  } catch (error) {
    close();
    throw error;
  }
  return {
    async call(name, args, call = {}) {
      const clean = Object.fromEntries(Object.entries(args).filter(([key]) => !key.startsWith("_")));
      const response = await exchange({ method: "call", name, args: clean, session_id: options.owner, observation_origin: "direct", client_kind: "unknown" }, call, cuaMutates(name, clean));
      if (!response.ok) return { isError: true, content: [{ type: "text", text: response.error ?? "cua-driver refused the call" }], structuredContent: { exit_code: response.exit_code ?? 1 } };
      if (!response.result || typeof response.result !== "object") throw new NativeCallError("execution_failed", "\u7535\u8111\u63A7\u5236\u8FD4\u56DE\u4E86\u65E0\u6548\u5DE5\u5177\u7ED3\u679C");
      return response.result;
    },
    close
  };
}

// runtime/native/cua-observation.ts
import { createHash } from "node:crypto";

// runtime/native/cua-image-sample.ts
function sampleCuaImage(decode, base64) {
  const image = decode(Buffer.from(base64, "base64"));
  if (image.isEmpty()) throw new Error("The native screenshot could not be decoded");
  const { width, height } = image.getSize();
  const scale = Math.min(1, 128 / Math.max(width, height));
  return (scale < 1 ? image.resize({ width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)), quality: "good" }) : image).toBitmap();
}
function sameCuaImageSample(a, b) {
  return a.length === b.length && a.every((value, i) => Math.abs(value - b[i]) <= 1);
}

// runtime/log.ts
function programLogger(component) {
  const write = (fields, message) => {
    process.stderr.write(JSON.stringify({ component, message, ...fields }) + "\n");
  };
  return { info: write, warn: write };
}

// runtime/native/cua-observation.ts
var log = programLogger("computer-observation");
var object = (value) => !!value && typeof value === "object" && !Array.isArray(value);
var number = (value) => typeof value === "number" && Number.isFinite(value);
function createObservationGate() {
  const active2 = /* @__PURE__ */ new Map();
  const key = (args) => number(args.pid) && number(args.window_id) ? `${args.pid}:${args.window_id}` : null;
  return {
    following(args) {
      return active2.get(key(args) ?? "") ?? null;
    },
    async observe(args, work) {
      const window = key(args);
      if (!window) return work();
      const result = Promise.resolve().then(work);
      active2.set(window, result);
      try {
        return await result;
      } finally {
        if (active2.get(window) === result) active2.delete(window);
      }
    }
  };
}
function displayOnlyObservation(result) {
  if (result.isError) return result;
  const allowed = /* @__PURE__ */ new Set(["app_name", "pid", "window_id", "window_title", "window_bounds", "screenshot_width", "screenshot_height", "screenshot_scale", "screenshot_mime_type", "screenshot_frame_valid"]);
  return { content: result.content?.filter((block) => block.type === "image"), structuredContent: { ...Object.fromEntries(Object.entries(result.structuredContent ?? {}).filter(([key]) => allowed.has(key))), display_only: true } };
}
function transientObservationError(result) {
  return result.isError === true && (result.content ?? []).some((block) => block.type === "text" && /No content produced|px_frame_mismatch|px_capture_unavailable/i.test(block.text ?? ""));
}
function frame(result, sampleImage) {
  const data = result.structuredContent;
  const bounds = data?.window_bounds;
  const image = result.content?.findLast((block) => block.type === "image" && typeof block.data === "string");
  if (result.isError || !image?.data || !object(bounds) || data?.screenshot_frame_valid === false) return null;
  return { bounds, fingerprint: createHash("sha256").update(sampleImage ? "" : image.data).update(JSON.stringify([bounds, data?.screenshot_width, data?.screenshot_height])).digest("hex"), pixels: sampleImage?.(image.data) };
}
function sameFrame(a, b) {
  return a?.fingerprint === b.fingerprint && (a.pixels && b.pixels ? sameCuaImageSample(a.pixels, b.pixels) : !a.pixels && !b.pixels);
}
function matchesWindow(result, bounds, windowId) {
  const windows = result.structuredContent?.windows;
  if (result.isError || !Array.isArray(windows)) return false;
  const window = windows.find((value) => object(value) && value.window_id === windowId);
  const current = window?.bounds;
  return object(current) && ["x", "y", "width", "height"].every((key) => current[key] === bounds[key]);
}
async function settleCuaWindow(input) {
  const started = (input.now ?? Date.now)();
  try {
    return await settleWindow(input);
  } catch (error) {
    log.warn({ error: String(error), pid: input.args.pid, window_id: input.args.window_id }, "post-action image sampling failed");
    return { isError: true, content: [{ type: "text", text: "Post-action image sampling failed. The input may already have completed; read again before acting." }], structuredContent: { observation_stability: { status: "unavailable", elapsed_ms: (input.now ?? Date.now)() - started } } };
  }
}
async function settleWindow(input) {
  const { args, read } = input;
  if (!number(args.pid) || !number(args.window_id) || args.include_screenshot === false) return input.initial;
  const now = input.now ?? Date.now;
  const pause = input.pause ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const started = now();
  let latest = input.initial;
  let grounded = input.initial;
  let groundedFrame = grounded.structuredContent?.display_only === true && args.display_only !== true ? null : frame(grounded, input.sampleImage);
  const sampleArgs = { ...args, include_accessibility_tree: false, display_only: true, full_output: false, verbose: false };
  let changedAt = started;
  let samples = groundedFrame ? 1 : 0;
  let matches = false;
  let stable = false;
  let checkedAt = null;
  let deadlineReached = false;
  while (now() - started < input.budgetMs) {
    await pause(Math.min(60, Math.max(0, input.budgetMs - (now() - started))));
    if (now() - started >= input.budgetMs) break;
    let next;
    let windows;
    const reground = !groundedFrame;
    try {
      next = await read("get_window_state", reground ? args : sampleArgs);
      if (next.isError) {
        if (!transientObservationError(next)) return next;
        groundedFrame = null;
        changedAt = now();
        latest = next;
        matches = false;
        continue;
      }
      windows = await read("list_windows", { pid: args.pid, ...args.session ? { session: args.session } : {} });
      if (windows.isError) return windows;
    } catch (error) {
      if (object(error) && error.code === "timeout" && now() - started >= input.budgetMs) {
        deadlineReached = true;
        log.warn({ error: String(error), pid: args.pid, window_id: args.window_id }, "post-action observation deadline reached");
        break;
      }
      log.warn({ error: String(error), pid: args.pid, window_id: args.window_id }, "post-action observation failed");
      return { isError: true, content: [{ type: "text", text: "Post-action observation failed. The input may already have completed; do not repeat it without reading the window." }], structuredContent: { observation_stability: { status: "unavailable", samples, elapsed_ms: now() - started } } };
    }
    const nextFrame = frame(next, input.sampleImage);
    if (!nextFrame) {
      groundedFrame = null;
      changedAt = now();
      latest = next;
      matches = false;
      continue;
    }
    samples++;
    latest = next;
    matches = matchesWindow(windows, nextFrame.bounds, args.window_id);
    if (!matches) {
      groundedFrame = null;
      changedAt = now();
      continue;
    }
    checkedAt = now();
    if (reground) {
      grounded = next;
      groundedFrame = next.structuredContent?.display_only === true && args.display_only !== true ? null : nextFrame;
      changedAt = now();
      continue;
    }
    if (!sameFrame(groundedFrame, nextFrame)) {
      groundedFrame = null;
      changedAt = now();
      continue;
    }
    if (now() - started >= input.budgetMs) break;
    if (samples >= 2 && now() - started >= 300 && now() - changedAt >= 180) {
      stable = true;
      break;
    }
  }
  const observation = {
    status: stable ? "stable" : "timeout",
    samples,
    elapsed_ms: now() - started,
    quiet_ms: now() - changedAt,
    ...deadlineReached ? { deadline_code: "timeout" } : {},
    ...checkedAt !== null && matches ? { last_geometry_check_age_ms: now() - checkedAt } : {}
  };
  if (!frame(latest, input.sampleImage) || !matches) {
    return { isError: true, content: [{ type: "text", text: "The window did not produce a screenshot matching its current geometry before the observation deadline. Read the window again before acting." }], structuredContent: { observation_stability: observation } };
  }
  const shown = stable && args.display_only !== true ? grounded : displayOnlyObservation(stable ? grounded : latest);
  return { ...shown, ...!stable ? { content: [{ type: "text", text: "Post-action sampling timed out. This is the last picture checked against window geometry, for display only; stability was not confirmed. Read the window again before acting." }, ...shown.content ?? []] } : {}, structuredContent: { ...shown.structuredContent, observation_stability: observation } };
}
function batchObservation(result) {
  const observation = result.structuredContent?.observation;
  return object(observation) && observation.ok === true && object(observation.state) ? observation.state : null;
}
function batchObservationArgs(result, args) {
  const steps = Array.isArray(args.steps) ? args.steps : [];
  const last = steps.at(-1);
  if (object(last) && (last.tool === "zoom" || "zoom" in last)) return null;
  const observe = object(args.observe) ? args.observe : {};
  const hasPicture = result.content?.some((block) => block.type === "image") === true;
  if (!hasPicture && observe.include_screenshot !== true) return null;
  if (!number(result.structuredContent?.executed) || result.structuredContent.executed <= 0) return null;
  const reports = result.structuredContent?.steps;
  const targets = Array.isArray(reports) ? reports.flatMap((report) => {
    const target2 = object(report) && object(report.target) ? report.target.window : null;
    return object(target2) ? [target2] : [];
  }) : [];
  const target = batchObservation(result) ?? targets.at(-1) ?? args;
  if (!number(target.pid) || !number(target.window_id)) return null;
  return { ...observe, pid: target.pid, window_id: target.window_id, include_screenshot: true, ...args.session ? { session: args.session } : {} };
}
function replaceBatchObservation(result, fresh) {
  const header = result.content?.find((block) => block.type === "text")?.text?.split(/\nobservation:/)[0] ?? "run_steps completed";
  const original = result.structuredContent?.observation;
  const initialMessage = object(original) && typeof original.message === "string" ? original.message : null;
  const stability = fresh.structuredContent?.observation_stability;
  const timedOut = object(stability) && stability.status === "timeout";
  const observed = fresh.isError !== true && !timedOut;
  return {
    ...result,
    content: [{ type: "text", text: header }, ...fresh.content ?? []],
    structuredContent: {
      ...result.structuredContent,
      observation: { ok: observed, tool: "get_window_state", state: fresh.structuredContent, summary: !observed ? "Post-action observation did not settle; read again before acting." : "Post-action screenshot checked against current window geometry.", ...initialMessage ? { initial_message: initialMessage, recovered_initial_observation: observed } : {} }
    }
  };
}

// runtime/native/linux-display.ts
import fs from "node:fs";
import path from "node:path";
function linuxScreen(source, deps = {}) {
  if (source.DISPLAY || source.WAYLAND_DISPLAY) return {};
  const uid = deps.uid ?? process.getuid?.();
  if (uid === void 0) return {};
  const files = deps.fs ?? fs;
  const owned = (file) => {
    try {
      const stat = files.statSync(file);
      return stat.uid === uid && stat.isSocket();
    } catch {
      return false;
    }
  };
  const list = (dir) => {
    try {
      return files.readdirSync(dir);
    } catch {
      return [];
    }
  };
  const runtime = source.XDG_RUNTIME_DIR || `/run/user/${uid}`;
  const bus = path.join(runtime, "bus");
  const session = source.DBUS_SESSION_BUS_ADDRESS || !owned(bus) ? {} : { DBUS_SESSION_BUS_ADDRESS: `unix:path=${bus}` };
  const x = list("/tmp/.X11-unix").map((name) => /^X(\d+)$/.exec(name)?.[1]).filter((n) => n !== void 0).map(Number).sort((a, b) => a - b).find((n) => owned(`/tmp/.X11-unix/X${n}`));
  if (x !== void 0) return { DISPLAY: `:${x}`, ...session };
  const wayland = list(runtime).filter((name) => /^wayland-\d+$/.test(name)).sort().find((name) => owned(path.join(runtime, name)));
  if (wayland) return { WAYLAND_DISPLAY: wayland, XDG_RUNTIME_DIR: runtime, ...session };
  return {};
}

// runtime/native/cua-client.ts
var IDLE_MS = 10 * 6e4;
var READY_MS = 15e3;
var LANE_IDLE_MS = 10 * 6e4;
var SLOW_MS = 1e4;
var RETURN_RESERVE_MS = 500;
var INPUTS = /* @__PURE__ */ new Set(["click", "double_click", "right_click", "drag", "scroll", "type_text", "press_key", "hotkey", "set_value", "set_window_frame", "invoke_menu", "run_steps"]);
var START_FAILED = "\u7535\u8111\u63A7\u5236\u6CA1\u80FD\u542F\u52A8\uFF1A\u8BF7\u91CD\u542F Computer Use App\uFF1B\u8FD8\u4E0D\u884C\u5C31\u91CD\u65B0\u5B89\u88C5\u8FD9\u4E2A App";
var CRASHED = "\u7535\u8111\u63A7\u5236\u610F\u5916\u505C\u4E86\uFF1A\u518D\u8C03\u4E00\u6B21\u4F1A\u81EA\u52A8\u91CD\u65B0\u542F\u52A8";
var DISCONNECTED = "\u7535\u8111\u63A7\u5236\u7684\u8FDE\u63A5\u65AD\u4E86\uFF1A\u518D\u8C03\u4E00\u6B21\u4F1A\u81EA\u52A8\u91CD\u65B0\u8FDE\u4E0A";
var PASS_THROUGH = [
  "PATH",
  "HOME",
  "USER",
  "LOGNAME",
  "TMPDIR",
  "LANG",
  "LC_ALL",
  "CUA_LOG",
  "SystemRoot",
  "windir",
  "USERPROFILE",
  "APPDATA",
  "LOCALAPPDATA",
  "TEMP",
  "TMP",
  "ComSpec",
  "PATHEXT",
  "SystemDrive",
  "ProgramData",
  // Linux: the display and accessibility bus the driver observes and drives.
  "DISPLAY",
  "XAUTHORITY",
  "WAYLAND_DISPLAY",
  "XDG_RUNTIME_DIR",
  "XDG_SESSION_TYPE",
  "DBUS_SESSION_BUS_ADDRESS"
];
function cuaEnvironment(input) {
  const source = input.source ?? (process.platform === "linux" ? { ...process.env, ...linuxScreen(process.env) } : process.env);
  const env = {};
  for (const key of PASS_THROUGH) if (source[key] !== void 0) env[key] = source[key];
  return {
    ...env,
    CUA_DRIVER_EMBEDDED: "1",
    // 默认的 standard:看、点、输、滚不逐次要批;接管已登录的浏览器、杀别人的进程、从工具里弹系统授权一律拒。
    CUA_DRIVER_PERMISSION_MODE: "standard",
    CUA_DRIVER_RS_TELEMETRY_ENABLED: "false",
    CUA_DRIVER_RS_UPDATE_CHECK: "false",
    CUA_DRIVER_RS_HOME: input.home,
    ...input.hostBundleId ? { CUA_DRIVER_HOST_BUNDLE_ID: input.hostBundleId } : {}
  };
}
function cuaSocketPath(platform = process.platform, pid = process.pid) {
  return platform === "win32" ? `\\\\.\\pipe\\gugu-cua-${pid}` : path2.join(os.tmpdir(), `gugu-cua-${pid}.sock`);
}
var pipeAccepting = (pipe) => new Promise((resolve) => {
  const socket = net2.connect(pipe);
  socket.once("connect", () => {
    socket.destroy();
    resolve(true);
  });
  socket.once("error", () => resolve(false));
});
function createCuaClient(options) {
  const platform = options.platform ?? process.platform;
  const socket = options.socketPath ?? cuaSocketPath(platform);
  const spawn = options.spawn ?? ((command2, args, spawnOptions) => nodeSpawn(command2, args, spawnOptions));
  const laneIdleMs = options.laneIdleMs ?? LANE_IDLE_MS;
  let daemon = null;
  let daemonReady = null;
  let nextId = 1;
  let idle = null;
  const pendingOf = /* @__PURE__ */ new WeakMap();
  const lanes = /* @__PURE__ */ new Map();
  const needsObservation = /* @__PURE__ */ new Set();
  const observations = createObservationGate();
  let disposed = false;
  const failAll = (proc, error) => {
    const pending = pendingOf.get(proc);
    if (!pending) return;
    for (const [id, p] of pending) {
      p.reject(error);
      pending.delete(id);
    }
  };
  const write = (proc, message) => {
    const stdin = proc.stdin;
    if (!stdin || stdin.destroyed || stdin.writableEnded) return false;
    stdin.write(`${JSON.stringify(message)}
`);
    return true;
  };
  const request = (proc, method, params) => {
    const id = nextId++;
    const done = new Promise((resolve, reject) => {
      pendingOf.get(proc)?.set(id, { resolve, reject });
      if (write(proc, { jsonrpc: "2.0", id, method, params })) return;
      pendingOf.get(proc)?.delete(id);
      reject(new NativeCallError("execution_failed", DISCONNECTED));
    });
    return { id, done };
  };
  const within = (work, timeoutMs, timedOut, signal) => {
    if (signal?.aborted) return Promise.reject(new NativeCallError("execution_failed", "\u5DF2\u53D6\u6D88"));
    return new Promise((resolve, reject) => {
      const settle = () => {
        clearTimeout(timer);
        signal?.removeEventListener("abort", onAbort);
      };
      const timer = setTimeout(() => {
        settle();
        reject(timedOut());
      }, timeoutMs);
      const onAbort = () => {
        settle();
        reject(new NativeCallError("execution_failed", "\u5DF2\u53D6\u6D88"));
      };
      signal?.addEventListener("abort", onAbort, { once: true });
      work.then(
        (value) => {
          settle();
          resolve(value);
        },
        (error) => {
          settle();
          reject(error);
        }
      );
    });
  };
  const closeLane = (key, lane, reason) => {
    if (lane.closed) return;
    lane.closed = true;
    if (lanes.get(key) === lane) {
      lanes.delete(key);
      needsObservation.delete(key);
    }
    if (lane.idle) clearTimeout(lane.idle);
    lane.idle = null;
    lane.startup.abort();
    if (lane.direct) {
      lane.direct.close();
    }
    const p = lane.proc;
    if (p) {
      failAll(p, new NativeCallError("execution_failed", reason));
      p.stdin?.end();
      p.kill();
    }
    if (lanes.size === 0) stopDaemon();
  };
  const stopDaemon = () => {
    if (idle) clearTimeout(idle);
    idle = null;
    const oldDaemon = daemon;
    daemon = null;
    daemonReady = null;
    oldDaemon?.kill();
    if (platform !== "win32") {
      try {
        fs2.rmSync(socket, { force: true });
      } catch (error) {
        options.log?.warn({ err: String(error) }, "cua-driver socket could not be removed");
      }
    }
  };
  const shutdown = (reason) => {
    for (const [key, lane] of [...lanes]) closeLane(key, lane, reason);
    stopDaemon();
  };
  const waitForSocket = async (child) => {
    const deadline = Date.now() + (options.readyTimeoutMs ?? READY_MS);
    while (Date.now() < deadline) {
      if (child.exitCode !== null || child.signalCode !== null) {
        options.log?.warn({ code: child.exitCode, signal: child.signalCode }, "cua-driver serve exited before its socket was ready");
        throw new NativeCallError("execution_failed", START_FAILED);
      }
      if (platform === "win32" ? await pipeAccepting(socket) : fs2.existsSync(socket)) return;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    options.log?.warn({ timeoutMs: options.readyTimeoutMs ?? READY_MS }, "cua-driver serve did not open its socket in time");
    throw new NativeCallError("execution_failed", START_FAILED);
  };
  const driverCwd = () => os.homedir();
  const environment2 = () => cuaEnvironment({ home: options.home, ...options.hostBundleId ? { hostBundleId: options.hostBundleId } : {} });
  const startDaemon = () => {
    if (daemonReady) return daemonReady;
    shutdown("\u7535\u8111\u63A7\u5236\u91CD\u65B0\u542F\u52A8\u4E86");
    fs2.mkdirSync(options.home, { recursive: true });
    const serveArgs = ["serve", "--embedded", "--socket", socket, ...platform === "win32" ? [] : ["--pid-file", `${socket}.pid`]];
    const d = spawn(options.binary, serveArgs, { cwd: driverCwd(), env: { ...environment2(), CUA_DRIVER_PARENT_LIVENESS_STDIN: "1" }, stdio: ["pipe", "pipe", "pipe"] });
    daemon = d;
    d.stdin?.on("error", () => void 0);
    d.stdout?.on("data", () => void 0);
    let daemonTail = "";
    let pendingLine = "";
    const diagnostic = (raw) => {
      const line = stripVTControlCharacters(raw);
      const nativeAt = line.match(/\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z\b/)?.[0];
      const time = { at: (/* @__PURE__ */ new Date()).toISOString(), ...nativeAt ? { nativeAt } : {} };
      const info = line.match(/\bINFO\s+(?:[\w:]+:\s+)?(.*)$/)?.[1];
      const fieldPattern = /\b([a-z_]+)=("(?:[^"\\\n]|\\.)*"|[^\s]+)/g;
      if (/\bWARN\s+(?:[\w:]+:\s+)?cursor overlay: no arrival within [\d.]+(?:s|ms); continuing without it\s*$/.test(line)) {
        options.log?.warn({ event: "cursor_arrival_timeout", ...time }, "cua-driver cursor arrival timed out");
      } else if (info && info.replace(fieldPattern, "").trim() === "cua input timing") {
        const fields = {};
        for (const match of info.matchAll(fieldPattern)) {
          const key = match[1];
          if (!["tool", "phase", "elapsed_ms", "lock_wait_ms", "dt_ms", "arrived", "session", "pid", "window_id"].includes(key)) continue;
          const value = match[2].replace(/^"|"$/g, "").replace(/^Some\((\d+)\)$/, "$1");
          if (key === "arrived") {
            if (match[2] === "true" || match[2] === "false") fields[key] = match[2] === "true";
          } else if (["elapsed_ms", "lock_wait_ms", "dt_ms", "pid", "window_id"].includes(key)) {
            if (/^\d+(?:\.\d+)?$/.test(value) && Number.isFinite(Number(value))) fields[key] = Number(value);
          } else if (/^[\w.:-]{1,256}$/.test(value)) fields[key] = value;
        }
        options.log?.info({ event: "cua_input_timing", ...time, ...fields }, "cua-driver input timing");
      }
    };
    d.stderr?.on("data", (chunk) => {
      const text = chunk.toString();
      daemonTail = (daemonTail + text).slice(-2e3);
      pendingLine += text;
      let newline;
      while ((newline = pendingLine.indexOf("\n")) >= 0) {
        diagnostic(pendingLine.slice(0, newline));
        pendingLine = pendingLine.slice(newline + 1);
      }
      pendingLine = pendingLine.slice(-2e3);
    });
    d.on("exit", (code, signal) => {
      if (pendingLine) diagnostic(pendingLine);
      options.log?.info({ code, signal, stderrTail: daemonTail.trim().split("\n").slice(-3).join("\n") }, "cua-driver serve exited");
      if (daemon === d) shutdown(CRASHED);
    });
    d.on("error", (error) => {
      options.log?.warn({ err: error.message }, "cua-driver serve failed to start");
      if (daemon === d) shutdown(START_FAILED);
    });
    const ready = waitForSocket(d);
    daemonReady = ready;
    ready.catch((error) => {
      options.log?.warn({ err: String(error) }, "cua-driver did not start");
      if (daemonReady === ready) shutdown(error instanceof NativeCallError ? error.message : START_FAILED);
    });
    return ready;
  };
  const openLane = (key) => {
    const existing = lanes.get(key);
    if (existing) return existing;
    const daemonUp = startDaemon();
    const lane = { ready: Promise.resolve(null), proc: null, session: `${key}-${randomUUID()}`, inflight: 0, users: 0, starting: true, startup: new AbortController(), closed: false, settledAt: 0, idle: null };
    lanes.set(key, lane);
    lane.ready = (async () => {
      await daemonUp;
      if (lanes.get(key) !== lane) throw new NativeCallError("execution_failed", "\u7535\u8111\u63A7\u5236\u91CD\u65B0\u542F\u52A8\u4E86");
      if (platform === "darwin") {
        const owner = daemon;
        const direct = await openCuaDaemonLease({
          socket,
          owner: `mcp-gugu-${randomUUID()}`,
          timeoutMs: options.readyTimeoutMs ?? READY_MS,
          signal: lane.startup.signal,
          ...options.hostBundleId ? { hostBundleId: options.hostBundleId } : {},
          onClosed: () => {
            if (lanes.get(key) === lane) closeLane(key, lane, DISCONNECTED);
          }
        });
        if (disposed || lanes.get(key) !== lane || daemon !== owner) {
          direct.close();
          throw new NativeCallError("execution_failed", "\u7535\u8111\u63A7\u5236\u91CD\u65B0\u542F\u52A8\u4E86");
        }
        lane.direct = direct;
        lane.starting = false;
        return daemon;
      }
      const p = spawn(options.binary, ["mcp", "--embedded", "--socket", socket], { cwd: driverCwd(), env: environment2(), stdio: ["pipe", "pipe", "pipe"] });
      lane.proc = p;
      p.stdin?.on("error", (error) => options.log?.info({ err: error.message, lane: key }, "cua-driver mcp stdin closed"));
      const pending = /* @__PURE__ */ new Map();
      pendingOf.set(p, pending);
      const lines = readline2.createInterface({ input: p.stdout });
      lines.on("line", (line) => {
        let msg;
        try {
          msg = JSON.parse(line);
        } catch {
          return;
        }
        if (typeof msg.id !== "number") return;
        const waiter = pending.get(msg.id);
        if (!waiter) return;
        pending.delete(msg.id);
        if (msg.error) waiter.reject(new NativeCallError("execution_failed", String(msg.error.message ?? "cua-driver \u62A5\u9519")));
        else waiter.resolve(msg.result);
      });
      p.stderr?.on("data", () => void 0);
      p.on("exit", (code, signal) => {
        options.log?.info({ code, signal, lane: key }, "cua-driver mcp exited");
        failAll(p, new NativeCallError("execution_failed", DISCONNECTED));
        if (lanes.get(key) === lane) closeLane(key, lane, DISCONNECTED);
      });
      p.on("error", (error) => {
        options.log?.warn({ err: error.message, lane: key }, "cua-driver mcp failed to start");
        failAll(p, new NativeCallError("execution_failed", START_FAILED));
      });
      const readyMs = options.readyTimeoutMs ?? READY_MS;
      await within(request(p, "initialize", {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "gugu", version: options.clientVersion }
      }).done, readyMs, () => {
        options.log?.warn({ timeoutMs: readyMs, lane: key }, "cua-driver mcp did not answer initialize in time");
        return new NativeCallError("execution_failed", START_FAILED);
      }, lane.startup.signal);
      write(p, { jsonrpc: "2.0", method: "notifications/initialized" });
      lane.starting = false;
      return p;
    })();
    lane.ready.catch((error) => {
      options.log?.warn({ err: String(error), lane: key }, "cua-driver lane did not start");
      closeLane(key, lane, error instanceof NativeCallError ? error.message : START_FAILED);
    });
    return lane;
  };
  const touch = () => {
    if (idle) clearTimeout(idle);
    idle = setTimeout(() => shutdown("\u7535\u8111\u63A7\u5236\u95F2\u7F6E\u592A\u4E45,\u5DF2\u5173\u95ED"), IDLE_MS);
    idle.unref?.();
  };
  const touchLane = (key, lane) => {
    if (lane.idle) clearTimeout(lane.idle);
    lane.idle = setTimeout(() => {
      if (lane.users === 0) closeLane(key, lane, "\u8FD9\u6761\u7535\u8111\u63A7\u5236\u7684\u8FDE\u63A5\u95F2\u7F6E\u592A\u4E45,\u5DF2\u5173\u95ED");
    }, laneIdleMs);
    lane.idle.unref?.();
  };
  const send = async (key, name, args, callOptions) => {
    const asked = Date.now();
    const timeoutMs = Math.min(callOptions.timeoutMs ?? 12e4, callOptions.remainingMs?.() ?? Infinity);
    const exhausted = () => new NativeCallError("timeout", `${name} \u6267\u884C\u9884\u7B97\u5DF2\u8017\u5C3D\uFF0C\u672C\u6B21\u64CD\u4F5C\u6CA1\u6709\u53D1\u51FA`);
    if (callOptions.signal?.aborted) throw new NativeCallError("execution_failed", "\u5DF2\u53D6\u6D88\uFF0C\u672C\u6B21\u64CD\u4F5C\u6CA1\u6709\u53D1\u51FA");
    if (timeoutMs <= 0) throw exhausted();
    const lane = openLane(key);
    lane.users += 1;
    try {
      const p = await within(
        lane.ready,
        timeoutMs,
        () => new NativeCallError("timeout", `\u7535\u8111\u63A7\u5236 ${Math.round(timeoutMs / 1e3)} \u79D2\u5185\u6CA1\u80FD\u542F\u52A8,${name} \u6CA1\u6709\u53D1\u51FA\u53BB`),
        callOptions.signal
      );
      if (disposed || lanes.get(key) !== lane || callOptions.signal?.aborted) throw new NativeCallError("execution_failed", "\u7535\u8111\u63A7\u5236\u5DF2\u53D6\u6D88\u6216\u91CD\u65B0\u542F\u52A8\uFF0C\u672C\u6B21\u64CD\u4F5C\u6CA1\u6709\u53D1\u51FA");
      const sent = Date.now();
      const left = Math.min(timeoutMs - (sent - asked), callOptions.remainingMs?.() ?? Infinity);
      if (left <= 0) throw exhausted();
      touch();
      touchLane(key, lane);
      lane.inflight += 1;
      const forwarded = typeof args.session === "string" && args.session ? { ...args, session: lane.session } : args;
      const { id, done } = lane.direct ? { id: 0, done: lane.direct.call(name, forwarded, { signal: callOptions.signal, timeoutMs: left }) } : request(p, "tools/call", { name, arguments: forwarded });
      let timer = null;
      let onAbort = null;
      const mutation = cuaMutates(name, args);
      const cancel = (why, error, reject) => {
        if (!lane.direct) {
          pendingOf.get(p)?.delete(id);
          write(p, { jsonrpc: "2.0", method: "notifications/cancelled", params: { requestId: id, reason: why } });
        }
        if (mutation) closeLane(key, lane, error.message);
        reject(error);
      };
      try {
        return await Promise.race([
          done,
          new Promise((_, reject) => {
            timer = setTimeout(() => cancel("timeout", new NativeCallError("timeout", `${name} \u8D85\u8FC7 ${Math.round(timeoutMs / 1e3)} \u79D2\u6CA1\u505A\u5B8C\uFF1B${CUA_CANCEL_UNCONFIRMED}`), reject), left);
            onAbort = () => cancel("cancelled", new NativeCallError("execution_failed", CUA_CANCEL_UNCONFIRMED), reject);
            callOptions.signal?.addEventListener("abort", onAbort, { once: true });
          })
        ]);
      } catch (error) {
        if (mutation && error instanceof NativeCallError && (error.code === "timeout" || callOptions.signal?.aborted)) closeLane(key, lane, CUA_CANCEL_UNCONFIRMED);
        throw error;
      } finally {
        if (timer) clearTimeout(timer);
        if (onAbort) callOptions.signal?.removeEventListener("abort", onAbort);
        const end = Date.now();
        const before = lane.settledAt;
        lane.inflight -= 1;
        lane.settledAt = end;
        touch();
        if (lanes.get(key) === lane) touchLane(key, lane);
        if (end - asked >= SLOW_MS) {
          const waited = Math.max(0, Math.min(before, end) - sent);
          options.log?.warn({ tool: name, lane: key, totalMs: end - asked, startMs: sent - asked, queuedMs: waited, driverMs: end - sent - waited, lanes: lanes.size }, "cua-driver call was slow");
        }
      }
    } finally {
      lane.users -= 1;
      if (lane.starting && lane.users === 0) closeLane(key, lane, "\u7535\u8111\u63A7\u5236\u542F\u52A8\u5DF2\u53D6\u6D88");
      else if (lanes.get(key) === lane) touchLane(key, lane);
    }
  };
  const sessionEnded = (result) => result?.isError === true && (result.content ?? []).some((block) => block.type === "text" && typeof block.text === "string" && block.text.includes("session has ended"));
  return {
    async cursorState(session, signal) {
      const lane = lanes.get(session);
      if (!lane || !lane.direct || disposed) return null;
      return lane.direct.call("get_agent_cursor_state", { session: lane.session }, { ...signal ? { signal } : {}, timeoutMs: 2e3 });
    },
    available() {
      if (!options.binary) return { ok: false, message: options.missingMessage };
      if (!fs2.existsSync(options.binary)) return { ok: false, message: `${options.missingMessage}(\u627E\u4E0D\u5230 ${options.binary})` };
      return { ok: true };
    },
    async callTool(name, args, callOptions = {}) {
      if (disposed) throw new NativeCallError("execution_failed", "Computer Use App \u6B63\u5728\u9000\u51FA\uFF0C\u7535\u8111\u63A7\u5236\u5DF2\u5173\u95ED");
      const available = this.available();
      if (!available.ok) throw new NativeCallError("unsupported", available.message);
      if (callOptions.signal?.aborted) throw new NativeCallError("execution_failed", "\u5DF2\u53D6\u6D88");
      const askedAt = Date.now();
      const remainingMs = () => Math.max(0, Math.min(
        (callOptions.timeoutMs ?? 12e4) - (Date.now() - askedAt),
        callOptions.remainingMs ? callOptions.remainingMs() - RETURN_RESERVE_MS : Infinity
      ));
      const budgetOptions = { ...callOptions, remainingMs };
      if (remainingMs() <= 0) throw new NativeCallError("timeout", `${name} \u6267\u884C\u9884\u7B97\u5DF2\u8017\u5C3D\uFF0C\u672C\u6B21\u64CD\u4F5C\u6CA1\u6709\u53D1\u51FA`);
      if (name === "get_window_state" && args.display_only === true) {
        const closingRead = observations.following(args);
        if (closingRead) return displayOnlyObservation(await within(
          closingRead,
          Math.min(remainingMs(), callOptions.timeoutMs ?? 1e4),
          () => new NativeCallError("timeout", "\u64CD\u4F5C\u540E\u7684\u753B\u9762\u4ECD\u5728\u83B7\u53D6\u4E2D"),
          callOptions.signal
        ));
      }
      const session = typeof args.session === "string" && args.session ? args.session : null;
      const key = session ?? callOptions.lane ?? "";
      let result = await send(key, name, args, budgetOptions);
      if (session && sessionEnded(result)) {
        const revived = await send(key, "start_session", { session }, budgetOptions);
        options.log?.info({ tool: name, session, revived: revived?.isError !== true }, "cua session had ended; started it again");
        if (revived?.isError === true) return result;
        result = await send(key, name, args, budgetOptions);
      }
      if (result.isError === true && !(name === "get_window_state" && needsObservation.has(key) && transientObservationError(result))) return result;
      if (result.isError !== true && INPUTS.has(name)) needsObservation.add(key);
      const state = name === "run_steps" ? batchObservation(result) : null;
      const batch = name === "run_steps" ? batchObservationArgs(result, args) : null;
      const subsequentRead = name === "get_window_state" && args.include_screenshot !== false && args.display_only !== true && needsObservation.has(key);
      if (platform !== "darwin" || !batch && !subsequentRead) return result;
      const budgetMs = Math.min(8e3, remainingMs());
      const readArgs = batch ?? args;
      const initial = batch ? { content: result.content?.filter((block) => block.type === "image"), structuredContent: state ?? void 0 } : result;
      const observationStarted = Date.now();
      const fresh = await observations.observe(readArgs, () => settleCuaWindow({
        initial,
        args: readArgs,
        budgetMs,
        sampleImage: options.sampleImage,
        read: (tool, values) => send(key, tool, values, {
          ...budgetOptions,
          timeoutMs: Math.max(0, budgetMs - (Date.now() - observationStarted))
        })
      }));
      if (fresh.structuredContent?.observation_stability && fresh.structuredContent.observation_stability.status === "stable") needsObservation.delete(key);
      return batch ? replaceBatchObservation(result, fresh) : fresh;
    },
    stop: shutdown,
    dispose: () => {
      disposed = true;
      shutdown("Computer Use App \u9000\u51FA\u4E86");
    }
  };
}

// runtime/native/cua-window-cursor.ts
var record = (value) => !!value && typeof value === "object" && !Array.isArray(value);
var number2 = (value) => typeof value === "number" && Number.isFinite(value);
function cursorOnWindow(before, after, shot) {
  if (before?.isError || after?.isError) return null;
  const a = before?.structuredContent;
  const b = after?.structuredContent;
  const first = a?.position;
  const last = b?.position;
  const bounds = shot.structuredContent?.window_bounds;
  const width = shot.structuredContent?.screenshot_width;
  const height = shot.structuredContent?.screenshot_height;
  if (a?.enabled !== true || b?.enabled !== true || a.session !== b.session || !record(first) || !record(last) || !number2(first.x) || !number2(first.y) || first.x !== last.x || first.y !== last.y || !record(bounds) || !number2(bounds.x) || !number2(bounds.y) || !number2(bounds.width) || !number2(bounds.height) || bounds.width <= 0 || bounds.height <= 0 || !number2(width) || !number2(height)) return null;
  const x = (first.x - bounds.x) * width / bounds.width;
  const y = (first.y - bounds.y) * height / bounds.height;
  if (x < 0 || y < 0 || x >= width || y >= height) return null;
  const priorVisual = record(a.visual_state) ? a.visual_state : {};
  const visual = record(b.visual_state) ? b.visual_state : {};
  if (["requested_action", "resolved_action", "phase", "preempted_count"].some((key) => priorVisual[key] !== visual[key]) || JSON.stringify(priorVisual.modifiers) !== JSON.stringify(visual.modifiers)) return null;
  return { x, y, revision: `${String(b.session)}:${first.x}:${first.y}:${String(visual.requested_action)}:${String(visual.preempted_count)}`, click: /click/.test(String(visual.requested_action)) };
}

// runtime/control.ts
function appStopped(appName) {
  const app = appName ? `"${appName}"` : "that app";
  return `The person pressed Stop for ${app} on its window's control bar: they are taking ${app} over. Do not operate ${app} until they press "\u7EE7\u7EED / Continue" on that bar; other apps are not affected. Tell them what you did in ${app} and what is left.`;
}
var COMPUTER_STOPPED = 'The person pressed Stop on the bar at the bottom of their screen. Do not use computer.* until they press "\u7EE7\u7EED / Continue" on that bar. Tell them what you have done and what is left.';
var LINGER_MS = 3e4;
var PAUSED_BAR_MS = 2 * 6e4;
var log2 = programLogger("control-display");
function createComputerControl(input) {
  let disposed = false;
  const lingerMs = input.lingerMs ?? LINGER_MS;
  const paused = /* @__PURE__ */ new Map();
  const inFlight = /* @__PURE__ */ new Map();
  let shown = null;
  let hideTimer = null;
  const reportViewError = (error) => {
    try {
      if (input.onViewError) input.onViewError(error);
      else log2.warn({ error: String(error) }, "Computer Use display failed");
    } catch {
    }
  };
  const display = (work) => {
    try {
      void Promise.resolve(work()).catch(reportViewError);
    } catch (error) {
      reportViewError(error);
    }
  };
  const hide = () => display(() => input.view.hide());
  const clearHide = () => {
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = null;
  };
  const hideAfter = (ms) => {
    clearHide();
    hideTimer = setTimeout(() => {
      shown = null;
      hide();
    }, ms);
    hideTimer.unref?.();
  };
  const show = (next) => {
    shown = next;
    clearHide();
    display(() => input.view.show({
      state: next.state,
      ...next.sessionId ? { sessionId: next.sessionId } : {},
      ...next.callerName ? { callerName: next.callerName } : {},
      ...next.taskTitle ? { taskTitle: next.taskTitle } : {},
      ...next.subject === "computer" ? {} : { app: { pid: next.subject, ...next.appName ? { name: next.appName } : {}, ...next.windowId !== void 0 ? { windowId: next.windowId } : {} } }
    }));
  };
  const busy = () => [...inFlight.values()].some((set) => set.size > 0);
  return {
    begin(call) {
      if (disposed) return { refused: "Computer Use App \u5DF2\u505C\u6B62\uFF0C\u4E0D\u80FD\u63A5\u53D7\u65B0\u7684\u64CD\u4F5C\u3002" };
      const identity = { ...call.sessionId ? { sessionId: call.sessionId } : {}, ...call.callerName ? { callerName: call.callerName } : {}, ...call.taskTitle ? { taskTitle: call.taskTitle } : {} };
      const subject = call.pid ?? "computer";
      const subjects = /* @__PURE__ */ new Set([subject, ...call.targetPids ?? []]);
      const blockedBy = paused.has("computer") ? "computer" : [...subjects].find((target) => paused.has(target)) ?? null;
      if (blockedBy !== null) {
        const appName = blockedBy === "computer" ? void 0 : paused.get(blockedBy)?.appName ?? (call.pid === blockedBy ? call.appName : void 0);
        const windowId2 = blockedBy === "computer" ? void 0 : (call.pid === blockedBy ? call.windowId : void 0) ?? paused.get(blockedBy)?.windowId;
        show({ subject: blockedBy, ...identity, ...appName ? { appName } : {}, ...windowId2 !== void 0 ? { windowId: windowId2 } : {}, state: "paused" });
        hideAfter(PAUSED_BAR_MS);
        return { refused: blockedBy === "computer" ? COMPUTER_STOPPED : appStopped(appName) };
      }
      const controller = new AbortController();
      const sets = [...subjects].map((target) => {
        const set = inFlight.get(target) ?? /* @__PURE__ */ new Set();
        set.add(controller);
        inFlight.set(target, set);
        return { target, set };
      });
      const windowId = call.windowId;
      if (!call.deferAttachment) show({ subject, ...identity, ...call.appName ? { appName: call.appName } : {}, ...windowId !== void 0 ? { windowId } : {}, state: "driving" });
      let ended = false;
      return {
        signal: controller.signal,
        end() {
          if (ended) return;
          ended = true;
          for (const { target, set } of sets) {
            set.delete(controller);
            if (set.size === 0 && inFlight.get(target) === set) inFlight.delete(target);
          }
          if (!busy() && shown?.state === "driving") hideAfter(lingerMs);
        }
      };
    },
    stoppedFor(pid) {
      if (disposed) return "Computer Use App \u5DF2\u505C\u6B62";
      if (paused.has("computer")) return COMPUTER_STOPPED;
      return pid !== void 0 && paused.has(pid) ? appStopped(paused.get(pid)?.appName) : null;
    },
    setTargetPaused(call, pause) {
      if (disposed) return "Computer Use App \u5DF2\u505C\u6B62";
      if (!Number.isSafeInteger(call.pid) || call.pid <= 0) throw new Error("A known application is required");
      if (paused.has("computer")) return COMPUTER_STOPPED;
      if (!pause) {
        paused.delete(call.pid);
        if (shown?.subject === call.pid && shown.state === "paused") {
          shown = null;
          clearHide();
          hide();
        }
        return null;
      }
      paused.set(call.pid, { appName: call.appName, windowId: call.windowId });
      const reason = appStopped(call.appName);
      for (const controller of inFlight.get(call.pid) ?? []) controller.abort(reason);
      show({
        subject: call.pid,
        sessionId: call.sessionId,
        callerName: call.callerName,
        taskTitle: call.taskTitle,
        appName: call.appName,
        windowId: call.windowId,
        state: "paused"
      });
      hideAfter(PAUSED_BAR_MS);
      return reason;
    },
    stop() {
      if (disposed) return;
      if (!shown || shown.state !== "driving") return;
      const prior = shown;
      const { subject, appName, windowId } = shown;
      paused.set(subject, { ...appName ? { appName } : {}, ...windowId !== void 0 ? { windowId } : {} });
      const reason = subject === "computer" ? COMPUTER_STOPPED : appStopped(appName);
      for (const [s, set] of inFlight) {
        if (subject !== "computer" && s !== subject) continue;
        for (const controller of set) controller.abort(reason);
      }
      show({ ...prior, state: "paused" });
      hideAfter(PAUSED_BAR_MS);
    },
    resume() {
      if (disposed) return;
      if (!shown || shown.state !== "paused") return;
      paused.delete(shown.subject);
      shown = null;
      clearHide();
      hide();
    },
    dispose() {
      disposed = true;
      for (const controllers of inFlight.values()) for (const controller of controllers) controller.abort("Computer Use App \u5DF2\u505C\u6B62");
      inFlight.clear();
      paused.clear();
      shown = null;
      clearHide();
      hide();
    }
  };
}

// runtime/policy.ts
import path3 from "node:path";

// runtime/types.ts
var str = (args, key) => typeof args[key] === "string" ? args[key].trim() : "";
var num = (args, key) => typeof args[key] === "number" && Number.isFinite(args[key]) ? args[key] : void 0;

// runtime/policy.ts
var isRecord = (v) => !!v && typeof v === "object" && !Array.isArray(v);
var isNum = (v) => typeof v === "number" && Number.isFinite(v);
var BACKGROUND = "By default, runs in the background: it does not move the person's real pointer or take keyboard focus; an agent cursor drawn on screen shows where it acts.";
var WINDOW_ONLY = `Target one window (pid with window_id, a window target, or an element_token from computer.get_window_state). Desktop-wide input (scope or target "desktop", or no window at all) moves the person's real pointer and is refused by \u5495\u5495.`;
var FOREGROUND = `delivery_mode "foreground" briefly brings the target to the front and interrupts the person: the tool returns immediately so the agent can ask the person using its existing conversation, then retry with confirmed: true after explicit approval. Foreground HID mouse input moves the person's real pointer, including across displays. The person and agent share the pointer and keyboard focus; simultaneous input can interfere with clicks. Coordinate foreground work with the person; standing authorization does not isolate their concurrent desktop use.`;
var NOT_GUGU = "Operating \u5495\u5495 itself is refused.";
var MENU_FOCUS = "Some native menus need the app to remain active across calls. A foreground click immediately restores the previous app and can dismiss such a menu. After the person has authorized foreground work, record the previous active app with list_apps, use bring_to_front to keep the target active, read the menu and choose its item, then restore the previous app. Check fresh pixels and list_windows filtered by pid; a successful dispatch alone does not prove that a menu opened.";
var TOOLS = [
  // 看
  { cua: "list_apps", title: "\u5217\u51FA App", titleEn: "List apps", kind: "look" },
  { cua: "list_windows", title: "\u5217\u51FA\u7A97\u53E3", titleEn: "List windows", kind: "look", note: "Menus and popovers can be separate windows. Filter by pid to include their window layers before concluding that a menu did not open." },
  { cua: "get_window_state", title: "\u770B\u7A97\u53E3", titleEn: "Read a window", kind: "look", note: "Without Screen Recording permission pass include_screenshot: false to get the accessibility tree alone. On macOS, a post-input screenshot includes observation_stability from bounded pixel/geometry sampling; timeout is inconclusive, so read again before acting." },
  { cua: "get_accessibility_tree", title: "\u770B\u684C\u9762\u6982\u51B5", titleEn: "Desktop overview", kind: "look" },
  { cua: "get_desktop_state", title: "\u622A\u6574\u4E2A\u5C4F\u5E55", titleEn: "Capture the screen", kind: "look" },
  { cua: "zoom", title: "\u653E\u5927\u770B\u4E00\u5757", titleEn: "Zoom into a window", kind: "look" },
  { cua: "get_screen_size", title: "\u67E5\u5C4F\u5E55\u5C3A\u5BF8", titleEn: "Screen size", kind: "look", risk: "low" },
  { cua: "get_cursor_position", title: "\u67E5\u9F20\u6807\u4F4D\u7F6E", titleEn: "Pointer position", kind: "look", risk: "low" },
  { cua: "verify_state", title: "\u6838\u5BF9\u7A97\u53E3\u72B6\u6001", titleEn: "Verify a window", kind: "look" },
  // App 与窗口
  {
    cua: "launch_app",
    title: "\u5728\u540E\u53F0\u6253\u5F00 App",
    titleEn: "Launch an app",
    kind: "act",
    risk: "medium",
    confirm: "on_conflict",
    note: `On Windows an app may jump to the front as it starts (cua-driver cannot stop that for a normal launch): the tool returns immediately so the agent can ask the person using its existing conversation, then retry with confirmed: true after explicit approval \u2014 unless you pass start_minimized: true, which starts it without ever activating it, or refuses and starts nothing. If it still times out, the app may come up anyway \u2014 look with list_windows before launching it again. ${NOT_GUGU}`
  },
  {
    cua: "bring_to_front",
    title: "\u628A App \u5207\u5230\u524D\u53F0",
    titleEn: "Bring an app to front",
    kind: "act",
    confirm: "always",
    question: () => "\u8981\u628A\u5B83\u6B63\u5728\u64CD\u4F5C\u7684 App \u5207\u5230\u524D\u53F0\u5417\uFF1F\u5B83\u4F1A\u4E00\u76F4\u7559\u5728\u6700\u524D\u9762\uFF0C\u6253\u65AD\u4F60\u6B63\u5728\u7528\u7684\u7A97\u53E3\u3002",
    note: `Requires the person's consent; an applicable explicit standing authorization counts. Before activating, record the previous active app with list_apps and restore it after the interactions. ${NOT_GUGU}`
  },
  { cua: "set_window_frame", title: "\u8C03\u6574\u7A97\u53E3\u4F4D\u7F6E\u5927\u5C0F", titleEn: "Move or resize a window", kind: "act", risk: "medium", note: NOT_GUGU },
  { cua: "invoke_menu", title: "\u70B9\u83DC\u5355", titleEn: "Use an app menu", kind: "act", note: NOT_GUGU },
  {
    cua: "kill_app",
    title: "\u5F3A\u5236\u9000\u51FA App",
    titleEn: "Force-quit an app",
    kind: "act",
    confirm: "always",
    question: (args) => `\u8981\u5F3A\u5236\u9000\u51FA\u8FDB\u7A0B ${num(args, "pid") ?? "?"} \u5417\uFF1F\u5B83\u6CA1\u4FDD\u5B58\u7684\u5185\u5BB9\u4F1A\u4E22\u3002`,
    note: `Only processes this driver launched can be ended; requires the person\u2019s prior explicit approval every time. ${NOT_GUGU}`
  },
  // 操作
  { cua: "click", title: "\u70B9\u51FB", titleEn: "Click", kind: "act", confirm: "on_conflict", windowInput: true, note: MENU_FOCUS },
  { cua: "double_click", title: "\u53CC\u51FB", titleEn: "Double-click", kind: "act", confirm: "on_conflict", windowInput: true },
  { cua: "right_click", title: "\u53F3\u952E\u70B9\u51FB", titleEn: "Right-click", kind: "act", confirm: "on_conflict", windowInput: true },
  { cua: "drag", title: "\u62D6\u52A8", titleEn: "Drag", kind: "act", confirm: "on_conflict", windowInput: true },
  { cua: "scroll", title: "\u6EDA\u52A8", titleEn: "Scroll", kind: "act", confirm: "on_conflict", windowInput: true },
  {
    cua: "move_cursor",
    title: "\u79FB\u52A8 agent \u9F20\u6807",
    titleEn: "Move the agent cursor",
    kind: "act",
    risk: "medium",
    note: "Without a target only the agent cursor moves (screen points); with a window target it may hover. A desktop target would move the person's real pointer and is refused."
  },
  { cua: "type_text", title: "\u8F93\u5165\u6587\u5B57", titleEn: "Type text", kind: "act", confirm: "on_conflict", windowInput: true },
  { cua: "press_key", title: "\u6309\u952E", titleEn: "Press a key", kind: "act", confirm: "on_conflict", windowInput: true },
  {
    cua: "hotkey",
    title: "\u6309\u5FEB\u6377\u952E",
    titleEn: "Press a shortcut",
    kind: "act",
    confirm: "on_conflict",
    windowInput: true,
    note: "On macOS, background Cmd+L in a Chromium browser is unavailable because it can activate the app. Use Browser Use for webpage navigation; address-bar control needs explicitly approved foreground (interrupts the person)."
  },
  { cua: "set_value", title: "\u8BBE\u7F6E\u503C", titleEn: "Set a value", kind: "act", confirm: "on_conflict", windowInput: true },
  {
    cua: "run_steps",
    title: "\u8FDE\u7EED\u505A\u51E0\u6B65",
    titleEn: "Run steps",
    kind: "act",
    confirm: "on_conflict",
    note: "Every step must name its window (pid, or app \u2014 a window title alone is not enough); the same \u5495\u5495 rules apply to each step.",
    timeoutMs: () => 75e3
  }
];
var INPUT_TOOLS = /* @__PURE__ */ new Set(["click", "double_click", "right_click", "drag", "scroll", "type_text", "press_key", "hotkey", "set_value", "move_cursor"]);
var lower = (v) => typeof v === "string" ? v.trim().toLowerCase() : "";
function targetPid(args) {
  const target = isRecord(args.target) ? args.target : null;
  if (target && isNum(target.pid)) return target.pid;
  return isNum(args.pid) ? args.pid : void 0;
}
function isDesktop(args) {
  const target = isRecord(args.target) ? args.target : null;
  return lower(args.scope) === "desktop" || lower(target?.kind) === "desktop";
}
function refusal(tool, args, self, inherited = {}) {
  const pid = targetPid(args) ?? inherited.pid;
  if (pid !== void 0 && self.pids.has(pid)) return "That is \u5495\u5495 itself: \u5495\u5495 does not let an agent operate its own windows.";
  for (const key of ["bundle_id", "app", "name"]) {
    if (key === "name" && tool !== "launch_app" && tool !== "bring_to_front") continue;
    if (self.names.has(lower(args[key]))) return "That is \u5495\u5495 itself: \u5495\u5495 does not let an agent operate its own windows.";
  }
  if (!INPUT_TOOLS.has(tool)) return null;
  if (isDesktop(args)) return "Desktop-wide input moves the person's real pointer / acts on whatever they are using: \u5495\u5495 refuses it. Target one window (pid and window_id, or an element_token).";
  if (tool === "move_cursor") return null;
  const hasWindow = pid !== void 0 || typeof args.element_token === "string" || (inherited.app ?? str(args, "app")) !== "";
  if (!hasWindow) {
    return typeof args.window === "string" ? "Name the app too (app or pid): a window title alone could match \u5495\u5495 or a window the person is using." : "Name the window to act on (pid and window_id, or an element_token from computer.get_window_state): input without a window would land on whatever the person is using.";
  }
  return null;
}
function stepsOf(args) {
  const steps = Array.isArray(args.steps) ? args.steps : [];
  return steps.flatMap((step) => {
    if (!isRecord(step)) return [];
    if (typeof step.tool === "string") return [{ tool: step.tool, args: isRecord(step.args) ? step.args : {} }];
    const key = Object.keys(step).find((k) => INPUT_TOOLS.has(k));
    return key ? [{ tool: key, args: isRecord(step[key]) ? step[key] : {} }] : [];
  });
}
function launchQuestion(args) {
  const target = str(args, "name") || path3.win32.basename(str(args, "path") || str(args, "launch_path")) || str(args, "bundle_id") || str(args, "aumid") || "\u8FD9\u4E2A App";
  return `\u8981\u6253\u5F00\u300C${target}\u300D\u5417\uFF1F\u5728 Windows \u4E0A\u5B83\u6253\u5F00\u65F6\u53EF\u80FD\u4F1A\u8DF3\u5230\u6700\u524D\u9762\uFF0C\u6253\u65AD\u4F60\u6B63\u5728\u7528\u7684\u7A97\u53E3\u3002`;
}
function checkCall(tool, args, self, platform) {
  if (tool === "launch_app") {
    const refused = refusal(tool, args, self);
    return platform === "win32" && args.start_minimized !== true ? { refused, foreground: true, question: launchQuestion(args) } : { refused, foreground: false };
  }
  if (tool !== "run_steps") {
    return { refused: refusal(tool, args, self), foreground: lower(args.delivery_mode) === "foreground" || args.foreground_fallback === true };
  }
  const inherited = { ...isNum(args.pid) ? { pid: args.pid } : {}, ...typeof args.app === "string" ? { app: args.app } : {} };
  if (self.names.has(lower(args.app))) return { refused: "That is \u5495\u5495 itself: \u5495\u5495 does not let an agent operate its own windows.", foreground: false };
  if (inherited.pid !== void 0 && self.pids.has(inherited.pid)) return { refused: "That is \u5495\u5495 itself: \u5495\u5495 does not let an agent operate its own windows.", foreground: false };
  let foreground = lower(args.delivery_mode) === "foreground" || args.foreground_fallback === true;
  for (const [i, step] of stepsOf(args).entries()) {
    if (!INPUT_TOOLS.has(step.tool)) return { refused: `Step ${i + 1}: run_steps here only runs ${[...INPUT_TOOLS].join(", ")}.`, foreground };
    const problem = refusal(step.tool, step.args, self, inherited);
    if (problem) return { refused: `Step ${i + 1}: ${problem}`, foreground };
    if (lower(step.args.delivery_mode) === "foreground" || step.args.foreground_fallback === true) foreground = true;
  }
  if (isRecord(args.observe) && self.pids.has(targetPid(args.observe) ?? -1)) {
    return { refused: "That is \u5495\u5495 itself: \u5495\u5495 does not let an agent operate its own windows.", foreground };
  }
  return { refused: null, foreground };
}
function descriptionOf(tool, spec) {
  return [
    spec.description || tool.titleEn,
    tool.kind === "act" && !["kill_app", "bring_to_front", "invoke_menu"].includes(tool.cua) ? BACKGROUND : "",
    tool.windowInput ? WINDOW_ONLY : "",
    tool.confirm === "on_conflict" && tool.cua !== "launch_app" ? FOREGROUND : "",
    tool.note || ""
  ].filter(Boolean).join("\n\n").replaceAll("computer.", "");
}

// runtime/driver-resources.mjs
import { createHash as createHash2, randomUUID as randomUUID2 } from "node:crypto";
import { execFile } from "node:child_process";
import { chmod, lstat, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path4 from "node:path";
import { promisify } from "node:util";
import { gunzipSync, inflateRawSync } from "node:zlib";
var execute = promisify(execFile);
var MAX_ARCHIVE = 64 * 1024 * 1024;
var MAX_NATIVE = 256 * 1024 * 1024;
var digest = (bytes) => createHash2("sha256").update(bytes).digest("hex");
var active = /* @__PURE__ */ new Map();
var DRIVER_RELEASES = Object.freeze({
  "darwin-arm64": { platform: "darwin", arch: "arm64", version: "0.36.0", revision: "0.36.0-gugu.1", format: "tar.gz", member: "cua-driver", sha256: "3a9e5ddfc3078bdc09ab1eb708d8bc49964a306b31f0251689fda8da69fae9c6", url: "https://github.com/OpenDCAI/gugu/releases/download/assets/cua-driver-rs-0.36.0-gugu.1-darwin-universal-binary.tar.gz" },
  "darwin-x64": { platform: "darwin", arch: "x64", version: "0.36.0", revision: "0.36.0-gugu.1", format: "tar.gz", member: "cua-driver", sha256: "3a9e5ddfc3078bdc09ab1eb708d8bc49964a306b31f0251689fda8da69fae9c6", url: "https://github.com/OpenDCAI/gugu/releases/download/assets/cua-driver-rs-0.36.0-gugu.1-darwin-universal-binary.tar.gz" },
  "win32-x64": { platform: "win32", arch: "x64", version: "0.36.0", revision: "0.36.0", format: "zip", member: "cua-driver.exe", sha256: "f8c47024b626f4e0e70f8428d2998df39e4879110c5722a29d5fd03e367353ad", url: "https://github.com/trycua/cua/releases/download/cua-driver-rs-v0.36.0/cua-driver-rs-0.36.0-windows-x86_64-binary.zip" },
  "win32-arm64": { platform: "win32", arch: "arm64", version: "0.36.0", revision: "0.36.0", format: "zip", member: "cua-driver.exe", sha256: "520ea584cf11c074bccc4fd2328e8f2b34ec43de9328d97afb7fd03f761b55ee", url: "https://github.com/trycua/cua/releases/download/cua-driver-rs-v0.36.0/cua-driver-rs-0.36.0-windows-arm64-binary.zip" },
  "linux-x64": { platform: "linux", arch: "x64", version: "0.36.0", revision: "0.36.0", format: "tar.gz", member: "cua-driver", sha256: "05dae2160c86bdf4855c279d30898213d7a150edb1992b7470afdd69f0df4064", url: "https://github.com/trycua/cua/releases/download/cua-driver-rs-v0.36.0/cua-driver-rs-0.36.0-linux-x86_64-binary.tar.gz" },
  "linux-arm64": { platform: "linux", arch: "arm64", version: "0.36.0", revision: "0.36.0", format: "tar.gz", member: "cua-driver", sha256: "f64a33889605944a4e5af0e6036496137a25d6375f041d7c56e65c3be456aab2", url: "https://github.com/trycua/cua/releases/download/cua-driver-rs-v0.36.0/cua-driver-rs-0.36.0-linux-arm64-binary.tar.gz" }
});
function safeName(name) {
  const normalized = name.replace(/^\.\//, "").replace(/\/$/, "");
  if (!normalized || normalized.includes("\\") || normalized.startsWith("/") || /^[A-Za-z]:/.test(normalized) || normalized.split("/").some((part) => !part || part === "." || part === "..")) throw new Error("Unsafe native archive path.");
  return normalized;
}
function field(bytes, start, size) {
  return bytes.subarray(start, start + size).toString("utf8").split("\0")[0];
}
function octal(bytes, start, size) {
  const value = field(bytes, start, size).trim();
  if (!/^[0-7]*$/.test(value)) throw new Error("Invalid tar number.");
  return value ? Number.parseInt(value, 8) : 0;
}
function verifyPaxMetadata(bytes) {
  if (bytes.length > 64 * 1024) throw new Error("Oversized tar metadata.");
  for (let offset = 0; offset < bytes.length; ) {
    const space = bytes.indexOf(32, offset);
    if (space < 0 || space - offset > 8) throw new Error("Invalid tar metadata record.");
    const lengthText = bytes.subarray(offset, space).toString("ascii");
    if (!/^[1-9][0-9]*$/.test(lengthText)) throw new Error("Invalid tar metadata length.");
    const end = offset + Number(lengthText), equal = bytes.indexOf(61, space + 1);
    if (end > bytes.length || end <= space + 1 || equal < 0 || equal >= end - 1 || bytes[end - 1] !== 10) throw new Error("Truncated tar metadata.");
    const key = bytes.subarray(space + 1, equal).toString("ascii");
    if (!["mtime", "atime", "ctime"].includes(key) && !key.startsWith("LIBARCHIVE.xattr.") && !key.startsWith("SCHILY.xattr.")) throw new Error("Unsupported tar metadata override.");
    offset = end;
  }
}
function untar(bytes, member, maximum) {
  const tar = gunzipSync(bytes, { maxOutputLength: maximum });
  let selected;
  for (let offset = 0; offset + 512 <= tar.length; ) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) break;
    const sum = header.reduce((total, byte, index) => total + (index >= 148 && index < 156 ? 32 : byte), 0);
    if (sum !== octal(header, 148, 8)) throw new Error("Invalid tar header checksum.");
    const prefix = field(header, 345, 155);
    const name = safeName((prefix ? prefix + "/" : "") + field(header, 0, 100));
    const type = field(header, 156, 1);
    if (!["", "0", "5", "x"].includes(type)) throw new Error("Native archives may not contain links or special files.");
    const size = octal(header, 124, 12);
    const start = offset + 512;
    if (size > maximum || start + size > tar.length) throw new Error("Truncated or oversized tar member.");
    if (type === "x") verifyPaxMetadata(tar.subarray(start, start + size));
    if (name === member && ["", "0"].includes(type)) {
      if (selected) throw new Error("Duplicate native archive member.");
      selected = Buffer.from(tar.subarray(start, start + size));
    }
    offset = start + Math.ceil(size / 512) * 512;
  }
  if (!selected) throw new Error("Pinned native archive member is missing.");
  return selected;
}
function unzip(bytes, member, maximum) {
  let end = -1;
  for (let at2 = bytes.length - 22; at2 >= Math.max(0, bytes.length - 65557); at2--) {
    if (bytes.readUInt32LE(at2) === 101010256 && at2 + 22 + bytes.readUInt16LE(at2 + 20) === bytes.length) {
      end = at2;
      break;
    }
  }
  if (end < 0 || bytes.readUInt32LE(end + 4) !== 0 || bytes.readUInt16LE(end + 8) !== bytes.readUInt16LE(end + 10)) throw new Error("Invalid or split zip archive.");
  const count = bytes.readUInt16LE(end + 10);
  const centralSize = bytes.readUInt32LE(end + 12);
  let at = bytes.readUInt32LE(end + 16);
  if (count > 1e4 || at + centralSize !== end) throw new Error("Unsupported zip directory.");
  let selected;
  for (let i = 0; i < count; i++) {
    if (at + 46 > end || bytes.readUInt32LE(at) !== 33639248) throw new Error("Truncated zip directory.");
    const flags = bytes.readUInt16LE(at + 8), method = bytes.readUInt16LE(at + 10);
    const compressed = bytes.readUInt32LE(at + 20), size = bytes.readUInt32LE(at + 24);
    const length = bytes.readUInt16LE(at + 28), extra = bytes.readUInt16LE(at + 30), comment = bytes.readUInt16LE(at + 32);
    const local = bytes.readUInt32LE(at + 42);
    if (at + 46 + length + extra + comment > end) throw new Error("Truncated zip entry.");
    const rawName = bytes.subarray(at + 46, at + 46 + length).toString("utf8");
    const name = safeName(rawName);
    const mode = bytes.readUInt32LE(at + 38) >>> 16;
    if ((mode & 61440) === 40960 || flags & 1) throw new Error("Native archives may not contain links or encrypted files.");
    if (name === member && !rawName.endsWith("/")) {
      if (selected || size > maximum || local + 30 > at || ![0, 8].includes(method)) throw new Error("Unsupported native zip member.");
      if (bytes.readUInt32LE(local) !== 67324752 || bytes.readUInt16LE(local + 8) !== method) throw new Error("Invalid local zip header.");
      const nameLength = bytes.readUInt16LE(local + 26), extraLength = bytes.readUInt16LE(local + 28);
      const start = local + 30 + nameLength + extraLength;
      if (start + compressed > at || safeName(bytes.subarray(local + 30, local + 30 + nameLength).toString("utf8")) !== member) throw new Error("Truncated or mismatched zip member.");
      const input = bytes.subarray(start, start + compressed);
      selected = method === 0 ? Buffer.from(input) : inflateRawSync(input, { maxOutputLength: maximum });
      if (selected.length !== size) throw new Error("Incorrect uncompressed native size.");
    }
    at += 46 + length + extra + comment;
  }
  if (!selected || at !== end) throw new Error("Pinned native archive member is missing.");
  return selected;
}
function unpackDriver(bytes, release, maximum = MAX_NATIVE) {
  if (!Buffer.isBuffer(bytes) || bytes.length > MAX_ARCHIVE || digest(bytes) !== release.sha256) throw new Error("Native archive integrity check failed.");
  const member = safeName(release.member);
  if (member.includes("/")) throw new Error("The native executable must be a root archive member.");
  if (release.format === "tar.gz") return untar(bytes, member, maximum);
  if (release.format === "zip") return unzip(bytes, member, maximum);
  throw new Error("Unsupported native archive format.");
}
function assertNativeArchitecture(bytes, platform, arch) {
  if (platform === "win32") {
    const offset = bytes.length >= 64 ? bytes.readUInt32LE(60) : -1;
    const expected2 = { arm64: 43620, x64: 34404 }[arch];
    if (!expected2 || offset < 64 || offset + 6 > bytes.length || bytes.toString("latin1", offset, offset + 4) !== "PE\0\0" || bytes.readUInt16LE(offset + 4) !== expected2) throw new Error("Incorrect native PE architecture.");
    return;
  }
  if (platform === "linux") {
    const expected2 = { arm64: 183, x64: 62 }[arch];
    if (!expected2 || bytes.length < 20 || bytes.readUInt32BE(0) !== 2135247942 || bytes[4] !== 2 || bytes[5] !== 1 || bytes.readUInt16LE(18) !== expected2) throw new Error("Incorrect native ELF architecture.");
    return;
  }
  if (platform !== "darwin" || bytes.length < 8) throw new Error("This platform has no supported native driver.");
  const expected = { arm64: 16777228, x64: 16777223 }[arch];
  const magic = bytes.readUInt32BE(0);
  if (magic === 3405691582 || magic === 3405691583) {
    const count = bytes.readUInt32BE(4), stride = magic === 3405691582 ? 20 : 32;
    if (count > 16 || 8 + count * stride > bytes.length) throw new Error("Invalid native Mach-O header.");
    for (let i = 0; i < count; i++) if (expected && bytes.readUInt32BE(8 + i * stride) === expected) return;
  } else if (magic === 3489328638 && expected && bytes.readUInt32LE(4) === expected) return;
  throw new Error("Incorrect native Mach-O architecture.");
}
async function download(url, { signal }) {
  const response = await fetch(url, { signal });
  if (!response.ok || Number(response.headers.get("content-length") ?? 0) > MAX_ARCHIVE) throw new Error("Native download was not available.");
  const chunks = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > MAX_ARCHIVE) throw new Error("Native download exceeds the size limit.");
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
async function regular(file) {
  try {
    const value = await lstat(file);
    if (!value.isFile() || value.isSymbolicLink()) throw new Error("Native cache entry is not a regular file.");
    return await readFile(file);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}
function environment(home) {
  const names = ["PATH", "HOME", "USER", "LOGNAME", "TMPDIR", "SystemRoot", "windir", "USERPROFILE", "TEMP", "TMP", "DISPLAY", "XAUTHORITY", "WAYLAND_DISPLAY", "XDG_RUNTIME_DIR", "XDG_SESSION_TYPE", "DBUS_SESSION_BUS_ADDRESS"];
  return { ...Object.fromEntries(names.filter((key) => process.env[key] !== void 0).map((key) => [key, process.env[key]])), CUA_DRIVER_EMBEDDED: "1", CUA_DRIVER_RS_TELEMETRY_ENABLED: "false", CUA_DRIVER_RS_UPDATE_CHECK: "false", CUA_DRIVER_RS_HOME: home };
}
async function verifyExecutable(file, release, dataDir, signal) {
  if (release.platform === "darwin") await execute("/usr/bin/codesign", ["--verify", "--strict", file], { signal, timeout: 15e3 });
  const { stdout } = await execute(file, ["--version"], { signal, timeout: 15e3, maxBuffer: 8192, env: environment(path4.join(dataDir, "driver-home")) });
  if (stdout.trim() !== `cua-driver ${release.version}`) throw new Error("Incorrect native driver version.");
}
async function prepareDriver({ dataDir, platform = process.platform, arch = process.arch, signal, fetchArchive = download, verify = verifyExecutable, releases = DRIVER_RELEASES }) {
  if (!dataDir || !path4.isAbsolute(dataDir)) throw new Error("The App data directory is required.");
  const release = releases[`${platform}-${arch}`];
  if (!release || release.platform !== platform || release.arch !== arch) throw new Error("This platform has no supported native driver.");
  if (signal?.aborted) throw signal.reason;
  const key = path4.join(dataDir, "native", release.sha256);
  const identity = key + "\0" + platform + "\0" + arch;
  let job = active.get(identity);
  if (!job) {
    job = { controller: new AbortController(), subscribers: /* @__PURE__ */ new Set(), settled: false };
    active.set(identity, job);
    job.task = prepare(job.controller.signal).finally(() => {
      job.settled = true;
      if (active.get(identity) === job) active.delete(identity);
    });
  }
  return new Promise((resolve, reject) => {
    const subscriber = {};
    job.subscribers.add(subscriber);
    const leave = () => {
      signal?.removeEventListener("abort", abort);
      job.subscribers.delete(subscriber);
      if (!job.settled && job.subscribers.size === 0) {
        if (active.get(identity) === job) active.delete(identity);
        job.controller.abort(new Error("Native preparation has no remaining callers."));
      }
    };
    const abort = () => {
      leave();
      reject(signal.reason);
    };
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted) abort();
    job.task.then((value) => {
      leave();
      resolve(value);
    }, (error) => {
      leave();
      reject(error);
    });
  });
  async function prepare(signal2) {
    await mkdir(key, { recursive: true, mode: 448 });
    signal2.throwIfAborted();
    const archive = path4.join(key, "archive");
    let bytes = await regular(archive);
    signal2.throwIfAborted();
    if (!bytes || digest(bytes) !== release.sha256) {
      bytes = await fetchArchive(release.url, { signal: AbortSignal.any([...signal2 ? [signal2] : [], AbortSignal.timeout(12e4)]) });
      signal2.throwIfAborted();
      if (digest(bytes) !== release.sha256 || bytes.length > MAX_ARCHIVE) throw new Error("Native archive integrity check failed.");
      const temporary = archive + "." + randomUUID2() + ".part";
      try {
        await writeFile(temporary, bytes, { mode: 384, flag: "wx" });
        await rename(temporary, archive);
      } finally {
        await rm(temporary, { force: true });
      }
    }
    if (signal2?.aborted) throw signal2.reason;
    const executableBytes = unpackDriver(bytes, release);
    assertNativeArchitecture(executableBytes, platform, arch);
    const file = path4.join(key, release.member);
    const cached = await regular(file);
    signal2.throwIfAborted();
    if (!cached || digest(cached) !== digest(executableBytes)) {
      const temporary = file + "." + randomUUID2() + ".part";
      try {
        await writeFile(temporary, executableBytes, { mode: 448, flag: "wx" });
        await rename(temporary, file);
      } finally {
        await rm(temporary, { force: true });
      }
    }
    if (platform !== "win32") await chmod(file, 448);
    if (signal2?.aborted) throw signal2.reason;
    await verify(file, release, dataDir, signal2);
    signal2.throwIfAborted();
    return { binary: file, version: release.version, revision: release.revision, sha256: digest(executableBytes) };
  }
}

// runtime/permissions.mjs
import { execFile as execFile2 } from "node:child_process";
import { createHash as createHash3, randomUUID as randomUUID3 } from "node:crypto";
import { chmod as chmod2, mkdir as mkdir2, readFile as readFile2, rename as rename2, rm as rm2 } from "node:fs/promises";
import { writeFile as writeFile2 } from "node:fs/promises";
import path5 from "node:path";
import { promisify as promisify2 } from "node:util";
var execute2 = promisify2(execFile2);
var digest2 = (bytes) => createHash3("sha256").update(bytes).digest("hex");
var choices = /* @__PURE__ */ new Set(["accessibility", "screen"]);
function createPermissionClient({ bundleDir, dataDir, platform = process.platform, arch = process.arch, run = execute2 }) {
  if (!bundleDir || !dataDir || !path5.isAbsolute(bundleDir) || !path5.isAbsolute(dataDir)) throw new Error("App bundle and data directories are required.");
  let ready;
  async function prepare() {
    if (platform !== "darwin") throw new Error("macOS system settings are not available on this platform.");
    ready ??= (async () => {
      const meta = JSON.parse(await readFile2(path5.join(bundleDir, "permissions.json"), "utf8"));
      if (meta.platform !== platform || !meta.architectures.includes(arch) || !/^[a-f0-9]{64}$/.test(meta.sha256)) throw new Error("The permission helper does not match this computer.");
      const bytes = await readFile2(path5.join(bundleDir, "mac-permissions"));
      if (digest2(bytes) !== meta.sha256) throw new Error("The permission helper failed its integrity check.");
      assertNativeArchitecture(bytes, platform, arch);
      const directory = path5.join(dataDir, "native", "permissions", meta.sha256);
      await mkdir2(directory, { recursive: true, mode: 448 });
      const file = path5.join(directory, "mac-permissions");
      const temporary = file + "." + randomUUID3() + ".part";
      try {
        await writeFile2(temporary, bytes, { mode: 448, flag: "wx" });
        await rename2(temporary, file);
      } finally {
        await rm2(temporary, { force: true });
      }
      await chmod2(file, 448);
      await run("/usr/bin/codesign", ["--verify", "--strict", file], { timeout: 15e3 });
      return file;
    })().catch((error) => {
      ready = void 0;
      throw error;
    });
    return ready;
  }
  async function call(args, signal) {
    if (signal?.aborted) throw signal.reason;
    const file = await prepare();
    const keep = ["PATH", "HOME", "USER", "LOGNAME", "TMPDIR", "LANG", "LC_ALL"];
    const { stdout } = await run(file, args, { signal, timeout: 15e3, maxBuffer: 64 * 1024, env: Object.fromEntries(keep.filter((key) => process.env[key] !== void 0).map((key) => [key, process.env[key]])) });
    const result = JSON.parse(stdout);
    if (!result.ok) throw new Error("The permission operation could not be completed.");
    return result;
  }
  return {
    openSettings(permission, signal) {
      if (!choices.has(permission)) throw new Error("Choose Accessibility or Screen Recording.");
      return call(["open", permission], signal);
    }
  };
}

// runtime/tools.ts
import { createHash as createHash4 } from "node:crypto";

// runtime/app-directory.ts
var isRecord2 = (v) => !!v && typeof v === "object" && !Array.isArray(v);
var isNum2 = (v) => typeof v === "number" && Number.isFinite(v);
var lower2 = (v) => typeof v === "string" ? v.trim().toLowerCase() : "";
var targetPid2 = (args) => isRecord2(args.target) && isNum2(args.target.pid) ? args.target.pid : isNum2(args.pid) ? args.pid : void 0;
function createAppDirectory() {
  const described = /* @__PURE__ */ new Map();
  const windowNames = /* @__PURE__ */ new Map();
  const titles = /* @__PURE__ */ new Map();
  const fileNames = /* @__PURE__ */ new Map();
  const listed = /* @__PURE__ */ new Map();
  const snapshots = /* @__PURE__ */ new Map();
  const appPids = /* @__PURE__ */ new Map();
  const askedWindows = /* @__PURE__ */ new Set();
  const askedDescription = /* @__PURE__ */ new Set();
  const isFileName = (name) => /\.exe$/i.test(name);
  const learnOne = (entry) => {
    if (!isRecord2(entry) || !isNum2(entry.pid)) return;
    if (typeof entry.app_name === "string" && entry.app_name) (isFileName(entry.app_name) ? fileNames : windowNames).set(entry.pid, entry.app_name);
    if (typeof entry.title === "string" && entry.title.trim() && !titles.has(entry.pid)) titles.set(entry.pid, entry.title.trim());
    if (typeof entry.name === "string" && entry.name && !listed.has(entry.pid)) listed.set(entry.pid, entry.name);
  };
  const once = (asked, pid) => {
    if (asked.has(pid)) return false;
    asked.add(pid);
    return true;
  };
  return {
    pidOf(session, args) {
      const pid = targetPid2(args);
      if (pid !== void 0) return pid;
      const token = typeof args.element_token === "string" ? args.element_token : "";
      const snapshot = token.includes(":") ? token.slice(0, token.lastIndexOf(":")) : "";
      return snapshot ? snapshots.get(`${session}|${snapshot}`)?.pid : appPids.get(`${session}|${lower2(args.app)}`);
    },
    windowOf(session, args) {
      const target = isRecord2(args.target) ? args.target : args;
      if (isNum2(target.window_id)) return target.window_id;
      const token = typeof args.element_token === "string" ? args.element_token : "";
      const snapshot = token.includes(":") ? token.slice(0, token.lastIndexOf(":")) : "";
      const known = snapshots.get(`${session}|${snapshot}`);
      return known && (targetPid2(args) === void 0 || targetPid2(args) === known.pid) ? known.windowId : void 0;
    },
    nameOf: (pid) => described.get(pid) ?? windowNames.get(pid) ?? titles.get(pid) ?? fileNames.get(pid) ?? listed.get(pid),
    /** 还没从窗口上读到过系统语言的名字、也还没问过:该问 cua 一次它的窗口(顺带拿到窗口标题)。 */
    shouldAskWindows: (pid) => !described.has(pid) && !windowNames.has(pid) && once(askedWindows, pid),
    /** Windows:还没读过这个进程 exe 的 FileDescription。 */
    shouldAskDescription: (pid) => !described.has(pid) && once(askedDescription, pid),
    describe(pid, description) {
      if (description) described.set(pid, description);
    },
    learn(session, data, args = {}) {
      if (!isRecord2(data)) return;
      const pid = isNum2(data.pid) ? data.pid : targetPid2(args);
      const target = isRecord2(args.target) ? args.target : args;
      const windowId = isNum2(data.window_id) ? data.window_id : isNum2(target.window_id) ? target.window_id : void 0;
      if (pid !== void 0 && typeof data.snapshot_id === "string") snapshots.set(`${session}|${data.snapshot_id}`, { pid, ...windowId !== void 0 ? { windowId } : {} });
      const remember = (entry, aliases = []) => {
        if (!isRecord2(entry) || !isNum2(entry.pid) || entry.pid <= 0) return;
        for (const name of [entry.app_name, entry.name, entry.bundle_id, ...aliases]) {
          if (lower2(name)) appPids.set(`${session}|${lower2(name)}`, entry.pid);
        }
      };
      remember(data, [args.app]);
      for (const list of [data.windows, data.apps]) if (Array.isArray(list)) list.forEach((entry) => remember(entry));
      learnOne(data);
      for (const list of [data.windows, data.apps]) if (Array.isArray(list)) list.forEach(learnOne);
    }
  };
}

// runtime/placement.ts
var COMPUTER_HEAD_WIDTH = 236;
var COMPUTER_HEAD_HEIGHT = 44;
var record2 = (v) => !!v && typeof v === "object" && !Array.isArray(v);
var finite = (v) => typeof v === "number" && Number.isFinite(v);
function resolveComputerWindow(data, target) {
  if (!record2(data) || !Array.isArray(data.windows)) return null;
  const windows = data.windows.filter((w) => record2(w) && w.pid === target.pid && w.is_on_screen === true && w.on_current_space !== false && (target.windowId !== void 0 ? w.window_id === target.windowId : (w.layer ?? 0) === 0));
  if (windows.length !== 1) return null;
  const windowId = windows[0]?.window_id, bounds = windows[0]?.bounds;
  if (!finite(windowId) || !Number.isSafeInteger(windowId) || windowId <= 0) return null;
  if (!record2(bounds) || !finite(bounds.x) || !finite(bounds.y) || !finite(bounds.width) || !finite(bounds.height) || bounds.width <= 0 || bounds.height <= 0) return null;
  return { windowId, bounds: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height } };
}
function computerBarBounds(target, area) {
  const left = Math.max(target.x, area.x), top = Math.max(target.y, area.y);
  const right = Math.min(target.x + target.width, area.x + area.width);
  const bottom = Math.min(target.y + target.height, area.y + area.height);
  const width = Math.min(COMPUTER_HEAD_WIDTH, Math.floor(right - left - 16)), height = COMPUTER_HEAD_HEIGHT;
  if (width < 120 || bottom - top < height) return null;
  const y = target.y - height + 1 >= area.y ? Math.round(target.y - height + 1) : Math.ceil(top);
  return { x: Math.round(Math.max(left + 8, Math.min(right - width - 8, left + (right - left) * 0.44 - width / 2))), y, width, height };
}

// runtime/targets.ts
var record3 = (v) => !!v && typeof v === "object" && !Array.isArray(v);
var number3 = (v) => typeof v === "number" && Number.isFinite(v);
var lower3 = (v) => typeof v === "string" ? v.trim().toLowerCase() : "";
async function resolveCallTargets(input) {
  const launching = input.name === "launch_app";
  const named = /* @__PURE__ */ new Map();
  const targetOf = async (args) => {
    const explicit = record3(args.target) && number3(args.target.pid) ? args.target.pid : number3(args.pid) ? args.pid : void 0;
    if (!launching && input.control && lower3(args.app) && explicit === void 0 && typeof args.element_token !== "string") {
      const key = JSON.stringify([args.app, args.window]);
      let pending = named.get(key);
      if (!pending) {
        pending = (async () => {
          const options = { signal: input.signal, timeoutMs: 5e3, lane: input.owner };
          try {
            const listed = await input.native.callTool("list_windows", { app: args.app, on_screen_only: true }, options);
            const raw = listed.structuredContent;
            if (!listed.isError && record3(raw) && Array.isArray(raw.windows)) {
              const data = { ...raw, windows: raw.windows.filter((w) => !lower3(args.window) || record3(w) && lower3(w.title).includes(lower3(args.window))) };
              const pids = new Set(data.windows.flatMap((w) => record3(w) && number3(w.pid) && w.pid > 0 ? [w.pid] : []));
              if (pids.size === 1) {
                const pid = [...pids][0];
                input.apps.learn(input.owner, data, args);
                const window = resolveComputerWindow(data, { pid, ...number3(args.window_id) ? { windowId: args.window_id } : {} });
                return { pid, ...window ? { windowId: window.windowId } : {} };
              }
            }
          } catch {
          }
          try {
            const listed = await input.native.callTool("list_apps", {}, options);
            const raw = listed.structuredContent;
            if (!listed.isError && record3(raw) && Array.isArray(raw.apps)) {
              const matched = raw.apps.filter((app2) => record3(app2) && [app2.name, app2.app_name, app2.bundle_id].some((name) => lower3(name) === lower3(args.app)));
              const pids = new Set(matched.flatMap((app2) => record3(app2) && number3(app2.pid) && app2.pid > 0 ? [app2.pid] : []));
              if (pids.size === 1) {
                const pid = [...pids][0];
                input.apps.learn(input.owner, { ...raw, pid, apps: matched }, args);
                return { pid };
              }
            }
          } catch {
          }
          const known = input.apps.pidOf(input.owner, args);
          const stopped = known !== void 0 ? input.control?.stoppedFor(known) : null;
          return stopped ? { stopped } : {};
        })();
        named.set(key, pending);
      }
      return pending;
    }
    return { pid: input.apps.pidOf(input.owner, args), windowId: input.apps.windowOf(input.owner, args) };
  };
  const targets = input.name === "run_steps" ? await Promise.all(stepsOf(input.args).map((step) => targetOf(
    ["target", "pid", "app", "element_token"].some((key) => step.args[key] !== void 0) ? step.args : { ...input.args, ...step.args }
  ))) : [await targetOf(input.args)];
  const first = targets[0];
  const app = first && targets.every((other) => other.pid === first.pid) ? first : void 0;
  return {
    pid: app?.pid ?? (launching ? input.apps.pidOf(input.owner, { app: input.args.name ?? input.args.bundle_id }) : void 0),
    windowId: app && targets.every((other) => other.windowId === app.windowId) ? app.windowId : void 0,
    targetPids: [...new Set(targets.flatMap((target) => target.pid !== void 0 ? [target.pid] : []))],
    stopped: targets.find((target) => target.stopped)?.stopped
  };
}

// runtime/background-location-shortcut.ts
var record4 = (value) => !!value && typeof value === "object" && !Array.isArray(value);
var lower4 = (value) => typeof value === "string" ? value.toLowerCase() : "";
var pidNumber = (value) => typeof value === "number" && Number.isSafeInteger(value) && value > 0;
var command = /* @__PURE__ */ new Set(["cmd", "command", "meta", "super", "win"]);
var modifiers = /* @__PURE__ */ new Set([...command, "shift", "option", "alt", "ctrl", "control", "fn"]);
var windowKeys = ["pid", "window_id", "app", "window"];
function locationShortcut(name, args) {
  if (name !== "hotkey" || lower4(args.delivery_mode) === "foreground" || !Array.isArray(args.keys)) return false;
  const keys = args.keys.filter((key) => typeof key === "string").map(lower4);
  const held = keys.filter((key) => modifiers.has(key));
  return keys.filter((key) => !modifiers.has(key)).at(-1) === "l" && held.length > 0 && held.every((key) => command.has(key));
}
function windowSelector(args) {
  const nested = record4(args.target) ? args.target : {};
  return Object.fromEntries(windowKeys.flatMap((key) => {
    const value = nested[key] ?? args[key];
    return value === void 0 ? [] : [[key, value]];
  }));
}
function candidates(name, args) {
  if (name !== "run_steps") return locationShortcut(name, args) ? [{ args }] : [];
  let context = windowSelector(args);
  const result = [];
  for (const [index, raw] of (Array.isArray(args.steps) ? args.steps : []).entries()) {
    if (!record4(raw)) continue;
    if (record4(raw.wait_for)) {
      const selector = windowSelector(raw.wait_for);
      if (Object.keys(selector).length) context = selector;
    }
    const action = stepsOf({ steps: [raw] })[0];
    if (action) {
      const selector = windowSelector(action.args);
      if (Object.keys(selector).length) context = selector;
      const effective = { ...context, ...action.args, delivery_mode: action.args.delivery_mode ?? args.delivery_mode };
      if (locationShortcut(action.tool, effective)) result.push({ args: effective, step: index + 1 });
    } else {
      const checks = Array.isArray(raw.expect) ? raw.expect : [raw.expect];
      for (const check of checks.filter(record4)) {
        const selector = windowSelector(check);
        if (Object.keys(selector).length) context = selector;
      }
    }
  }
  return result;
}
function chromiumBundle(bundle) {
  return bundle.split(/[^a-z0-9]+/).some((part) => ["chrome", "chromium", "brave", "edgemac", "vivaldi", "opera", "thorium"].includes(part)) || ["company.thebrowser.browser", "com.operasoftware.operagx", "com.operasoftware.operanext", "com.operasoftware.operadeveloper"].includes(bundle);
}
var unavailable = () => ({ code: "unavailable", message: "The shortcut target could not be verified from the native process list. Read its window again before retrying." });
var blocked = () => ({ code: "background_unavailable", message: "Background Cmd+L is unavailable for this Chromium app. Use Browser Use for webpage navigation; address-bar control needs explicitly approved foreground (interrupts the person)." });
async function backgroundLocationShortcut(input) {
  const pending = candidates(input.name, input.args);
  if (!pending.length) return null;
  const options = {
    lane: input.lane,
    signal: input.signal,
    timeoutMs: 5e3,
    ...input.remainingMs ? { remainingMs: input.remainingMs } : {}
  };
  try {
    const listed = await input.native.callTool("list_apps", {}, options);
    if (listed.isError || !record4(listed.structuredContent) || !Array.isArray(listed.structuredContent.apps)) return unavailable();
    const running = listed.structuredContent.apps.filter(record4).filter((app) => pidNumber(app.pid) && app.running === true);
    const windows = /* @__PURE__ */ new Map();
    const resolvePid = async (args) => {
      const selector = windowSelector(args);
      if (pidNumber(selector.pid)) return selector.pid;
      if (typeof args.element_token === "string" && !Object.keys(selector).length) return input.apps.pidOf(input.owner, args);
      const app = typeof selector.app === "string" ? selector.app : "";
      const key = JSON.stringify(selector);
      let read = windows.get(key);
      if (!read) {
        read = input.native.callTool("list_windows", { ...app ? { app } : {}, on_screen_only: false }, options).then((value) => {
          const data = value.structuredContent;
          if (value.isError || !record4(data) || !Array.isArray(data.windows)) return null;
          return data.windows.filter(record4).filter((window) => (selector.window_id === void 0 || window.window_id === selector.window_id) && (!selector.window || lower4(window.title).includes(lower4(selector.window))));
        });
        windows.set(key, read);
      }
      const found = await read;
      const pids = new Set(found?.flatMap((window) => pidNumber(window.pid) ? [window.pid] : []));
      return pids.size === 1 ? [...pids][0] : void 0;
    };
    for (const candidate of pending) {
      const pid = await resolvePid(candidate.args);
      const identities = new Set(running.filter((app) => app.pid === pid).map((app) => lower4(app.bundle_id)).filter(Boolean));
      const bundle = identities.size === 1 ? [...identities][0] : void 0;
      const refusal2 = !bundle ? unavailable() : chromiumBundle(bundle) ? blocked() : null;
      if (refusal2) return { ...refusal2, message: `${candidate.step ? `Step ${candidate.step}: ` : ""}${refusal2.message}` };
    }
    return null;
  } catch {
    return input.signal?.aborted ? { code: "cancelled", message: "This operation was cancelled before input." } : unavailable();
  }
}

// runtime/tools.ts
var failure = (code, message) => ({ isError: true, content: [{ type: "text", text: message }], structuredContent: { code, message } });
var object2 = (v) => !!v && typeof v === "object" && !Array.isArray(v);
function permissionState(result) {
  if (result.isError) return null;
  if (object2(result.structuredContent)) return result.structuredContent;
  for (const block of result.content ?? []) {
    if (block.type !== "text" || typeof block.text !== "string") continue;
    try {
      const state = JSON.parse(block.text);
      if (object2(state)) return state;
    } catch {
    }
  }
  return null;
}
function fileCapture(args) {
  return object2(args) && (typeof args.screenshot_out_file === "string" || typeof args.debug_image_out === "string");
}
function needsScreen(name, args) {
  return fileCapture(args) || name === "get_desktop_state" || name === "zoom" || name === "get_window_state" && args.include_screenshot !== false || name === "verify_state" && args.include_screenshot === true || name === "run_steps" && (fileCapture(args.observe) || object2(args.observe) && args.observe.include_screenshot === true || Array.isArray(args.steps) && args.steps.some((step) => object2(step) && Object.values(step).some(fileCapture)));
}
var hasScreen = (env) => Boolean(env.DISPLAY || env.WAYLAND_DISPLAY);
function createComputerTools(input) {
  const specs = new Map(input.specs.map((spec) => [spec.name, spec]));
  const definitions = new Map(TOOLS.map((tool) => {
    const native = specs.get(tool.cua);
    if (!native) throw new Error(`Native tool documentation is missing: ${tool.cua}`);
    const schema = native.input_schema ?? native.inputSchema;
    if (!object2(schema) || schema.type !== "object" || !object2(schema.properties)) throw new Error(`Invalid native tool schema: ${tool.cua}`);
    const properties = { ...schema.properties };
    delete properties.session;
    if (tool.confirm) properties.confirmed = { type: "boolean", description: "Set true only after the person explicitly approved this foreground or destructive action through the agent\u2019s existing conversation. This flag is not approval by the App." };
    const required = Array.isArray(schema.required) ? schema.required.filter((key) => key !== "session") : [];
    return [tool.cua, { tool, native, schema, public: { name: tool.cua, description: descriptionOf(tool, native), inputSchema: { ...schema, properties, required }, annotations: { readOnlyHint: tool.kind === "look", destructiveHint: tool.cua === "kill_app" } } }];
  }));
  const apps = createAppDirectory();
  return {
    list: () => [...definitions.values()].map((value) => value.public),
    async call(name, args, caller) {
      const definition = definitions.get(name);
      if (!definition) return failure("not_found", "This App does not expose that native tool.");
      if (!caller.agent || !caller.session) return failure("not_granted", "An agent and its bound task are required.");
      if (input.platform !== "darwin" && input.platform !== "win32" && input.platform !== "linux") return failure("unsupported", "This platform has no supported Computer Use driver.");
      if (input.platform === "linux" && !hasScreen(input.display ?? { ...process.env, ...linuxScreen(process.env) })) return failure("unavailable", "This computer has no screen (no X11 or Wayland display). Start a desktop or virtual display session for the account running Gugu, then retry. No input was sent.");
      if (["session", "device", "device_id", "agent"].some((key) => key in args)) return failure("invalid_args", "Caller and machine identity cannot be supplied as tool arguments.");
      const { confirmed, ...forwardArgs } = args;
      if (caller.signal?.aborted) return failure("cancelled", "This operation was cancelled before it was sent.");
      const self = await input.protectedHost();
      if (!self.pids.size || !self.names.size) return failure("unavailable", "The protected host identity could not be checked.");
      const checked = checkCall(name, forwardArgs, self, input.platform);
      if (checked.refused) return failure("invalid_args", checked.refused);
      const tool = definition.tool;
      if ((tool.confirm === "always" || checked.foreground) && confirmed !== true) {
        const question = tool.question?.(forwardArgs) ?? checked.question ?? "This will bring the target window to the foreground and may interrupt the person\u2019s pointer or keyboard focus.";
        return failure("needs_confirmation", `${question} Ask the person using AskUserQuestion or the existing conversation. Only after their explicit approval retry with confirmed: true. No input was sent; this tool does not wait for an answer.`);
      }
      if (caller.signal?.aborted) return failure("cancelled", "This operation was cancelled before it was sent.");
      const owner = "gugu-" + createHash4("sha256").update(caller.agent + "\0" + caller.session).digest("hex").slice(0, 20);
      const lane = caller.humanViewer ? owner + "-human-" + createHash4("sha256").update(caller.humanViewer).digest("hex").slice(0, 12) : caller.preview ? owner + "-preview" : owner;
      const launching = name === "launch_app";
      const target = await resolveCallTargets({
        name,
        args: forwardArgs,
        owner,
        apps,
        native: input.cua,
        signal: caller.signal,
        ...tool.kind === "act" ? { control: input.control } : {}
      });
      if (target.stopped) return failure("revoked", target.stopped);
      const { pid, windowId, targetPids } = target;
      if ([pid, ...targetPids].some((pid2) => pid2 !== void 0 && self.pids.has(pid2))) return failure("invalid_args", "The target belongs to the protected host.");
      if (input.platform === "darwin") {
        const refusal2 = await backgroundLocationShortcut({
          name,
          args: forwardArgs,
          owner,
          lane,
          apps,
          native: input.cua,
          signal: caller.signal,
          ...caller.remainingMs ? { remainingMs: caller.remainingMs } : {}
        });
        if (refusal2) return failure(refusal2.code, refusal2.message);
      }
      const identity = { sessionId: caller.session, ...caller.name ? { callerName: caller.name } : {}, ...caller.taskTitle ? { taskTitle: caller.taskTitle } : {} };
      let handle = tool.kind === "act" ? input.control?.begin({
        ...identity,
        ...launching ? { deferAttachment: true } : {},
        ...pid === void 0 ? {} : { pid, appName: apps.nameOf(pid) },
        ...targetPids.some((target2) => target2 !== pid) ? { targetPids } : {},
        windowId
      }) : void 0;
      if (handle && "refused" in handle) return failure("revoked", handle.refused);
      const signal = handle ? caller.signal ? AbortSignal.any([caller.signal, handle.signal]) : handle.signal : caller.signal;
      try {
        if (input.platform === "darwin") {
          const state = permissionState(await input.cua.callTool("check_permissions", { prompt: false }, { signal, lane, timeoutMs: 15e3, ...caller.remainingMs ? { remainingMs: caller.remainingMs } : {} }));
          if (!state || typeof state.accessibility !== "boolean" || typeof state.screen_recording !== "boolean") return failure("unavailable", "The native driver could not check its system permissions. No input was sent.");
          const missing = [...!state.accessibility ? ["Accessibility"] : [], ...!state.screen_recording ? ["Screen Recording"] : []];
          if (!state.accessibility || !state.screen_recording && needsScreen(name, forwardArgs)) {
            return failure("os_permission", `${missing.join(" and ")} permission is missing on this computer. The person must grant it before this operation can continue. The Computer Use page beside this task (also the App's settings page) now lists what is missing with an Allow button for each; macOS then lists \u5495\u5495 and they turn it on, and the page shows Allowed by itself. No permission prompt or input was sent by this tool. Tell the person exactly that using the existing conversation, then retry after they report completion.`);
          }
        }
        if (handle?.signal.aborted) return failure("revoked", String(handle.signal.reason));
        if (signal?.aborted) return failure("cancelled", "This operation was cancelled before it was sent.");
        const forward = object2(definition.schema.properties) && "session" in definition.schema.properties ? { ...forwardArgs, session: lane } : forwardArgs;
        const result = await input.cua.callTool(name, forward, { signal, lane, ...caller.remainingMs ? { remainingMs: caller.remainingMs } : {}, timeoutMs: caller.preview ? 1e4 : tool.timeoutMs?.(args) ?? 6e4 });
        if (handle?.signal.aborted) return failure("revoked", String(handle.signal.reason));
        if (result.isError !== true) {
          apps.learn(owner, result.structuredContent, launching ? { ...forwardArgs, app: forwardArgs.name ?? forwardArgs.bundle_id ?? forwardArgs.app } : forwardArgs);
          if (launching && input.control && object2(result.structuredContent)) {
            const launchedPid = apps.pidOf(owner, result.structuredContent);
            if (launchedPid !== void 0) {
              const window = resolveComputerWindow(result.structuredContent, { pid: launchedPid });
              handle?.end();
              const attached = input.control.begin({ ...identity, pid: launchedPid, appName: apps.nameOf(launchedPid), ...window ? { windowId: window.windowId } : {} });
              if ("refused" in attached) return failure("revoked", attached.refused);
              handle = attached;
            }
          }
        }
        if (!caller.preview) {
          try {
            input.observed?.({ caller, owner, name, args: forwardArgs, pid, windowId, result });
          } catch {
          }
        }
        return result;
      } catch (error) {
        if (handle?.signal.aborted) return failure("revoked", String(handle.signal.reason));
        throw error;
      } finally {
        handle?.end();
      }
    }
  };
}
export {
  CUA_CANCEL_UNCONFIRMED,
  DRIVER_RELEASES,
  NativeCallError,
  TOOLS,
  assertNativeArchitecture,
  checkCall,
  computerBarBounds,
  createComputerControl,
  createComputerTools,
  createCuaClient,
  createObservationGate,
  createPermissionClient,
  cuaEnvironment,
  cuaMutates,
  cuaSocketPath,
  cursorOnWindow,
  displayOnlyObservation,
  linuxScreen,
  openCuaDaemonLease,
  prepareDriver,
  resolveComputerWindow,
  sameCuaImageSample,
  sampleCuaImage,
  settleCuaWindow,
  unpackDriver
};

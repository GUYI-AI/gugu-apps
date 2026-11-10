import { mkdir, realpath } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListRootsRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createLeaseTransport, pageBrowserVersion } from './transport.mjs';

/**
 * Browser Use's tools are `@playwright/mcp`'s own (snapshot / click / type / navigate / screenshot …, Apache-2.0),
 * driving the one page Gugu lends this task. This program adds only the product rules around them:
 *
 * - **which page**: the task's page from `gugu.pages.acquire()` (a lease, never a debugging port or a browser of its own);
 * - **one Playwright per task**: its state (snapshot refs, current page) belongs to one session, never shared;
 * - **the person's page stays**: `browser_close` closes nothing; tools that reach beyond the page are withheld.
 */

/** Playwright's tool groups (`core*` is always on). No installs, cookies/storage/network rewriting or devtools. */
export const PLAYWRIGHT_CONFIG = Object.freeze({
  capabilities: ['core', 'core-navigation', 'core-input', 'vision'],
  // Tools a page registers itself (WebMCP) are untrusted page content; they never join the agent's toolbox.
  webmcp: false,
  saveSession: false,
});

/**
 * Withheld (Playwright always enables `core*`, so they are filtered here):
 * - `browser_run_code_unsafe`: arbitrary code in this program's process ("RCE-equivalent" in its own words).
 * - `browser_tabs`: a task drives one page; opening or closing tabs is refused at the transport.
 */
const WITHHELD = new Set(['browser_run_code_unsafe', 'browser_tabs']);

const TOOL_TIMEOUT_MS = 120_000;

export function agentVisibleTools(tools) {
  return tools.filter((tool) => !WITHHELD.has(tool.name));
}

const refused = (text) => ({ content: [{ type: 'text', text }], isError: true });

/** Answered here, never by Playwright. `browser_close` would close the whole connection and the person's page. */
export function answeredLocally(name) {
  if (WITHHELD.has(name)) return refused(`${name} is not available in Gugu's browser.`);
  if (name === 'browser_close') return { content: [{ type: 'text', text: 'The tab stays open in the task so the person can see it; nothing was closed.' }] };
  return null;
}

/** Playwright asks for the client's roots: files the agent names land in the task's working copy. */
function toolsClient(root) {
  const client = new Client({ name: 'gugu-browser-use', version: '1.0.0' }, { capabilities: { roots: {} } });
  client.setRequestHandler(ListRootsRequestSchema, () => ({ roots: [{ uri: pathToFileURL(root).href, name: 'task workspace' }] }));
  return client;
}

/** Paths the agent hands a tool must stay inside the task's working copy or this task's own output folder. */
export async function checkFileArguments(args, roots) {
  const allowed = await Promise.all(roots.filter(Boolean).map((root) => realpath(root).catch(() => path.resolve(root))));
  const inside = async (file) => {
    if (typeof file !== 'string' || !file) throw new Error('Invalid browser file path');
    const absolute = path.resolve(roots[0], file);
    const real = await realpath(absolute).catch(() => absolute);
    if (!allowed.some((root) => real === root || real.startsWith(root + path.sep))) {
      throw new Error(`${file} is outside this task's working folder`);
    }
  };
  if (Array.isArray(args?.paths)) for (const file of args.paths) await inside(file);
  if (typeof args?.filename === 'string') await inside(args.filename);
}

class TaskBrowser {
  constructor({ playwright, pages, sessionId, workspace, outputDir, log, onGone }) {
    Object.assign(this, { playwright, pages, sessionId, workspace, outputDir, log, onGone });
    this.connecting = null;
    this.lease = null;
    this.server = null;
    this.client = null;
    this.closed = false;
  }

  /** Inside a tool call: the lease and the first page commands need the call's authority. */
  connect(initialUrl) {
    if (this.closed) return Promise.reject(new Error('this task\'s browser connection was closed'));
    this.connecting ??= this.open(initialUrl).catch((error) => { this.connecting = null; throw error; });
    return this.connecting;
  }

  async open(initialUrl) {
    await mkdir(this.outputDir, { recursive: true });
    const lease = await this.pages.acquire(initialUrl ? { url: initialUrl } : {});
    this.lease = lease;
    lease.onClose((reason) => {
      this.log({ sessionId: this.sessionId, reason }, 'task page lease ended');
      void this.close();
    });
    const browser = await pageBrowserVersion(lease);
    const transport = createLeaseTransport(lease, browser, { log: (fields, message) => this.log({ sessionId: this.sessionId, ...fields }, message) });
    const { createConnection, chromium } = this.playwright;
    const server = await createConnection({ ...PLAYWRIGHT_CONFIG, outputDir: this.outputDir }, async () => {
      const connected = await chromium.connectOverCDP(transport);
      connected.on('disconnected', () => void this.close());
      const context = connected.contexts()[0];
      if (!context) throw new Error('the browser tab has no page to drive');
      return context;
    });
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
    await server.connect(serverSide);
    const client = toolsClient(this.workspace ?? this.outputDir);
    await client.connect(clientSide);
    this.server = server;
    this.client = client;
    return client;
  }

  async close() {
    if (this.closed) return;
    this.closed = true;
    this.onGone();
    await this.client?.close().catch(() => undefined);
    await this.server?.close().catch(() => undefined);
    // The person's page stays: releasing the lease hands it back, it does not close it.
    await this.lease?.close().catch(() => undefined);
  }
}

/** One MCP server per App program; one TaskBrowser per calling session. */
export function createBrowserUse({ playwright, gugu, dataDir, settings, log }) {
  const browsers = new Map();
  let schemas = null;

  /** Listing must not acquire a page. */
  async function listTools() {
    schemas ??= (async () => {
      const server = await playwright.createConnection(PLAYWRIGHT_CONFIG, async () => { throw new Error('Tool listing cannot open a browser page'); });
      const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
      const client = toolsClient(dataDir);
      try {
        await server.connect(serverSide);
        await client.connect(clientSide);
        return agentVisibleTools((await client.listTools()).tools);
      } finally {
        await client.close().catch(() => undefined);
        await server.close().catch(() => undefined);
      }
    })().catch((error) => { schemas = null; throw error; });
    return schemas;
  }

  function browserOf(sessionId, workspace) {
    let browser = browsers.get(sessionId);
    if (!browser) {
      const created = new TaskBrowser({ playwright, pages: gugu.pages, sessionId, workspace, log,
        outputDir: path.join(dataDir, 'sessions', sessionId.replace(/[^\w.-]/g, '_')),
        onGone: () => { if (browsers.get(sessionId) === created) browsers.delete(sessionId); } });
      browsers.set(sessionId, created);
      browser = created;
    }
    return browser;
  }

  async function callTool(params, signal) {
    const meta = params._meta ?? {};
    const sessionId = meta['gugu/sessionId'];
    if (typeof sessionId !== 'string' || !sessionId) return refused('Browser Use needs a Gugu task to drive its page.');
    if (signal?.aborted) return refused('This browser action was cancelled with the Agent turn.');
    const local = answeredLocally(params.name);
    if (local) return local;
    const workspace = typeof meta['gugu/workspace'] === 'string' && meta['gugu/workspace'] ? meta['gugu/workspace'] : null;
    return gugu.withCall(meta, async () => {
      const browser = browserOf(sessionId, workspace);
      try {
        await checkFileArguments(params.arguments, [workspace ?? browser.outputDir, browser.outputDir]);
        // The App's default startUrl is about:blank, not an instruction to navigate on reconnect.
        const navigate = params.name === 'browser_navigate' && typeof params.arguments?.url === 'string' ? params.arguments.url : undefined;
        const start = typeof settings.startUrl === 'string' && settings.startUrl !== 'about:blank' ? settings.startUrl : undefined;
        const client = await browser.connect(navigate ?? start);
        signal?.throwIfAborted();
        return await client.callTool({ name: params.name, arguments: params.arguments }, undefined, { signal, timeout: TOOL_TIMEOUT_MS });
      } catch (error) {
        log({ sessionId, tool: params.name, error: error instanceof Error ? error.message : String(error) }, 'browser tool failed');
        return refused(`The browser tool could not run: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }

  async function closeAll() {
    await Promise.allSettled([...browsers.values()].map((browser) => browser.close()));
  }

  return { listTools, callTool, closeAll, browsers };
}

export async function startBrowserUseStdio({ version, ...options }) {
  const browserUse = createBrowserUse(options);
  const server = new Server({ name: 'browser-use', version }, { capabilities: { tools: {} } });
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: await browserUse.listTools() }));
  server.setRequestHandler(CallToolRequestSchema, async (request, extra) => browserUse.callTool(request.params, extra.signal));
  server.onclose = () => void browserUse.closeAll();
  await server.connect(new StdioServerTransport());
  return { server, browserUse };
}

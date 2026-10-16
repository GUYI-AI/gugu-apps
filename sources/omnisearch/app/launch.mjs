// Runs omnisearch (server/server.mjs) for gugu's agents, configured by settings.json in this App's data folder
// (the settings tab writes it; an agent may edit it too). gugu ⇄ this ⇄ omnisearch is one MCP stdio pipe.
// This file decides what agents see: one tool per capability the person turned on, defaulting to the service
// they picked, and no knobs an agent cannot judge. When settings.json changes it starts omnisearch again with
// the new keys and tells gugu the tool list changed, so a save takes effect at once. While no service has a key
// omnisearch is not started at all (it could do nothing): this file answers gugu itself, with no tools for agents.
import { spawn } from 'node:child_process';
import { readFileSync, watchFile } from 'node:fs';
import { dirname, join } from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { CAPABILITIES, SERVICES, SETTINGS_FILE, parseSettings, serviceFor } from './catalog.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const SERVER = join(here, 'server', 'server.mjs');
const SETTINGS_PATH = join(process.env.GUGU_EXTENSION_DATA_DIR ?? here, SETTINGS_FILE);
const VERSION = JSON.parse(readFileSync(join(here, 'package.json'), 'utf8')).version;
const STATUS_URI = 'omnisearch://providers/status';
const DRAIN_MS = 30_000;
const PAGE_ONLY = { readOnlyHint: true };
const PAGE_TOOLS = [
	{ name: 'provider_status', description: 'Which services have a key and which tools agents have from them.',
		inputSchema: { type: 'object', properties: {} }, annotations: PAGE_ONLY, _meta: { ui: { visibility: ['app'] } } },
	{ name: 'check_service', description: 'Try one small real request through a service and say whether it works.',
		inputSchema: { type: 'object', required: ['service'], properties: { service: { type: 'string' } } },
		annotations: PAGE_ONLY, _meta: { ui: { visibility: ['app'] } } },
];
const CHECK_ARGS = {
	web_search: { query: 'model context protocol', limit: 1 },
	web_extract: { url: 'https://example.com' },
	library_docs: { library: 'valibot', query: 'pipe' },
	ai_search: { query: 'What is the Model Context Protocol?', limit: 1 },
	github_search: { query: 'modelcontextprotocol', search_type: 'repositories', limit: 1 },
};

const toGugu = (message) => process.stdout.write(JSON.stringify(message) + '\n');
const errorTo = (id, message) => toGugu({ jsonrpc: '2.0', id, error: { code: -32603, message } });

function readSettings() {
	try {
		return parseSettings(readFileSync(SETTINGS_PATH, 'utf8'));
	} catch {
		return parseSettings('');
	}
}

const anyKey = (settings) => Object.keys(SERVICES).some((id) => typeof settings.keys[id] === 'string' && settings.keys[id].trim());

/** settings.json is the only source of keys: one the person cleared is gone even if the shell has it. */
function serverEnv(settings) {
	const env = { ...process.env, OMNISEARCH_LARGE_RESULT_MODE: 'file' };
	for (const service of Object.values(SERVICES)) delete env[service.env];
	delete env.FIRECRAWL_BASE_URL;
	for (const [id, key] of Object.entries(settings.keys)) {
		if (SERVICES[id] && typeof key === 'string' && key.trim()) env[SERVICES[id].env] = key.trim();
	}
	if (settings.firecrawl_base_url) env.FIRECRAWL_BASE_URL = String(settings.firecrawl_base_url);
	return env;
}

// The arguments an agent can use whatever service answers; the rest are one service's knobs.
const KEEP_ARGS = {
	web_search: ['query', 'limit', 'include_domains', 'exclude_domains', 'time_range', 'provider'],
	web_extract: ['url', 'provider', 'mode', 'query', 'format'],
	ai_search: ['query', 'provider', 'limit'],
};
// web_extract's modes, by the service that has them.
const EXTRACT_MODES = {
	firecrawl: ['scrape', 'crawl', 'map', 'extract', 'actions'],
	tavily: ['extract', 'crawl', 'map'],
	exa: ['contents', 'similar'],
	kagi: ['summarize'],
};
const capabilityOfTool = (name) => CAPABILITIES.find((c) => c.tool === name);
const servicesWithKey = (capability, settings) => Object.keys(capability.via).filter((s) => settings.keys[s]);

/** The tool as agents see it: the person's default service, the others as a choice, no large_result_mode. */
function presentTool(tool, settings) {
	const capability = capabilityOfTool(tool.name);
	if (!capability) return tool;
	const chosen = serviceFor(capability, settings);
	if (!chosen) return null;
	const others = servicesWithKey(capability, settings).filter((s) => s !== chosen);
	const schema = structuredClone(tool.inputSchema ?? { type: 'object', properties: {} });
	delete schema.properties?.large_result_mode;
	const keep = KEEP_ARGS[capability.id];
	if (keep && schema.properties) {
		for (const name of Object.keys(schema.properties)) if (!keep.includes(name)) delete schema.properties[name];
	}
	const usesProvider = capability.via[chosen] !== null && schema.properties?.provider;
	if (usesProvider) {
		if (others.length === 0) {
			delete schema.properties.provider;
		} else {
			schema.properties.provider = {
				type: 'string',
				enum: [chosen, ...others],
				description: `Which service to use; defaults to ${chosen}.`,
			};
		}
	}
	if (capability.id === 'web_extract' && schema.properties?.mode) {
		const modes = [...new Set([chosen, ...others].flatMap((s) => EXTRACT_MODES[s] ?? []))];
		schema.properties.mode = { ...schema.properties.mode, enum: modes, description: `How to read: ${[chosen, ...others].map((s) => `${SERVICES[s].name} ${EXTRACT_MODES[s].join('/')}`).join('; ')}. Defaults to the service's usual mode.` };
	}
	if (Array.isArray(schema.required)) {
		schema.required = schema.required.filter((k) => k in (schema.properties ?? {}) && k !== 'provider');
	}
	const lead = {
		web_search: 'Search the web: titles, URLs and snippets. Read a page you found with web_extract.',
		web_extract: 'Read web pages: give a URL (or several) and get the text. A whole site: mode "crawl" or "map" where the service has it.',
		library_docs: tool.description,
		ai_search: 'A direct answer to a question, with the sources it came from.',
		github_search: tool.description,
	}[capability.id];
	const via = capability.via[chosen] === null
		? ''
		: ` Uses ${SERVICES[chosen].name}${others.length ? `; also ${others.map((s) => SERVICES[s].name).join(', ')} via provider` : ''}.`;
	const where = ` Set up in the 全能搜索 App; its settings are ${SETTINGS_PATH} — "keys" by service (${Object.keys(SERVICES).join(', ')}) and "use" by capability (${CAPABILITIES.map((c) => c.id).join(', ')}: a service id or "off") — which you may edit for the person; changes apply at once.`;
	return { ...tool, description: `${lead}${via}${where}`, inputSchema: schema };
}

/** An agent's call in the tool's own terms: the default service filled in, service ids mapped to provider values. */
function prepareCall(params, settings) {
	const capability = capabilityOfTool(params?.name);
	if (!capability) return params;
	const args = { ...(params.arguments ?? {}) };
	delete args.large_result_mode;
	const keep = KEEP_ARGS[capability.id];
	if (keep) for (const name of Object.keys(args)) if (!keep.includes(name)) delete args[name];
	const chosen = serviceFor(capability, settings);
	const service = args.provider && args.provider in capability.via ? args.provider : chosen;
	if (service && capability.via[service] !== null) args.provider = capability.via[service];
	else delete args.provider;
	return { ...params, arguments: args };
}

let initializeRequest = null; // gugu's own, replayed to each omnisearch started after it
let initialized = false;
let ownIds = 0;
let current = null;

function startServer() {
	const settings = readSettings();
	const proc = spawn(process.execPath, [SERVER], { cwd: here, env: serverEnv(settings), stdio: ['pipe', 'pipe', 'pipe'] });
	const server = { proc, settings, pending: new Map(), own: new Map(), ready: null };
	proc.stderr.on('data', (chunk) => process.stderr.write(chunk));
	server.write = (message) => proc.stdin.write(JSON.stringify(message) + '\n');
	server.request = (method, params) =>
		new Promise((resolve) => {
			const id = `omnisearch-launch-${++ownIds}`;
			server.own.set(id, resolve);
			server.write({ jsonrpc: '2.0', id, method, params });
		});
	readline.createInterface({ input: proc.stdout }).on('line', (line) => {
		let message;
		try {
			message = JSON.parse(line);
		} catch {
			return;
		}
		if (message.id !== undefined && message.method === undefined) {
			if (server.own.has(message.id)) {
				server.own.get(message.id)(message);
				server.own.delete(message.id);
				return;
			}
			const method = server.pending.get(message.id);
			server.pending.delete(message.id);
			if (method === 'tools/list' && Array.isArray(message.result?.tools)) {
				message.result.tools = [
					...message.result.tools.map((tool) => presentTool(tool, server.settings)).filter(Boolean),
					...PAGE_TOOLS,
				];
			}
		}
		toGugu(message);
	});
	proc.on('exit', (code) => {
		for (const id of server.pending.keys()) errorTo(id, `omnisearch stopped (code ${code}); try again`);
		server.pending.clear();
		for (const resolve of server.own.values()) resolve({ error: { message: 'omnisearch stopped' } });
		server.own.clear();
		if (current === server) current = null; // the next message starts it again
	});
	server.ready = initializeRequest
		? server.request('initialize', initializeRequest.params).then(() => {
				if (initialized) server.write({ jsonrpc: '2.0', method: 'notifications/initialized' });
			})
		: Promise.resolve();
	return server;
}

const serverNow = () => (current ??= startServer());

async function forward(message) {
	const server = serverNow();
	if (message.method === 'initialize' && message.id !== undefined) {
		initializeRequest = message;
	} else {
		await server.ready;
	}
	if (message.method === 'tools/call') message = { ...message, params: prepareCall(message.params, server.settings) };
	if (message.id !== undefined && message.method !== undefined) server.pending.set(message.id, message.method);
	server.write(message);
	if (message.method === 'notifications/initialized') {
		initialized = true;
		// gugu keeps a program's tool list across its restarts; settings saved while this was stopped change it.
		toGugu({ jsonrpc: '2.0', method: 'notifications/tools/list_changed' });
	}
}

async function providerStatus(id) {
	// Without any key omnisearch is not running: then the status is what settings.json says, nothing more.
	let settings = current?.settings ?? readSettings();
	let status = {};
	if (current || anyKey(settings)) {
		const server = serverNow();
		await server.ready;
		const answer = await server.request('resources/read', { uri: STATUS_URI });
		const text = answer.result?.contents?.[0]?.text;
		if (!text) return errorTo(id, answer.error?.message ?? 'omnisearch gave no status');
		status = JSON.parse(text);
		settings = server.settings;
	}
	const structured = {
		...status,
		settings_path: SETTINGS_PATH,
		services: Object.fromEntries(Object.keys(SERVICES).map((s) => [s, Boolean(settings.keys[s])])),
		capabilities: Object.fromEntries(CAPABILITIES.map((c) => [c.id, serviceFor(c, settings)])),
	};
	toGugu({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(structured) }], structuredContent: structured } });
}

async function checkService(id, service) {
	const capability = CAPABILITIES.find((c) => service in c.via);
	if (!capability || !SERVICES[service]) return errorTo(id, `unknown service ${service}`);
	if (!(current?.settings ?? readSettings()).keys[service]) return errorTo(id, `${SERVICES[service].name} has no key yet`);
	const server = serverNow();
	await server.ready;
	const args = { ...CHECK_ARGS[capability.id] };
	if (capability.via[service] !== null) args.provider = capability.via[service];
	const started = Date.now();
	const answer = await server.request('tools/call', { name: capability.tool, arguments: args });
	const ms = Date.now() - started;
	const text = answer.result?.content?.[0]?.text ?? answer.error?.message ?? '';
	const ok = Boolean(answer.result) && !answer.result.isError;
	let reason = null;
	if (!ok) {
		try {
			// omnisearch writes a provider error as {"error":"Invalid API key","provider":…}; others carry {message}.
			const parsed = JSON.parse(text);
			reason = typeof parsed.error === 'string' ? parsed.error : parsed.error?.message ?? parsed.message ?? text;
		} catch {
			reason = text;
		}
	}
	const structured = { service, ok, ms, reason: reason ? String(reason).slice(0, 300) : null };
	toGugu({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(structured) }], structuredContent: structured } });
}

/** No service has a key: gugu is answered here and omnisearch stays unstarted — no tools for agents, the page its own two. */
function answerWithoutServer(message) {
	if (message.method === 'initialize' && message.id !== undefined) {
		initializeRequest = message; // replayed to the omnisearch started once a key is saved
		return toGugu({ jsonrpc: '2.0', id: message.id, result: {
			protocolVersion: message.params?.protocolVersion ?? '2025-06-18',
			capabilities: { tools: { listChanged: true } },
			serverInfo: { name: 'omnisearch', version: VERSION },
		} });
	}
	if (message.method === 'notifications/initialized') initialized = true;
	if (message.id === undefined) return;
	if (message.method === 'tools/list') return toGugu({ jsonrpc: '2.0', id: message.id, result: { tools: PAGE_TOOLS } });
	if (message.method === 'ping') return toGugu({ jsonrpc: '2.0', id: message.id, result: {} });
	errorTo(message.id, 'No service has a key yet: set one up in the 全能搜索 App.');
}

let restarting = Promise.resolve();
function restartWithNewSettings() {
	restarting = restarting.then(async () => {
		const old = current;
		current = null;
		if (old) {
			// Wait for what is still on its way through it — gugu's calls and this file's own: the page's status and check
			// read settings.json themselves and may start omnisearch on a save before the watcher below has seen it.
			const deadline = Date.now() + DRAIN_MS;
			while (old.pending.size + old.own.size > 0 && Date.now() < deadline) await new Promise((r) => setTimeout(r, 200));
			old.proc.stdin.end();
			old.proc.kill();
		}
		if (initializeRequest) {
			if (anyKey(readSettings())) await serverNow().ready;
			toGugu({ jsonrpc: '2.0', method: 'notifications/tools/list_changed' });
		}
	});
}

watchFile(SETTINGS_PATH, { interval: 1000 }, (now, before) => {
	if (now.mtimeMs !== before.mtimeMs) restartWithNewSettings();
});

readline.createInterface({ input: process.stdin }).on('line', async (line) => {
	let message;
	try {
		message = JSON.parse(line);
	} catch {
		return;
	}
	await restarting;
	if (message.method === 'tools/call' && message.params?.name === 'provider_status') return providerStatus(message.id);
	if (message.method === 'tools/call' && message.params?.name === 'check_service') {
		return checkService(message.id, message.params?.arguments?.service);
	}
	if (!current && !anyKey(readSettings())) return answerWithoutServer(message);
	forward(message);
});

process.stdin.on('end', () => {
	current?.proc.kill();
	process.exit(0);
});

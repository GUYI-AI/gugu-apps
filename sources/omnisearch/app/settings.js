// The settings tab: one section per capability — pick the service, give it a key, check it works.
// Everything lives in settings.json in this App's data folder; launch.mjs restarts omnisearch when it changes.
import { CAPABILITIES, SERVICES, SETTINGS_FILE, parseSettings, serviceFor } from './catalog.mjs';

const host = window.gugu;
const TEXT = {
	zh: {
		title: '全能搜索', canUse: (n) => `agent 现在能用 ${n} 项`, none: '还没有能用的', off: '不使用',
		configured: '已配置', needKey: '需 key', apiKey: 'API 密钥', getKey: '获取密钥', site: '官网',
		check: '检查', change: '更换', cancel: '取消', saveCheck: '保存并检查', paste: (s) => `粘贴 ${s} 的 API 密钥`,
		works: (ms) => `能用 · 刚才试过一次，${(ms / 1000).toFixed(1)} 秒`, fails: (r) => `不能用：${r}`, checking: '正在试一次…',
		applying: '保存好了，正在生效…', sharedWith: (list) => `这把 key 也用在${list}。`, alsoFor: (list) => `同一把 key 也能用在${list}。`,
		advanced: '高级设置', firecrawlHost: '自建 Firecrawl 地址', firecrawlHostHelp: '留空就用 Firecrawl 官方的服务。', save: '保存',
		sentTo: (url) => `这把 key 会发到 ${url}，不是 Firecrawl 官方的服务。`,
		where: (p) => `设置存在这台电脑上：${p}。agent 也可以直接改这个文件。`, elsewhere: '在电脑上设置',
		elsewhereWhy: '全能搜索给电脑上的 agent 用，手机上跑不了。到电脑上的咕咕里打开它，在那里选服务、填密钥。',
		withdrawn: 'agent 现在用不了',
		withdrawnWhy: '「给 agent 工具」这项权限被收回了，agent 现在一项都用不了。在 App 管理里全能搜索的权限中把它打开，就恢复了。',
		sep: '、',
	},
	en: {
		title: 'Omnisearch', canUse: (n) => `Agents can use ${n} now`, none: 'Nothing set up yet', off: 'Not used',
		configured: 'Set up', needKey: 'Needs key', apiKey: 'API key', getKey: 'Get a key', site: 'Website',
		check: 'Check', change: 'Change', cancel: 'Cancel', saveCheck: 'Save and check', paste: (s) => `Paste the ${s} API key`,
		works: (ms) => `Works · tried just now, ${(ms / 1000).toFixed(1)} s`, fails: (r) => `Does not work: ${r}`, checking: 'Trying once…',
		applying: 'Saved, applying…', sharedWith: (list) => `This key is also used for ${list}.`, alsoFor: (list) => `The same key also works for ${list}.`,
		advanced: 'Advanced', firecrawlHost: 'Self-hosted Firecrawl address', firecrawlHostHelp: 'Leave empty to use Firecrawl itself.', save: 'Save',
		sentTo: (url) => `This key is sent to ${url}, not to Firecrawl itself.`,
		where: (p) => `Settings live on this computer: ${p}. Agents may edit that file too.`, elsewhere: 'Set up on a computer',
		elsewhereWhy: 'Omnisearch is for the agents on your computer and does not run on a phone. Open it in gugu on your computer to pick services and add keys.',
		withdrawn: 'Agents cannot use it now',
		withdrawnWhy: 'The permission to give agents tools was taken back, so agents can use none of these now. Turn it back on under 全能搜索’s permissions in Apps.',
		sep: ', ',
	},
};

let lang = 'zh';
let t = TEXT.zh;
let settings = parseSettings('');
let status = null;
let lastText = null; // settings.json as this page last read or wrote it: anything else is someone else's edit
let saving = 0; // saves in flight: a look at the file then would catch it half way
let withdrawn = false; // the person took back「give agents tools」: no program runs for this App
// A device that runs no programs (the phone): its page has no callProgram, and nothing here is for it.
const elsewhere = typeof host.callProgram !== 'function';
const editing = new Set(); // services whose key field is open for typing
const results = new Map(); // service → { kind: 'ok' | 'bad' | 'busy', text }
let openMenu = null;

const $ = (id) => document.getElementById(id);
const el = (tag, attrs = {}, ...children) => {
	const node = document.createElement(tag);
	for (const [k, v] of Object.entries(attrs)) {
		if (k === 'class') node.className = v;
		else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
		else if (v !== undefined && v !== null && v !== false) node.setAttribute(k, v === true ? '' : v);
	}
	for (const child of children.flat()) if (child !== null && child !== undefined) node.append(child);
	return node;
};
const svg = (paths) => {
	const node = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	node.setAttribute('viewBox', '0 0 24 24');
	node.setAttribute('width', '14');
	node.setAttribute('height', '14');
	node.setAttribute('fill', 'none');
	node.setAttribute('stroke', 'currentColor');
	node.setAttribute('stroke-width', '2');
	node.setAttribute('stroke-linecap', 'round');
	node.setAttribute('stroke-linejoin', 'round');
	node.innerHTML = paths;
	return node;
};

function showError(error) {
	const message = error instanceof Error ? error.message : String(error);
	$('error').hidden = false;
	$('error').textContent = message;
	host.reportError(message).catch((e) => console.error('reportError failed', e));
}

const logo = (id) => el('img', { class: 'logo', src: `logos/${id}.png`, alt: '' });
const hasKey = (id) => Boolean(settings.keys[id]);
const capTitle = (c) => c.title[lang];

async function loadSettings() {
	lastText = await host.readData(SETTINGS_FILE);
	settings = parseSettings(lastText);
}

/**
 * Read the file again and apply one change to what is there now: an agent may have edited it while this page was
 * open, and a save must not undo that. Only what the person changed is written: a capability they never chose keeps
 * following whichever service has a key.
 */
async function saveSettings(change) {
	saving += 1;
	try {
		const next = change(parseSettings(await host.readData(SETTINGS_FILE)));
		lastText = JSON.stringify(next, null, 2) + '\n';
		await host.writeData(SETTINGS_FILE, lastText);
		settings = next;
	} finally {
		saving -= 1;
	}
}

async function readStatus() {
	const result = await host.callProgram('provider_status');
	if (!result) return false;
	if (result.isError) throw new Error(result.content?.[0]?.text ?? 'provider_status failed');
	status = result.structuredContent ?? JSON.parse(result.content[0].text);
	return true;
}

/** After a save, launch.mjs restarts omnisearch; wait until what it reports matches the file. */
async function waitApplied() {
	const want = JSON.stringify({
		services: Object.fromEntries(Object.keys(SERVICES).map((s) => [s, hasKey(s)])),
		capabilities: Object.fromEntries(CAPABILITIES.map((c) => [c.id, serviceFor(c, settings)])),
	});
	for (let i = 0; i < 12; i++) {
		await new Promise((r) => setTimeout(r, 800));
		if (!(await readStatus())) return;
		if (JSON.stringify({ services: status.services, capabilities: status.capabilities }) === want) return;
	}
}

async function check(service) {
	results.set(service, { kind: 'busy', text: t.checking });
	render();
	try {
		const result = await host.callProgram('check_service', { service });
		if (!result) return results.delete(service);
		const answer = result.structuredContent ?? JSON.parse(result.content?.[0]?.text ?? '{}');
		if (result.isError) throw new Error(result.content?.[0]?.text ?? 'check failed');
		results.set(service, answer.ok ? { kind: 'ok', text: t.works(answer.ms) } : { kind: 'bad', text: t.fails(answer.reason ?? '?') });
	} catch (error) {
		results.set(service, { kind: 'bad', text: t.fails(error instanceof Error ? error.message : String(error)) });
	}
	render();
}

async function pick(capability, choice) {
	openMenu = null;
	try {
		await saveSettings((s) => ({ ...s, use: { ...s.use, [capability.id]: choice } }));
		if (choice !== 'off' && !hasKey(choice)) editing.add(choice);
		render();
		await waitApplied();
		render();
	} catch (error) {
		showError(error);
	}
}

async function saveKey(service, value) {
	const key = value.trim();
	if (!key) return;
	results.set(service, { kind: 'busy', text: t.applying });
	render();
	try {
		await saveSettings((s) => ({ ...s, keys: { ...s.keys, [service]: key } }));
		editing.delete(service);
		await waitApplied();
		await check(service);
	} catch (error) {
		results.delete(service);
		showError(error);
		render();
	}
}

function selectMenu(capability, chosen) {
	const options = Object.keys(capability.via);
	const label = chosen
		? [logo(chosen), el('span', { class: 'nm' }, SERVICES[chosen].name), el('span', { class: hasKey(chosen) ? 'tag ok' : 'tag need' }, hasKey(chosen) ? t.configured : t.needKey)]
		: [el('span', { class: 'nm off' }, t.off)];
	const open = openMenu === capability.id;
	const button = el('button', {
		class: 'select', type: 'button', 'aria-haspopup': 'listbox', 'aria-expanded': String(open),
		onclick: (event) => {
			event.stopPropagation();
			openMenu = open ? null : capability.id;
			render();
		},
	}, ...label, svg('<path d="m7 10 5 5 5-5"/>'));
	button.querySelector('svg').classList.add('chev');
	const pop = el('div', { class: 'pop', role: 'listbox', hidden: !open },
		...options.map((id) => el('button', {
			type: 'button', role: 'option', 'aria-selected': String(id === chosen), onclick: () => pick(capability, id),
		}, logo(id), el('span', { class: 'nm' }, SERVICES[id].name), el('span', { class: hasKey(id) ? 'tag ok' : 'tag need' }, hasKey(id) ? t.configured : t.needKey))),
		el('div', { class: 'sep' }),
		el('button', { type: 'button', role: 'option', class: 'off', 'aria-selected': String(!chosen), onclick: () => pick(capability, 'off') }, el('span', { class: 'nm' }, t.off)),
	);
	return el('div', { class: 'menu' }, button, pop);
}

function keyForm(capability, service) {
	const s = SERVICES[service];
	const others = CAPABILITIES.filter((c) => c !== capability && service in c.via);
	// "Also used for" only where this service is what that capability uses now; elsewhere it merely could be.
	const usedBy = hasKey(service) ? others.filter((c) => serviceFor(c, settings) === service) : [];
	const couldBe = others.filter((c) => !usedBy.includes(c));
	const help = el('span', { class: 'help' },
		el('button', { class: 'link', type: 'button', onclick: () => host.openBrowserTab(s.keyUrl).catch(showError) }, t.getKey),
		el('button', { class: 'link', type: 'button', onclick: () => host.openBrowserTab(s.site).catch(showError) }, t.site));
	const result = results.get(service);
	const resultLine = result ? el('span', { class: `result ${result.kind}`, role: 'status' }, result.text) : null;
	let row;
	if (hasKey(service) && !editing.has(service)) {
		const key = settings.keys[service];
		row = el('span', { class: 'inrow' },
			el('input', { class: 'in', readonly: true, value: `${key.slice(0, 4)}••••••••••••${key.slice(-4)}`, 'aria-label': t.apiKey }),
			el('button', { class: 'btn', type: 'button', disabled: result?.kind === 'busy', onclick: () => check(service) }, t.check),
			el('button', { class: 'btn', type: 'button', onclick: () => { editing.add(service); render(); } }, t.change));
	} else {
		const input = el('input', { class: 'in', type: 'password', spellcheck: 'false', autocomplete: 'off', placeholder: t.paste(s.name), 'aria-label': t.apiKey,
			onkeydown: (e) => { if (e.key === 'Enter') saveKey(service, input.value); } });
		const buttons = [el('button', { class: 'btn primary', type: 'button', disabled: result?.kind === 'busy', onclick: () => saveKey(service, input.value) }, t.saveCheck)];
		if (hasKey(service)) buttons.push(el('button', { class: 'btn', type: 'button', onclick: () => { editing.delete(service); render(); } }, t.cancel));
		row = el('span', { class: 'inrow' }, input, ...buttons);
		queueMicrotask(() => { if (!hasKey(service)) input.focus(); });
	}
	const note = usedBy.length
		? el('p', { class: 'sub' }, t.sharedWith(usedBy.map(capTitle).join(t.sep)))
		: couldBe.length ? el('p', { class: 'sub' }, t.alsoFor(couldBe.map(capTitle).join(t.sep))) : null;
	// Where the key goes, in plain sight: an address set under Advanced (by the person, or an agent editing the file).
	const sentTo = service === 'firecrawl' && settings.firecrawl_base_url ? el('p', { class: 'sub' }, t.sentTo(settings.firecrawl_base_url)) : null;
	return el('div', { class: 'form' },
		el('div', { class: 'fl' }, el('span', { class: 'lab' }, t.apiKey, help), row, resultLine),
		note, sentTo);
}

function render() {
	const caps = $('caps');
	const live = withdrawn ? {} : status?.capabilities ?? Object.fromEntries(CAPABILITIES.map((c) => [c.id, serviceFor(c, settings)]));
	const count = Object.values(live).filter(Boolean).length;
	const said = elsewhere ? t.elsewhere : withdrawn ? t.withdrawn : count ? t.canUse(count) : t.none;
	$('summary').replaceChildren(el('i', { class: count && !elsewhere ? '' : 'none' }), said);
	$('notice').hidden = !(withdrawn || elsewhere);
	$('notice').textContent = elsewhere ? t.elsewhereWhy : withdrawn ? t.withdrawnWhy : '';
	$('caps').hidden = elsewhere;
	$('adv').hidden = elsewhere;
	$('adv').open ||= Boolean(settings.firecrawl_base_url); // an address set there is shown, not folded away
	caps.replaceChildren(...CAPABILITIES.map((capability) => {
		const picked = settings.use[capability.id];
		const chosen = picked === 'off' ? null : picked && picked in capability.via ? picked : serviceFor(capability, settings);
		return el('section', { 'aria-label': capTitle(capability) },
			el('div', { class: 'sh' },
				el('div', { class: 't' }, el('b', {}, capTitle(capability)), el('span', {}, capability.about[lang])),
				selectMenu(capability, chosen)),
			chosen ? keyForm(capability, chosen) : null);
	}));
	$('fcHost').value = settings.firecrawl_base_url ?? '';
}

function applyLanguage(locale) {
	lang = String(locale || '').toLowerCase().startsWith('zh') ? 'zh' : 'en';
	t = TEXT[lang];
	for (const node of document.querySelectorAll('[data-t]')) node.textContent = t[node.dataset.t];
	document.title = t.title;
	host.setTabTitle(t.title).catch(showError);
}

async function main() {
	try {
		const context = await host.getContext();
		applyLanguage(context.locale);
		// Taken back in the App's permissions: say that in words, not as the host's error (the page reloads on a change).
		withdrawn = typeof host.callProgram === 'function' && Array.isArray(context.capabilities)
			&& !context.capabilities.includes('agents:tools');
		host.onContextChanged((next) => {
			if (next?.locale) {
				applyLanguage(next.locale);
				render();
			}
		});
	} catch (error) {
		showError(error);
	}
	document.addEventListener('click', () => {
		if (openMenu) {
			openMenu = null;
			render();
		}
	});
	// An agent may edit settings.json while this page is open: look again every few seconds while it is on screen (a
	// local read) and when it comes back. Not while someone types: a fresh render would drop their letters.
	let looking = false;
	const refresh = async () => {
		if (elsewhere || looking || saving || document.hidden || document.activeElement?.tagName === 'INPUT') return;
		looking = true;
		try {
			const seen = lastText;
			const text = await host.readData(SETTINGS_FILE);
			if (text === seen || saving || lastText !== seen) return; // unchanged, or this page saved meanwhile
			lastText = text;
			settings = parseSettings(text);
			render();
			if (withdrawn) return;
			await waitApplied();
			render();
		} catch (error) {
			showError(error);
		} finally {
			looking = false;
		}
	};
	document.addEventListener('visibilitychange', refresh);
	setInterval(refresh, 3000);
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape' && openMenu) {
			openMenu = null;
			render();
		}
	});
	$('fcHostSave').addEventListener('click', async () => {
		const value = $('fcHost').value.trim();
		try {
			await saveSettings((s) => {
				const next = { ...s };
				if (value) next.firecrawl_base_url = value.replace(/\/+$/, '');
				else delete next.firecrawl_base_url;
				return next;
			});
			await waitApplied();
		} catch (error) {
			showError(error);
		}
	});
	if (elsewhere) return render();
	try {
		await loadSettings();
		render();
		if (withdrawn) return;
		const reached = await readStatus();
		render();
		if (reached) {
			const path = status?.settings_path;
			if (path) $('where').textContent = t.where(path);
		}
	} catch (error) {
		showError(error);
	}
}

main();

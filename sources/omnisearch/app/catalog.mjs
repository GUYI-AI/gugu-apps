// What the person picks between: services (one key each) and the capabilities agents get from them.
// Shared by launch.mjs (what agents see and call) and the settings page (what the person sees).

export const SERVICES = {
	firecrawl: { name: 'Firecrawl', env: 'FIRECRAWL_API_KEY', keyUrl: 'https://www.firecrawl.dev/app/api-keys', site: 'https://www.firecrawl.dev' },
	context7: { name: 'Context7', env: 'CONTEXT7_API_KEY', keyUrl: 'https://context7.com/dashboard', site: 'https://context7.com' },
	tavily: { name: 'Tavily', env: 'TAVILY_API_KEY', keyUrl: 'https://app.tavily.com', site: 'https://tavily.com' },
	exa: { name: 'Exa', env: 'EXA_API_KEY', keyUrl: 'https://dashboard.exa.ai/api-keys', site: 'https://exa.ai' },
	brave: { name: 'Brave Search', env: 'BRAVE_API_KEY', keyUrl: 'https://api-dashboard.search.brave.com', site: 'https://brave.com/search/api/' },
	kagi: { name: 'Kagi', env: 'KAGI_API_KEY', keyUrl: 'https://kagi.com/settings?p=api', site: 'https://kagi.com' },
	linkup: { name: 'Linkup', env: 'LINKUP_API_KEY', keyUrl: 'https://app.linkup.so', site: 'https://www.linkup.so' },
	github: { name: 'GitHub', env: 'GITHUB_API_KEY', keyUrl: 'https://github.com/settings/tokens', site: 'https://github.com' },
};

// One capability = one omnisearch tool. `via` maps a service to the tool's `provider` value (null: the tool has no provider argument).
export const CAPABILITIES = [
	{ id: 'web_search', tool: 'web_search', title: { zh: '网页搜索', en: 'Web search' },
		about: { zh: 'agent 上网找资料时用哪家', en: 'Which service agents search the web with' },
		via: { firecrawl: 'firecrawl', tavily: 'tavily', brave: 'brave', exa: 'exa', kagi: 'kagi' } },
	{ id: 'web_extract', tool: 'web_extract', title: { zh: '读网页', en: 'Read pages' },
		about: { zh: '把网址的正文读下来，整站也行', en: 'Read a page, or a whole site' },
		via: { firecrawl: 'firecrawl', tavily: 'tavily', exa: 'exa', kagi: 'kagi' } },
	{ id: 'library_docs', tool: 'library_docs', title: { zh: '查编程文档', en: 'Library docs' },
		about: { zh: '写代码前查准库的最新用法', en: 'Up-to-date docs for code libraries' },
		via: { context7: null } },
	{ id: 'ai_search', tool: 'ai_search', title: { zh: '带出处的回答', en: 'Cited answers' },
		about: { zh: '直接给答案，附上来源', en: 'An answer with its sources' },
		via: { exa: 'exa_answer', tavily: 'tavily_research', kagi: 'kagi_fastgpt', linkup: 'linkup' } },
	{ id: 'github_search', tool: 'github_search', title: { zh: '搜 GitHub', en: 'Search GitHub' },
		about: { zh: '找代码、仓库和人', en: 'Code, repositories and people' },
		via: { github: null } },
];

export const SETTINGS_FILE = 'settings.json';

/** The service a capability uses: the person's pick when it has a key, else the first service with a key; 'off' or none → null. */
export function serviceFor(capability, settings) {
	const keys = settings.keys ?? {};
	const pick = settings.use?.[capability.id];
	if (pick === 'off') return null;
	const hasKey = (service) => Boolean(keys[service]);
	if (pick && pick in capability.via && hasKey(pick)) return pick;
	return Object.keys(capability.via).find(hasKey) ?? null;
}

export function parseSettings(text) {
	if (!text) return { keys: {}, use: {} };
	const parsed = JSON.parse(text);
	return { ...parsed, keys: parsed.keys ?? {}, use: parsed.use ?? {} };
}

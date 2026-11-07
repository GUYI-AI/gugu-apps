// The 「Prompt 管理」 App's tools: the person's own prompts, the 「我的」 group of the composer's `/` menu, through the
// host's `gugu.prompts` (apiVersion 34, capability `prompts`). Nothing is kept here; the account holds the list.
// A delete is shown to the person at once with an undo.
const host = () => globalThis.gugu
const object = (properties = {}, required = []) => ({ type: 'object', properties, required, additionalProperties: false })
const id = { type: 'string', description: 'A prompt id, as list gives it.' }

export const list = {
  description: 'The person\'s prompts (id, title, text) and the read-only ones their Apps offer. query narrows by title or text.',
  inputSchema: object({ query: { type: 'string', description: 'Words in a title or the text.' } }),
  annotations: { readOnlyHint: true },
  run: ({ query } = {}) => host().prompts.list(query ? { query } : {}),
}

export const save = {
  description: 'Create a prompt, or replace one whole by its id. The text is plain: what the person inserts with / and sends.',
  inputSchema: object({
    id: { ...id, description: 'Leave out to create; give it to replace that prompt.' },
    title: { type: 'string', description: 'Short title shown in the / menu.' },
    prompt: { type: 'string', description: 'The full text.' },
  }, ['title', 'prompt']),
  run: (args) => host().prompts.save(args),
}

const del = {
  description: 'Delete a prompt. The person sees it at once and can undo it.',
  inputSchema: object({ id }, ['id']),
  annotations: { destructiveHint: true },
  run: ({ id }) => host().prompts.delete(id),
}

// `delete` is a reserved word as a binding, not as an export name: the tool is prompts__delete.
export { del as delete }

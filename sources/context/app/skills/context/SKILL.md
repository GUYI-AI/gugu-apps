---
name: context
description: Inspect project context health, loading capacity and memory links for Claude and Codex using the Context App. Use when asked to diagnose context, memory bloat, stale instructions or broken memory navigation.
---

# Context

Use `context__discover` to find projects on this machine and `context__diagnose` with its absolute project root. The host owns transcript indexing and parsing; never add a second parser or scan JSONL yourself.

Use `context__findings` with the report and rule id to page all evidence. Counts are per rule; health starts at 10 and deducts 3 for each red rule and 1 for each yellow rule, once per rule. Cleanup checks do not deduct. Pending observations are not zero.

Use `context__agent_prompt` for A1 (implicit contradictions), A2 (cross-language/rephrased duplicates) or A3 (claims invalidated by current code). It returns text only. Follow the person's request about whether to perform that focused review; do not spawn an agent automatically.

The App page owns deterministic repair preview and confirmation. Tell the person which project and rule to open. Never apply a preview as an agent or bypass the page by editing its App data. The program rechecks file hash and modification time, refuses changed sources, and keeps pre-edit snapshots.

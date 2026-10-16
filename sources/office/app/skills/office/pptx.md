# A .pptx: scripts/pptx.mjs

People pick shapes in 咕咕办公 and send them as pills; the link's `#` says where. `slide=3&shape=12`: slide 3, the
shape whose cNvPr id is 12 (`&k=2`: the slide gives that id twice and it is the second — address it as `12:2`, and
`k: 2` in an edit). `slide=3&box=x,y,w,h`: a box drawn on slide 3, in slide px — the shapes it touches are the ones meant
(`outline` gives each shape's box). The pill's words (`第 3 页 · 季度目标`) are the slide and the shape's first words.

Run `gugu-node <this folder>/scripts/pptx.mjs <command> …`. It prints one JSON; a refusal is one sentence on stderr,
exit code 1, and nothing written. `<deck>` below is the path the download gave (`saved_to`); its folder is yours alone,
so keep every file of this change in it — never in the current directory, which other agents share.

1. `outline <deck> [slide]`: every slide's shapes (id, k when repeated, name, kind, box, first words, `was` — a
   fingerprint of the shape as it is). With a slide, whole texts.
   `show <deck> 3 12[:2]`: that shape's whole XML, its `was` and the relationship ids its slide has. The name it
   gives is not the one the pill says? The deck changed since it was picked: say so.
2. Change only what you were asked to, in that XML: keep the element, its `cNvPr id`, the namespaces and `r:` ids the
   slide already has. Text is in `<a:t>` inside `<a:r>` runs; keep each run's `<a:rPr>` so the formatting stays.
3. Write the edits to a file in `<deck>`'s folder, `[{ "slide": 3, "shape": "12", "k"?, "name"?, "was": "…", "xml":
   "…" }]` (or `"delete": true`), several shapes at once, and `apply <deck> <that file>`: it changes `<deck>` in place,
   the file you save back. Every zip entry you did not touch is copied byte for byte; only the edited shapes' XML
   changes. The answer gives each edited shape's `was` now: a next change to it gives that one.
   Refused, said why: content-changed (that shape changed since you read it: `show` it again, redo the change); bad XML
   (a bare `&`: write `&amp;`); a changed id; an unknown prefix or relationship; deleting a shape an animation points at,
   or one kept in two copies (an equation, a newer chart: change it instead); a shape that only stands in for what
   PowerPoint shows (ink); the changed slide no longer drawing cleanly in pptx-glimpse (the warning is quoted).
4. Save the deck back: SKILL.md, "Download and save back".

Another tool: python-pptx adds slides, changes layouts and makes decks in bulk, but saves the whole package again
(entries you did not touch change too) and needs python and pip; have it write its result into `<deck>`'s folder too.
Whatever changed the deck, check it before saving it back: `check <new> --against <deck>` — every XML part strictly
well-formed, which entries changed, and no new pptx-glimpse warning on the changed slides.

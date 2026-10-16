---
name: office
description: "Before reading or changing an Office file in a chat's folder (群文件夹), a .pptx or .xlsx: download it, read and change it with this skill's script for its kind, save it back as the same file's next version."
---

# Office files in a chat's folder (咕咕办公)

People open them from the chat's folder in 咕咕办公 (Gugu Office), pick what should change and send it to the chat as
pills — `@[label](gugu-file://<item_id>?v=<version>#<where>)`, one per place: the file's `item_id`, the version it was
picked on, where in it (pptx.md, xlsx.md). Change only those places; the file already past that version: read the new one and
check each place is still there first. To point someone at a place yourself, write the same pill (copy it as it is).
When you save a new version, the file they have open shows it.

1. Download it (below): the file on this computer and its version N.
2. Read and change it with the script for its kind, in your shell: `gugu-node <this folder>/scripts/pptx.mjs …`
   (pptx.md says how), `gugu-node <this folder>/scripts/xlsx.mjs …` (xlsx.md). `gugu-node` is gugu's own Node, on
   your PATH; where there is none, `node` 22.2 or later.
3. Save it back (below) as the same file's next version — never a new attachment.
4. Say in the chat what you changed: by slide and shape, by cell address.

Another tool (python-pptx, openpyxl, say) may do it too: pptx.md and xlsx.md say what each keeps.

## Download and save back

- Download: `workspace__read({ item_id, save: true })` saves the whole file on this computer and gives `saved_to` (its
  path) and `version` N. `item_id` is in the pill's link, or `workspace__list({ chat_id })` gives it. That folder
  is yours alone (one per agent, file and version): change the file there, in place, and keep your other files of this
  change beside it — the current directory is shared with other agents.
- Save back: `workspace__edit({ item_id, path, expected_version: N })`: the file at `path` becomes its next version.
- Refused because someone saved a newer one since: read it again and make your change on that (the same edits apply
  again; a shape they changed is refused, read it again).

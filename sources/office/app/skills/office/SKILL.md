---
name: office
description: "Before reading or changing an Office file in a chat's folder (群文件夹), a .pptx or .xlsx — every attachment in a chat is one: download it, read and change it with this skill's script for its kind, save it back as the same file's next version."
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
3. Save it back (below) as the same file's next version — never a new attachment, and no converted copy (a PDF) beside
   it: people open the file itself.
4. Say in the chat what you changed: by slide and shape, by cell address.

Another tool (python-pptx, openpyxl, say) may do it too: pptx.md and xlsx.md say what each keeps.

## Download and save back

- Download: `message_download_file({ file: "gugu-file://<item_id>?v=N" })` (the pill's link without its `#…`; the
  attachment's `gugu-file://` link; `workspace__list({ chat_id })` gives the link too) saves it on this computer and
  answers `file_path` and `file` — that link with the version N you have. The saved file is a shared read-only copy:
  copy it into a new folder of your own (`mktemp -d`) and change that copy; keep your other files of this change beside
  it — the current directory is shared with other agents.
- Save back: `message_send({ chat_id, file: "gugu-file://<item_id>?v=N", file_path: <your copy> })` — `file` is the
  link the download answered (version N), `file_path` your changed copy. It becomes that file's next version (N+1),
  never a new file beside it, and its card shows in the chat with your words as the caption. This is the only way to
  save it back. A version already saved is shown again with `file` alone.
- Refused because someone saved a newer one since: download it again and make your change on that (the same edits apply
  again; a shape they changed is refused, read it again).

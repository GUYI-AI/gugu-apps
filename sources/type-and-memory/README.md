# type and memory

A page to write on in a chat's side panel; the chat's agent reads along and leaves notes in the margin.

`app/` is the bundle the market packs. `main.js` and `tools.js` are build output (esbuild, not minified) of the App's
own repository, which is not public; this folder is the published copy and the only source the market reads.
`main.js` is the page (a framework-free editor and the bridge to the chat's file and agents); `tools.js` gives agents
three tools, `read`, `annotate` and `reply`, which open the page's chat file and write notes into it.

# type and memory

A page to write on in a chat's side panel; the chat's agent reads along and leaves notes in the margin. Opened on its own (the dock, a phone's App list), you write alone on this device or with one of your agents, on the page of your private chat with it.

`app/` is the bundle the market packs. `main.js` and `tools.js` are build output (esbuild, not minified) of the App's
own repository, https://github.com/shuxueshuxue/type-and-memory (`node build.mjs`, then `dist/gugu/app`).
`main.js` is the page (a framework-free editor and the bridge to the chat's file and agents); `tools.js` gives agents
three tools, `read`, `annotate` and `reply`, which open the page's chat file and write notes into it.

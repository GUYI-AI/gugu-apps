Lets an agent browse, click, fill in and take screenshots in its own task's Gugu browser page. It uses that page's browser profile and sign-ins; no separate browser is started on a desktop.

The App runs the browser tools itself and reaches exactly one page: the one Gugu lends to the calling task. It cannot open other tabs, read other tasks' pages or run code in its own process. Files the agent uploads or saves stay inside the task's working folder.

Uninstall or switch off this App and agents can no longer call its tools; browsing by hand works as before.

The tools come from Playwright MCP, licensed under Apache-2.0. Needs Gugu App interface 36.

# App market promotional artwork

Each HTML file is a reusable 1600 × 900 (16:9) canvas: App icon and name, one concise benefit, and an existing real screenshot. The dark brand canvas stays fixed in both client themes. Text uses Noto Sans CJK SC with PingFang SC as the macOS fallback.

Open a template in a headless Chromium browser with a 1600 × 900 viewport. Wait for `document.fonts.ready`, decode every image, and wait two animation frames; capture only `.promo` at device scale 1. Save to the App package’s `screenshots/promo.png`; verify 1600 × 900 and at most 1 MiB. Keep the same browser and fonts for a batch. The current exports use Chromium 155.

To add an App, copy a template and replace the icon, name, benefit, screenshot path and brand color variables. Keep the product screenshot real. Do not redraw controls, invent features or stretch the screenshot. Prepend a Markdown image to the package README and preserve every original image afterward. A new package version and normal index PR are required.

## Screenshot sources

All product images below already existed in the corresponding App before this artwork change, except Radar and Context, whose screenshots were retaken in the client for 0.2.1 in an example account to show the 0.2 interface, Paper Club, whose screenshots were retaken for 0.3.9 to show the reworked reader, Calendar, whose screenshots were retaken in the client for 0.5.5 to show the time axis, and Forum, whose screenshots were retaken in the client for 0.2.0 in example accounts to show the new layout (see each App's `screenshots/SOURCE.md`). Only their placement inside the promotional frame is new.

| Template | Product screenshot, relative to package root | SHA-256 |
| --- | --- | --- |
| `context.html` | `screenshots/1.jpg` | `59ae3c46fd132ec75b1cfd0973282286cf5286b1e7b902388079d824dd9dc287` |
| `browser-use.html` | `screenshots/1.jpg` | `b20cc7ea678d121fd35558f0874b7675365f3663792425f0f47dd6e2a67b9f90` |
| `computer-use.html` | `screenshots/settings.jpg` | `1c5711fdb83f78a416d689f28cb6a5626150bb74d09968c9646797a72e3a1c2b` |
| `day-calendar.html` | `screenshots/side.png` | `78e9df4611db4ee671d483c98c6d045770afe5af2482ea2e22e304e49b354acd` |
| `forum.html` | `screenshots/3.jpg` | `7662ae08cfe657102729704636ed8aba783024410b911d19aed9eadd0b54c69b` |
| `kanban.html` | `screenshots/1.jpg` | `d6ebdf117d10c533efb984be017840f6aca80c5a95536055326e8140920e582b` |
| `office.html` | `screenshots/1.jpg` | `0df5e78865659d4b16d90a5dba9cd40abca227a51b21bc702b64b2dff4368465` |
| `omnisearch.html` | `screenshots/1.jpg` | `7ab7f0ddbd42d8433e19e5b0770374aa51d8f33c871287b53ad4cfc6b418e948` |
| `paper-club.html` | `screenshots/1.jpg` | `4bdfec7a8a7d7fd6611d5318083a9f0485d84a34b2e1771e073fd33f235c4fe5` |
| `radar.html` | `screenshots/1.jpg` | `d4f58bc74dabf211407cabdd9436cc35503a36bc06d7de33a1ce22dc5bd69d49` |
| `turtle-soup.html` | `screenshots/1.jpg` | `ac5df95fc41ff375b0516b61e9bc1b34a248e9bd335152f015c1f4cca503f0cc` |

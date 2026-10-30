# App market promotional artwork

Each HTML file is a reusable 1600 × 900 (16:9) canvas: App icon and name, one concise benefit, and an existing real screenshot. The dark brand canvas stays fixed in both client themes. Text uses Noto Sans CJK SC with PingFang SC as the macOS fallback.

Open a template in a headless Chromium browser with a 1600 × 900 viewport. Wait for `document.fonts.ready`, decode every image, and wait two animation frames; capture only `.promo` at device scale 1. Save to the App package’s `screenshots/promo.png`; verify 1600 × 900 and at most 1 MiB. Keep the same browser and fonts for a batch. The current exports use Chromium 155.

To add an App, copy a template and replace the icon, name, benefit, screenshot path and brand color variables. Keep the product screenshot real. Do not redraw controls, invent features or stretch the screenshot. Prepend a Markdown image to the package README and preserve every original image afterward. A new package version and normal index PR are required.

## Screenshot sources

All product images below already existed in the corresponding App before this artwork change, except Context, whose screenshots were taken for its 0.1.1 listing from a real project report with paths and machine names replaced, Paper Club, whose screenshots were retaken for 0.3.9 to show the reworked reader, and Calendar, whose screenshots were retaken in the client for 0.5.5 to show the time axis (see each App's `screenshots/SOURCE.md`). Only their placement inside the promotional frame is new.

| Template | Product screenshot, relative to package root | SHA-256 |
| --- | --- | --- |
| `context.html` | `screenshots/1.jpg` | `ee9dfdfaefc6fbed364b7df10c73a30f0b05e84bf05467dfc2284e1a08fc9b50` |
| `browser-use.html` | `screenshots/1.jpg` | `b20cc7ea678d121fd35558f0874b7675365f3663792425f0f47dd6e2a67b9f90` |
| `computer-use.html` | `screenshots/settings.jpg` | `1c5711fdb83f78a416d689f28cb6a5626150bb74d09968c9646797a72e3a1c2b` |
| `day-calendar.html` | `screenshots/side.png` | `78e9df4611db4ee671d483c98c6d045770afe5af2482ea2e22e304e49b354acd` |
| `forum.html` | `screenshots/compose.jpg` | `b99d6d2a5af4d6033b601b52c86ae087438f460c279d7c5d11fac8236ed1c37d` |
| `kanban.html` | `screenshots/1.jpg` | `d6ebdf117d10c533efb984be017840f6aca80c5a95536055326e8140920e582b` |
| `office.html` | `screenshots/1.jpg` | `0df5e78865659d4b16d90a5dba9cd40abca227a51b21bc702b64b2dff4368465` |
| `omnisearch.html` | `screenshots/1.jpg` | `7ab7f0ddbd42d8433e19e5b0770374aa51d8f33c871287b53ad4cfc6b418e948` |
| `paper-club.html` | `screenshots/1.jpg` | `4bdfec7a8a7d7fd6611d5318083a9f0485d84a34b2e1771e073fd33f235c4fe5` |
| `radar.html` | `screenshots/1.jpg` | `967cb35d769065b25f756f74a20e8d48434174d465434abe77995f219aa1a3d5` |
| `turtle-soup.html` | `screenshots/1.jpg` | `242c3f9a7f3c06801b5fed8d59d3c913395e05a8f8f40f7ba6d253fe3c668970` |

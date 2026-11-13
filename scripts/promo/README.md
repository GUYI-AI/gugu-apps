# App market promotional artwork

Each HTML file is a reusable 1600 × 900 (16:9) canvas: App icon and name, one concise benefit, and an existing real screenshot. The dark brand canvas stays fixed in both client themes. Text uses Noto Sans CJK SC with PingFang SC as the macOS fallback.

Open a template in a headless Chromium browser with a 1600 × 900 viewport. Wait for `document.fonts.ready`, decode every image, and wait two animation frames; capture only `.promo` at device scale 1. Save to the App's `store/screenshots/0-promo.png` (file-name order puts it first: the market's featured artwork); verify 1600 × 900 and at most 1 MiB. Keep the same browser and fonts for a batch. The initial exports used Chromium 155. The Paper Club native-image refresh uses Electron 44.0.0 / Chromium 152.0.7977.54 on macOS 26.5.1, with the existing PingFang SC font fallback. Other exports retain their recorded renderer.

To add an App, copy a template and replace the icon, name, benefit, screenshot path and brand color variables. Keep the product screenshot real. Do not redraw controls, invent features or stretch the screenshot. Keep every original screenshot beside it in `store/screenshots/`. A new package version and normal index PR are required.

## Screenshot sources

All product images below already existed in the corresponding App before this artwork change, except Radar and Context, whose screenshots were retaken in the client for 0.2.1 in an example account to show the 0.2 interface, Paper Club, whose screenshots were retaken for 0.3.9 to show the reworked reader, Calendar, whose screenshots were retaken in the client for 0.5.5 to show the time axis, and Forum, whose screenshots were retaken in the client for 0.2.0 in example accounts to show the new layout (see each App's `store/SOURCE.md`). Only their placement inside the promotional frame is new.

| Template | Product screenshot, relative to package root | SHA-256 |
| --- | --- | --- |
| `context.html` | `store/screenshots/1.jpg` | `59ae3c46fd132ec75b1cfd0973282286cf5286b1e7b902388079d824dd9dc287` |
| `browser-use.html` | `store/screenshots/1.jpg` | `b20cc7ea678d121fd35558f0874b7675365f3663792425f0f47dd6e2a67b9f90` |
| `computer-use.html` | `store/screenshots/settings.jpg` | `1c5711fdb83f78a416d689f28cb6a5626150bb74d09968c9646797a72e3a1c2b` |
| `data-lens.html` | `scripts/promo/data-lens-chat.png` (repo path; not in the package) | `852d562d0635f57a4fbd043af6d6d2b58ffc691798125b4fa1aabb96ae006b97` |
| `day-calendar.html` | `store/screenshots/side.png` | `78e9df4611db4ee671d483c98c6d045770afe5af2482ea2e22e304e49b354acd` |
| `forum.html` | `store/screenshots/3.jpg` | `7662ae08cfe657102729704636ed8aba783024410b911d19aed9eadd0b54c69b` |
| `kanban.html` | `store/screenshots/1.jpg` | `339866f4d5f9a1777da860619fa9bafda967aee8da9fc0528a5d4664fd41a030` |
| `office.html` | `store/screenshots/1.jpg` | `0df5e78865659d4b16d90a5dba9cd40abca227a51b21bc702b64b2dff4368465` |
| `omnisearch.html` | `store/screenshots/1.jpg` | `7ab7f0ddbd42d8433e19e5b0770374aa51d8f33c871287b53ad4cfc6b418e948` |
| `paper-club.html` | `store/screenshots/1.jpg` | `e26afb7562ff42903bce04b1bd37cb5d45b525b0301cdd6c5693c6698f300f2c` |
| `radar.html` | `store/screenshots/1.jpg` | `d4f58bc74dabf211407cabdd9436cc35503a36bc06d7de33a1ce22dc5bd69d49` |
| `turtle-soup.html` | `store/screenshots/1.jpg` | `ac5df95fc41ff375b0516b61e9bc1b34a248e9bd335152f015c1f4cca503f0cc` |
| `type-and-memory.html` | `store/screenshots/1.png` | `0569e7c42fadffa0fdd048bd9d384de31de7576ccfb6c9519d2b90a46479f459` |

## Teamboard and Data Lens native-image refresh

The Teamboard 1.4.1 and Data Lens 0.1.3 artwork uses actual desktop captures of the preceding App versions, installed through the normal market UI. The final board and chart use native device-scale-2 pixels; the cover canvas stays at scale 1. Electron 44.0.0 / Chromium 152.0.7977.54 on macOS 26.5.1 rendered the covers with PingFang SC, the existing font fallback. See each App's `store/SOURCE.md` for the crop sizes and the retained earlier gallery images. The layouts, icons, colours and wording remain fixed; the new Data Lens template reuses the shared frame and constrains the product image to its native size or smaller.

## Data Lens in a group chat (0.1.4)

The Data Lens cover now shows the App where it is used: a person asks an agent about a CSV in a group, and the agent answers
with a chart card. `data-lens-chat.png` is an exact crop of a native desktop capture (device scale 2) of that conversation;
it sits beside the template because it is cover material, not a gallery image. It was taken in a narrow (800 px) window so
the question and the card sit close together and stay legible in the frame. The template now caps the image at the frame's
530 px height: an image narrower than 16:10 is centred instead of being stretched to full width and clipped at the bottom. The cover was rendered with Chromium 147 on Linux, with Noto Sans
CJK SC (the template's first font) supplied through a private fontconfig. See `sources/data-lens/app/store/SOURCE.md`.

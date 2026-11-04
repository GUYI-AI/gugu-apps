# Market media sources

The product images were captured in the Gugu desktop client on macOS on November 4, 2026 (UTC), with Teamboard 1.4.0 installed through the normal market UI. The host was built from `GUYI-AI/gugu@9b07c9a232f78d963193dd2cfe1ce4d3326b734a`; the App source was `GUYI-AI/gugu-apps@7c480639bb64f7a66c31d185a56df2ebbf0623ce`.

The board and comments were created through the product. The final board contains 15 example cards about a reading group: four To do, four In progress, three Review and four Done. Teamboard 1.4.0 has no separate assignee or label fields for these cards; the pictures show its real due dates, progress and Waiting on state. The extra cards were added by one person, not presented as a multi-person editing demonstration.

| File | Native picture and crop in device pixels (x, y, width, height) | What it shows |
| --- | --- | --- |
| `1.jpg` | `kb-board-2x.png`, (641, 198, 2528, 1580) | All four columns and the complete header, including the filters and Add column control |
| `2.jpg` | `kb-card-detail.png`, (996, 86, 600, 700) | A card's properties, note, links and a comment |
| `3.jpg` | `kb-card-detail.png`, (308, 86, 1288, 804) | The same card in the context of the earlier six-card board |

The first picture was captured with device scale factor 2: a 1600 × 1000 logical window produced a 3200 × 2000 native PNG. The other two pictures retain their original 1600 × 1000, scale-1 captures. The cropped PNG masters match the original pixels exactly; the JPEG gallery exports use quality 90, without resizing. The crops omit desktop navigation and the capture label, without replacing or painting over interface content.

`0-promo.png` uses the existing `scripts/promo/kanban.html` frame, icon, colours and wording, with the same final-board crop as `1.jpg`. Its composition is separate from the native screenshot: the 2528 × 1580 product image is downsampled into the existing frame on a 1600 × 900 canvas, device scale 1. The empty area below the cards is part of the real board; no extra cards or controls were drawn to fill it.

The export used Electron 44.0.0 / Chromium 152.0.7977.54 on macOS 26.5.1, with the existing PingFang SC font fallback. Native PNGs, crop masters and render records are retained separately. These images replace the earlier pictures rendered in a browser against the host stylesheet; this release does not change board behaviour.

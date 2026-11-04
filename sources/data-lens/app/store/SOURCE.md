# Screenshot source

Each image is a Data Lens card as an agent posted it in a group chat, captured in the Gugu desktop client (light theme) on November 2, 2026, and cropped to the card (420 × 360). The client was not redrawn.

- `1-bar.png`, `2-heatmap.png`: cards over a sample sales workbook (`.xlsx`).
- `3-series.png`, `5-table.png`: a three-series line card and a 12-column, 640-row table card over a sample `.sqlite` database.
- `4-line.png`: a card over a sample store-traffic `.csv`.

The data files are synthetic, generated for testing; no real customers or sales appear in them.

## Native cover refresh, November 4, 2026

`0-promo.png` and `1-native.png` show a new single-series card, “每周阅读页数合计”, posted by an agent through the product. It uses an example reading-group CSV with five rows, one for each week. The grey bars are the App's normal single-series colour; the chart and its accompanying description agree. No real customer data is shown.

Data Lens 0.1.2 was installed through the normal market UI from `GUYI-AI/gugu-apps@6d3b8e472826742bd6496146e19b7ac96581d81b`. The Gugu desktop host was built from `GUYI-AI/gugu@9b07c9a232f78d963193dd2cfe1ce4d3326b734a`, on macOS 26.5.1. It captured a real device-scale-2 rendering: a 1600 × 1000 logical window produced a 3200 × 2000 native PNG. The host and the App webview both reported device pixel ratio 2.

`1-native.png` is the exact native crop of `dl-card-2x.png` at (618, 736, 1152, 720), in device pixels. It retains the title, five bars and the Open / Ask an agent buttons, while omitting surrounding chat text and the capture label. It was not upscaled, redrawn or populated by editing a screenshot. The original five gallery images described above are retained.

The cover uses the existing shared promotional layout at 1600 × 900 and device scale 1, with `scripts/promo/data-lens.html`. The native product crop is downsampled into the frame; the icon, brand colours and wording follow the approved template. Electron 44.0.0 / Chromium 152.0.7977.54 rendered it with the existing PingFang SC font fallback. The native screenshot, crop and promotional composition are recorded separately. This artwork-only release changes no charting or data-loading code.

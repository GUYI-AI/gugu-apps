# Market media sources

The product images were captured in the Gugu desktop client on macOS on November 4, 2026 (UTC), with Paper Club 0.5.0 installed through the normal market UI. The host was built from `GUYI-AI/gugu@9b07c9a232f78d963193dd2cfe1ce4d3326b734a`; the App source was `GUYI-AI/gugu-apps@7c480639bb64f7a66c31d185a56df2ebbf0623ce`.

The original windows were 1600 × 1000 device pixels. The images were cropped from those native PNGs, without upscaling, control redraws or edited conversations. The two people created their highlights and comments in the product. There is no agent reply in these pictures; the “Ask an agent” control is shown as an available action only.

| File | Native picture and crop in device pixels (x, y, width, height) | What it shows |
| --- | --- | --- |
| `1.jpg` | `pc-thread.png`, (308, 45, 1288, 804) | A selected highlight and the two people's expanded comment thread |
| `2.jpg` | `pc-select-toolbar.png`, (308, 45, 1288, 804) | A real PDF text selection with colour, Comment, Ask an agent and Copy controls |
| `3.jpg` | `pc-filter-discussed.png`, (308, 45, 1288, 804) | The Discussed filter and the highlight's thread |

The JPEG gallery exports use quality 90; the native PNGs and cropped PNG masters are retained separately. The crop omits the desktop navigation and the capture label; it does not replace or paint over interface content.

`0-promo.png` uses the existing `scripts/promo/paper-club.html` frame, icon, colours and wording at 1600 × 900, device scale 1, with `1.jpg` as its product image. This promotional composition is separate from the native window capture. The export used Electron 44.0.0 / Chromium 152.0.7977.54 on macOS 26.5.1. The rendered heading, tagline and footer used PingFang SC (the existing fallback); no new fonts were installed.

## Paper attribution

The PDF is **ReAct: Synergizing Reasoning and Acting in Language Models**, by Shunyu Yao, Jeffrey Zhao, Dian Yu, Nan Du, Izhak Shafran, Karthik Narasimhan and Yuan Cao, [arXiv:2210.03629v3](https://arxiv.org/abs/2210.03629v3), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The screenshots show cropped passages with product highlights and discussion annotations; the paper's text was not rewritten. The authors do not endorse this App.

These native images replace the earlier browser-rendered example-host images. The artwork-only release does not change the reader's runtime behaviour.

# Market media sources

All five pictures are screenshots of Teamboard 2.0.0 running in the real Gugu clients on November 15, 2026 (UTC), against the shared test backend, in a scratch test group. The desktop client is a macOS build of `GUYI-AI/gugu` dev at `9b62809d8`; the phone pictures come from an Android debug build of the same day on an emulator (360 × 640 CSS pixels, scale 3). The App was installed from this source folder (desktop) and from an App card sent into the group (phone).

The board was filled through the App's own code: cards held by a real agent in the group were created and answered through `kanban__set` and the page; the other cards and their holders, machines and times were written with the App's `lib/core.js` operations, so every field is one the App produces. Holder and machine names are made up; the two green dots are a real agent running at the time.

| File | Client | What it shows |
| --- | --- | --- |
| `1.png` | desktop, light, board tab widened | The grouped list and a card open beside it: holder with live status, wait, next step, checklist, note, log, and 完成 kept off while a check is open |
| `2.png` | phone, light | The list's first screen: two questions with their answers as buttons, then 进行中 with a stopped card first |
| `3.png` | phone, light | A card opened from the bottom |
| `4.png` | desktop, dark | The list in the dark theme |
| `5.png` | phone, dark | The phone list in the dark theme |

Desktop pictures are captures of the App's own view (no window chrome) at scale 1. Phone pictures are `adb screencap` captures with the top 100 and bottom 20 device pixels cut (the Android status bar), otherwise unchanged. Nothing was painted over or redrawn.

`0-promo.png` is the existing `scripts/promo/kanban.html` frame, icon, colours and wording, with `1.png` as its product image (scaled to the frame's width, cut at its bottom edge). It was rendered at 1600 × 900, device scale 1, with Chrome for Testing 151 headless on macOS, PingFang SC as the font fallback.

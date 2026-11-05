# Screenshot source

Every image is from the Gugu desktop client (light theme, Chinese UI) on November 5, 2026: Data Lens 0.1.4 installed
from this source, the host built from Gugu `dev` at `73a5d62b`, captured natively at device scale 2 on Linux. Nothing was redrawn.

The scene is a real conversation in a two-member group, 「门店经营周会」: a person posts a CSV of weekly figures for five
stores and asks an agent, "这是上半年各门店的周报，有什么值得注意的？". The agent (Codex, model Gugu GPT-6 Luna) read the
Data Lens skill, called `data_profile`, `data_query` and `data_card`, and answered with three cards and a summary.

- `1-chat.png` — the question and the first card in the group (window crop, scaled to 60 %).
- `2-open.png` — the card opened with 展开: Data Lens beside the chat, showing the whole 120-row file (scaled to 50 %).
- `3-findings.png` — the outlier card and the agent's findings (scaled to 75 %).
- `0-promo.png` — the market cover, `scripts/promo/data-lens.html` around an exact crop of the question and the agent's
  first card. That crop comes from a second run of the same scene in a narrow (800 px) window, so the two sit close together.

The CSV is synthetic, generated for this capture; no real stores, customers or sales appear in it. The person's name in
the chat is a test account's display name.

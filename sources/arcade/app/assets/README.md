# Fonts

Both are cut down to the characters this App writes (its buttons, tabs and lines, plus printable ASCII), so a whole font is a few KB. Names and anything else fall back to the system font.

- `arcade-pixel.woff2`: Fusion Pixel Font 12px proportional, zh_hans, v2026.10.25 (https://github.com/TakWolf/fusion-pixel-font), SIL OFL 1.1 (`arcade-pixel-OFL.txt`; the fonts it draws on, in `arcade-pixel-licenses/`).
- `arcade-start.woff2`: Press Start 2P (https://github.com/google/fonts/tree/main/ofl/pressstart2p), SIL OFL 1.1 (`arcade-start-OFL.txt`), only A–Z, 0–9 and a little punctuation.

Subsetting makes them Modified Versions under the OFL, and "Press Start 2P" is a Reserved Font Name, so both are renamed (`Arcade Pixel`, `Arcade Start`) in their name tables and in `style.css`. Made with fontTools: `pyftsubset <font> --text-file=<chars> --flavor=woff2 --layout-features=`, then the name records rewritten.

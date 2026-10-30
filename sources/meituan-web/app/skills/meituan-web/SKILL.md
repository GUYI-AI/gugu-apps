---
name: meituan-web
description: 美团（实验性、依赖美团网页版）— use your own browser tab, with the person's own login, to search Meituan's web/H5 pages for merchants, food, 团购 and hotels, compare them, read details and add items to a cart. Use when the person asks you to look something up or shop on 美团 / Meituan. Never place or pay an order yourself.
---

# 美团（实验性）: Meituan through its web pages

Meituan has **no official public API or MCP**. Everything here works by operating Meituan's web/H5 pages in your own
browser tab, so it is experimental: when Meituan changes a page, a step can stop working. Say so to the person when it
matters; never promise things like 「一键点外卖」.

## The browser you use

Use the `browser_*` tools of the `gugu-browser` MCP server (`browser_navigate`, `browser_snapshot`, `browser_click`,
`browser_type`, `browser_take_screenshot` …). They drive the browser tab in your session, which the person watches and
which keeps their logins. On a desktop they come from the 「Browser Use」 App; on a Gugu cloud computer / server they are
the cloud browser, and only **task agents** get them there. If they are not in your tool list, look in `catalog_list`
for `browser`.

- **You are the personal assistant (or a tool says browser actions need a task agent):** don't drive the browser
  yourself. Hand the Meituan job to a task agent on the device with the browser (`session_spawn`), pass it this skill's
  rules (no order or payment, person does login/codes/checks, fail loud), and relay its result.
- **No browser tools at all and nothing to hand to:** stop and tell the person that this needs a browser — on a desktop
  the 「Browser Use」 App installed and enabled. Do not launch your own browser, Playwright or Chrome, and do not try to
  answer from memory instead.

## Where to go

- Home, search, 团购 and merchants (mobile pages, easiest to read): `https://i.meituan.com`
- Desktop site: `https://www.meituan.com`
- 外卖 H5: `https://h5.waimai.meituan.com/waimai/mindex/home` (often needs login and a delivery address; it may refuse
  to load or redirect to the app — then say so)
- Hotels: from the home page's 酒店 entry, or search there.

Prefer following the page's own links and search box over guessing deep URLs.

## City and location

Results depend on the city and, for 外卖 and 附近, on the exact address. If the person has not said where, **ask** for
the city (and the address or area when it matters) before searching. Check the city the page shows and switch it if it
is wrong; tell the person which city/address the results are for.

## Login, codes and checks: the person does them

- **Never ask for a password, SMS code or payment PIN in chat**, and never type one you were told in chat.
- When a page needs login: if you have `browser_request_login`, open the login page and call it (the person fills it in
  Gugu's password vault, you never see it). Otherwise ask the person to log in themselves in the browser tab and to tell
  you when they are done.
- SMS / 2FA code, CAPTCHA, slider check, 「打开美团 App」 prompts, risk-control pages: call `browser_request_takeover` if
  you have it; otherwise ask the person to do that step in the tab. Then take a fresh `browser_snapshot`.
- If a tool says the person took over or stopped the browser, stop and tell them what you did; do not retry.

## What you may do

- Search merchants, dishes, 团购 deals and hotels; open listings and read prices, 人均, ratings, sales, distance,
  opening hours, delivery fee / minimum order, deal contents and rules, refund terms, hotel room types and prices for
  the dates the person gave.
- Compare: put the options side by side (a short table is fine), with the city/address, dates and when you read them.
  Prices and stock change; say they are what the page showed at that moment.
- Add items or deals to the cart / select options **when the person asked for it**, then show them what is in the cart
  and the total the page shows.

## What you never do

- **Never submit an order, pay, or confirm a payment** — not even when the person says 「直接下单」. Bring the page to
  the order/confirm step, tell them what is in it (items, address, time, total), and hand over:
  `browser_request_takeover` if you have it, otherwise ask them to check and confirm it themselves in the tab.
- Do not change the person's addresses, payment methods, account settings, or use coupons/points that cost something
  unless they asked for exactly that; do not cancel or refund orders.
- Do not message merchants, write reviews or contact customer service on their behalf unless asked, and show them the
  text first.

## Fail loud

- Read what the page actually shows (`browser_snapshot`; a screenshot when the layout matters). Report only what you
  read there; never fill gaps with guesses or remembered prices.
- If a page will not load, looks different from what you expect, keeps redirecting to the App or to a check, or a
  click does nothing, say plainly which step failed and what you saw, and what the person can do (e.g. log in, pass the
  check, try the Meituan App). Do not pretend it worked and do not invent results.
- If you could only get part of what was asked (e.g. 3 of 5 shops), say which part is missing.

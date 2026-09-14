# External SEO benchmarks (2026)

Distilled 2026-09-15 from [AgriciDaniel/claude-seo](https://github.com/AgricIDaniel/claude-seo)
(MIT-licensed reference data, read for research — no code from that project
runs anywhere in this repo or this loop). Kept only what's actually relevant
to a single-page Singapore local-service business; skipped e-commerce,
hreflang/i18n, programmatic SEO, and anything requiring their paid
extensions. Numbers below are dated and will decay — re-verify before
leaning on anything older than ~6 months from here.

## Schema.org — what's actually retired (Google rich results)

PWP's current JSON-LD (`LocalBusiness`, `FAQPage`, `WebSite`, `VideoObject`)
uses none of the retired types below — confirmed clean, no cleanup needed.
Listed so future iterations don't accidentally add a dead type:

| Type | Retired | Replacement |
|---|---|---|
| `FAQPage` (rich result only — vocabulary still valid) | 2026-05-07, all sites | None — keep markup for Bing/AI crawlers, don't expect a Google SERP box. See [[faq-rich-results]] note already in PLAYBOOK.md. |
| `HowTo` | 2023-09 | None for SERP benefit |
| `ClaimReview` | 2025-06 | None |
| `VehicleListing` | 2025-06 | `Product` if sold online |
| `EstimatedSalary` | 2025-06 | `JobPosting` with `baseSalary` |
| `LearningVideo` | 2025-06 | `VideoObject` (still live — what PWP already uses) |
| `SpecialAnnouncement` | 2025-07 | `Event` or `Article` |
| Course Info *carousel* | 2025-06 | Single `Course` card still live (n/a to PWP) |

## Local SEO / Google Business Profile — concrete numbers

Source: Whitespark 2026 Local Search Ranking Factors (47 experts, 187
factors, published 2025-11-06) + Sterling Sky + BrightLocal LCRS 2026.

- **Ranking-factor weight**: GBP signals 32% (largest single group), review
  signals ~20% (up from ~16% in 2023, still rising), on-page 15-19%
  (slight decline), links declining multi-year.
- **Top 3 individual local-pack factors**: (1) primary GBP category, (2)
  keywords in GBP business title, (3) proximity of address to searcher.
  PWP's category ("Photo booth in Singapore") is already specific and
  correct — matches factor #1 well.
- **"Magic 10" threshold** (Sterling Sky, controlled study): a real ranking
  boost lands at exactly **10 reviews** — the 9→10 jump is noticeable, the
  10→11 jump isn't. **PWP is at 3 reviews as of 2026-09-14.** This is a
  concrete number to work toward, not just "get more reviews" — reaching
  10 is the actual lever.
- **"18-Day Rule"**: rankings measurably drop if no *new* review lands
  within roughly 3 weeks — velocity matters more than total volume. Keep
  asking recent clients steadily rather than in one batch.
- 74% of consumers only weigh reviews from the last 3 months (BrightLocal
  2026) — old reviews lose influence over both ranking and buyer trust.
- **Photos**: some ranking benefit from having photos vs. none, but no
  measurable extra benefit from adding more once you have a reasonable
  set (WebFX empirical testing). Geotagging photos has **no** ranking
  effect (common myth). Photos do drive 45% more direction requests
  though — a real, separate benefit.
- **Posts have no direct ranking impact** (WebFX empirical testing) — this
  matches what `gbp-posts-queue.md` already says about Posts being for
  local-pack visibility/trust, not ranking. Confirmed, not new, but good
  to have and independent source.
- **GBP profile completeness scoring** (50-point rubric, see the source
  repo's `maps-gbp-checklist.md` for the full table): Critical fields
  (category, name, address, phone, website, hours, verified status) carry
  2pts each; the "Complete info" banner Jeff keeps seeing in GBP is likely
  flagging Supplementary-tier fields (description length 250-750 chars,
  10+ recent photos, service areas, products/services detail) rather than
  anything ranking-critical. Worth a quick manual pass but not urgent.

## AI search (ChatGPT / Perplexity) doesn't read GBP directly

This is the most important reframe for "how do I show up in AI answers"
(BrightLocal LCRS 2026, Search Engine Land, Qwairy):

- 45% of consumers now use ChatGPT/AI tools for local recommendations, up
  from 6% previously — real and growing.
- **ChatGPT's sources for local business info**: Bing's web index
  (primary), Yelp, TripAdvisor, BBB, Reddit. It does **not** query Google
  Business Profile directly. All of PWP's GBP review/photo/post work,
  however valuable for Google's own local pack, does not feed ChatGPT
  recommendations.
- **Perplexity** is authority-first — pulls ~40% more from high-authority
  sites, averages ~22 citations per question.
- **Practical implication for PWP**: the directory/outreach targets already
  in `outreach-drafts.md` (SingaporeBrides, Bridestory, Blissful Brides,
  The Wedding Vow) aren't just backlinks — sites like these plus any
  Reddit/community mentions are plausible AI-citation sources in a way
  GBP posts/reviews structurally cannot be. Bing Places / Bing Webmaster
  presence is also worth checking (currently untracked in this loop) since
  Bing's index directly feeds ChatGPT.

## Core Web Vitals — current thresholds + the PageSpeed API fix

- LCP good ≤2.5s, INP good ≤200ms, CLS good ≤0.1 — unchanged from prior
  audits, just reconfirmed current as of June 2026.
- INP fully replaced FID (final removal from PageSpeed/CrUX: 2024-09-09) —
  if any future audit tool or blog references FID, it's stale.
- **The working PageSpeed Insights API call** (this loop has been blocked
  on a 429/no-key quota wall since 2026-08-29):
  ```bash
  curl -H "X-Goog-Api-Key: $GOOGLE_API_KEY" \
    "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://playingwithphoto.com&strategy=mobile"
  ```
  Key goes in the `X-Goog-Api-Key` **header**, not a `?key=` query param —
  worth trying this exact form once Jeff supplies a key, in case the
  header form has a separate/working quota tier from the anonymous
  no-key path already confirmed dead.

## What this doesn't change

No PWP site code, copy, or schema changed as a result of this file — it's
reference material only. Two items below moved into the PLAYBOOK backlog
because they're concrete enough to act on; everything else here is
context for future prioritization, not an immediate task.

# PWP SEO Playbook

Operating guide for the recurring SEO improvement loop. Each iteration: read this file
and the latest audit in `seo/audits/`, do the next most valuable item, verify, write a
new audit entry, commit to a branch, and tell Jeff what changed and what needs his
action. Never change visible page copy or design without flagging it to Jeff first —
technical SEO is autonomous, copy/brand is his call.

## Target queries (priority order)

1. photo booth rental Singapore
2. AI photo booth Singapore
3. wedding photo booth Singapore
4. vintage photo booth Singapore
5. corporate event photo booth Singapore
6. photo booth Malaysia / JB wedding photo booth (secondary market)

Note: users search "photo booth" (two words). Site copy historically used
"photobooth" only. Meta tags fixed 2026-07-20; visible copy still pending Jeff.

## Site facts

- Live domain (canonical): https://playingwithphoto.com/
- Also serves: photo.playingwithpencil.art, playingwithphoto.vercel.app, www.playingwithphoto.com — all canonicalized to the .com
- Repo: ~/playingwithphoto → github.com/Jefflai0315/playingwithphoto → Vercel auto-deploy from `main`
- Static single-page site, no build step (`outputDirectory: "."`)
- Legacy files (Landing v1/v2, index_before_hero_redesign.html, snapshot/) are deployed but noindexed via vercel.json X-Robots-Tag

## Rules for the loop

1. Reversible technical fixes: do them, commit to branch `seo-improvements`, notify Jeff to merge.
2. Copy, design, new pages/sections: draft them, but leave as proposal in the audit file.
3. Never keyword-stuff, never add hidden text, never fabricate reviews/ratings in schema.
4. Verify live state with curl after Jeff merges (check previous audit's "pending verification" list each run).
5. Keep one canonical domain: playingwithphoto.com. Everything else redirects or canonicalizes.

## Backlog (work top-down; re-prioritize each iteration)

- [x] JEFF: Google Search Console — verified playingwithphoto.com, sitemap.xml submitted 2026-07-21, status Success. First real Performance data pulled 2026-09-06 (245 impressions / 8 clicks / 3.3% CTR / 7.7 avg position over 3 months, 37 distinct queries) — see seo/audits/2026-09-06.md §1. No durable GSC API access exists; this was a one-off manual pull via the user's authenticated browser session, not a repeatable pipeline.
- [x] Google Business Profile for Playing With Photo — **already exists and is verified** (Jeff confirmed 2026-09-06: "Playing With Photo", category "Photo booth in Singapore", 5.0★, 102 customer interactions, pinned in Chinatown/Maxwell/Telok Ayer — matches the GSC query data exactly: "photobooth chinatown", "tanjong pagar photo booth", "maxwell photobooth"). Correcting earlier iterations, which incorrectly listed this as not-yet-set-up.
- [ ] JEFF: Optimize the existing Google Business Profile — profile strength shows "Complete info" still outstanding (likely missing services list/products/hours/description), and only **1 Google review** despite 102 customer interactions. Low review count plausibly caps local-pack ranking against competitors with more reviews. Two concrete actions: (1) fill out every profile field GBP flags as incomplete, (2) start asking recent customers for reviews (GBP has a built-in "Ask for reviews" / shareable review-link tool on the profile dashboard).
- [x] `/software/` page found stuck in "Discovered - currently not indexed" (real page, correctly linked + in sitemap, but Google hadn't crawled it) — Request Indexing submitted via GSC 2026-09-06, confirmed queued. Verify it flips to Indexed next iteration.
- [x] Vercel domain redirects — live-verified 2026-09-09: www.playingwithphoto.com and playingwithphoto.vercel.app both 308-redirect to playingwithphoto.com; photo.playingwithpencil.art 307-redirects. Turned out to already be solved in code via `vercel.json` `redirects` (commit 6258b01, done directly by Jeff outside this loop) — no dashboard action was needed after all.
- [x] Add visible "photo booth" (two-word) phrasing to hero pitch / section copy — Jeff picked the lines, shipped in iteration 4 (2026-07-21). Live-confirmed 2026-07-29 (16 occurrences site-wide).
- [x] Add an FAQ section + FAQPage JSON-LD — shipped in iteration 4 (2026-07-21), custom-backdrop question added same iteration. Live-confirmed 2026-07-29.
- [~] Directory/backlink pass: SingaporeBrides, Blissful Brides, Bridestory, The Wedding Vow vendor listings; wedding planner partnerships, plus Venuerific (corporate-event angle, found 2026-08-29). Research + submission paths + drafted outreach email done 2026-08-29 (seo/audits/2026-08-29.md §3). Jeff sent a humble "starter/lower-cost listing?" outreach email to Bridestory (sales@bridestory.com) 2026-09-10 — awaiting reply, not yet a confirmed listing. Jeff explicitly deprioritized Singapore Wedding Vendors and Bridestory's paid tier (cost); SingaporeBrides, Blissful Brides, The Wedding Vow, Venuerific still untouched. NEXT: check for a Bridestory reply; if none after ~2 weeks, consider a follow-up or move on to the free-outreach targets.
- [x] Image SEO: content image filenames already descriptive, no change needed. og-share.jpg recompressed 434KB→259KB (quality 50, visually verified, same dimensions) 2026-07-21.
- [~] Performance pass: real PageSpeed data received 2026-07-21 (mobile 64, desktop 93). Fonts + vision-scrub.css deferred non-blocking, image width/height added, all visually verified (seo/audits/2026-07-21.md Iteration 3). Deliberately left creation.css/hero-scrub.css blocking (genuinely critical to hero, risk of FOUC). The ~837KiB hero-scroll-scrub eager-loading issue was fixed by Jeff directly (commit 361e499, 2026-07-29, requestIdleCallback defer) — NEXT: needs a fresh PageSpeed run to confirm the score actually moved (not yet re-measured). Blocked again 2026-09-09: web UI polling stalled in the automation environment, public API quota exhausted (no key). JEFF: run https://pagespeed.web.dev/analysis?url=https://playingwithphoto.com manually and paste the mobile score, or share a `pagespeedonline.googleapis.com` API key so future iterations can pull this reliably.
- [~] Accessibility pass (score 81 mobile / 84 desktop): `<main>` landmark added, booking-form labels linked to inputs, h2->h4 heading skip fixed to h3 — all shipped 2026-07-29 (seo/audits/2026-07-29.md §2), branch `seo-improvements-4`. Color contrast (inline light-on-photo text colors) NOT fixed — real palette decision, needs Jeff.
- [ ] Consider /wedding, /corporate landing pages once single-page site ranks (only if GSC shows impressions but weak positions for those modifiers).
- [ ] Event schema for public events/activations when applicable.
- [x] Monitor: IG profile link should point to playingwithphoto.com (not .vercel.app) — Jeff confirmed done 2026-09-10.
- [ ] Work towards Search Keywords "Photobooth Singapore" / "AI photobooth Singapore" / "photo booth Singapore" / "wedding photo booth Singapore" / "corporate event photo booth Singapore" / "vintage photo booth Singapore" / "photo booth Malaysia / JB wedding photo booth" (secondary market). ALl points to Playingwithpencil.com
- [x] Uncommitted hero-redesign WIP — resolved, confirmed clean 2026-09-09 (committed to `main` sometime after 2026-09-06, visible as "Refactor service hero implementation and enhance accessibility features" and related hero-scrub commits). No longer a loss risk.
- [x] `/catalogue/` pages (shipped 2026-09-08, outside this loop) — found and fixed 2026-09-09: canonical mismatch (ai-styles.html pointed to an empty meta-refresh stub instead of itself), missing meta description + OG/Twitter tags on both catalogue pages, sitemap pointed at the same empty stub. Fixed: self-canonical, added meta tags, proper 308 redirect in vercel.json replacing the meta-refresh, sitemap updated to point at the real content URL. Branch `seo-improvements-8`. See seo/audits/2026-09-09.md §3.

## When the backlog empties

Do not idle. On a run where every backlog item is done/blocked-on-Jeff, switch to
maintenance mode and add new items derived from real data instead of guessing:

1. Pull Google Search Console data — NOTE: the agent has no GSC login/API access.
   GSC is verified (2026-07-21) but data only enters this loop when Jeff pastes it
   in (Performance report screenshot/export, or copy-pasted rows like the sitemap
   status). If no fresh GSC data has been shared since the last run, say so
   explicitly and ask Jeff to paste the Performance tab (queries/impressions/
   position) rather than silently skipping this step. Once pasted: identify
   queries with impressions but rank page 2+, and pages/queries that lost position
   week-over-week; turn the top 2 gaps into new backlog items.
2. Re-check the 3-5 named competitors' sites for changes (new pages, pricing,
   package structure) — note anything that shifts positioning.
3. Re-run Lighthouse; regressions become backlog items.
4. Check for broken links, 404s, expired seasonal content.
5. Propose ONE new content/page/FAQ expansion idea tied to an actual query gap from
   GSC — not a guess. If GSC isn't connected yet, skip this step and re-flag GSC
   setup as the blocker instead of inventing work.
6. If truly nothing new to do, say so plainly in the audit rather than manufacturing
   busywork — log "maintenance pass, no action needed" and note when GSC data will
   next be checked.

The goal is never "more tasks," it's closing the gap between current rankings and
target queries. Once GSC is live, that data should drive the backlog more than this
static list does.

## Iteration log

- 2026-07-20 — Iteration 1 (baseline, run manually in-session). See seo/audits/2026-07-20.md.
- 2026-07-21 — Iteration 2 (manual, on-request). og-share.jpg compressed −40%; FAQ + "photo booth" copy proposals drafted; performance pass partially blocked on tooling. See seo/audits/2026-07-21.md.
- 2026-07-21 — Iteration 2b (manual). Pricing decisions implemented: Showpiece 5h->6h at unchanged S$1,380, AI styles unlimited on all tiers. Branch seo-improvements-2.
- 2026-07-21 — Iteration 3 (manual, real PageSpeed data). Fonts + vision-scrub.css deferred non-blocking, image width/height added, all visually verified via local preview. Branch seo-improvements-3. See seo/audits/2026-07-21.md.
- 2026-07-21 — Iteration 4 (manual, Jeff instructions). Hero copy "photo booth", custom-backdrop FAQ, removed Email & SMS add-on. Committed straight to main. See seo/audits/2026-07-21.md.
- 2026-07-29 — Iteration 5 (scheduled). Verified iterations 1-4 all live (no gaps found). Accessibility pass: `<main>` landmark, form label associations, heading-order fix. Branch seo-improvements-4 (also carries Jeff's own concurrent /software/ trailing-slash fix — see audit §1). See seo/audits/2026-07-29.md.
- 2026-08-29 — Iteration 6 (scheduled). Verified iteration 5 + /software page live with no regressions despite heavy unrelated feature work on main. Noted Jeff's own commit already fixes the hero-scroll-scrub performance item. Directory/backlink research + drafted outreach copy for SingaporeBrides, Bridestory, Blissful Brides, Singapore Wedding Vendors, The Wedding Vow, Venuerific. Branch seo-improvements-5. See seo/audits/2026-08-29.md.
- 2026-09-06 — Iteration 7 (manual, on-request). Pulled first real GSC Performance data (37 queries, 5 pages, 3 months) via the user's authenticated browser session. Found `/software/` stuck un-indexed despite being correctly set up; submitted Request Indexing. Re-flagged still-uncommitted hero-redesign WIP. Branch seo-improvements-7. See seo/audits/2026-09-06.md.
- 2026-09-06 — Iteration 7 correction (same day). Jeff confirmed a Google Business Profile already exists and is verified (5.0★, 102 customer interactions) — earlier iterations wrongly listed it as not set up. Backlog item corrected from "set up GBP" to "optimize the existing GBP" (complete profile fields, get more than 1 review). See seo/audits/2026-09-06.md addendum.
- 2026-09-09 — Iteration 8 (scheduled). Verified iterations 1-7 all merged to main; confirmed Vercel domain redirects now live in code (closes that backlog item); confirmed the previously-flagged uncommitted hero-redesign WIP is now committed (no longer a loss risk). Found and fixed a real gap in the new (unaudited) `/catalogue/` pages: canonical mismatch, missing meta description/OG/Twitter tags, sitemap pointing at an empty meta-refresh stub — replaced with a proper redirect and corrected tags. PageSpeed Insights re-check attempted but blocked (web UI stalled, public API quota exhausted). Branch `seo-improvements-8`. See seo/audits/2026-09-09.md.

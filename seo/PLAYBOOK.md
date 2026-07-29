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

- [x] JEFF: Google Search Console — verified playingwithphoto.com, sitemap.xml submitted 2026-07-21, status Success, 1 page discovered. Performance/query data check pending (needs a few days to populate).
- [ ] JEFF: Google Business Profile for Playing With Photo (huge for "photo booth singapore" local pack).
- [ ] JEFF: Vercel dashboard — set www.playingwithphoto.com + photo.playingwithpencil.art + .vercel.app to 308-redirect to playingwithphoto.com (currently they serve 200 duplicates; canonical tag mitigates but redirect is cleaner).
- [x] Add visible "photo booth" (two-word) phrasing to hero pitch / section copy — Jeff picked the lines, shipped in iteration 4 (2026-07-21). Live-confirmed 2026-07-29 (16 occurrences site-wide).
- [x] Add an FAQ section + FAQPage JSON-LD — shipped in iteration 4 (2026-07-21), custom-backdrop question added same iteration. Live-confirmed 2026-07-29.
- [ ] Directory/backlink pass: SingaporeBrides, Blissful Brides, Bridestory, The Wedding Vow vendor listings; wedding planner partnerships. (Mostly JEFF: these platforms need business login/verification to submit — agent can research targets and draft outreach copy, not create the listings.)
- [x] Image SEO: content image filenames already descriptive, no change needed. og-share.jpg recompressed 434KB→259KB (quality 50, visually verified, same dimensions) 2026-07-21.
- [~] Performance pass: real PageSpeed data received 2026-07-21 (mobile 64, desktop 93). Fonts + vision-scrub.css deferred non-blocking, image width/height added, all visually verified (seo/audits/2026-07-21.md Iteration 3). Deliberately left creation.css/hero-scrub.css blocking (genuinely critical to hero, risk of FOUC). NEXT: the ~837KiB image-delivery opportunity is very likely the 123-frame hero-scroll-scrub sequence loading eagerly instead of lazily — needs a dedicated, carefully-tested iteration on the scroll-animation JS itself, not a blind edit.
- [~] Accessibility pass (score 81 mobile / 84 desktop): `<main>` landmark added, booking-form labels linked to inputs, h2->h4 heading skip fixed to h3 — all shipped 2026-07-29 (seo/audits/2026-07-29.md §2), branch `seo-improvements-4`. Color contrast (inline light-on-photo text colors) NOT fixed — real palette decision, needs Jeff.
- [ ] Consider /wedding, /corporate landing pages once single-page site ranks (only if GSC shows impressions but weak positions for those modifiers).
- [ ] Event schema for public events/activations when applicable.
- [ ] Monitor: IG profile link should point to playingwithphoto.com (not .vercel.app).

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

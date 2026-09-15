# PWP SEO Playbook

Operating guide for the recurring SEO improvement loop. Each iteration: read this file
and the latest audit in `seo/audits/`, do the next most valuable item, verify, write a
new audit entry, commit to a branch, and tell Jeff what changed and what needs his
action. Never change visible page copy or design without flagging it to Jeff first —
technical SEO is autonomous, copy/brand is his call.

Reference material (dated external benchmarks, not operating instructions):
`seo/references/external-seo-benchmarks-2026.md`.

Audit discipline — read `seo/references/audit-methodology.md` once per
session (not every backlog item) and apply it: find the actual highest-
leverage constraint before picking a task, not just the next unchecked
box; give every new backlog item a one-line falsifiability check (how
we'd know it failed) and, where possible, a specific number to watch
afterward rather than "check if it's better."

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
- [~] JEFF: Optimize the existing Google Business Profile — profile strength shows "Complete info" still outstanding, but 2026-09-10 finding: that banner mixes real free fields (description, services, hours, attributes, photos, posts) with paid upsells (Google Ads credit, `@playingwithphoto.com` Workspace email) — Jeff should fill the free fields only, skip the upsells. Reviews: now **3 reviews total** (live-checked 2026-09-14) — Patricia Chin (wedding) and Christine Chew (Teacher's Day/superhero) both replied 2026-09-10 (note: earlier drafts had these two names swapped, corrected 2026-09-14 — reply content was fine, only tracking-file labels were wrong); Jaslynn Lai (daughter's 7th birthday) is new and unreplied, draft queued in `seo/gbp-posts-queue.md`. NEXT: confirm Jaslynn's reply posted, keep tracking review count, re-confirm current aggregate star rating for the `aggregateRating` schema item below. **Concrete target (2026-09-15, see `seo/references/external-seo-benchmarks-2026.md`): a real local-pack ranking boost lands at 10 reviews specifically** (Sterling Sky controlled study — the 9→10 jump is measurable, 10→11 isn't). PWP is at 3. Keep asking recent clients steadily rather than in one batch — ranking also drops if 3+ weeks pass with no new review ("18-Day Rule"), so velocity matters as much as the total. Falsifiability: watch GSC impressions for the neighborhood queries that already show up (photobooth chinatown, tanjong pagar photo booth, maxwell photobooth) once the review count crosses 10 — if those don't move within a month or two of crossing the threshold, the "10 is a real inflection point" claim didn't hold for this profile specifically, and review count should go back to being treated as "more is generically better" rather than a target number worth optimizing around.
- [ ] GBP Posts queue — 5 drafts in `seo/gbp-posts-queue.md`, none confirmed posted yet as of 2026-09-14. The original 2 review replies ARE confirmed posted (live-checked 2026-09-14). A 3rd review (Jaslynn Lai, birthday party) came in since — reply drafted, not yet posted. NEXT iteration: check the queue file's checkboxes for what's posted, draft fresh ones once it's used up.
- [ ] JEFF: GSC account access mismatch — found 2026-09-14, the automated browser session (jefflai0315@gmail.com) does not have access to the `playingwithphoto.com` GSC property ("Oops, you don't have access to this property"). Grant that account access, or confirm which account is verified, so future iterations can pull Performance data directly instead of needing a manual paste. Single highest-value unblock right now.
- [x] `/software/` page found stuck in "Discovered - currently not indexed" (real page, correctly linked + in sitemap, but Google hadn't crawled it) — Request Indexing submitted via GSC 2026-09-06, confirmed queued. Verify it flips to Indexed next iteration.
- [x] Vercel domain redirects — live-verified 2026-09-09: www.playingwithphoto.com and playingwithphoto.vercel.app both 308-redirect to playingwithphoto.com; photo.playingwithpencil.art 307-redirects. Turned out to already be solved in code via `vercel.json` `redirects` (commit 6258b01, done directly by Jeff outside this loop) — no dashboard action was needed after all.
- [x] Add visible "photo booth" (two-word) phrasing to hero pitch / section copy — Jeff picked the lines, shipped in iteration 4 (2026-07-21). Live-confirmed 2026-07-29 (16 occurrences site-wide).
- [x] Add an FAQ section + FAQPage JSON-LD — shipped in iteration 4 (2026-07-21), custom-backdrop question added same iteration. Live-confirmed 2026-07-29. **Note (2026-09-15, verified via web search across multiple sources incl. Search Engine Journal): Google retired the visible FAQ rich-result dropdown in search for all sites except authoritative gov/health ones on 2026-05-07.** The `FAQPage` schema itself is not deprecated/harmful and other engines (Bing, DuckDuckGo, AI crawlers) still read it, so it's still fine to keep synced with visible content — but new FAQ schema work should not be justified as "for the Google rich snippet" going forward. The visible on-page FAQ text/questions still matter for normal ranking; the schema wrapper specifically does not earn SERP real estate anymore.
- [~] Directory/backlink pass: SingaporeBrides, Blissful Brides, Bridestory, The Wedding Vow vendor listings; wedding planner partnerships, plus Venuerific (corporate-event angle, found 2026-08-29). Research + submission paths done 2026-08-29 (seo/audits/2026-08-29.md §3). All outreach email drafts, send status, and replies now tracked in `seo/outreach-drafts.md` — Bridestory sent 2026-09-10 (awaiting reply); Blissful Brides, SingaporeBrides (routed to editor@singaporebrides.com, not their paid-ads sales@tian.com.sg), and The Wedding Vow drafted 2026-09-10, not yet sent. Gmail connector lacked compose permission both times tried, so these are hand-off text for Jeff to send manually. Venuerific has no email contact — needs Jeff to use their vendor sign-up form directly. Singapore Wedding Vendors and Bridestory's paid tier explicitly deprioritized by Jeff (cost). NEXT iteration: check `seo/outreach-drafts.md` for send/reply status before redrafting anything.
- [x] Image SEO: content image filenames already descriptive, no change needed. og-share.jpg recompressed 434KB→259KB (quality 50, visually verified, same dimensions) 2026-07-21.
- [~] Performance pass: real PageSpeed data received 2026-07-21 (mobile 64, desktop 93). Fonts + vision-scrub.css deferred non-blocking, image width/height added, all visually verified (seo/audits/2026-07-21.md Iteration 3). Deliberately left creation.css/hero-scrub.css blocking (genuinely critical to hero, risk of FOUC). The ~837KiB hero-scroll-scrub eager-loading issue was fixed by Jeff directly (commit 361e499, 2026-07-29, requestIdleCallback defer) — NEXT: needs a fresh PageSpeed run to confirm the score actually moved (not yet re-measured). Blocked again 2026-09-09: web UI polling stalled in the automation environment, public API quota exhausted (no key). JEFF: run https://pagespeed.web.dev/analysis?url=https://playingwithphoto.com manually and paste the mobile score, or share a `pagespeedonline.googleapis.com` API key so future iterations can pull this reliably. **Possible fix found 2026-09-15** (see `seo/references/external-seo-benchmarks-2026.md`): the confirmed-dead path was the anonymous no-key query-param request; a keyed request should instead pass the key via the `X-Goog-Api-Key` HTTP header, not `?key=` — untested since no key exists yet, but worth trying this exact form once Jeff shares one, in case it's a separate/working quota tier.
- [ ] Bing Places / Bing Webmaster presence — untracked in this loop so far. New finding 2026-09-15 (`seo/references/external-seo-benchmarks-2026.md`): ChatGPT's local-business answers source from Bing's web index plus Yelp/TripAdvisor/BBB/Reddit — **not** Google Business Profile directly. If Jeff wants PWP to show up in AI-assistant answers (45% of consumers now use these for local recs, up from 6%), Bing presence is the more direct lever than more GBP work, which stays valuable for Google's own local pack but doesn't reach ChatGPT. NEXT: check whether a Bing Places listing exists for PWP; if not, claiming one is free and low-effort. Falsifiability: if PWP shows up in Bing's own site search (`site:playingwithphoto.com` on bing.com) within a few weeks of claiming/submitting a listing but a ChatGPT query for "AI photo booth Singapore" still doesn't surface PWP months later, the Bing-as-AI-search-lever hypothesis for a business this size was wrong — don't keep pouring effort into Bing-specific work past that point without re-checking the underlying claim.
- [~] Accessibility pass (score 81 mobile / 84 desktop): `<main>` landmark added, booking-form labels linked to inputs, h2->h4 heading skip fixed to h3 — all shipped 2026-07-29 (seo/audits/2026-07-29.md §2), branch `seo-improvements-4`. Color contrast (inline light-on-photo text colors) NOT fixed — real palette decision, needs Jeff.
- [ ] Consider /wedding, /corporate landing pages once single-page site ranks (only if GSC shows impressions but weak positions for those modifiers).
- [ ] Event schema for public events/activations when applicable.
- [x] Monitor: IG profile link should point to playingwithphoto.com (not .vercel.app) — Jeff confirmed done 2026-09-10.
- [ ] Work towards Search Keywords "Photobooth Singapore" / "AI photobooth Singapore" / "photo booth Singapore" / "wedding photo booth Singapore" / "corporate event photo booth Singapore" / "vintage photo booth Singapore" / "photo booth Malaysia / JB wedding photo booth" (secondary market). ALl points to Playingwithpencil.com
- [x] Uncommitted hero-redesign WIP — resolved, confirmed clean 2026-09-09 (committed to `main` sometime after 2026-09-06, visible as "Refactor service hero implementation and enhance accessibility features" and related hero-scrub commits). No longer a loss risk.
- [x] `/catalogue/` pages (shipped 2026-09-08, outside this loop) — found and fixed 2026-09-09: canonical mismatch (ai-styles.html pointed to an empty meta-refresh stub instead of itself), missing meta description + OG/Twitter tags on both catalogue pages, sitemap pointed at the same empty stub. Fixed: self-canonical, added meta tags, proper 308 redirect in vercel.json replacing the meta-refresh, sitemap updated to point at the real content URL. Branch `seo-improvements-8`. See seo/audits/2026-09-09.md §3.

## Recurring checklist (every run, regardless of backlog state)

Added 2026-09-10 — Jeff wants active demand-gen work (reviews, GBP posts,
outreach, video content), not just one-off technical fixes, folded into the
standing loop. Check these every iteration, not only when the backlog is
empty:

1. **GBP reviews** — check for new Google reviews since last run. Draft a
   reply for each (see tone/style in past replies, e.g.
   `seo/gbp-posts-queue.md`), and draft a testimonial-card proposal for the
   homepage corkboard if the review is quotable (see
   `seo/testimonial-cards-proposal.md` for the pattern/process — always a
   proposal, never applied without Jeff confirming attribution/photo).
2. **GBP Posts queue** (`seo/gbp-posts-queue.md`) — check how many drafted
   posts are still unposted; top up the queue with 2-3 fresh drafts once
   it's down to 1-2 remaining, so Jeff always has a ready stock.
3. **Outreach tracking** (`seo/outreach-drafts.md`) — check send/reply
   status on every drafted email; chase up or redirect (e.g. the Blissful
   Brides bounce → contact form) rather than re-drafting from scratch.
4. **YouTube/video content** — check whether any new AI style/video assets
   have shipped (e.g. new `/catalogue/` entries) that could feed a new
   Short; note format constraints (existing catalogue clips are 4:3, ~5s —
   need reformatting/combining to vertical, see the 2026-09-10 sample in
   this iteration's session) rather than assuming raw footage is upload-
   ready.
5. **Structured data freshness** — once Jeff confirms current GBP star
   rating + review count, add/update `aggregateRating` on the homepage's
   `LocalBusiness` JSON-LD (real numbers only, never estimate/fabricate).
   Blocked as of 2026-09-10 on Jeff confirming the current live count.

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
- 2026-09-14 — Iteration 9 (scheduled). Verified iterations 1-8 all merged and live, including the `/catalogue/` fixes. Found GSC is blocked by an account-access mismatch (browser session's Google account isn't granted access to the property) — new, more specific finding than prior "no session" blocks. Live-checked GBP: found a new unreplied review (Jaslynn Lai) and fixed a name-attribution swap from 2026-09-10 affecting `gbp-posts-queue.md` and `testimonial-cards-proposal.md` (reply content was correct, only labels were wrong). Gmail access blocked this run (connector permissions), so outreach reply status not re-checked. No new site-code changes — technical health re-check found no regressions. Branch `seo-improvements-9`. See seo/audits/2026-09-14.md.
- 2026-09-14 — Iteration 10 (manual, on-request). Jeff supplied real photo-booth strip images for Patricia Chin (wedding) and Christine Chew (Teacher's Day/superhero) — shipped the testimonial cards proposal from iteration 9 using real photos (option a) instead of the photo-less draft. Two new `.strip-card.single-photo` entries added to `#testiBoard` in `index.html`; images resized/compressed into `photos/testimonials/`. Verified visually in browser preview, no console errors. This is a visible content change made with Jeff present and directing it in-session — not through the autonomous branch-and-propose flow. See seo/testimonial-cards-proposal.md for full detail.
- 2026-09-15 — Iteration 11 (manual, on-request). GSC access fixed (Jeff granted the browser session's account permission) — confirmed live, pulled real Performance data (58 queries/3mo): zero impressions for "wedding photo booth" or "corporate photo booth" despite both being real business lines, confirming a real content gap. Worked those exact phrases into hero pitch, pricing copy, and 2 new FAQ entries (mirrored into FAQPage JSON-LD, which also fixed a pre-existing gap where 2 real FAQ questions were missing from the schema). Added WebSite schema (was absent) and VideoObject schema for all 6 video-catalogue clips (real ffprobe-measured durations, no fabricated data) — prompted by comparing against a competitor's schema stack, but skipped their Service/Offer suggestion since `LocalBusiness.makesOffer` already covered it. Read (did not install/execute) a third-party Claude Code SEO plugin's reference docs for benchmarking; verified its FAQ-rich-results claim independently via web search (confirmed true, see the iteration-9 entry above) and distilled the locally-relevant parts (local SEO numbers, schema deprecation list, CWV/PageSpeed notes) into `seo/references/external-seo-benchmarks-2026.md` — added the "10 reviews" concrete target and a new Bing Places backlog item as a result. Everything pushed live to `main` this iteration (commits `aab57c7`..`724ca37`), no separate branch — Jeff was present and confirming each step.

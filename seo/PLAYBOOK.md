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

- [ ] JEFF: Google Search Console — verify playingwithphoto.com, submit sitemap.xml. Without GSC the loop can't see queries/rankings; this unlocks everything.
- [ ] JEFF: Google Business Profile for Playing With Photo (huge for "photo booth singapore" local pack).
- [ ] JEFF: Vercel dashboard — set www.playingwithphoto.com + photo.playingwithpencil.art + .vercel.app to 308-redirect to playingwithphoto.com (currently they serve 200 duplicates; canonical tag mitigates but redirect is cleaner).
- [ ] Add visible "photo booth" (two-word) phrasing to hero pitch / section copy (PROPOSAL for Jeff — brand voice decision).
- [ ] Add an FAQ section (pricing, space needed, setup time, AI styles, Malaysia travel) + FAQPage JSON-LD. Draft copy first for Jeff's approval.
- [ ] Directory/backlink pass: SingaporeBrides, Blissful Brides, Bridestory, The Wedding Vow vendor listings; wedding planner partnerships.
- [ ] Image SEO: descriptive filenames for key gallery shots; check og-share.jpg weight.
- [ ] Performance pass: Lighthouse on live site; hero scroll-scrub JS may hurt LCP/INP on mobile.
- [ ] Consider /wedding, /corporate landing pages once single-page site ranks (only if GSC shows impressions but weak positions for those modifiers).
- [ ] Event schema for public events/activations when applicable.
- [ ] Monitor: IG profile link should point to playingwithphoto.com (not .vercel.app).

## Iteration log

- 2026-07-20 — Iteration 1 (baseline). See seo/audits/2026-07-20.md.

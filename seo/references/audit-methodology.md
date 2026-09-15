# Audit methodology (adapted from claude-seo, scaled to PWP)

Distilled 2026-09-15 from the `seo` orchestrator skill's synthesis framework
in [AgriciDaniel/claude-seo](https://github.com/AgricIDaniel/claude-seo)
(read for methodology, no code executed). Their version is built for
multi-page enterprise sites with parallel subagents and dependency graphs
across dozens of recommendations — most of that doesn't apply to a
single-page, one-operator business. This is the part that transfers: the
actual thinking discipline, scaled down to what one person running one
iteration a week can use.

## The four-phase discipline

Before shipping a change or adding a backlog item, walk through these in
order. Skipping straight to "fix it" is how effort gets spent on the wrong
thing — this is what catches that.

**1. PERCEIVE — collect before judging**
- What does the live site actually say/do right now (curl it, don't assume
  from memory of a past audit)?
- What assumption is this recommendation resting on? Would it survive
  being said out loud to Jeff?
- Read the existing copy/SERP/reviews before proposing a rewrite — they're
  data, not obstacles. (This is why the wedding/corporate copy work on
  2026-09-15 started from GSC query data showing zero impressions, not
  from a guess.)

**2. ANALYZE — find the real constraint**
- What's the single highest-leverage thing blocking the most other work?
  (GSC access being broken blocked real prioritization for months — that
  was worth fixing before any new content work, not after.)
- Does this contradict what Google's own current guidance says (see
  `external-seo-benchmarks-2026.md`)? If a claim conflicts with Google
  primary-source docs, Google wins.
- Is a finding actually two findings pretending to be one? (E.g. the
  catalogue pages' canonical-mismatch bug in iteration 8 was really one
  root cause — a meta-refresh stub — expressed three ways.)

**3. VALIDATE — pressure-test before shipping**
- Would this make the page worse for an actual visitor, even if it helps
  a crawler? (Never stuff a phrase in just because GSC shows zero
  impressions for it — the wedding/corporate copy edits were checked for
  reading naturally before they shipped.)
- Is this realistic for a one-person operation to sustain? (This is why
  the loop tracks GBP posts/outreach as a slow drip, not a batch.)
- **Every new backlog item gets a falsifiability line**: if the hypothesis
  behind it is wrong, what would prove that? Add it inline when writing
  the item, e.g. "(how we'd know this failed: GSC still shows 0
  impressions for this phrase after 60 days)".

**4. ACT — ship the smallest real artifact, then set the leading indicator**
- Ship the smallest version of the highest-leverage fix, not the full
  wishlist.
- Name one thing to watch afterward that doesn't require re-running a full
  audit (a specific GSC query's impression count, a specific review
  count, a specific PageSpeed score) — this is what the "Pending
  verification" list at the bottom of each audit file already does; keep
  doing it, and prefer a number over "check if it's better."

## Quality gates (checkable directly against the live site)

Re-verified 2026-09-15 against `index.html` — logged here so it isn't
re-litigated every iteration unless something changes:

| Check | Threshold | PWP status (2026-09-15) |
|---|---|---|
| Title tag length | 30-60 chars (Google truncates ~60) | 81 chars — deliberate iteration-1 choice, keywords front-loaded before truncation point. Not a bug, not touched. |
| Meta description length | 120-160 chars | 131 chars. Pass. |
| Image alt text | 10-125 chars, descriptive, on all non-decorative images | Pass — client-logo marquee's `alt=""` set is the `aria-hidden="true"` CSS-loop duplicate (correct), the visible set has full alt text. Nav logo's `alt=""` is correct WCAG practice since it sits next to visible "Playing With Photo"/"PWP" text in the same link. |
| Alt text anti-patterns | no filenames, no keyword stuffing, no "click here" | Pass on spot-check. |

Re-run this table's checks (not the whole framework) whenever new images
or pages are added — cheap, and catches regressions fast.

## What was deliberately not replicated

- Parallel sub-agent dispatch, SEO Health Score (0-100), dependency-graph
  sequencing across dozens of findings — built for sites with far more
  surface area than one HTML page.
- Any of their Python scripts, MCP extensions, or paid data sources
  (DataForSEO, Ahrefs, SE Ranking) — this loop already has direct access
  to GSC, GBP, and the live site via browser + curl, which covers what
  those would add for a site this size.
- The PDF report generator — audit files in `seo/audits/` already serve
  that purpose at zero extra tooling cost.

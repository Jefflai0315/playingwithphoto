---
name: Playing With Photo · Booth Software
description: Operator-facing software page (/software/), built inside the main playingwithphoto.com sepia world, with a split-flap departure board as its own device.
colors:
  cream: "#f4ead5"
  cream-2: "#efe3c7"
  rust: "#b25f2e"
  rust-2: "#8a4620"
  ink: "#2a1a0c"
  ink-2: "#4a2f1a"
  highlight: "#ffd88a"
  logo: "#642015"
  board: "#1f140b"
  flap: "#2e2015"
  on-time: "#9fd08a"
  stop: "#f08a5d"
typography:
  display:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "clamp(54px, 7vw, 92px)"
    fontWeight: 500
    lineHeight: 0.98
    letterSpacing: "-0.045em"
  headline:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(40px, 5vw, 70px)"
    fontWeight: 400
    lineHeight: 1.02
  accent:
    fontFamily: "Caveat, cursive"
    fontWeight: 600
  label:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "12px"
    letterSpacing: "0.24em"
  body:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "17px"
    lineHeight: 1.55
rounded:
  pill: "999px"
  input: "10px"
  board: "18px"
  card: "20px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.cream}"
    rounded: "{rounded.pill}"
    padding: "15px 28px"
  button-featured:
    backgroundColor: "{colors.rust}"
    textColor: "{colors.cream}"
    rounded: "{rounded.pill}"
  board:
    backgroundColor: "{colors.board}"
    textColor: "{colors.cream}"
    rounded: "{rounded.board}"
  pass:
    backgroundColor: "#fbf5e8"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
---

## Overview

This page uses the main site's identity: the sepia palette, the Titan One logo with the booth sketch mark, Fraunces headings with Caveat script accent words, DM Sans body text, tracked mono labels with a leading rule, and ink pill buttons. Its own device is a vintage split-flap departure board in dark brown with JetBrains Mono tiles. Restyled on 2026-10-02 after the owner asked for consistency with the main page.

## Colors

Sections alternate cream, cream-2 and ink (dark brown); a section colour never repeats twice in a row. Rust is the accent on light sections and highlight (`#ffd88a`) on dark ones. On-time green and stop orange appear only on boards and status UI.

## Typography

- **Hero headline:** DM Sans 500, tracking −0.045em, with the last line in Fraunces italic rust.
- **Section headings:** Fraunces 400, with one or two key words in Caveat rust (highlight on dark sections).
- **Labels:** JetBrains Mono, uppercase, 0.24em tracking, with a 24px leading rule.

## Layout

The wrap is `min(1280px, 100% − 2×gutter)` with 20px/36px gutters. Splits are 5/7 or 6/6 at ≥980px. The hero sits on `/hero-bg.webp` (the painted landscape) under a cream wash.

## Elevation & Depth

Shadows are soft, warm and offset (`rgba(62,34,12,.25)`). Polaroid frames (`#fff8ea`, slight rotation) hold prints and the founder photo, as on the main site.

## Components

- **Split-flap board:** container-query-sized cells. It pauses offscreen and on hover; with reduced motion it shows the final state.
- **Photo flap:** the original ↔ AI style swap.
- **Pills:** the style picker, plan segments and buttons.
- **Boarding-pass plan cards:** 20px radius, dashed perforation, notches; the featured plan gets a rust outline and italic name.
- **Route line:** dashed rust line with numbered circular stops in Fraunces italic.

## Do's and Don'ts

- **Do** reuse the main site's tokens. Don't introduce new hues.
- **Do** label demo data and use real booth output.
- **Don't** put paragraph rules on `.eyebrow` (scope them with `:not(.eyebrow)`).
- **Don't** publish prices or claims PRODUCT.md hasn't confirmed.

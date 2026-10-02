# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Event clients (rental side, `/`, `/snapshot/`):** people in Singapore booking a Playing With Photo booth for weddings, birthdays and corporate events.
- **Booth operators (software side, `/software/`):** photo booth rental businesses and studios worldwide evaluating Playing With Photo as the software that runs their own booths. They own (or are buying) a PC, DSLR, printer and touchscreen and want a guest experience that wins bookings.

## Product Purpose

Playing With Photo is a local photobooth OS for events: capture → customize → AI restyle / print → guest delivery. It began as the software behind Jeff's own Singapore rental booths and is now licensed to other operators as a subscription. Success on `/software/` = a qualified operator requests a demo.

## Positioning

Local-first booth software with live AI style transformation and event-scoped operations (activate event, live monitor, floor bigscreen), battle-tested on the vendor's own paid events. Not a generic camera app and not a cloud-only dashboard.

## Operating Context

- Booth runs on the operator's machine (Flask app in a kiosk browser); core capture and printing work offline. A cloud license relay meters AI generations.
- Day-of ritual: Events → activate → open Bigscreen → open guest booth → watch Monitor.
- Guests use a touchscreen, get a print and a QR ticket to download on their phone.

## Capabilities and Constraints

- Supported (confirmed by owner, 2026-10-02): Windows PC and Mac; Canon DSLR (digiCamControl / native bridge) and webcam; DNP dye-sub printers (DS620 / RX1HS class) via the installed print queue.
- Guest features: classic strips/sheets, filters, stickers, background replacement, AI style packs, QR delivery, AI video (Pro+).
- Operator: branding, templates, frames, guest flow, AI styles, readiness checks, monitor, bigscreen.
- Tiers: **Starter** (500 AI images/mo, no video), **Pro** (1,500 images + 200 videos/mo, white-label), **Agency** (unlimited). Prices are not published: "Contact us". Billing is manual (no self-serve checkout).
- Windows installer still in progress; do not claim one-click install or auto-update.
- **Undecided:** public prices, self-serve trial, reseller portal, iPad app, hosted media retention period.

## Brand Commitments

- Name: **Playing With Photo**. Founder: Jeff (photo at `photos/about/jeff.webp`).
- Voice: clear operator English; no fake testimonials, no invented customer quotes, no invented metrics.
- Rental client logos may be used on `/software/`, framed as events this software has run (confirmed 2026-10-02).

## Evidence on Hand

- Client logos: `photos/client-logos/` (Visa, Scoot, Sembcorp, People's Association, Chick-fil-A, Sanmina, Zeno, Passion Arts, SJI Junior, Virtue Vantage).
- AI before/after: `photos/spark/`, `photos/meta/` (jenmike Van Gogh / Monet / Hokusai / Picasso / Warhol), `photos/approved-styles/`.
- Booth hardware footage: `photos/booth/assembled.mp4`, add-ons in `photos/addons/` (AI animation, collector cards, guestbook).
- Strips and samples: `photos/strips/`, `photos/samples/`.
- Demo form inbox: Formspree `https://formspree.io/f/xkodydoy`.
- Absent: operator testimonials, usage statistics, uptime figures. Do not fabricate.

## Product Principles

1. Prove with real event output, not adjectives.
2. Honest scope: say what is shipped, label what is coming.
3. Operators buy reliability on the day; offline-first is a promise, not a footnote.
4. Guests are the operator's product; show the guest experience first.

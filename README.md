# Playing With Photo

Static marketing/demo website for a retro AI photo booth experience.

## Local development

```bash
npm run dev
```

Then open `http://localhost:5173`.

**Quick booking page (short landing):** [http://localhost:5173/snapshot/](http://localhost:5173/snapshot/) — use this URL for Instagram bio, ads, or `playingwithpencil.art/snapshot`.

## Build

```bash
npm run build
```

This project is a static site, so there is no compilation step.

## Local preview

```bash
npm run preview
```

Then open `http://localhost:4173`.

## Deploy

### Option A: Vercel (recommended)

1. Push this repo to GitHub.
2. In Vercel, click **Add New Project** and import the repo.
3. Vercel will use:
   - Build command: `echo "No build step"`
   - Output directory: `.`
4. Click **Deploy**.

`vercel.json` is already included.

### Option B: Netlify

1. Push this repo to GitHub.
2. In Netlify, click **Add new site** -> **Import an existing project**.
3. Select the repo and deploy.

`netlify.toml` is already included with build and publish settings.

## Notes

- Camera features require HTTPS in production (Vercel/Netlify both provide this).
- If camera access fails, confirm browser permission settings and reload.

## Booking Form Submissions (easy setup)

Use [Formspree](https://formspree.io/) to collect all enquiries in one dashboard without building a backend.

1. Create a free Formspree account and a new form.
2. Copy your endpoint URL (looks like `https://formspree.io/f/xxxxabcd`).
3. In `index.html`, set it on the booking form:

```html
<form id="bookForm" data-provider="formspree" data-endpoint="https://formspree.io/f/xxxxabcd">
```

After that, submissions will appear in your Formspree dashboard and can also notify your email.

## Photo Booth Software Waitlist (`/software/`)

A separate lead-gen page for the "license the booth software" / self-serve product idea, at `playingwithphoto.com/software/`. Until an endpoint is set, submissions fall back to opening an email draft.

To wire it up to Formspree (same pattern as above, use a **second, separate** Formspree form so waitlist leads don't mix with event booking enquiries):

```html
<form id="waitlistForm" data-provider="formspree" data-endpoint="https://formspree.io/f/yyyyabcd">
```

That line is in `software/index.html`.

# Playing With Photo

Static marketing/demo website for a retro AI photo booth experience.

## Local development

```bash
npm run dev
```

Then open `http://localhost:5173`.

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

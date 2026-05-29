# Photos

This folder holds every real photo used on the site. Drop files in, then list
them in the matching section of `/photos.config.js` at the project root.

## Folders

| Folder      | What goes here                                                                |
|-------------|--------------------------------------------------------------------------------|
| `hero/`     | Photos for the two floating film strips next to the hero title.                |
| `styles/`   | One photo per filter (`sepia`, `polaroid`, `bw`, `kodachrome`).                |
| `reel/`     | Exactly **4** photos for the cinema-reel section.                              |
| `spark/`    | Real "before" photos, painted "after" stills, and optional **`.mp4` loops**. |
| `meta/`     | Exactly **4** photos for the metamorphosis painter switcher.                   |

## Recommended specs

- **Format:** WebP (smaller) or JPG.
- **Size:** ~1200 px on the long side. Square or slightly tall (4:5) looks best
  in the filmstrips and spark frames.
- **Naming:** lowercase, hyphens, no spaces — e.g. `hero-jen-mike-01.webp`.

## Workflow

1. Save photos into the right subfolder.
2. Open `photos.config.js` and uncomment / add their filenames.
3. Save, refresh the browser. The drawn cartoon placeholders disappear and
   your real photos show up.

Any section left empty in the config keeps using the existing cartoon
placeholder, so you can fill these in over time.

## AI style videos (Spark gallery)

For each painter in `photos.config.js` → `spark.byPainter`, you can add:

```js
vangogh: {
  before: "spark/jenmike.png",
  after: "spark/jenmike-vangogh.png",      // still — poster + fallback
  afterVideo: "spark/jenmike-vangogh.mp4",  // loop plays in "After" frame
  name: "Jen & Mike",
},
```

**Export tips:** 3–8 second loop, H.264 MP4, ~720–1080p, under ~3 MB if possible.
Use `muted` + `loop` (the site sets this). The still `after` image shows until the
video loads, and stays as the poster on slow connections.

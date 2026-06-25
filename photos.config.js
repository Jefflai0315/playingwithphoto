/* ============================================================
   PHOTOS CONFIG
   ============================================================
   This is the ONE file you edit to plug in real photos.

   How to use:
   1. Drop your image files into the matching subfolder of /photos.
      WebP or JPG both work. Aim for ~1200px on the long side.
   2. Below, list each filename relative to /photos (e.g. 'hero/01.webp').
   3. Save, refresh the page. That's it.

   Any section left with an empty list / empty string keeps showing the
   existing drawn cartoon placeholder, so you can fill these in over time.
   ============================================================ */

window.PHOTO_CONFIG = {
  // Root folder for all photos. Don't change unless you move the folder.
  base: "photos",

  // ─── HERO FLOATING STRIPS ───────────────────────────────────
  // The 2 vertical filmstrips on either side of the hero title.
  // List as many photos as you like; they cycle.
  hero: {
    files: [
      // 'hero/01.webp',
      // 'hero/02.webp',
      // 'hero/03.webp',
      // 'hero/04.webp',
      // 'hero/05.webp',
      // 'hero/06.webp',
    ],
  },

  // ─── STYLES FILMSTRIP ───────────────────────────────────────
  // The horizontal scrolling polaroids under "Five films, one roll."
  // One photo per chip / look. Use the SAME photo in all 5 to show
  // a strong before/after of one shot under different "films",
  // or use 5 different shots to show variety.
  //
  // Keys map to the 5 chips on the page:
  //   kodak      → "70s Kodak"          caption: "Summer of '78"
  //   bw         → "Silver Gelatin B&W" caption: "The classics"
  //   polaroid   → "Polaroid 600"       caption: "Say cheese"
  //   kodachrome → "Kodachrome Slide"   caption: "Golden hour"
  //   sepia      → "Studio Sepia"       caption: "Portrait No. 4"
  styles: {
    kodak: "styles/summerof78.png", // e.g. 'styles/kodak.webp'
    bw: "styles/classic.png", // e.g. 'styles/bw.webp'
    polaroid: "styles/saycheese.png", // e.g. 'styles/polaroid.webp'
    kodachrome: "styles/goldenhour.png", // e.g. 'styles/kodachrome.webp'
    sepia: "styles/portraitno4.png", // e.g. 'styles/sepia.webp'
  },

  // ─── REEL STRIP ─────────────────────────────────────────────
  // The 4 frames on the cinema sticky panel (id #reel section).
  // Provide EXACTLY 4 files for it to switch on.
  // Optional `videos` array (same length) — MP4 loop plays when that frame develops.
  reel: {
    files: [
      "spark/jenmike.png",
      "reel/jenmike-vangogh1.png",
      "spark/jenmike-vangogh.png",
      "reel/jenmike-keepsake.png",
    ],
    videos: [
      null,
      null,
      "spark/jenmike-vangogh.mp4",
      null,
    ],
  },

  // ─── VISION SCRUB (The idea section) ────────────────────────
  // Hero-style frame scrub. Source MP4 → extract with:
  //   ffmpeg -i photos/vision/vision-scrub.mp4 -vf "fps=12,scale=960:-2" -c:v libwebp -quality 82 photos/vision/frames/v_%04d.webp
  vision: {
    video: "vision/vision-scrub.mp4",
    frameCount: 61,
    framePrefix: "vision/frames/v_",
    frameExt: "webp",
  },

  // ─── SPARK BEFORE / AFTER GALLERY ───────────────────────────
  // ONE entry per painter. Clicking a painter button on the page jumps to
  // that painter's photo. Auto-rotate cycles through the painters in order.
  //
  //   'before'     = path to your real photo (REQUIRED)
  //   'after'      = still image (poster + fallback if no video)
  //   'afterVideo' = optional MP4/WebM loop — plays in the "After" frame
  //                  when that painter is selected (muted, looping)
  //   'name'       = caption shown under the "before" frame
  //
  // Tip: as you generate each painted version (e.g. with Midjourney /
  // ChatGPT image-gen), drop it into /photos/spark/ and uncomment the
  // 'after' line for that painter. No code changes needed.
  spark: {
    byPainter: {
      vangogh: {
        before: "spark/jenmike.png",
        after: "spark/jenmike-vangogh.png",
        afterVideo: "spark/jenmike-vangogh.mp4",
        name: "Jen & Mike",
      },
      monet: {
        before: "spark/myra.png",
        after: "spark/myra-monet1.png",
        afterVideo: "spark/myra-monet.mp4",
        name: "Myra Sweet 16",
      },
      picasso: {
        before: "spark/co.png",
        after: "spark/co-picasso.png",
        afterVideo: "spark/co-picasso.mp4",
        name: "Studio session",
      },
      warhol: {
        before: "spark/olivebirthday.png",
        after: "spark/olivebirthday-warhol.png",
        name: "Pop duo Birthday",
      },
      hokusai: {
        before: "spark/jenmikeguests.png",
        after: "spark/jenmikeguests-hokusai.png",
        name: "Wave portrait",
      },
    },
  },

  // ─── METAMORPHOSIS SECTION ──────────────────────────────────
  // Per option, define BEFORE and AFTER frames (1–4 each):
  //  - 1 photo  → repeated 4x
  //  - 2 photos → A,B,A,B
  //  - 3 photos → A,B,C,A
  //  - 4 photos → used as-is
  //
  // Keys should match the picker options:
  // vintage, vangogh, monet, picasso, warhol, hokusai
  //
  // Legacy fallback: meta.files is still supported.
  meta: {
    byPainter: {
      vintage: {
        before: ["spark/jenmikeguests.png", "spark/jenmike.png"],
        after: ["spark/jenmikeguests.png", "spark/jenmike.png"],
      },
      vangogh: {
        before: ["spark/jenmikeguests.png", "spark/jenmike.png"],
        after: ["meta/jenmikeguests-vangogh.png", "reel/jenmike-vangogh1.png"],
      },
      monet: {
        before: ["spark/jenmikeguests.png", "spark/jenmike.png"],
        after: ["meta/jenmikeguests-monet.png", "meta/jenmike-monet.png"],
      },
      picasso: {
        before: ["spark/jenmikeguests.png", "spark/jenmike.png"],
        after: ["meta/jenmikeguests-picasso.png", "meta/jenmike-picasso.png"],
      },
      warhol: {
        before: ["spark/jenmikeguests.png", "spark/jenmike.png"],
        after: ["meta/jenmikeguests-warhol.png", "meta/jenmike-warhol.png"],
      },
      hokusai: {
        before: ["spark/jenmikeguests.png", "spark/jenmike.png"],
        after: ["spark/jenmikeguests-hokusai.png", "meta/jenmike-hokusai.png"],
      },
    },
    files: [
      "spark/jenmikeguests.png",
      "spark/jenmike.png",
      "spark/jenmikeguests.png",
      "spark/jenmike.png",
    ],
  },

  // ─── KIND WORDS / TESTIMONIALS ──────────────────────────────
  // Each testimonial card on the cork-board is a 4-frame photo strip.
  // For each card, list 1–4 photo paths:
  //   - Give 1 path  → that photo fills all 4 frames.
  //   - Give 4 paths → each frame gets its own photo (true filmstrip feel).
  //   - Give 2 or 3  → they cycle to fill the 4 slots.
  //   - Leave empty  → the original colored gradient placeholder stays.
  //
  // Keys map to the cards on the page (in display order):
  //   wedding   → Priya & Aaron
  //   brand     → Marcus L. · Aesop SG
  //   sixtieth  → Lee Wei Ling · 60th birthday
  //   gala      → Sophie K. · NGS Gala
  //   bday      → Carla M. · Manila
  testimonials: {
    wedding: [
      "testimonials/priya1.png",
      "testimonials/priya2.png",
      "testimonials/priya3.png",
      "testimonials/priya4.png",
    ], // e.g. ["testimonials/priya-1.jpg", "testimonials/priya-2.jpg"]
    brand: ["testimonials/aesop.png"],
    sixtieth: ["testimonials/60dad1.png"],
    gala: ["testimonials/gala.png"],
    bday: ["testimonials/bday.png"],
  },

  // ─── PUBLIC LOOKS (customer-facing style names) ─────────────
  // Used in the spark gallery, sample wall, and metamorphosis picker.
  // Keys (vangogh, kodak, …) stay internal — only labels show on site.
  looks: {
    filmBefore: "spark/jenmike.png",
    painterly: {
      vangogh: { label: "Swirl sky", swatch: "#f4b731", subtitle: "Bold golden brushwork" },
      monet: { label: "Garden soft", swatch: "#a7c8e8", subtitle: "Dreamy pastel light" },
      picasso: { label: "Cubist bold", swatch: "#d87a3c", subtitle: "Angles & warm colour" },
      warhol: { label: "Pop colour", swatch: "#ff2d88", subtitle: "Screen-print vivid" },
      hokusai: { label: "Ink & wave", swatch: "#1e5aa8", subtitle: "Woodblock drama" },
    },
    film: {
      kodak: { label: "70s Kodak", swatch: "#c38a52", image: "styles/summerof78.png" },
      bw: { label: "B&W classic", swatch: "#5a5a5a", image: "styles/classic.png" },
      polaroid: { label: "Polaroid", swatch: "#e8dcc8", image: "styles/saycheese.png" },
      kodachrome: { label: "Kodachrome", swatch: "#d4a056", image: "styles/goldenhour.png" },
      sepia: { label: "Studio sepia", swatch: "#8a6a4a", image: "styles/portraitno4.png" },
    },
  },

  // ─── SAMPLE WALL (public gallery — full catalogue on enquiry) ─
  // tags: wedding | corporate | birthday | film | painterly | print
  samples: [
    {
      src: "spark/jenmike-vangogh.png",
      label: "Swirl sky",
      tags: ["wedding", "painterly"],
    },
    {
      src: "spark/myra-monet.png",
      label: "Garden soft",
      tags: ["birthday", "painterly"],
    },
    {
      src: "spark/co-picasso.png",
      label: "Cubist bold",
      tags: ["corporate", "painterly"],
    },
    {
      src: "spark/olivebirthday-warhol.png",
      label: "Pop colour",
      tags: ["birthday", "painterly"],
    },
    {
      src: "spark/jenmikeguests-hokusai.png",
      label: "Ink & wave",
      tags: ["wedding", "painterly"],
    },
    {
      src: "meta/jenmike-monet.png",
      label: "Soft portrait",
      tags: ["wedding", "painterly"],
    },
    {
      src: "meta/jenmike-warhol.png",
      label: "Pop art strip",
      tags: ["corporate", "painterly"],
    },
    {
      src: "styles/summerof78.png",
      label: "70s Kodak",
      tags: ["film", "wedding"],
    },
    { src: "styles/classic.png", label: "B&W classic", tags: ["film"] },
    {
      src: "styles/saycheese.png",
      label: "Polaroid",
      tags: ["film", "birthday"],
    },
    {
      src: "styles/goldenhour.png",
      label: "Kodachrome",
      tags: ["film", "wedding"],
    },
    { src: "styles/portraitno4.png", label: "Studio sepia", tags: ["film"] },
    {
      src: "reel/jenmike-vangogh1.png",
      label: "Wedding strip",
      tags: ["wedding", "print"],
    },
    {
      src: "reel/jenmike-keepsake.png",
      label: "Gold frame keepsake",
      tags: ["wedding", "print"],
    },
    {
      src: "testimonials/aesop.png",
      label: "Brand activation",
      tags: ["corporate", "print"],
    },
    {
      src: "testimonials/priya1.png",
      label: "Reception guests",
      tags: ["wedding", "print"],
    },
  ],

  // ─── SITE / ANALYTICS ───────────────────────────────────────
  // Paste your GA4 measurement ID to enable Google Analytics (optional).
  site: {
    ga4Id: "G-373B8EW1D0",
    whatsapp: "6589896901",
    whatsappMessage: "Hi Jeff, I'd like to enquire about the photobooth.",
  },
};

/* ============================================================
   Tiny helper API used by app.js / enhancements.js / creation.js.
   You don't need to touch anything below this line.
   ============================================================ */
(function () {
  const cfg = window.PHOTO_CONFIG || {};
  const base = (cfg.base || "photos").replace(/\/+$/, "");

  function resolve(rel) {
    if (!rel) return null;
    if (/^(https?:|data:|\/)/.test(rel)) return rel;
    return base + "/" + rel.replace(/^\/+/, "");
  }
  function asCss(rel) {
    const u = resolve(rel);
    // Use SINGLE quotes inside url(...) so the result is safe to embed inside
    // a double-quoted HTML style attribute (e.g. style="background-image:${...}").
    return u ? "url('" + u + "')" : null;
  }

  window.PhotoLib = {
    base,
    resolve,
    asCss,
    heroPhotos: () => (cfg.hero?.files || []).map(resolve).filter(Boolean),
    stylePhoto: (key) => asCss(cfg.styles?.[key]),
    reelPhotos: () => (cfg.reel?.files || []).map(asCss).filter(Boolean),
    reelVideos: () =>
      (cfg.reel?.videos || []).map((v) => (v ? resolve(v) : null)),
    reelStill: (index) => resolve(cfg.reel?.files?.[index]),
    visionPoster: () => resolve(cfg.vision?.poster),
    visionVideo: () => resolve(cfg.vision?.video),
    visionFrameCount: () => cfg.vision?.frameCount || 0,
    visionFramePath: (index) => {
      const prefix = cfg.vision?.framePrefix || "vision/frames/v_";
      const ext = cfg.vision?.frameExt || "webp";
      const n = String(index).padStart(4, "0");
      return resolve(`${prefix}${n}.${ext}`);
    },
    visionFrames: () => {
      const count = cfg.vision?.frameCount || 0;
      const prefix = cfg.vision?.framePrefix || "vision/frames/v_";
      const ext = cfg.vision?.frameExt || "webp";
      return Array.from({ length: count }, (_, i) => {
        const n = String(i + 1).padStart(4, "0");
        return resolve(`${prefix}${n}.${ext}`);
      });
    },
    metaPhotos: () => (cfg.meta?.files || []).map(asCss).filter(Boolean),
    metaFrames: (painter, side) => {
      const key = side === "after" ? "after" : "before";
      const list = (cfg.meta?.byPainter?.[painter]?.[key] || [])
        .map(asCss)
        .filter(Boolean);
      if (list.length === 0) return [];
      const out = [];
      for (let i = 0; i < 4; i++) out.push(list[i % list.length]);
      return out;
    },
    sparkByPainter: () => cfg.spark?.byPainter || {},
    sparkVideo: (painter) =>
      resolve(cfg.spark?.byPainter?.[painter]?.afterVideo),
    sparkPoster: (painter) => resolve(cfg.spark?.byPainter?.[painter]?.after),
    // Returns up to 4 CSS url() values for a given testimonial card key.
    // 1 photo  → repeated 4×.   2 photos → A,B,A,B.   3 → A,B,C,A.   4 → as-is.
    testimonialPhotos: (key) => {
      const list = (cfg.testimonials?.[key] || []).map(asCss).filter(Boolean);
      if (list.length === 0) return [];
      const out = [];
      for (let i = 0; i < 4; i++) out.push(list[i % list.length]);
      return out;
    },
    // Returns raw configured photo list for layout decisions.
    testimonialSourcePhotos: (key) =>
      (cfg.testimonials?.[key] || []).map(asCss).filter(Boolean),
    samples: () =>
      (cfg.samples || [])
        .map((s) => ({
          ...s,
          src: resolve(s.src),
        }))
        .filter((s) => s.src),
    looks: () => cfg.looks || {},
    site: () => cfg.site || {},
  };
})();

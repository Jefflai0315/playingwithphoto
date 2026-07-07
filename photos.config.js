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
  base:
    typeof location !== "undefined" &&
    /\/snapshot(?:\/|$)/.test(location.pathname)
      ? "../photos"
      : "photos",

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
    kodak: "styles/summerof78.webp", // e.g. 'styles/kodak.webp'
    bw: "styles/classic.webp", // e.g. 'styles/bw.webp'
    polaroid: "styles/saycheese.webp", // e.g. 'styles/polaroid.webp'
    kodachrome: "styles/goldenhour.webp", // e.g. 'styles/kodachrome.webp'
    sepia: "styles/portraitno4.webp", // e.g. 'styles/sepia.webp'
  },

  // ─── REEL STRIP ─────────────────────────────────────────────
  // The 4 frames on the cinema sticky panel (id #reel section).
  // Provide EXACTLY 4 files for it to switch on.
  // Optional `videos` array (same length) — MP4 loop plays when that frame develops.
  reel: {
    files: [
      "spark/jenmike.webp",
      "reel/jenmike-vangogh1.webp",
      "spark/jenmike-vangogh.webp",
      "reel/jenmike-keepsake.webp",
    ],
    videos: [null, null, "spark/jenmike-vangogh.mp4", null],
  },

  // ─── VISION SCRUB (The idea section) ────────────────────────
  // Hero-style frame scrub. Source MP4 → extract with:
  //   ffmpeg -i photos/vision/vision-scrub.mp4 -vf "fps=12,scale=960:-2" -c:v libwebp -quality 82 photos/vision/frames/v_%04d.webp
  vision: {
    video: "vision/vision-scrub.mp4",
    frameCount: 59,
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
        before: "spark/jenmike.webp",
        after: "spark/jenmike-vangogh.webp",
        afterVideo: "spark/jenmike-vangogh.mp4",
        name: "Jen & Mike",
      },
      monet: {
        before: "spark/myra.webp",
        after: "spark/myra-monet1.webp",
        afterVideo: "spark/myra-monet.mp4",
        name: "Myra Sweet 16",
      },
      picasso: {
        before: "spark/co.webp",
        after: "spark/co-picasso.webp",
        afterVideo: "spark/co-picasso.mp4",
        name: "Studio session",
      },
      warhol: {
        before: "spark/olivebirthday.webp",
        after: "spark/olivebirthday-warhol.webp",
        name: "Pop duo Birthday",
      },
      hokusai: {
        before: "spark/jenmikeguests.webp",
        after: "spark/jenmikeguests-hokusai.webp",
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
        before: ["spark/jenmikeguests.webp", "spark/jenmike.webp"],
        after: ["spark/jenmikeguests.webp", "spark/jenmike.webp"],
      },
      vangogh: {
        before: ["spark/jenmikeguests.webp", "spark/jenmike.webp"],
        after: ["meta/jenmikeguests-vangogh.webp", "reel/jenmike-vangogh1.webp"],
      },
      monet: {
        before: ["spark/jenmikeguests.webp", "spark/jenmike.webp"],
        after: ["meta/jenmikeguests-monet.webp", "meta/jenmike-monet.webp"],
      },
      picasso: {
        before: ["spark/jenmikeguests.webp", "spark/jenmike.webp"],
        after: ["meta/jenmikeguests-picasso.webp", "meta/jenmike-picasso.webp"],
      },
      warhol: {
        before: ["spark/jenmikeguests.webp", "spark/jenmike.webp"],
        after: ["meta/jenmikeguests-warhol.webp", "meta/jenmike-warhol.webp"],
      },
      hokusai: {
        before: ["spark/jenmikeguests.webp", "spark/jenmike.webp"],
        after: ["spark/jenmikeguests-hokusai.webp", "meta/jenmike-hokusai.webp"],
      },
    },
    files: [
      "spark/jenmikeguests.webp",
      "spark/jenmike.webp",
      "spark/jenmikeguests.webp",
      "spark/jenmike.webp",
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
      "testimonials/priya1.webp",
      "testimonials/priya2.webp",
      "testimonials/priya3.webp",
      "testimonials/priya4.webp",
    ], // e.g. ["testimonials/priya-1.jpg", "testimonials/priya-2.jpg"]
    brand: ["testimonials/aesop.webp"],
    sixtieth: ["testimonials/60dad1.webp"],
    gala: ["testimonials/gala.webp"],
    bday: ["testimonials/bday.webp"],
  },

  // ─── PUBLIC LOOKS (customer-facing style names) ─────────────
  // Used in the spark gallery, sample wall, and metamorphosis picker.
  // Keys (vangogh, kodak, …) stay internal — only labels show on site.
  looks: {
    filmBefore: "spark/jenmike.webp",
    painterly: {
      vangogh: {
        label: "Swirl sky",
        swatch: "#f4b731",
        subtitle: "Bold golden brushwork",
      },
      monet: {
        label: "Garden soft",
        swatch: "#a7c8e8",
        subtitle: "Dreamy pastel light",
      },
      picasso: {
        label: "Cubist bold",
        swatch: "#d87a3c",
        subtitle: "Angles & warm colour",
      },
      warhol: {
        label: "Pop colour",
        swatch: "#ff2d88",
        subtitle: "Screen-print vivid",
      },
      hokusai: {
        label: "Ink & wave",
        swatch: "#1e5aa8",
        subtitle: "Woodblock drama",
      },
    },
    film: {
      kodak: {
        label: "70s Kodak",
        swatch: "#c38a52",
        image: "styles/summerof78.webp",
      },
      bw: {
        label: "B&W classic",
        swatch: "#5a5a5a",
        image: "styles/classic.webp",
      },
      polaroid: {
        label: "Polaroid",
        swatch: "#e8dcc8",
        image: "styles/saycheese.webp",
      },
      kodachrome: {
        label: "Kodachrome",
        swatch: "#d4a056",
        image: "styles/goldenhour.webp",
      },
      sepia: {
        label: "Studio sepia",
        swatch: "#8a6a4a",
        image: "styles/portraitno4.webp",
      },
    },
  },

  // ─── SAMPLE WALL (public gallery — full catalogue on enquiry) ─
  // tags: wedding | corporate | birthday | film | painterly | print
  samples: [
    {
      src: "spark/jenmike-vangogh.webp",
      label: "Swirl sky",
      tags: ["wedding", "painterly"],
    },
    {
      src: "spark/myra-monet.webp",
      label: "Garden soft",
      tags: ["birthday", "painterly"],
    },
    {
      src: "samples/chickfila.webp",
      label: "Chick-fil-A activation",
      tags: ["corporate", "print"],
    },
    {
      src: "spark/olivebirthday-warhol.webp",
      label: "Pop colour",
      tags: ["birthday", "painterly"],
    },
    {
      src: "spark/jenmikeguests-hokusai.webp",
      label: "Ink & wave",
      tags: ["wedding", "painterly"],
    },
    {
      src: "meta/jenmike-monet.webp",
      label: "Soft portrait",
      tags: ["wedding", "painterly"],
    },
    {
      src: "samples/gala-night.jpeg",
      label: "Gala night",
      tags: ["corporate", "print"],
    },
    {
      src: "styles/summerof78.webp",
      label: "70s Kodak",
      tags: ["film", "wedding"],
    },
    { src: "styles/classic.webp", label: "B&W classic", tags: ["film"] },
    {
      src: "styles/saycheese.webp",
      label: "Polaroid",
      tags: ["film", "birthday"],
    },
    {
      src: "styles/goldenhour.webp",
      label: "Kodachrome",
      tags: ["film", "wedding"],
    },
    { src: "styles/portraitno4.webp", label: "Studio sepia", tags: ["film"] },
    {
      src: "samples/yucompletemar.webp",
      label: "Wedding strip",
      tags: ["wedding", "print"],
    },
    {
      src: "reel/jenmike-keepsake.webp",
      label: "Gold frame keepsake",
      tags: ["wedding", "print"],
    },
    {
      src: "samples/aesop-opening.jpeg",
      label: "Grand opening",
      tags: ["corporate", "print"],
    },
    {
      src: "testimonials/priya1.webp",
      label: "Reception guests",
      tags: ["wedding", "print"],
    },
  ],

  // ─── SNAPSHOT CHALKBOARD (strip GIFs on /snapshot/) ─────────
  // Drop looping GIFs into /photos/strips/ and list them here.
  // Each entry: { src: 'strips/your-strip.gif', label: 'wedding' }
  // Each entry: { gif: 'strips/foo.gif', src: 'strips/foo.jpg', label: 'wedding' }
  // gif = animated loop (required for motion). src = still fallback / poster.
  snapshotStrips: [
    {
      gif: "strips/wedding-ghibli-vertical.gif",
      src: "strips/wedding-ghibli-vertical.webp",
      label: "wedding · Ghibli",
    },
    {
      gif: "strips/wedding-ghibli-grid.gif",
      src: "strips/wedding-ghibli-grid.webp",
      label: "wedding · collage",
      wide: true,
    },
    {
      gif: "strips/party-kuromi.gif",
      src: "strips/party-kuromi.webp",
      label: "party",
    },
    {
      gif: "strips/branded-strip.gif",
      src: "strips/branded-strip.webp",
      label: "Playing With Photo",
    },
  ],

  // ─── SNAPSHOT REVIEWS (booking section marquee) ─────────────
  snapshotReviews: [
    {
      quote:
        "Three hours in and the line was still around the bar. Guests printed four strips each.",
      cite: "Priya & Aaron · Cliveden House",
      photo: "testimonials/priya1.webp",
    },
    {
      quote:
        "Our activation needed a moment. Jeff's booth was the moment. We posted the filmstrips for weeks.",
      cite: "Marcus L. · Aesop SG",
      photo: "testimonials/aesop.webp",
    },
    {
      quote:
        "My dad is 60 and hates being photographed. He took eleven strips. I've never seen him grin that hard.",
      cite: "Lee Wei Ling · Tanjong Pagar",
      photo: "testimonials/60dad1.webp",
    },
    {
      quote:
        "I've hired photo-booths for six galas. This was the first one guests actually queued for. Everyone left with a strip.",
      cite: "Sophie K. · NGS",
      photo: "testimonials/gala.webp",
    },
    {
      quote:
        "Sent a strip to my grandma in Manila. She framed it. Said it looked like photos from her own wedding, 1962.",
      cite: "Carla M. · Makati",
      photo: "testimonials/bday.webp",
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
    snapshotStrips: () =>
      (cfg.snapshotStrips || [])
        .map((s) => ({
          ...s,
          src: resolve(s.src),
          gif: s.gif ? resolve(s.gif) : null,
          video: s.video ? resolve(s.video) : null,
        }))
        .filter((s) => s.src || s.gif || s.video),
    snapshotReviews: () =>
      (cfg.snapshotReviews || [])
        .map((r) => ({
          ...r,
          photo: r.photo ? resolve(r.photo) : null,
        }))
        .filter((r) => r.quote),
  };
})();

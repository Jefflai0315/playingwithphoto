// ==========================================================
// CREATION OF ART — Hero hands, Spark gallery, Flash transitions
// ==========================================================

const PAINTER_MAP = {
  vangogh: {
    name: "Van Gogh",
    sig: "— V. van Gogh",
    meta: "vangogh",
    prompt:
      "\u201CThrow them into a Van Gogh fever dream\u2014swirly sky, dramatic vibes, and make them pose like they\u2019re in a windy romance scene.\u201D",
  },
  monet: {
    name: "Monet",
    sig: "— C. Monet",
    meta: "monet",
    prompt:
      "\u201CDrop them into a Monet garden\u2014soft, glowy, a little blurry, and make them giggle like it\u2019s the best birthday ever.\u201D",
  },
  picasso: {
    name: "Picasso",
    sig: "— P. Picasso",
    meta: "picasso",
    prompt:
      "\u201CPicasso-ify them\u2014twist the faces, mix the angles, and give them a pose that makes zero sense but somehow works.\u201D",
  },
  warhol: {
    name: "Warhol",
    sig: "— A. Warhol",
    meta: "warhol",
    prompt:
      "\u201CPop-art them into Warhol mode\u2014loud colors, flat faces, and pose like they\u2019re accidentally famous.\u201D",
  },
  hokusai: {
    name: "Hokusai",
    sig: "— Hokusai",
    meta: "hokusai",
    prompt:
      "\u201CStick them on a tiny boat under a giant wave\u2014slightly panicked but still posing like it\u2019s a photoshoot.\u201D",
  },
};

const PAINTERS = Object.keys(PAINTER_MAP); // ['vangogh','monet','picasso','warhol','hokusai']

// --- Spark gallery dataset: ONE entry per painter ---
// Each painter key maps to { before, after, name } where:
//   before = real photo (or SVG placeholder fallback)
//   after  = real painted photo (or null → we render SVG painting on the fly)
//   name   = caption under the "before" frame
const FALLBACK_BY_PAINTER = {
  vangogh: {
    before: makePhoto("#d9b681", "#5a3018", true, "couple"),
    after: null,
    name: "A candid snap",
  },
  monet: {
    before: makePhoto("#c89a6a", "#2a1a0c", false, "solo"),
    after: null,
    name: "Portrait No. 02",
  },
  picasso: {
    before: makePhoto("#e8c8a0", "#3a2614", true, "couple"),
    after: null,
    name: "Studio session",
  },
  warhol: {
    before: makePhoto("#b2824e", "#2a1a0c", false, "solo"),
    after: null,
    name: "The regular",
  },
  hokusai: {
    before: makePhoto("#d0a480", "#4a2a1a", true, "trio"),
    after: null,
    name: "Group shot",
  },
};

const sparkConfigured = window.PhotoLib?.sparkByPainter?.() || {};

// Merge config over fallbacks per painter — any painter not configured
// keeps showing its drawn placeholder + SVG painting.
const GALLERY = {};
for (const key of PAINTERS) {
  const cfg = sparkConfigured[key];
  if (cfg && cfg.before) {
    GALLERY[key] = {
      before: window.PhotoLib.asCss(cfg.before),
      after: cfg.after ? window.PhotoLib.asCss(cfg.after) : null,
      name: cfg.name || "Untitled",
    };
  } else {
    GALLERY[key] = FALLBACK_BY_PAINTER[key];
  }
}

function makePhoto(bg, hair, smile, kind) {
  // Two-face "couple" or single — stylized stock portrait
  const faces = kind === "couple" ? 2 : kind === "trio" ? 3 : 1;
  const skin = "#e8c8a0";
  const centers = faces === 1 ? [50] : faces === 2 ? [36, 64] : [28, 50, 72];
  const r = faces === 1 ? 22 : faces === 2 ? 15 : 12;
  const faceSvg = centers
    .map((cx, i) => {
      const sm = (smile && i === 0) || i === 1;
      return `
      <circle cx="${cx}" cy="52" r="${r}" fill="${skin}"/>
      <path d="M ${cx - r} 46 Q ${cx - r + 2} ${30 - i} ${cx} ${28 - i} Q ${cx + r - 2} ${30 - i} ${cx + r} 46 Q ${cx + r} 38 ${cx} 34 Q ${cx - r} 38 ${cx - r} 46 Z" fill="${hair}"/>
      <circle cx="${cx - r * 0.25}" cy="54" r="1.2" fill="#2a1a0c"/>
      <circle cx="${cx + r * 0.25}" cy="54" r="1.2" fill="#2a1a0c"/>
      ${
        sm
          ? `<path d="M ${cx - r * 0.35} 62 Q ${cx} ${66} ${cx + r * 0.35} 62" stroke="#8a4620" stroke-width="1.2" fill="none" stroke-linecap="round"/>`
          : `<path d="M ${cx - r * 0.3} 63 L ${cx + r * 0.3} 63" stroke="#8a4620" stroke-width="1.2" stroke-linecap="round"/>`
      }
    `;
    })
    .join("");

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 125" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="skyA" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="${bg}" stop-opacity=".9"/>
        <stop offset="1" stop-color="${bg}" stop-opacity=".6"/>
      </linearGradient>
      <filter id="gn"><feTurbulence baseFrequency=".9" numOctaves="1"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .18 0"/></filter>
    </defs>
    <rect width="100" height="125" fill="url(#skyA)"/>
    <rect width="100" height="125" filter="url(#gn)"/>
    ${faceSvg}
    <path d="M20 125 L20 95 Q50 88 80 95 L80 125 Z" fill="#6b3f25"/>
  </svg>`.replace(/\s+/g, " ");
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

// The "painting" is the same scene with painter-specific palette shifts.
// CSS filters + overlay handle the rest. We render it a bit more richly.
function makePainting(style) {
  const palettes = {
    vangogh: {
      sky: "#1e3a8a",
      accent: "#f4b731",
      skin: "#e0b878",
      hair: "#2a1a0c",
      cloth: "#8a2e14",
    },
    monet: {
      sky: "#cde1f2",
      accent: "#f5c5da",
      skin: "#f0dcc0",
      hair: "#7a5a8a",
      cloth: "#b2d4e8",
    },
    picasso: {
      sky: "#c9a878",
      accent: "#d87a3c",
      skin: "#e8d0a8",
      hair: "#2a2018",
      cloth: "#5a4838",
    },
    warhol: {
      sky: "#ff2d88",
      accent: "#ffdc00",
      skin: "#f8c8d8",
      hair: "#00c8dc",
      cloth: "#2a1a0c",
    },
    hokusai: {
      sky: "#d8e6f0",
      accent: "#1e5aa8",
      skin: "#f0dcc0",
      hair: "#1e3050",
      cloth: "#1e5aa8",
    },
  };
  const p = palettes[style] || palettes.vangogh;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 125" preserveAspectRatio="xMidYMid slice">
    <rect width="100" height="125" fill="${p.sky}"/>
    <circle cx="50" cy="52" r="24" fill="${p.skin}"/>
    <path d="M26 46 Q28 22 50 20 Q72 22 74 46 Q74 38 66 32 Q50 28 34 32 Q26 38 26 46 Z" fill="${p.hair}"/>
    <circle cx="43" cy="54" r="1.6" fill="#1a0f06"/>
    <circle cx="57" cy="54" r="1.6" fill="#1a0f06"/>
    <path d="M43 64 Q50 69 57 64" stroke="${p.cloth}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <path d="M20 125 L20 92 Q50 85 80 92 L80 125 Z" fill="${p.cloth}"/>
    <circle cx="18" cy="30" r="6" fill="${p.accent}" opacity=".8"/>
  </svg>`.replace(/\s+/g, " ");
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

// ==========================================================
// CINEMATIC FLASH (declared early — hero scroll may reference it)
// ==========================================================
const flashOverlay = document.getElementById("flashOverlay");

function fireFlash(opts = {}) {
  if (!flashOverlay) return;
  flashOverlay.classList.remove("firing");
  void flashOverlay.offsetWidth; // reflow
  flashOverlay.classList.add("firing");
  setTimeout(() => {
    flashOverlay.classList.remove("firing");
  }, 1000);
}

// ==========================================================
// HERO: scroll-driven hands + spark pulse
// ==========================================================
const hands = document.querySelector(".hero-hands");
const sparkEl = document.querySelector(".spark");
const hero = document.querySelector(".hero-creation");

function onHeroScroll() {
  if (!hero) return;
  const rect = hero.getBoundingClientRect();
  const vh = window.innerHeight;
  // Progress 0 (hero at top) → 1 (hero bottom touches viewport top)
  const p = Math.max(
    0,
    Math.min(1, -rect.top / (hero.offsetHeight - vh * 0.6)),
  );

  // Hands drift closer. At p=0 they're at their resting pose.
  // At p≈0.7 they touch. We use CSS variables to offset.
  const humanMove = p * 16; // % right
  const aiMove = -p * 16; // % left
  hands.style.setProperty("--hand-offset-l", `${-2 + humanMove}%`);
  hands.style.setProperty("--hand-offset-r", `${2 + aiMove}%`);

  // Spark scales + brightens as they approach
  const sparkScale = 0.3 + p * 1.2;
  const sparkOp = Math.min(1, 0.35 + p * 1.3);
  sparkEl.style.setProperty("--spark-s", sparkScale);
  sparkEl.style.setProperty("--spark-o", sparkOp);

  // Disable idle breathing when actively scrolling
  if (p > 0.05) hands.classList.remove("idle");
  else hands.classList.add("idle");

  // Trigger flash when the fingertips "touch" (once per scroll-down pass)
  if (p > 0.85 && !window.__sparkTriggered) {
    window.__sparkTriggered = true;
    fireFlash({ scrollTrigger: true });
  }
  if (p < 0.4) window.__sparkTriggered = false;
}
if (hero) {
  hands.classList.add("idle");
  window.addEventListener("scroll", onHeroScroll, { passive: true });
  onHeroScroll();
}

// ==========================================================
// SPARK GALLERY — auto-rotates, flash on swap
// ==========================================================
const sparkBeforeImg = document.getElementById("sparkBeforeImg");
const sparkAfterImg = document.getElementById("sparkAfterImg");
const sparkBeforeName = document.getElementById("sparkBeforeName");
const sparkAfterName = document.getElementById("sparkAfterName");
const sparkSignature = document.getElementById("sparkSignature");
const sparkArrowLabel = document.getElementById("sparkArrowLabel");
const sparkPicker = document.querySelector(".spark-picker");
const sparkPromptText = document.getElementById("sparkPromptText");

let currentPainterIndex = 0;
let userLocked = false;
let autoTimer = null;
let resumeTimer = null;
const RESUME_AFTER_MS = 10000;

function pauseAutoRotate() {
  userLocked = true;
  clearInterval(autoTimer);
  clearTimeout(resumeTimer);
  resumeTimer = setTimeout(() => {
    userLocked = false;
    startAutoRotate();
  }, RESUME_AFTER_MS);
}

function renderPainter(key) {
  if (!PAINTER_MAP[key]) return;
  const entry = GALLERY[key];
  currentPainterIndex = PAINTERS.indexOf(key);

  sparkBeforeImg.style.backgroundImage = entry.before;
  sparkBeforeName.textContent = entry.name;

  document.body.dataset.painter = key;

  // Real painted photo if user provided one for THIS painter; else the SVG.
  const useRealAfter = !!entry.after;
  sparkAfterImg.style.backgroundImage = useRealAfter
    ? entry.after
    : makePainting(key);
  sparkAfterImg.classList.toggle("is-real", useRealAfter);
  sparkAfterName.textContent = PAINTER_MAP[key].name;
  sparkSignature.textContent = PAINTER_MAP[key].sig;

  // Keep the legacy metamorphosis section synced (if present)
  document.body.dataset.meta = PAINTER_MAP[key].meta;
  syncMetaPicker(key);

  if (sparkPicker) {
    sparkPicker.querySelectorAll("button").forEach((b) => {
      b.classList.toggle("active", b.dataset.painter === key);
    });
  }

  sparkArrowLabel.textContent = `repainted by artist · ${PAINTER_MAP[key].name}`;

  // Swap the prompt card text with a quick cross-fade
  if (sparkPromptText) {
    sparkPromptText.classList.add("is-swapping");
    setTimeout(() => {
      sparkPromptText.textContent = PAINTER_MAP[key].prompt;
      sparkPromptText.classList.remove("is-swapping");
    }, 220);
  }

  sparkAfterImg.classList.remove("emerging");
  void sparkAfterImg.offsetWidth;
  sparkAfterImg.classList.add("emerging");
}

function syncMetaPicker(key) {
  // The original metamorphosis section uses data-meta buttons
  const metaBtns = document.querySelectorAll(".meta-picker button[data-meta]");
  metaBtns.forEach((b) => b.classList.toggle("active", b.dataset.meta === key));
  const afterLbl = document.getElementById("metaAfterLabel");
  const afterBrand = document.getElementById("metaAfterBrand");
  if (afterLbl) afterLbl.textContent = "After — " + PAINTER_MAP[key].name;
  if (afterBrand)
    afterBrand.textContent =
      "Playing With Photo · " + PAINTER_MAP[key].name + " Edition";
}

function advanceGallery() {
  if (userLocked) return;
  fireFlash();
  setTimeout(() => {
    currentPainterIndex = (currentPainterIndex + 1) % PAINTERS.length;
    renderPainter(PAINTERS[currentPainterIndex]);
  }, 350);
}

function startAutoRotate() {
  if (autoTimer) clearInterval(autoTimer);
  autoTimer = setInterval(advanceGallery, 6000);
}

// Painter picker — each button jumps to that painter's photo
if (sparkPicker) {
  sparkPicker.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-painter]");
    if (!btn) return;
    pauseAutoRotate();
    fireFlash();
    setTimeout(() => {
      renderPainter(btn.dataset.painter);
    }, 350);
  });
}

// Legacy metamorphosis picker → route through same flash system
const legacyMetaPicker = document.querySelector(".meta-picker");
if (legacyMetaPicker) {
  legacyMetaPicker.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-meta]");
    if (!btn) return;
    const key = btn.dataset.meta;
    if (!PAINTER_MAP[key]) return;
    pauseAutoRotate();
    fireFlash();
    setTimeout(() => renderPainter(key), 350);
  });
}

if (sparkBeforeImg) {
  renderPainter(PAINTERS[0]);
  startAutoRotate();
}

// ==========================================================
// WEBCAM LENS (inside the before frame)
// ==========================================================
const sparkLens = document.getElementById("sparkLens");
const sparkVideo = document.getElementById("sparkVideo");
const sparkCanvas = document.getElementById("sparkCanvas");
let webcamActive = false;

async function startSparkLens() {
  if (webcamActive || !sparkLens) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false,
    });
    sparkVideo.srcObject = stream;
    await sparkVideo.play();
    webcamActive = true;
    sparkLens.classList.add("live");
    const rect = sparkLens.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    sparkCanvas.width = rect.width * dpr;
    sparkCanvas.height = rect.height * dpr;
    const ctx = sparkCanvas.getContext("2d");
    const draw = () => {
      if (!webcamActive) return;
      if (sparkVideo.videoWidth) {
        const w = sparkCanvas.width,
          h = sparkCanvas.height;
        ctx.save();
        ctx.filter =
          "sepia(.7) saturate(1.3) contrast(1.05) brightness(.95) hue-rotate(-5deg)";
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
        const vw = sparkVideo.videoWidth,
          vh = sparkVideo.videoHeight;
        const cr = w / h,
          vr = vw / vh;
        let sx = 0,
          sy = 0,
          sw = vw,
          sh = vh;
        if (vr > cr) {
          sw = vh * cr;
          sx = (vw - sw) / 2;
        } else {
          sh = vw / cr;
          sy = (vh - sh) / 2;
        }
        ctx.drawImage(sparkVideo, sx, sy, sw, sh, 0, 0, w, h);
        ctx.restore();
      }
      requestAnimationFrame(draw);
    };
    draw();
    // When webcam is on, pin to that "before" and let the picker drive after-styles
    userLocked = true;
    clearInterval(autoTimer);
  } catch (e) {
    const off = document.getElementById("sparkLensOff");
    if (off) off.innerHTML = '<span style="opacity:.8;">Camera blocked</span>';
  }
}
if (sparkLens) sparkLens.addEventListener("click", startSparkLens);

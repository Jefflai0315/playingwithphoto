/**
 * Vintage film filter webcam demo — 4-shot strip with per-panel motion bursts + frame templates.
 */

const DEMO = {
  maxTries: 3,
  storageKey: "pwp_vintage_demo_tries",
  assetsBase: "demo-assets/frames",
  frameTemplates: [
    { id: "Noir_Minimal", label: "Noir minimal" },
    { id: "Linen__Stripes", label: "Linen stripes" },
    { id: "Botanica", label: "Botanica" },
    { id: "Midnight_Galaxy", label: "Midnight galaxy" },
  ],
  burstFrames: 8,
  burstIntervalMs: 100,
  gifFps: 6,
  gifFrames: 8,
};

const FILTERS = {
  kodak: {
    css: "sepia(.5) saturate(1.4) contrast(.95) hue-rotate(-8deg)",
    tint: { r: 210, g: 160, b: 100, alpha: 0.14 },
    vignette: 0.45,
  },
  bw: {
    css: "grayscale(1) contrast(1.2) brightness(.95)",
    tint: { r: 250, g: 245, b: 230, alpha: 0.04 },
    vignette: 0.55,
  },
  polaroid: {
    css: "sepia(.2) saturate(1.3) contrast(1.05) brightness(1.05)",
    tint: { r: 255, g: 220, b: 180, alpha: 0.1 },
    vignette: 0.38,
  },
  kodachrome: {
    css: "sepia(.15) saturate(1.15) contrast(1.04) hue-rotate(-6deg)",
    tint: { r: 230, g: 140, b: 70, alpha: 0.1 },
    vignette: 0.5,
  },
};

const layoutCache = new Map();
const imageCache = new Map();

const video = document.getElementById("video");
const filterCanvas = document.getElementById("filterCanvas");
const fctx = filterCanvas?.getContext("2d");
const status = document.getElementById("demoStatus");
const startBtn = document.getElementById("startCam");
const shutterBtn = document.getElementById("shutterBtn");
const countdown = document.getElementById("countdown");
const captureFeedback = document.getElementById("captureFeedback");
const flash = document.getElementById("flash");
const filterOptions = document.getElementById("filterOptions");
const resultActions = document.getElementById("resultActions");
const placeholder = document.getElementById("demoPlaceholder");
const demoGifPreview = document.getElementById("demoGifPreview");
const demoGifWrap = document.getElementById("demoGifWrap");
const demoGifLoading = document.getElementById("demoGifLoading");
const demoTriesNote = document.getElementById("demoTriesNote");
const demoLimitOverlay = document.getElementById("demoLimitOverlay");
const demoResultStatus = document.getElementById("demoResultStatus");
const demoResultLayout = document.getElementById("demoResultLayout");
const demoSideRail = document.getElementById("demoSideRail");
const demoThumbStrip = document.getElementById("demoThumbStrip");
const demoTemplateRail = document.getElementById("demoTemplateRail");
const thumbSlots = demoThumbStrip
  ? [...demoThumbStrip.querySelectorAll(".demo-thumb-slot")]
  : [];

const DEFAULT_TEMPLATE = DEMO.frameTemplates[0].id;

let currentFilter = "kodak";
let currentTemplate = DEFAULT_TEMPLATE;
let streamActive = false;
let shooting = false;
let lastGifUrl = null;
/** @type {string[][] | null} four panels, each an array of burst frame data URLs */
let panelBursts = null;
/** @type {Promise<typeof import("./lib/gifenc.esm.js")> | null} */
let gifencPromise = null;

function loadGifenc() {
  if (!gifencPromise) {
    gifencPromise = import("./lib/gifenc.esm.js");
  }
  return gifencPromise;
}

if (!video || !filterCanvas) {
  // Demo section not on this page
} else {
  initDemo();
}

function initDemo() {
  try {
    if (new URLSearchParams(location.search).get("reset_demo") === "1") {
      localStorage.removeItem(DEMO.storageKey);
    }
    buildFilterButtons();
    buildTemplateRail();
    updateTriesUI();
    if (getTries() >= DEMO.maxTries) showLimitState();

    startBtn?.addEventListener("click", startCamera);
    shutterBtn?.addEventListener("click", shoot);
    document.getElementById("retakeBtn")?.addEventListener("click", retake);
    document.getElementById("downloadGifBtn")?.addEventListener("click", downloadGif);
    document.getElementById("demoBookBtn")?.addEventListener("click", () => {
      window.pwpTrack?.("demo_limit_book", { tries: getTries() });
    });
    window.addEventListener("resize", () => {
      if (streamActive) sizeCanvas();
    });
  } catch (err) {
    console.error("Demo init failed:", err);
    if (demoTriesNote) {
      demoTriesNote.textContent = "Demo failed to load — please refresh the page.";
    }
  }
}

function buildFilterButtons() {
  if (!filterOptions) return;
  const filmLooks = window.PhotoLib?.looks?.()?.film || {};
  const order = ["kodak", "bw", "polaroid", "kodachrome"];
  filterOptions.innerHTML = "";
  order.forEach((key, i) => {
    const label = filmLooks[key]?.label || key;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.f = key;
    btn.textContent = label;
    if (i === 0) btn.classList.add("active");
    filterOptions.appendChild(btn);
  });
  filterOptions.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-f]");
    if (!btn) return;
    setFilter(btn.dataset.f);
  });
  setFilter("kodak");
}

function buildTemplateRail() {
  if (!demoTemplateRail) return;
  demoTemplateRail.innerHTML = "";
  DEMO.frameTemplates.forEach((t, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tpl-btn" + (i === 0 ? " active" : "");
    btn.dataset.template = t.id;
    btn.title = t.label;
    btn.innerHTML = `<img src="${DEMO.assetsBase}/${t.id}.png" alt="${t.label}" loading="lazy" />`;
    demoTemplateRail.appendChild(btn);
  });
  demoTemplateRail.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-template]");
    if (!btn || btn.disabled) return;
    const next = btn.dataset.template;
    if (next === currentTemplate) return;
    currentTemplate = next;
    [...demoTemplateRail.children].forEach((b) =>
      b.classList.toggle("active", b === btn)
    );
    window.pwpTrack?.("demo_pick_frame", { template: currentTemplate });
    if (panelBursts) refreshGifPreview();
  });
}

function setFilter(name) {
  const key = name === "sepia" ? "kodak" : name;
  if (!FILTERS[key]) return;
  currentFilter = key;
  if (!filterOptions) return;
  [...filterOptions.children].forEach((b) =>
    b.classList.toggle("active", b.dataset.f === key)
  );
}
window.pwpDemoSetFilter = setFilter;

function getTries() {
  try {
    return parseInt(localStorage.getItem(DEMO.storageKey) || "0", 10) || 0;
  } catch {
    return 0;
  }
}

function incrementTries() {
  const n = getTries() + 1;
  try {
    localStorage.setItem(DEMO.storageKey, String(n));
  } catch {
    /* ignore */
  }
  return n;
}

function triesLeft() {
  return Math.max(0, DEMO.maxTries - getTries());
}

function updateTriesUI() {
  if (!demoTriesNote) return;
  const left = triesLeft();
  if (left <= 0) {
    demoTriesNote.textContent = "Free demo strips used — book for the full booth experience";
  } else if (left === 1) {
    demoTriesNote.textContent = "1 free strip left · vintage filter only · nothing uploads";
  } else {
    demoTriesNote.textContent = `${left} free strips left · vintage filter only · nothing uploads`;
  }
}

function showLimitState() {
  demoLimitOverlay?.removeAttribute("hidden");
  updateTriesUI();
}

function hideLimitState() {
  demoLimitOverlay?.setAttribute("hidden", "");
}

function setPoseLabel(text) {
  setResultStatus(text);
}

function setResultStatus(text) {
  if (demoResultStatus) demoResultStatus.textContent = text;
}

function resetThumbStrip() {
  thumbSlots.forEach((slot) => {
    slot.classList.remove("active", "done", "has-img");
    slot.innerHTML = `<span>${Number(slot.dataset.slot) + 1}</span>`;
  });
}

function showThumbRail() {
  demoResultLayout?.classList.add("has-side-rail");
  demoSideRail?.removeAttribute("hidden");
  demoThumbStrip?.removeAttribute("hidden");
  demoTemplateRail?.setAttribute("hidden", "");
}

function hideThumbRail() {
  demoThumbStrip?.setAttribute("hidden", "");
}

function showTemplateRail() {
  demoResultLayout?.classList.add("has-side-rail");
  demoSideRail?.removeAttribute("hidden");
  demoTemplateRail?.removeAttribute("hidden");
  demoThumbStrip?.setAttribute("hidden", "");
}

function hideSideRail() {
  demoResultLayout?.classList.remove("has-side-rail");
  demoSideRail?.setAttribute("hidden", "");
  demoThumbStrip?.setAttribute("hidden", "");
  demoTemplateRail?.setAttribute("hidden", "");
}

function setActiveThumb(index) {
  thumbSlots.forEach((slot, i) => {
    slot.classList.toggle("active", i === index);
  });
}

function fillThumbSlot(index, posterUrl) {
  const slot = thumbSlots[index];
  if (!slot) return;
  slot.classList.remove("active");
  slot.classList.add("done", "has-img");
  slot.innerHTML = `<img src="${posterUrl}" alt="Pose ${index + 1}" />`;
}

function showResultActions() {
  resultActions?.removeAttribute("hidden");
}

function hideResultActions() {
  resultActions?.setAttribute("hidden", "");
}

function setTemplateRailEnabled(on) {
  if (!demoTemplateRail) return;
  [...demoTemplateRail.querySelectorAll("button")].forEach((b) => {
    b.disabled = !on;
  });
}

async function showCaptureFeedback(posterUrl, index) {
  if (!captureFeedback) return;
  const taken = index + 1;
  const remaining = 4 - taken;
  captureFeedback.innerHTML = `
    <img src="${posterUrl}" alt="" />
    <p class="capture-feedback-title">Got it!</p>
    <p class="capture-feedback-sub">${taken} of 4 captured${remaining > 0 ? ` · ${remaining} to go` : ""}</p>
  `;
  captureFeedback.classList.remove("show");
  void captureFeedback.offsetWidth;
  captureFeedback.classList.add("show");
  fillThumbSlot(index, posterUrl);
  const n = index + 1;
  setPoseLabel(`Pose ${n} of 4 — move a little on capture`);
  if (remaining > 0) {
    setPoseLabel(`${remaining} more pose${remaining === 1 ? "" : "s"} to go`);
  } else {
    setPoseLabel("Developing your GIF…");
  }
  await wait(1100);
  captureFeedback.classList.remove("show");
}

function showResultPanel() {
  placeholder?.setAttribute("hidden", "");
  demoGifWrap?.removeAttribute("hidden");
  hideThumbRail();
  hideResultActions();
  setTemplateRailEnabled(false);
  setGifLoading(true);
}

function hideResultPanel() {
  placeholder?.removeAttribute("hidden");
  demoGifWrap?.setAttribute("hidden", "");
  hideResultActions();
  hideSideRail();
  setTemplateRailEnabled(false);
}

function setGifLoading(on) {
  if (demoGifLoading) demoGifLoading.hidden = !on;
}

function showCameraBlocked(message) {
  status?.classList.remove("hide");
  const p = status?.querySelector("p");
  if (p) p.textContent = message;
}

async function startCamera() {
  if (!startBtn || !video || !status) return;
  startBtn.disabled = true;
  startBtn.innerHTML = "Starting…";
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: 720, height: 720 },
      audio: false,
    });
    video.srcObject = stream;
    await video.play();
    streamActive = true;
    status.classList.add("hide");
    shutterBtn.disabled = false;
    sizeCanvas();
    renderLoop();
    setPoseLabel("Ready — tap shutter for pose 1");
    setResultStatus("Waiting for photos");
    window.pwpTrack?.("demo_camera_start");
  } catch (err) {
    console.warn("Camera error:", err);
    startBtn.disabled = false;
    startBtn.innerHTML = "Turn on camera";
    showCameraBlocked(
      "We need camera permission for the demo. Check your browser settings and try again."
    );
  }
}

function sizeCanvas() {
  const rect = filterCanvas.getBoundingClientRect();
  filterCanvas.width = rect.width * (window.devicePixelRatio || 1);
  filterCanvas.height = rect.height * (window.devicePixelRatio || 1);
}

function renderLoop() {
  if (!streamActive) return;
  drawFrame(filterCanvas, fctx, currentFilter);
  requestAnimationFrame(renderLoop);
}

function drawFrame(canvas, ctx, filterName) {
  if (!video.videoWidth) return;
  const f = FILTERS[filterName];
  const w = canvas.width;
  const h = canvas.height;

  ctx.save();
  ctx.filter = f.css;
  ctx.translate(w, 0);
  ctx.scale(-1, 1);
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const cr = w / h;
  const vr = vw / vh;
  let sx = 0;
  let sy = 0;
  let sw = vw;
  let sh = vh;
  if (vr > cr) {
    sw = vh * cr;
    sx = (vw - sw) / 2;
  } else {
    sh = vw / cr;
    sy = (vh - sh) / 2;
  }
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, w, h);
  ctx.restore();

  ctx.fillStyle = `rgba(${f.tint.r},${f.tint.g},${f.tint.b},${f.tint.alpha})`;
  ctx.fillRect(0, 0, w, h);

  const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.7);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, `rgba(30,15,5,${f.vignette})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  if (filterName === "kodak" || filterName === "kodachrome") {
    const leak = ctx.createLinearGradient(0, 0, w, h);
    leak.addColorStop(0, "rgba(255,180,90,.08)");
    leak.addColorStop(0.5, "rgba(255,180,90,0)");
    leak.addColorStop(1, "rgba(100,30,10,.1)");
    ctx.fillStyle = leak;
    ctx.fillRect(0, 0, w, h);
  }
}

function captureSnapshot() {
  const s = 480;
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = s;
  tempCanvas.height = s;
  const tctx = tempCanvas.getContext("2d");
  const f = FILTERS[currentFilter];
  tctx.save();
  tctx.filter = f.css;
  tctx.translate(s, 0);
  tctx.scale(-1, 1);
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  let sx = 0;
  let sy = 0;
  let sw = vw;
  let sh = vh;
  const vr = vw / vh;
  if (vr > 1) {
    sw = vh;
    sx = (vw - sw) / 2;
  } else {
    sh = vw;
    sy = (vh - sh) / 2;
  }
  tctx.drawImage(video, sx, sy, sw, sh, 0, 0, s, s);
  tctx.restore();
  tctx.fillStyle = `rgba(${f.tint.r},${f.tint.g},${f.tint.b},${f.tint.alpha})`;
  tctx.fillRect(0, 0, s, s);
  const grad = tctx.createRadialGradient(s / 2, s / 2, s * 0.3, s / 2, s / 2, s * 0.7);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, `rgba(30,15,5,${f.vignette})`);
  tctx.fillStyle = grad;
  tctx.fillRect(0, 0, s, s);
  return tempCanvas.toDataURL("image/jpeg", 0.82);
}

async function capturePanelBurst() {
  const frames = [];
  for (let i = 0; i < DEMO.burstFrames; i++) {
    frames.push(captureSnapshot());
    if (i < DEMO.burstFrames - 1) await wait(DEMO.burstIntervalMs);
  }
  return frames;
}

async function shoot() {
  if (!streamActive || shooting || !shutterBtn) return;
  if (getTries() >= DEMO.maxTries) {
    showLimitState();
    showCameraBlocked(
      "You've used your 3 free demo strips. Book the booth for unlimited photos — or add ?reset_demo=1 to the URL while testing."
    );
    return;
  }

  shooting = true;
  shutterBtn.disabled = true;
  demoGifWrap?.setAttribute("hidden", "");
  hideResultActions();
  hideSideRail();
  panelBursts = [];
  resetThumbStrip();
  showThumbRail();
  setResultStatus("Shooting…");

  for (let i = 0; i < 4; i++) {
    setActiveThumb(i);
    setPoseLabel(`Pose ${i + 1} of 4 — move a little on capture`);
    for (let n = 3; n > 0; n--) {
      if (countdown) {
        countdown.textContent = String(n);
        countdown.classList.remove("show");
        void countdown.offsetWidth;
        countdown.classList.add("show");
      }
      await wait(650);
    }
    countdown?.classList.remove("show");
    if (flash) {
      flash.classList.remove("fire");
      void flash.offsetWidth;
      flash.classList.add("fire");
    }

    const burst = await capturePanelBurst();
    panelBursts.push(burst);
    const poster = burst[Math.floor(burst.length / 2)];
    await showCaptureFeedback(poster, i);
    await wait(300);
  }
  countdown?.classList.remove("show");

  const tries = incrementTries();
  window.pwpTrack?.("demo_strip_complete", {
    filter: currentFilter,
    template: currentTemplate,
    try_number: tries,
  });

  showResultPanel();
  setResultStatus("Developing GIF…");
  setPoseLabel("Strip complete");
  await refreshGifPreview();

  shooting = false;
  updateTriesUI();

  if (getTries() >= DEMO.maxTries) {
    showLimitState();
    shutterBtn.disabled = false;
  } else {
    hideLimitState();
    shutterBtn.disabled = false;
  }
}

async function refreshGifPreview() {
  if (!panelBursts?.length) return;
  setGifLoading(true);
  hideResultActions();
  setTemplateRailEnabled(false);
  setResultStatus("Developing GIF…");
  try {
    const gifUrl = await buildMotionGif(panelBursts, currentTemplate);
    if (lastGifUrl) URL.revokeObjectURL(lastGifUrl);
    lastGifUrl = gifUrl;
    if (demoGifPreview) demoGifPreview.src = gifUrl;
    demoGifWrap?.removeAttribute("hidden");
    setResultStatus("GIF ready");
    showTemplateRail();
    showResultActions();
  } catch (err) {
    console.error("GIF build failed:", err);
    if (demoGifLoading) {
      demoGifLoading.textContent = "GIF failed — try retaking.";
      demoGifLoading.hidden = false;
    }
    hideSideRail();
  } finally {
    setGifLoading(false);
    setTemplateRailEnabled(true);
  }
}

async function buildMotionGif(panelBursts, templateId) {
  const targetFrames = DEMO.gifFrames;
  const maxMotionFrames = Math.max(...panelBursts.map((b) => b.length), 1);
  const sampleIndices = Array.from({ length: targetFrames }, (_, i) =>
    Math.round((i * (maxMotionFrames - 1)) / Math.max(1, targetFrames - 1))
  );

  const canvases = [];
  for (const sampleIndex of sampleIndices) {
    const stills = panelBursts.map((burst) => burst[sampleIndex % burst.length]);
    canvases.push(await composeStripFrame(stills, templateId));
  }
  const blob = await encodeGif(canvases, DEMO.gifFps);
  canvases.forEach((c) => c.remove());
  return URL.createObjectURL(blob);
}

async function encodeGif(canvases, fps) {
  const { GIFEncoder, quantize, applyPalette } = await loadGifenc();
  const enc = GIFEncoder();
  const delay = Math.max(80, Math.round(1000 / fps));
  canvases.forEach((c, i) => {
    const { width, height } = c;
    const { data } = c.getContext("2d").getImageData(0, 0, width, height);
    const palette = quantize(data, 256);
    const index = applyPalette(data, palette);
    enc.writeFrame(index, width, height, {
      palette,
      delay,
      ...(i === 0 ? { repeat: 0 } : {}),
    });
  });
  enc.finish();
  return new Blob([enc.bytes()], { type: "image/gif" });
}

function pctRect(pct, cw, ch) {
  return {
    x: Math.round((cw * pct.x) / 100),
    y: Math.round((ch * pct.y) / 100),
    w: Math.round((cw * pct.w) / 100),
    h: Math.round((ch * pct.h) / 100),
  };
}

function coverDraw(ctx, img, x, y, w, h) {
  const ir = img.width / img.height;
  const rr = w / h;
  let sx;
  let sy;
  let sw;
  let sh;
  if (ir > rr) {
    sh = img.height;
    sw = sh * rr;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / rr;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

async function loadLayout(templateId) {
  if (layoutCache.has(templateId)) return layoutCache.get(templateId);
  const res = await fetch(`${DEMO.assetsBase}/${templateId}.layout.json`);
  if (!res.ok) throw new Error(`Layout not found: ${templateId}`);
  const layout = await res.json();
  layoutCache.set(templateId, layout);
  return layout;
}

function loadImage(src) {
  if (imageCache.has(src)) return imageCache.get(src);
  const p = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Image failed: ${src}`));
    img.src = src;
  });
  imageCache.set(src, p);
  return p;
}

async function composeStripFrame(panelStills, templateId) {
  const layout = await loadLayout(templateId);
  const { width: cw, height: ch } = layout.canvas;
  const targetW = 320;
  const scale = targetW / cw;
  const sw = Math.round(cw * scale);
  const sh = Math.round(ch * scale);

  const canvas = document.createElement("canvas");
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext("2d");

  const frameImg = await loadImage(`${DEMO.assetsBase}/${templateId}.png`);
  const photoImgs = await Promise.all(panelStills.map((src) => loadImage(src)));
  const panelsAbove = !!layout.panels_above_frame;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, sw, sh);

  if (panelsAbove) ctx.drawImage(frameImg, 0, 0, sw, sh);

  const panels = layout.panels_pct || [];
  for (let i = 0; i < panels.length; i++) {
    const r = pctRect(panels[i], sw, sh);
    if (photoImgs[i]) coverDraw(ctx, photoImgs[i], r.x, r.y, r.w, r.h);
  }

  if (!panelsAbove) ctx.drawImage(frameImg, 0, 0, sw, sh);

  return canvas;
}

function retake() {
  if (getTries() >= DEMO.maxTries) {
    showLimitState();
    return;
  }
  panelBursts = null;
  if (lastGifUrl) {
    URL.revokeObjectURL(lastGifUrl);
    lastGifUrl = null;
  }
  if (demoGifPreview) demoGifPreview.removeAttribute("src");
  demoGifWrap?.setAttribute("hidden", "");
  if (demoGifLoading) {
    demoGifLoading.textContent = "Developing your GIF…";
    demoGifLoading.hidden = true;
  }
  hideResultActions();
  hideResultPanel();
  resetThumbStrip();
  currentTemplate = DEFAULT_TEMPLATE;
  if (demoTemplateRail) {
    [...demoTemplateRail.children].forEach((b, i) =>
      b.classList.toggle("active", i === 0)
    );
  }
  setPoseLabel(streamActive ? "Ready — tap shutter for pose 1" : "Turn on camera to start");
  setResultStatus("Waiting for photos");
  if (getTries() < DEMO.maxTries) shutterBtn.disabled = false;
}

function downloadGif() {
  if (!lastGifUrl) return;
  const link = document.createElement("a");
  link.download = `playing-with-photo-vintage-${Date.now()}.gif`;
  link.href = lastGifUrl;
  link.click();
  window.pwpTrack?.("demo_download_gif", { filter: currentFilter, template: currentTemplate });
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

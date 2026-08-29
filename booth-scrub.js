/* ============================================================
   BOOTH SCRUB — scroll-driven assembly (deferred + progressive)
   ============================================================ */

(() => {
  const FRAME_COUNT = 121;
  const FRAME_PATH = (i) =>
    `photos/booth/frames/b_${String(i + 1).padStart(4, "0")}.webp`;

  const runway = document.querySelector(".booth-scrub");
  if (!runway) return;

  const canvas = document.getElementById("boothAssemblyCanvas");
  if (!canvas) return;

  const labels = runway.querySelector(".booth-labels");
  const ctx = canvas.getContext("2d");
  const ASSEMBLE_AT = 0.5;

  const frames = new Array(FRAME_COUNT);
  let loaded = 0;
  let targetIdx = 0;
  let currentIdx = 0;
  let ready = false;
  let preloadStarted = false;
  let loopRunning = false;
  let loopUsesSharedTicker = false;
  let removeSharedTick = null;
  let scrubProgress = 0;
  let smoothProgress = 0;
  let driverProgress = null;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const LOW_POWER = window.matchMedia(
    "(max-width: 900px), (hover: none) and (pointer: coarse)",
  ).matches;
  let runwayVisible = false;
  let pageVisible = !document.hidden;

  function preload() {
    if (preloadStarted) return;
    preloadStarted = true;

    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.onload = () => {
        frames[i] = img;
        loaded += 1;
        if (!ready && loaded >= 1) init();
      };
      img.onerror = () => {
        console.warn("[booth-scrub] missing frame:", FRAME_PATH(i));
      };
      img.src = FRAME_PATH(i);
    }
  }

  function sizeCanvas() {
    const dpr = LOW_POWER ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return false;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return true;
  }

  function drawFrame(idx) {
    const img = frames[idx];
    if (!img?.width) return;
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    if (!cw || !ch) return;
    ctx.clearRect(0, 0, cw, ch);
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const isMobile = window.matchMedia("(max-width: 900px)").matches;
    const scale = isMobile
      ? Math.max(cw / iw, ch / ih) * 1.06
      : Math.min(cw / iw, ch / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  function scrollProgress() {
    const vh = window.innerHeight;
    const rect = runway.getBoundingClientRect();
    const scrubRange = Math.max(1, runway.offsetHeight - vh);
    // Begin scrub before the pin locks — ~40% of viewport early
    const preRoll = vh * 0.4;

    if (rect.top > preRoll) return 0;
    if (rect.bottom <= vh) return 1;

    const scrollInto = preRoll - rect.top;
    const totalRange = scrubRange + preRoll;
    return Math.min(1, Math.max(0, scrollInto / totalRange));
  }

  // Continuous Ken Burns-style zoom, ramping up through the tail (same
  // treatment as the hero/vision scrubs) so the image keeps gliding with
  // the scroll even after the assembly animation finishes.
  function applyZoom() {
    // Smaller cap than hero/vision — .booth-stage is a tighter two-column
    // grid with overflow:visible, so a bigger zoom risks spilling into the
    // adjacent labels column instead of just filling more of a full-bleed section.
    const zoomT = Math.max(0, Math.min(1, (smoothProgress - 0.4) / 0.6));
    const scale = 1 + zoomT * 0.06;
    canvas.style.transform = `scale(${scale.toFixed(4)})`;
  }

  function update(progressOverride = null) {
    if (!ready) return;

    const p = progressOverride === null ? scrollProgress() : progressOverride;
    scrubProgress = p;
    const videoP = Math.min(1, p / ASSEMBLE_AT);
    const maxIdx = Math.max(0, loaded - 1);
    targetIdx = Math.round(videoP * (FRAME_COUNT - 1));
    if (targetIdx > maxIdx) targetIdx = maxIdx;

    if (labels) {
      const labelP =
        p <= ASSEMBLE_AT ? 0 : Math.min(1, (p - ASSEMBLE_AT) / 0.2);
      labels.style.opacity = String(labelP);
    }
  }

  function loop() {
    if (!loopRunning) return;
    if (!loopUsesSharedTicker) requestAnimationFrame(loop);

    if (!ready || !pageVisible || !runwayVisible) return;

    update(driverProgress);
    if (!prefersReducedMotion) {
      smoothProgress += (scrubProgress - smoothProgress) * 0.22;
      if (Math.abs(scrubProgress - smoothProgress) < 0.001) {
        smoothProgress = scrubProgress;
      }
      applyZoom();
      currentIdx += (targetIdx - currentIdx) * 0.5;
      if (Math.abs(targetIdx - currentIdx) < 0.12) currentIdx = targetIdx;
      drawFrame(Math.round(currentIdx));
    }
  }

  function startLoop() {
    if (loopRunning) return;
    loopRunning = true;
    const addTick = window.__pwpScrollDriver?.addTick;
    if (addTick) {
      loopUsesSharedTicker = true;
      removeSharedTick = addTick(loop);
    } else {
      loop();
    }
  }

  function stopLoop() {
    loopRunning = false;
    removeSharedTick?.();
    removeSharedTick = null;
    loopUsesSharedTicker = false;
  }

  function renderImmediateProgress() {
    if (!ready || !(prefersReducedMotion || LOW_POWER)) return;
    if (!prefersReducedMotion) {
      smoothProgress = scrubProgress;
      applyZoom();
    }
    drawFrame(Math.round(targetIdx));
  }

  const scrubTrigger = window.__pwpScrollDriver?.register({
    id: "booth-scrub",
    trigger: runway,
    start: "top 40%",
    end: "bottom bottom",
    finishOnStop: true,
    onUpdate: (progress) => {
      driverProgress = progress;
      update(progress);
      renderImmediateProgress();
    },
  });

  function init() {
    if (ready) return;
    if (!sizeCanvas()) {
      // Canvas may be 0×0 until layout/reveal — retry shortly
      requestAnimationFrame(() => {
        if (!ready) init();
      });
      return;
    }

    if (prefersReducedMotion) {
      drawFrame(Math.min(FRAME_COUNT - 1, Math.max(0, loaded - 1)));
      if (labels) labels.style.opacity = "1";
    } else {
      drawFrame(0);
      currentIdx = 0;
    }
    ready = true;
    update();
    if (!prefersReducedMotion) startLoop();
    console.log(`[booth-scrub] ready — loading ${FRAME_COUNT} frames`);
  }

  window.addEventListener("resize", () => {
    if (!sizeCanvas()) return;
    drawFrame(Math.round(currentIdx));
  });

  document.addEventListener("visibilitychange", () => {
    pageVisible = !document.hidden;
    if (pageVisible && ready && runwayVisible) startLoop();
    else if (document.hidden) stopLoop();
  });

  const preloadObs = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting) && !preloadStarted) {
        preloadObs.disconnect();
        preload();
      }
    },
    { rootMargin: LOW_POWER ? "40% 0px" : "120% 0px" },
  );
  preloadObs.observe(runway);

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      ([e]) => {
        runwayVisible = e.isIntersecting;
        if (runwayVisible && ready) startLoop();
        else if (!runwayVisible) stopLoop();
      },
      { rootMargin: "80px 0px" },
    ).observe(runway);
  } else {
    runwayVisible = true;
  }
})();

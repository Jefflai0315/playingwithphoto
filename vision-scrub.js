/* ============================================================
   VISION SCRUB — hero-style image-sequence scroll scrub
   ============================================================ */

(() => {
  const FRAME_COUNT = window.PhotoLib?.visionFrameCount?.() || 61;
  const FRAME_PATH = (i) =>
    window.PhotoLib?.visionFramePath?.(i) ||
    `photos/vision/frames/v_${String(i).padStart(4, "0")}.webp`;

  const FRAME_ZONE = 0.73; // frames finish slightly after cards begin
  const COPY_OUT = 0.48;
  const COPY_IN = 0.65; // headline re-entry
  const OUTRO_IN = 0.45; // layer cards — slightly before scrub ends
  const OUTRO_FULL = 0.72;
  const EXIT_START = 0.86;

  const runway = document.querySelector(".vision-scrub");
  if (!runway) return;

  const LOW_POWER = window.matchMedia(
    "(max-width: 900px), (hover: none) and (pointer: coarse)",
  ).matches;
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  let runwayVisible = false;
  let pageVisible = !document.hidden;
  let loopStarted = false;
  let loopUsesSharedTicker = false;

  const pin = document.querySelector(".vision-scrub-pin");
  const canvas = document.getElementById("visionScrubCanvas");
  const headline = document.getElementById("visionScrubHeadline");
  const outro = document.getElementById("visionScrubOutro");
  const hint = document.getElementById("visionScrubHint");
  const bar = document.getElementById("visionScrubBar");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const frames = new Array(FRAME_COUNT);
  let loadedCount = 0;
  let started = false;

  let targetIdx = 0;
  let currentIdx = 0;
  let preloadStarted = false;
  let scrubProgress = 0;
  let smoothProgress = 0;
  let driverProgress = null;

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function headlineOpacity(p) {
    if (p <= 0.1) return 1;
    if (p < COPY_OUT) return Math.max(0, 1 - (p - 0.1) / 0.22);
    if (p < COPY_IN) return 0;
    if (p < 0.82) return Math.min(1, (p - COPY_IN) / 0.14);
    return 1;
  }

  function outroOpacity(p) {
    if (p < OUTRO_IN) return 0;
    if (p < OUTRO_FULL)
      return Math.min(1, (p - OUTRO_IN) / (OUTRO_FULL - OUTRO_IN));
    return 1;
  }

  function preload() {
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.onload = img.onerror = () => {
        frames[i] = img;
        loadedCount++;
        if (!started) {
          started = true;
          runway.classList.add("is-ready");
          init();
        }
      };
      img.src = FRAME_PATH(i + 1);
    }
  }

  function sizeCanvas() {
    const dpr = LOW_POWER ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawFrame(idx) {
    const img = frames[idx];
    if (!img || !img.naturalWidth) return;
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    if (!cw || !ch) return;
    ctx.clearRect(0, 0, cw, ch);
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const scale = Math.max(cw / iw, ch / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  function updateScrub(progressOverride = null) {
    const rect = runway.getBoundingClientRect();
    const vh = window.innerHeight;
    const scrollInto = -rect.top;
    const scrubRange = runway.offsetHeight - vh;
    const p = progressOverride === null
      ? Math.max(0, Math.min(1, scrollInto / scrubRange))
      : Math.max(0, Math.min(1, progressOverride));
    scrubProgress = p;

    const frameT = Math.min(1, p / FRAME_ZONE);
    const eased = easeOutCubic(frameT);
    const maxIdx = Math.max(0, loadedCount - 1);
    targetIdx = Math.round(eased * (FRAME_COUNT - 1));
    if (targetIdx > maxIdx) targetIdx = maxIdx;

    if (headline) {
      const o = headlineOpacity(p);
      headline.style.opacity = o;
      headline.style.transform = `translateY(${(1 - o) * 14}px)`;
      window.__ideaTitleFocus?.setProgress(o);
    }

    if (outro) {
      const o = outroOpacity(p);
      outro.style.opacity = o;
      outro.style.transform = `translateY(${(1 - o) * 22}px)`;
      outro.classList.toggle("is-visible", p >= OUTRO_IN);
    }

    if (bar) bar.style.width = `${Math.min(1, p / FRAME_ZONE) * 100}%`;

    if (hint) {
      const hintO =
        p < 0.08
          ? 0
          : p < OUTRO_IN
            ? 0.9
            : Math.max(0, 1 - (p - OUTRO_IN) / 0.1);
      hint.style.opacity = hintO;
    }

    const exitT = p > EXIT_START ? (p - EXIT_START) / (1 - EXIT_START) : 0;
    const exitEase = easeOutCubic(exitT);
    runway.classList.toggle("is-exiting", exitT > 0.02);

    if (pin) {
      pin.style.transform = `translateY(${-exitEase * 48}px)`;
      pin.style.opacity = `${1 - exitEase * 0.28}`;
    }
  }

  // Continuous Ken Burns-style zoom, ramping up through the tail (same
  // treatment as the hero scrub) so the image keeps gliding with the scroll
  // even after individual frames stop changing.
  function applyZoom() {
    const zoomT = Math.max(0, Math.min(1, (smoothProgress - 0.4) / 0.6));
    const scale = 1 + zoomT * 0.14;
    if (canvas) canvas.style.transform = `scale(${scale.toFixed(4)})`;
  }

  let lastDrawIdx = -1;
  function loop() {
    if (!loopUsesSharedTicker) requestAnimationFrame(loop);
    if (
      !loopStarted ||
      !pageVisible ||
      !runwayVisible ||
      LOW_POWER ||
      prefersReducedMotion
    )
      return;

    updateScrub(driverProgress);
    smoothProgress += (scrubProgress - smoothProgress) * 0.22;
    if (Math.abs(scrubProgress - smoothProgress) < 0.001) {
      smoothProgress = scrubProgress;
    }
    applyZoom();
    const lerp = targetIdx >= FRAME_COUNT - 2 ? 0.3 : 0.38;
    currentIdx += (targetIdx - currentIdx) * lerp;
    if (Math.abs(targetIdx - currentIdx) < 0.12) currentIdx = targetIdx;
    const drawIdx = Math.round(currentIdx);
    if (drawIdx !== lastDrawIdx) {
      drawFrame(drawIdx);
      lastDrawIdx = drawIdx;
    }
  }

  function onScrubScroll() {
    updateScrub();
    if (prefersReducedMotion || LOW_POWER) {
      if (!prefersReducedMotion) {
        smoothProgress = scrubProgress;
        applyZoom();
      }
      const drawIdx = Math.round(
        Math.max(0, Math.min(FRAME_COUNT - 1, targetIdx)),
      );
      if (frames[drawIdx]) drawFrame(drawIdx);
    }
  }

  function renderImmediateProgress() {
    if (!(prefersReducedMotion || LOW_POWER)) return;
    if (!prefersReducedMotion) {
      smoothProgress = scrubProgress;
      applyZoom();
    }
    const drawIdx = Math.round(
      Math.max(0, Math.min(FRAME_COUNT - 1, targetIdx)),
    );
    if (frames[drawIdx]) drawFrame(drawIdx);
  }

  const scrubTrigger = window.__pwpScrollDriver?.register({
    id: "vision-scrub",
    trigger: runway,
    start: "top top",
    end: "bottom bottom",
    finishOnStop: true,
    onUpdate: (progress) => {
      driverProgress = progress;
      updateScrub(progress);
      renderImmediateProgress();
    },
  });

  function init() {
    sizeCanvas();
    drawFrame(0);
    updateScrub();
    if (!LOW_POWER && !prefersReducedMotion) {
      loopStarted = true;
      const addTick = window.__pwpScrollDriver?.addTick;
      if (addTick) {
        loopUsesSharedTicker = true;
        addTick(loop);
      } else {
        loop();
      }
    }
  }

  window.addEventListener("resize", () => {
    sizeCanvas();
    drawFrame(Math.round(currentIdx));
  });
  if (!scrubTrigger) {
    window.addEventListener("scroll", onScrubScroll, { passive: true });
  }

  document.addEventListener("visibilitychange", () => {
    pageVisible = !document.hidden;
  });

  const visObs = new IntersectionObserver(
    (entries) => {
      runwayVisible = entries.some((e) => e.isIntersecting);
      if (!preloadStarted && runwayVisible) {
        preloadStarted = true;
        preload();
      }
    },
    { rootMargin: LOW_POWER ? "40% 0px" : "100% 0px" },
  );
  visObs.observe(runway);
})();

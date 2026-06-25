/* ============================================================
   SNAPSHOT SCRUB — keyframe crossfade + drag + scroll
   Guest photo morphs through AI painter styles
   ============================================================ */

(() => {
  const KEYFRAMES = [
    {
      src: "../photos/spark/jenmike.png",
      label: "Before",
    },
    {
      src: "../photos/spark/jenmike-vangogh.png",
      label: "Van Gogh",
    },
    {
      src: "../photos/spark/myra-monet.png",
      label: "Monet",
    },
    {
      src: "../photos/spark/co-picasso.png",
      label: "Picasso",
    },
  ];

  const runway = document.querySelector(".snapshot-scrub");
  const canvas = document.getElementById("snapshotScrubCanvas");
  if (!runway || !canvas) return;

  const ctx = canvas.getContext("2d");
  const hint = document.getElementById("snapshotScrubHint");
  const bar = document.getElementById("snapshotScrubBar");
  const barFill = document.getElementById("snapshotScrubBarFill");
  const styleLabel = document.getElementById("snapshotStyleLabel");
  const overlay = document.getElementById("snapshotScrubOverlay");

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const TOUCH =
    window.matchMedia("(hover: none) and (pointer: coarse)").matches ||
    window.matchMedia("(max-width: 900px)").matches;

  const images = new Array(KEYFRAMES.length);
  let loaded = 0;
  let ready = false;
  let progress = 0;
  let targetProgress = 0;
  let dragging = false;
  let userActive = false;
  let autoPhase = 0;
  let lastUserAt = performance.now();
  let loopRunning = false;
  let runwayVisible = false;
  let pageVisible = !document.hidden;

  function ease(t) {
    return t * t * (3 - 2 * t);
  }

  function preload() {
    KEYFRAMES.forEach((kf, i) => {
      const img = new Image();
      img.onload = () => {
        images[i] = img;
        loaded += 1;
        if (loaded === 1) draw(0);
        if (loaded === KEYFRAMES.length && !ready) init();
      };
      img.onerror = () => console.warn("[snapshot-scrub] missing:", kf.src);
      img.src = kf.src;
    });
  }

  function sizeCanvas() {
    const dpr = TOUCH ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return false;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return true;
  }

  function drawCover(img) {
    if (!img?.width) return;
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const scale = Math.max(cw / iw, ch / ih) * (TOUCH ? 1.04 : 1);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  function styleAt(p) {
    const scaled = p * (KEYFRAMES.length - 1);
    const idx = Math.min(KEYFRAMES.length - 1, Math.round(scaled));
    return KEYFRAMES[idx].label;
  }

  function draw(p) {
    if (!ready) return;
    const scaled = p * (KEYFRAMES.length - 1);
    const i = Math.min(KEYFRAMES.length - 2, Math.floor(scaled));
    const t = scaled - i;
    const imgA = images[i];
    const imgB = images[Math.min(i + 1, KEYFRAMES.length - 1)];

    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    ctx.clearRect(0, 0, cw, ch);

    drawCover(imgA);
    if (t > 0.001 && imgB) {
      ctx.globalAlpha = ease(t);
      drawCover(imgB);
      ctx.globalAlpha = 1;
    }

    if (styleLabel) styleLabel.textContent = styleAt(p);
    if (barFill) barFill.style.width = `${p * 100}%`;
    if (overlay) overlay.style.opacity = String(Math.min(1, Math.max(0, (p - 0.55) / 0.35)));
    if (hint) hint.style.opacity = String(userActive ? 0 : 0.85);
  }

  function scrollProgress() {
    const vh = window.innerHeight;
    const rect = runway.getBoundingClientRect();
    const scrubRange = Math.max(1, runway.offsetHeight - vh);
    const preRoll = vh * 0.15;

    if (rect.top > preRoll) return 0;
    if (rect.bottom <= vh) return 1;

    const scrollInto = preRoll - rect.top;
    return Math.min(1, Math.max(0, scrollInto / (scrubRange + preRoll)));
  }

  function setProgress(p, fromUser = false) {
    targetProgress = Math.min(1, Math.max(0, p));
    if (fromUser) {
      userActive = true;
      lastUserAt = performance.now();
    }
  }

  function pointerProgress(clientX) {
    const rect = canvas.getBoundingClientRect();
    return (clientX - rect.left) / rect.width;
  }

  function onPointerDown(e) {
    if (!ready || prefersReducedMotion) return;
    dragging = true;
    canvas.setPointerCapture(e.pointerId);
    setProgress(pointerProgress(e.clientX), true);
    draw(targetProgress);
    progress = targetProgress;
  }

  function onPointerMove(e) {
    if (!dragging) return;
    setProgress(pointerProgress(e.clientX), true);
    progress = targetProgress;
    draw(progress);
  }

  function onPointerUp(e) {
    if (!dragging) return;
    dragging = false;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);

  if (bar) {
    bar.addEventListener("pointerdown", (e) => {
      const rect = bar.getBoundingClientRect();
      setProgress((e.clientX - rect.left) / rect.width, true);
      progress = targetProgress;
      draw(progress);
    });
  }

  function loop() {
    if (!loopRunning) return;
    requestAnimationFrame(loop);
    if (!ready || !pageVisible || !runwayVisible || prefersReducedMotion) return;

    if (!dragging && !userActive && TOUCH) {
      autoPhase += 0.004;
      targetProgress = (Math.sin(autoPhase) + 1) / 2;
    } else if (!dragging && performance.now() - lastUserAt > 4000) {
      userActive = false;
    }

    if (!dragging) {
      const scrollP = scrollProgress();
      if (!TOUCH && !userActive) {
        targetProgress = scrollP;
      } else if (!userActive && TOUCH && scrollP > 0.05) {
        targetProgress = scrollP;
      }
      progress += (targetProgress - progress) * 0.22;
      draw(progress);
    }
  }

  function startLoop() {
    if (loopRunning) return;
    loopRunning = true;
    requestAnimationFrame(loop);
  }

  function stopLoop() {
    loopRunning = false;
  }

  function init() {
    if (ready) return;
    if (!sizeCanvas()) {
      requestAnimationFrame(init);
      return;
    }

    if (prefersReducedMotion) {
      progress = 1;
      targetProgress = 1;
      draw(1);
      if (overlay) overlay.style.opacity = "1";
      if (hint) hint.hidden = true;
    } else {
      draw(0);
      startLoop();
    }

    ready = true;
  }

  window.addEventListener("resize", () => {
    if (!sizeCanvas()) return;
    draw(progress);
  });

  document.addEventListener("visibilitychange", () => {
    pageVisible = !document.hidden;
    if (pageVisible && ready && runwayVisible) startLoop();
    else if (document.hidden) stopLoop();
  });

  const preloadObs = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        preloadObs.disconnect();
        preload();
      }
    },
    { rootMargin: "80px 0px" },
  );
  preloadObs.observe(runway);

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      ([e]) => {
        runwayVisible = e.isIntersecting;
        if (runwayVisible && ready) startLoop();
        else if (!runwayVisible) stopLoop();
      },
      { rootMargin: "40px 0px" },
    ).observe(runway);
  } else {
    runwayVisible = true;
    preload();
  }
})();

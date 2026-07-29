/* ============================================================
   HERO SCRUB — image-sequence scrubber + parallax + particle dissolve
   ============================================================ */

(() => {
  const FRAME_COUNT = 61;
  const PRELOAD_STRIDE = 4;
  const PRELOAD_CONCURRENCY = 4;
  const FRAME_PATH = (i) => `frames/f_${String(i).padStart(3, '0')}.webp`;

  function sparseFrameIndexes() {
    const out = [];
    for (let i = 0; i < FRAME_COUNT; i += PRELOAD_STRIDE) out.push(i);
    if (out[out.length - 1] !== FRAME_COUNT - 1) out.push(FRAME_COUNT - 1);
    return out;
  }

  function nearestLoadedIndex(idx) {
    if (frames[idx]) return idx;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < FRAME_COUNT; i++) {
      if (!frames[i]) continue;
      const d = Math.abs(i - idx);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    return best;
  }

  const hero = document.querySelector('.hero-scrub');
  if (!hero) { console.warn('[hero-scrub] no .hero-scrub element found'); return; }
  hero.classList.add('is-loading');
  const loadStartedAt = performance.now();
  const MIN_LOADER_MS = 1000;

  const LOW_POWER = window.matchMedia(
    '(max-width: 900px), (hover: none) and (pointer: coarse)'
  ).matches;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let heroVisible = true;
  let pageVisible = !document.hidden;

  const canvas = document.getElementById('heroScrubCanvas');
  const dissolveCanvas = document.getElementById('heroDissolveCanvas');
  const bgImg = document.getElementById('heroBgImg');
  const bgPhoto = bgImg?.querySelector('img');
  const backdrop = document.getElementById('heroBackdrop');
  const planGroup = document.querySelector('.story-group--plan');
  const titleCard = document.querySelector('.hero-title-card');
  const hint = document.getElementById('heroScrubHint');
  const bar = document.getElementById('heroScrubBar');
  const ctx = canvas.getContext('2d');
  const dctx = dissolveCanvas ? dissolveCanvas.getContext('2d') : null;

  // Is next section paper? If so, skip dissolve. Checks bg.js STACKS if available,
  // otherwise detects from .paper-* classes on the next section element.
  function nextSectionIsPaper() {
    // Find the first <section id> AFTER hero in DOCUMENT order — hero's real
    // sibling is a wrapper <div class="story-group ..."> with #vision nested
    // inside it, so walking nextElementSibling alone skips straight past it.
    let el = null;
    for (const s of document.querySelectorAll('section[id]')) {
      if (s === hero) continue;
      if (hero.compareDocumentPosition(s) & Node.DOCUMENT_POSITION_FOLLOWING) {
        el = s;
        break;
      }
    }
    if (!el) return false;
    // Check if we can find STACKS metadata
    if (window.__BG_STACKS__) {
      const id = el.id;
      const s = window.__BG_STACKS__.find(x => x.id === id);
      if (s) return s.type === 'paper';
    }
    // Heuristic fallback
    return el.classList.contains('paper') || el.dataset.bgType === 'paper';
  }

  // ----- Preload frames -----
  const frames = new Array(FRAME_COUNT);
  let loadedCount = 0;
  let motionLoopStarted = false;
  let readyShown = false;
  let remainingPreloadStarted = false;

  function startMotionLoop() {
    if (motionLoopStarted) return;
    motionLoopStarted = true;
    sizeCanvas();
    updateScrubTargets();
    applyMotion();
    if (!LOW_POWER && !prefersReducedMotion) loop();
  }

  function showReadyState() {
    if (readyShown) return;
    readyShown = true;
    init();
    const elapsed = performance.now() - loadStartedAt;
    const waitMs = Math.max(0, MIN_LOADER_MS - elapsed);
    setTimeout(() => {
      hero.classList.remove('is-loading');
      hero.classList.add('is-ready');
    }, waitMs);
  }

  function handleFrameLoad(index, img) {
    if (frames[index]) return;
    frames[index] = img;
    loadedCount++;
    if (loadedCount === 1) {
      drawFrame(index);
      startMotionLoop();
      showReadyState();
    }
    if (loadedCount === FRAME_COUNT) {
      console.log('[hero-scrub] all frames loaded');
    }
  }

  function loadFrame(index, highPriority = false) {
    return new Promise((resolve) => {
      if (frames[index]) {
        resolve(frames[index]);
        return;
      }
      const img = new Image();
      img.decoding = 'async';
      if (highPriority && 'fetchPriority' in img) img.fetchPriority = 'high';
      img.onload = () => {
        handleFrameLoad(index, img);
        resolve(img);
      };
      img.onerror = () => resolve(null);
      img.src = FRAME_PATH(index + 1);
    });
  }

  function preloadRemainingFrames() {
    if (remainingPreloadStarted) return;
    remainingPreloadStarted = true;
    const queue = [];
    for (let i = 0; i < FRAME_COUNT; i++) {
      if (!frames[i]) queue.push(i);
    }
    let active = 0;

    function pump() {
      while (active < PRELOAD_CONCURRENCY && queue.length) {
        const index = queue.shift();
        active++;
        loadFrame(index).finally(() => {
          active--;
          pump();
        });
      }
    }

    pump();
  }

  async function preload() {
    const sparse = sparseFrameIndexes();
    await loadFrame(sparse[0], true);
    await Promise.allSettled(sparse.slice(1).map((i) => loadFrame(i, true)));
    // Defer the ~800KB background fill of remaining frames until the browser
    // is idle, so it doesn't compete with other page-load-critical requests.
    if ('requestIdleCallback' in window) {
      requestIdleCallback(preloadRemainingFrames, { timeout: 2000 });
    } else {
      setTimeout(preloadRemainingFrames, 1500);
    }
  }

  // ----- Canvas sizing (HiDPI-aware) -----
  function sizeCanvas() {
    const dpr = LOW_POWER ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    [canvas, dissolveCanvas].forEach(c => {
      if (!c) return;
      const w = c.clientWidth;
      const h = c.clientHeight;
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    });
  }

  // Mobile viewports are much taller/narrower than the ~1.77:1 source frames,
  // so a full cover-fit (scale ~1.8x on a 375px phone) crops down to a tiny
  // sliver of the frame's width. Zoom out further on narrow screens so more
  // of the scene is visible, even though it reveals more of the backdrop
  // layer above/below (already designed to always show through).
  function fgScaleMultiplier() {
    const w = window.innerWidth;
    if (w <= 400) return 0.76;
    if (w <= 720) return 0.86;
    return 1;
  }

  function frameScale(cw, ch, iw, ih) {
    return Math.max(cw / iw, ch / ih) * fgScaleMultiplier();
  }

  function fgParallaxStrength() {
    return window.innerWidth <= 720 ? 0.45 : 1;
  }

  // ----- Frame draw — cover-fit, softened on narrow viewports -----
  let lastFrameRect = null;
  function drawFrame(idx) {
    const img = frames[idx];
    if (!img || !img.width) return;
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    ctx.clearRect(0, 0, cw, ch);
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const scale = frameScale(cw, ch, iw, ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
    lastFrameRect = { dx, dy, dw, dh };
  }

  // ----- Particle system for the dissolve -----
  // Particles are sparkles emitted from "hotspots" (the figures' bodies).
  // We sample bright-ish alpha pixels from the current frame to seed emission points.
  const particles = [];
  let emitterPoints = [];
  const emitterCache = new Map();

  function sampleEmitterPoints(idx) {
    // Use the current frame to pick N bright-ish non-transparent points.
    // These become the spawn seeds.
    const img = frames[idx];
    if (!img || !lastFrameRect) return [];
    const { dx, dy, dw, dh } = lastFrameRect;
    if (emitterCache.has(idx)) return emitterCache.get(idx);
    const points = [];
    const tries = 220;
    // Sample in the image's native space then map to canvas space
    const tempC = document.createElement('canvas');
    const SAMPLE_W = 120;
    const SAMPLE_H = Math.round(SAMPLE_W * (img.naturalHeight / img.naturalWidth));
    tempC.width = SAMPLE_W; tempC.height = SAMPLE_H;
    const tctx = tempC.getContext('2d');
    tctx.drawImage(img, 0, 0, SAMPLE_W, SAMPLE_H);
    const data = tctx.getImageData(0, 0, SAMPLE_W, SAMPLE_H).data;
    for (let i = 0; i < tries; i++) {
      const sx = Math.floor(Math.random() * SAMPLE_W);
      const sy = Math.floor(Math.random() * SAMPLE_H);
      const p = (sy * SAMPLE_W + sx) * 4;
      const a = data[p + 3];
      if (a > 60) {
        // Map sample→canvas
        const cx = dx + (sx / SAMPLE_W) * dw;
        const cy = dy + (sy / SAMPLE_H) * dh;
        points.push({ x: cx, y: cy });
      }
    }
    emitterCache.set(idx, points);
    return points;
  }

  function spawnParticles(intensity) {
    if (!emitterPoints.length) return;
    // Intensity 0..1 — controls number spawned per frame
    const count = Math.floor(2 + intensity * 18);
    for (let i = 0; i < count; i++) {
      const p = emitterPoints[Math.floor(Math.random() * emitterPoints.length)];
      const speed = 0.3 + Math.random() * 1.8;
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9; // mostly upward
      const life = 800 + Math.random() * 1500;
      // Type: 0 = dot, 1 = cross-star
      const type = Math.random() < 0.2 ? 1 : 0;
      particles.push({
        x: p.x + (Math.random() - 0.5) * 8,
        y: p.y + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life, age: 0,
        size: type === 1 ? 4 + Math.random() * 6 : 0.8 + Math.random() * 2.2,
        type,
        hue: 30 + Math.random() * 30, // warm
      });
    }
  }

  function updateAndDrawDissolve(progress, skipDissolve) {
    if (!dctx || !dissolveCanvas) return;
    if (LOW_POWER || prefersReducedMotion) skipDissolve = true;
    const cw = dissolveCanvas.clientWidth;
    const ch = dissolveCanvas.clientHeight;

    // Progress of the dissolve effect itself — only active in last 25% of hero.
    // Dissolve maps to last 25% of scroll.
    const DISSOLVE_START = 0.55;
    const DISSOLVE_END = 1.0;
    const dp = Math.max(0, Math.min(1, (progress - DISSOLVE_START) / (DISSOLVE_END - DISSOLVE_START)));

    if (skipDissolve || dp <= 0) {
      // Fade out opacity
      dissolveCanvas.style.opacity = 0;
      dctx.clearRect(0, 0, cw, ch);
      // Also clear erosion on main canvas
      canvas.style.webkitMaskImage = '';
      canvas.style.maskImage = '';
      particles.length = 0;
      return;
    }

    dissolveCanvas.style.opacity = 1;

    // Spawn new particles each frame based on intensity
    spawnParticles(dp);

    // Dissolve / erode the figures: fade the scrub canvas opacity as dissolve progresses
    canvas.style.opacity = 1 - dp * 0.75;

    // Draw particles (additive)
    dctx.clearRect(0, 0, cw, ch);
    dctx.globalCompositeOperation = 'lighter';
    const now = performance.now();
    const prev = updateAndDrawDissolve._prev || now;
    const dt = Math.min(40, now - prev);
    updateAndDrawDissolve._prev = now;

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.age += dt;
      if (p.age >= p.life) { particles.splice(i, 1); continue; }
      // Physics
      p.vy -= 0.012; // slight upward drift
      p.x += p.vx;
      p.y += p.vy;
      // Drift horizontally with noise
      p.vx += (Math.random() - 0.5) * 0.02;

      const t = p.age / p.life;
      const alpha = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85;

      if (p.type === 1) {
        // Cross-star sparkle
        const s = p.size * (1 - t * 0.3);
        const grad = dctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, s * 2);
        grad.addColorStop(0, `rgba(255, 240, 200, ${alpha})`);
        grad.addColorStop(0.4, `rgba(255, 200, 140, ${alpha * 0.5})`);
        grad.addColorStop(1, 'rgba(255,180,100,0)');
        dctx.fillStyle = grad;
        dctx.beginPath();
        dctx.arc(p.x, p.y, s * 2, 0, Math.PI * 2);
        dctx.fill();
        // Cross spikes
        dctx.strokeStyle = `rgba(255, 250, 230, ${alpha})`;
        dctx.lineWidth = 1;
        dctx.beginPath();
        dctx.moveTo(p.x - s * 2.5, p.y); dctx.lineTo(p.x + s * 2.5, p.y);
        dctx.moveTo(p.x, p.y - s * 2.5); dctx.lineTo(p.x, p.y + s * 2.5);
        dctx.stroke();
      } else {
        // Dot
        dctx.fillStyle = `rgba(255, ${220 + Math.floor(Math.random() * 30)}, 180, ${alpha})`;
        dctx.beginPath();
        dctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        dctx.fill();
      }
    }
  }

  // ----- Scroll-driven scrub -----
  let targetIdx = 0;
  let currentIdx = 0;
  let scrubProgress = 0;
  let smoothProgress = 0;
  let heroScrollInto = 0;

  function updateBackdropFade() {
    if (!backdrop || !planGroup) return;
    const planTop = planGroup.getBoundingClientRect().top;
    const vh = window.innerHeight;
    const t = (planTop - vh * 0.1) / (vh * 0.55);
    backdrop.style.opacity = String(Math.max(0, Math.min(1, t)));
  }

  function updateScrubTargets() {
    const rect = hero.getBoundingClientRect();
    const vh = window.innerHeight;
    const scrollIntoHero = -rect.top;
    heroScrollInto = scrollIntoHero;
    const scrubRange = hero.offsetHeight - vh;
    const p = Math.max(0, Math.min(1, scrollIntoHero / scrubRange));
    scrubProgress = p;

    const rawTarget = Math.round(p * (FRAME_COUNT - 1));
    targetIdx = nearestLoadedIndex(rawTarget);

    if (titleCard) {
      const fade = p < 0.2 ? 1 : Math.max(0, 1 - (p - 0.2) / 0.35);
      titleCard.style.opacity = fade;
    }
    if (bar) bar.style.width = (p * 100) + '%';
    if (hint) hint.style.opacity = p < 0.9 ? 1 : Math.max(0, 1 - (p - 0.9) / 0.1);
    updateBackdropFade();
  }

  function applyMotion() {
    const pm = fgParallaxStrength();
    // Continuous Ken Burns-style zoom, ramping up through the dissolve tail
    // (smoothProgress 0.4→1) so the image keeps gliding with the scroll even
    // after individual frames stop changing — reverses smoothly on scroll-up
    // since smoothProgress itself tracks scroll direction.
    const zoomT = Math.max(0, Math.min(1, (smoothProgress - 0.4) / 0.6));
    const scrubScale = 1 + zoomT * 0.14;

    if (bgPhoto) {
      bgPhoto.style.transform =
        `translate3d(${Math.round(mx * 12 * pm)}px, ${Math.round(my * 8 * pm)}px, 0) scale(1.12)`;
    }
    if (canvas) {
      canvas.style.transform =
        `translate3d(${Math.round(mx * -22 * pm)}px, ${Math.round(my * -14 * pm)}px, 0) scale(${scrubScale.toFixed(4)})`;
    }
  }

  let mx = 0, my = 0;
  let tmx = 0, tmy = 0;
  if (!LOW_POWER) {
    window.addEventListener('mousemove', (e) => {
      tmx = (e.clientX / window.innerWidth - 0.5) * 2;
      tmy = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  let _cachedSkip = null;
  function shouldSkipDissolve() {
    if (_cachedSkip !== null) return _cachedSkip;
    // Wait until bg.js has defined STACKS (it exposes on window.__BG_STACKS__)
    if (window.__BG_STACKS__) {
      _cachedSkip = nextSectionIsPaper();
      return _cachedSkip;
    }
    return false; // default: do the dissolve
  }

  // Resample emitter points whenever the frame changes significantly
  let lastSampleFrame = -1;
  let lastDrawIdx = -1;
  function loop() {
    requestAnimationFrame(loop);
    if (!pageVisible || !heroVisible || LOW_POWER || prefersReducedMotion) return;

    mx += (tmx - mx) * 0.06;
    my += (tmy - my) * 0.06;
    updateScrubTargets();
    // Eased separately from currentIdx so the dissolve/particle layer (and
    // the tail-end zoom) glide to a stop instead of snapping the instant
    // scrolling stops.
    smoothProgress += (scrubProgress - smoothProgress) * 0.12;
    applyMotion();

    currentIdx += (targetIdx - currentIdx) * 0.2;
    const drawIdx = Math.round(currentIdx);
    if (frames[drawIdx] && drawIdx !== lastDrawIdx) {
      drawFrame(drawIdx);
      lastDrawIdx = drawIdx;
    }

    if (!LOW_POWER && scrubProgress > 0.5 && drawIdx !== lastSampleFrame && frames[drawIdx]) {
      emitterPoints = sampleEmitterPoints(drawIdx);
      lastSampleFrame = drawIdx;
    }

    updateAndDrawDissolve(smoothProgress, shouldSkipDissolve());
  }

  function onScrubScroll() {
    updateScrubTargets();
    if (prefersReducedMotion || LOW_POWER) {
      // This path never runs the rAF loop, so smoothProgress (which normally
      // eases toward scrubProgress there) would otherwise stay frozen at 0
      // forever — snap it directly here so the tail-end zoom still tracks
      // scroll on mobile, just without the easing glide.
      if (!prefersReducedMotion) smoothProgress = scrubProgress;
      applyMotion();
      const drawIdx = Math.round(
        Math.max(0, Math.min(FRAME_COUNT - 1, targetIdx))
      );
      if (frames[drawIdx]) drawFrame(drawIdx);
      return;
    }
  }

  function init() {
    if (!motionLoopStarted) startMotionLoop();
    else {
      sizeCanvas();
      drawFrame(Math.round(currentIdx));
    }
  }

  window.addEventListener('resize', () => {
    sizeCanvas();
    drawFrame(Math.round(currentIdx));
  });
  window.addEventListener('scroll', onScrubScroll, { passive: true });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      heroVisible = e.isIntersecting;
    }, { rootMargin: '80px 0px' }).observe(hero);
  }
  document.addEventListener('visibilitychange', () => {
    pageVisible = !document.hidden;
  });

  preload().then(() => {
    console.log('[hero-scrub] first frame ready; remaining frames loading');
  });
})();

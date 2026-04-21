/* ============================================================
   HERO SCRUB — image-sequence scrubber + parallax + particle dissolve
   ============================================================ */

(() => {
  const FRAME_COUNT = 61;
  const FRAME_PATH = (i) => `frames/f_${String(i).padStart(3, '0')}.png`;

  const hero = document.querySelector('.hero-scrub');
  if (!hero) { console.warn('[hero-scrub] no .hero-scrub element found'); return; }

  const canvas = document.getElementById('heroScrubCanvas');
  const dissolveCanvas = document.getElementById('heroDissolveCanvas');
  const bgImg = document.getElementById('heroBgImg');
  const titleCard = document.querySelector('.hero-title-card');
  const hint = document.getElementById('heroScrubHint');
  const bar = document.getElementById('heroScrubBar');
  const ctx = canvas.getContext('2d');
  const dctx = dissolveCanvas ? dissolveCanvas.getContext('2d') : null;

  // Is next section paper? If so, skip dissolve. Checks bg.js STACKS if available,
  // otherwise detects from .paper-* classes on the next section element.
  function nextSectionIsPaper() {
    // Find the first section AFTER hero in DOM order
    let el = hero.nextElementSibling;
    while (el && !el.matches('section, [id]')) el = el.nextElementSibling;
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
  function preload() {
    return new Promise((resolve) => {
      for (let i = 0; i < FRAME_COUNT; i++) {
        const img = new Image();
        img.onload = img.onerror = () => {
          loadedCount++;
          frames[i] = img;
          if (loadedCount === 1) drawFrame(0);
          if (loadedCount === FRAME_COUNT) resolve();
        };
        img.src = FRAME_PATH(i + 1);
      }
    });
  }

  // ----- Canvas sizing (HiDPI-aware) -----
  function sizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    [canvas, dissolveCanvas].forEach(c => {
      if (!c) return;
      const w = c.clientWidth;
      const h = c.clientHeight;
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    });
  }

  // ----- Frame draw — cover-fit like background-size:cover -----
  let lastFrameRect = null;
  function drawFrame(idx) {
    const img = frames[idx];
    if (!img || !img.width) return;
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    ctx.clearRect(0, 0, cw, ch);
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const scale = Math.max(cw / iw, ch / ih);
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

  function sampleEmitterPoints(idx) {
    // Use the current frame to pick N bright-ish non-transparent points.
    // These become the spawn seeds.
    const img = frames[idx];
    if (!img || !lastFrameRect) return [];
    const { dx, dy, dw, dh } = lastFrameRect;
    const points = [];
    const tries = 800;
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

  function updateScrub() {
    const rect = hero.getBoundingClientRect();
    const vh = window.innerHeight;
    const scrollIntoHero = -rect.top;
    const scrubRange = hero.offsetHeight - vh;
    const p = Math.max(0, Math.min(1, scrollIntoHero / scrubRange));
    scrubProgress = p;

    targetIdx = Math.round(p * (FRAME_COUNT - 1));

    if (titleCard) {
      const fade = p < 0.2 ? 1 : Math.max(0, 1 - (p - 0.2) / 0.35);
      titleCard.style.opacity = fade;
    }
    if (bar) bar.style.width = (p * 100) + '%';
    if (hint) hint.style.opacity = p < 0.9 ? 1 : Math.max(0, 1 - (p - 0.9) / 0.1);

    if (bgImg) {
      const bgY = scrollIntoHero * 0.25;
      bgImg.style.transform = `translate3d(${mx * 15}px, ${-bgY + my * 10}px, 0) scale(1.05)`;
    }
  }

  let mx = 0, my = 0;
  let tmx = 0, tmy = 0;
  window.addEventListener('mousemove', (e) => {
    tmx = (e.clientX / window.innerWidth - 0.5) * 2;
    tmy = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

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
  function loop() {
    mx += (tmx - mx) * 0.06;
    my += (tmy - my) * 0.06;

    currentIdx += (targetIdx - currentIdx) * 0.2;
    const drawIdx = Math.round(currentIdx);
    if (frames[drawIdx]) drawFrame(drawIdx);

    if (canvas) {
      canvas.style.transform =
        `translate3d(${mx * -22}px, ${my * -14}px, 0)`;
    }

    // Resample emitter points when we're near the dissolve zone and frame advanced
    if (scrubProgress > 0.5 && drawIdx !== lastSampleFrame && frames[drawIdx]) {
      emitterPoints = sampleEmitterPoints(drawIdx);
      lastSampleFrame = drawIdx;
    }

    updateScrub();
    updateAndDrawDissolve(scrubProgress, shouldSkipDissolve());

    requestAnimationFrame(loop);
  }

  function init() {
    sizeCanvas();
    drawFrame(0);
    updateScrub();
    loop();
  }

  window.addEventListener('resize', () => {
    sizeCanvas();
    drawFrame(Math.round(currentIdx));
  });
  window.addEventListener('scroll', updateScrub, { passive: true });

  preload().then(() => {
    init();
    console.log('[hero-scrub] ready — 61 frames loaded');
  });
  const checkFirst = setInterval(() => {
    if (frames[0]) {
      clearInterval(checkFirst);
      sizeCanvas();
      drawFrame(0);
      updateScrub();
    }
  }, 50);
})();

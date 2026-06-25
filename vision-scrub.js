/* ============================================================
   VISION SCRUB — hero-style image-sequence scroll scrub
   ============================================================ */

(() => {
  const FRAME_COUNT = window.PhotoLib?.visionFrameCount?.() || 61;
  const FRAME_PATH = (i) =>
    window.PhotoLib?.visionFramePath?.(i) ||
    `photos/vision/frames/v_${String(i).padStart(4, '0')}.webp`;

  const FRAME_ZONE = 0.88;   // scrub runs longer — buttons appear well before this
  const COPY_OUT = 0.48;
  const OUTRO_IN = 0.48;     // layer cards fade in ~mid-scroll
  const HEADLINE_IN = 0.54;  // title follows shortly after cards
  const EXIT_START = 0.86;

  const runway = document.querySelector('.vision-scrub');
  if (!runway) return;

  const pin = document.querySelector('.vision-scrub-pin');
  const canvas = document.getElementById('visionScrubCanvas');
  const headline = document.getElementById('visionScrubHeadline');
  const outro = document.getElementById('visionScrubOutro');
  const hint = document.getElementById('visionScrubHint');
  const bar = document.getElementById('visionScrubBar');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const frames = new Array(FRAME_COUNT);
  let loadedCount = 0;
  let started = false;
  let preloadStarted = false;

  let targetIdx = 0;
  let currentIdx = 0;

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function headlineOpacity(p) {
    if (p <= 0.1) return 1;
    if (p < COPY_OUT) return Math.max(0, 1 - (p - 0.1) / 0.22);
    if (p < HEADLINE_IN) return 0;
    if (p < 0.78) return Math.min(1, (p - HEADLINE_IN) / 0.12);
    return 1;
  }

  function outroOpacity(p) {
    if (p < OUTRO_IN) return 0;
    if (p < 0.72) return Math.min(1, (p - OUTRO_IN) / 0.12);
    return 1;
  }

  function beginPreload() {
    if (preloadStarted) return;
    preloadStarted = true;

    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.onload = img.onerror = () => {
        frames[i] = img;
        loadedCount++;
        if (!started) {
          started = true;
          runway.classList.add('is-ready');
          init();
        }
      };
      img.src = FRAME_PATH(i + 1);
    }
  }

  function sizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
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

  function updateScrub() {
    const rect = runway.getBoundingClientRect();
    const vh = window.innerHeight;
    const scrollInto = -rect.top;
    const scrubRange = runway.offsetHeight - vh;
    const p = Math.max(0, Math.min(1, scrollInto / scrubRange));

    const frameT = Math.min(1, p / FRAME_ZONE);
    const eased = easeOutCubic(frameT);
    const maxIdx = Math.max(0, loadedCount - 1);
    targetIdx = Math.round(eased * (FRAME_COUNT - 1));
    if (targetIdx > maxIdx) targetIdx = maxIdx;

    if (headline) {
      const o = headlineOpacity(p);
      headline.style.opacity = o;
      headline.style.transform = `translateY(${(1 - o) * 14}px)`;
    }

    if (outro) {
      const o = outroOpacity(p);
      outro.style.opacity = o;
      outro.style.transform = `translateY(${(1 - o) * 22}px)`;
      outro.classList.toggle('is-visible', p >= OUTRO_IN);
    }

    if (bar) bar.style.width = `${Math.min(1, p / FRAME_ZONE) * 100}%`;

    if (hint) {
      const hintO = p < 0.08 ? 0 : p < OUTRO_IN ? 0.9 : Math.max(0, 1 - (p - OUTRO_IN) / 0.1);
      hint.style.opacity = hintO;
    }

    const exitT = p > EXIT_START ? (p - EXIT_START) / (1 - EXIT_START) : 0;
    const exitEase = easeOutCubic(exitT);
    runway.classList.toggle('is-exiting', exitT > 0.02);

    if (pin) {
      pin.style.transform = `translateY(${-exitEase * 48}px)`;
      pin.style.opacity = `${1 - exitEase * 0.28}`;
    }
  }

  function loop() {
    updateScrub();
    const lerp = targetIdx >= FRAME_COUNT - 2 ? 0.14 : 0.2;
    currentIdx += (targetIdx - currentIdx) * lerp;
    drawFrame(Math.round(currentIdx));
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

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect();
        beginPreload();
      }
    },
    { rootMargin: '100% 0px' }
  );
  observer.observe(runway);
})();

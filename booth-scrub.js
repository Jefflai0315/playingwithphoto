/* ============================================================
   BOOTH SCRUB — scroll-driven assembly (image sequence)
   ============================================================ */

(() => {
  const FRAME_COUNT = 121;
  const FRAME_PATH = (i) =>
    `photos/booth/frames/b_${String(i + 1).padStart(4, '0')}.png`;

  const runway = document.querySelector('.booth-scrub');
  if (!runway) return;

  const canvas = document.getElementById('boothAssemblyCanvas');
  if (!canvas) return;

  const labels = runway.querySelector('.booth-labels');
  const ctx = canvas.getContext('2d');
  const ASSEMBLE_AT = 0.5;

  const frames = new Array(FRAME_COUNT);
  let loaded = 0;
  let targetIdx = 0;
  let currentIdx = 0;
  let ready = false;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function preload() {
    return Promise.all(
      Array.from({ length: FRAME_COUNT }, (_, i) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            frames[i] = img;
            loaded += 1;
            resolve();
          };
          img.onerror = () => {
            console.warn('[booth-scrub] missing frame:', FRAME_PATH(i));
            resolve();
          };
          img.src = FRAME_PATH(i);
        })
      )
    );
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
    if (!img?.width) return;
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    ctx.clearRect(0, 0, cw, ch);
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const isMobile = window.matchMedia('(max-width: 900px)').matches;
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
    const pinRange = Math.max(1, runway.offsetHeight - vh);
    const isMobile = window.matchMedia('(max-width: 900px)').matches;
    const startAt = isMobile ? vh * 0.88 : vh * 0.52;

    if (rect.top > startAt || rect.bottom < 0) {
      return rect.bottom < 0 ? 1 : 0;
    }

    const scrollInto = startAt - rect.top;
    const range = startAt + pinRange;
    return Math.min(1, Math.max(0, scrollInto / range));
  }

  function update() {
    if (!ready) return;

    const p = scrollProgress();
    const videoP = Math.min(1, p / ASSEMBLE_AT);
    targetIdx = Math.round(videoP * (FRAME_COUNT - 1));

    if (labels) {
      const labelP = p <= ASSEMBLE_AT ? 0 : Math.min(1, (p - ASSEMBLE_AT) / 0.2);
      labels.style.opacity = String(labelP);
    }
  }

  function loop() {
    update();
    if (ready && !prefersReducedMotion) {
      currentIdx += (targetIdx - currentIdx) * 0.35;
      drawFrame(Math.round(currentIdx));
    }
    requestAnimationFrame(loop);
  }

  function init() {
    sizeCanvas();
    if (prefersReducedMotion) {
      drawFrame(FRAME_COUNT - 1);
      if (labels) labels.style.opacity = '1';
    } else {
      drawFrame(0);
      loop();
    }
    ready = true;
  }

  window.addEventListener('resize', () => {
    sizeCanvas();
    drawFrame(Math.round(currentIdx));
  });

  preload().then(() => {
    if (loaded === 0) {
      console.warn('[booth-scrub] no frames loaded');
      return;
    }
    init();
    console.log(`[booth-scrub] ready — ${loaded}/${FRAME_COUNT} frames`);
  });
})();

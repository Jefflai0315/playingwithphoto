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
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const ASSEMBLE_AT = 0.5;
  const PAPER = '#ebdcb7';
  const DEFRINGE_MIN = 224;
  const DEFRINGE_PROTECT = 237;

  const frames = new Array(FRAME_COUNT);
  let loaded = 0;
  let targetIdx = 0;
  let currentIdx = 0;
  let ready = false;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function defringeImageData(imgData) {
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) continue;
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];
      const lo = Math.min(r, g, b);
      const spread = Math.max(r, g, b) - lo;
      if (lo >= DEFRINGE_PROTECT) continue;
      if (lo >= DEFRINGE_MIN && spread <= 14) d[i + 3] = 0;
    }
    return imgData;
  }

  function processFrame(img) {
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    const octx = off.getContext('2d', { willReadFrequently: true });
    octx.drawImage(img, 0, 0);
    octx.putImageData(defringeImageData(octx.getImageData(0, 0, w, h)), 0, 0);
    return off;
  }

  function preload() {
    return Promise.all(
      Array.from({ length: FRAME_COUNT }, (_, i) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            frames[i] = processFrame(img);
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
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, cw, ch);
    const iw = img.width;
    const ih = img.height;
    const scale = Math.min(cw / iw, ch / ih);
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

    if (rect.top > vh || rect.bottom < 0) return 0;

    const scrollInto = Math.max(0, -rect.top);
    return Math.min(1, scrollInto / pinRange);
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

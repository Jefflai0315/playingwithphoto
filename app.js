// ===== Playing With Photo — interactions =====

// --- Nav scroll state ---
const nav = document.getElementById('topnav');
const onScroll = () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// --- Reveal on scroll ---
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// --- Hero floating strip portraits (generated SVG) ---
const FAKE_FACES = [
  { bg: '#d9b681', hair: '#3a2614', skin: '#e8c8a0', smile: true, glasses: false },
  { bg: '#c89a6a', hair: '#5a3018', skin: '#d9b681', smile: true, glasses: true },
  { bg: '#b2824e', hair: '#2a1a0c', skin: '#c89a6a', smile: false, glasses: false },
  { bg: '#e8c8a0', hair: '#4a2814', skin: '#efdcbd', smile: true, glasses: false },
  { bg: '#a06838', hair: '#2a1a0c', skin: '#c29670', smile: true, glasses: true },
];

function fakePortraitSVG(i, sepia = true) {
  const f = FAKE_FACES[i % FAKE_FACES.length];
  const filter = sepia ? 'filter: sepia(.7) contrast(1.1) brightness(.95);' : '';
  return `
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%;${filter}">
      <rect width="100" height="100" fill="${f.bg}"/>
      <circle cx="50" cy="44" r="22" fill="${f.skin}"/>
      <path d="M28 38 Q30 18 50 17 Q70 18 72 38 Q72 28 65 23 Q58 19 50 20 Q42 19 35 23 Q28 28 28 38Z" fill="${f.hair}"/>
      <circle cx="42" cy="46" r="1.3" fill="#2a1a0c"/>
      <circle cx="58" cy="46" r="1.3" fill="#2a1a0c"/>
      ${f.glasses ? `
        <circle cx="42" cy="46" r="5" fill="none" stroke="#2a1a0c" stroke-width=".9"/>
        <circle cx="58" cy="46" r="5" fill="none" stroke="#2a1a0c" stroke-width=".9"/>
        <line x1="47" y1="46" x2="53" y2="46" stroke="#2a1a0c" stroke-width=".7"/>
      ` : ''}
      <path d="M50 50 Q48 56 50 60 Q52 60 53 58" stroke="#8a4620" stroke-width=".8" fill="none"/>
      ${f.smile
        ? `<path d="M43 64 Q50 70 57 64" stroke="#8a4620" stroke-width="1.5" fill="none" stroke-linecap="round"/>`
        : `<path d="M44 65 L56 65" stroke="#8a4620" stroke-width="1.5" stroke-linecap="round"/>`}
      <path d="M25 100 L25 80 Q50 72 75 80 L75 100 Z" fill="${f.hair === '#3a2614' ? '#8a4620' : '#6b3f25'}"/>
    </svg>
  `;
}

// Populate hero floating strips — real photos from photos.config.js if provided,
// otherwise fall back to the drawn SVG portraits above.
(() => {
  const heroPhotos = window.PhotoLib?.heroPhotos() || [];
  document.querySelectorAll('.floating-strip .frame').forEach((el, i) => {
    const idx = parseInt(el.dataset.portrait || i);
    if (heroPhotos.length) {
      const src = heroPhotos[idx % heroPhotos.length];
      el.innerHTML = '';
      el.style.backgroundImage = `url("${src}")`;
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
    } else {
      el.innerHTML = fakePortraitSVG(idx);
    }
  });
})();

// --- Style gallery filmstrip ---
// One entry per chip on the page. Each `key` maps to photos.config.js →
// styles.<key>. If a photo is configured, we use it (with the CSS filter
// on top); otherwise we fall back to the drawn SVG portrait.
// Keep this array in the SAME order as the chip buttons in #styles.
const STYLES = [
  { key: 'kodak',      name: '70s Kodak',    caption: "Summer of '78",  filter: 'sepia(.5) saturate(1.4) contrast(.95) hue-rotate(-8deg)' },
  { key: 'bw',         name: 'B&W',          caption: 'The classics',   filter: 'grayscale(1) contrast(1.2) brightness(.95)' },
  { key: 'polaroid',   name: 'Polaroid',     caption: 'Say cheese',     filter: 'sepia(.2) saturate(1.3) contrast(1.05) brightness(1.05)' },
  { key: 'kodachrome', name: 'Kodachrome',   caption: 'Golden hour',    filter: 'sepia(.15) saturate(1.15) contrast(1.04) hue-rotate(-6deg)' },
  { key: 'sepia',      name: 'Studio Sepia', caption: 'Portrait No. 4', filter: 'sepia(1) contrast(1.1) brightness(.95)' },
];

const filmstripEl = document.getElementById('styleFilmstrip');
if (filmstripEl) {
  const all = [...STYLES, ...STYLES];
  filmstripEl.innerHTML = all.map((s, i) => {
    const rot = (Math.sin(i * 1.3) * 3).toFixed(2);
    const photoCss = window.PhotoLib?.stylePhoto(s.key);
    const inner = photoCss
      ? `<div style="background-image:${photoCss};background-size:cover;background-position:center;width:100%;height:100%;"></div>`
      : fakePortraitSVG(i, false);
    return `
      <div class="polaroid" style="--r:${rot}deg;">
        <span class="tag">${s.name}</span>
        <div class="img" style="filter:${s.filter};">
          ${inner}
        </div>
        <div class="caption">${s.caption}</div>
      </div>
    `;
  }).join('');
}

// ===== Live Webcam Demo =====
const video = document.getElementById('video');
const filterCanvas = document.getElementById('filterCanvas');
const fctx = filterCanvas.getContext('2d');
const status = document.getElementById('demoStatus');
const startBtn = document.getElementById('startCam');
const shutterBtn = document.getElementById('shutterBtn');
const countdown = document.getElementById('countdown');
const flash = document.getElementById('flash');
const filterOptions = document.getElementById('filterOptions');
const resultStrip = document.getElementById('resultStrip');
const photosWrap = document.getElementById('photos');
const resultActions = document.getElementById('resultActions');
const placeholder = document.getElementById('demoPlaceholder');
const resultDate = document.getElementById('resultDate');

let currentFilter = window.TWEAKS?.filter || 'sepia';
let streamActive = false;
let rafId = null;

const FILTERS = {
  sepia: {
    css: 'sepia(.8) saturate(1.3) contrast(1.05) brightness(.95) hue-rotate(-5deg)',
    tint: { r: 210, g: 160, b: 100, alpha: 0.18 },
    vignette: 0.5,
    grain: 0.1,
  },
  bw: {
    css: 'grayscale(1) contrast(1.25) brightness(.95)',
    tint: { r: 250, g: 245, b: 230, alpha: 0.04 },
    vignette: 0.6,
    grain: 0.15,
  },
  polaroid: {
    css: 'sepia(.25) saturate(1.25) contrast(1.08) brightness(1.08)',
    tint: { r: 255, g: 220, b: 180, alpha: 0.1 },
    vignette: 0.4,
    grain: 0.05,
  },
  kodachrome: {
    css: 'sepia(.35) saturate(1.55) contrast(1.15) hue-rotate(-12deg) brightness(.95)',
    tint: { r: 230, g: 140, b: 70, alpha: 0.12 },
    vignette: 0.55,
    grain: 0.08,
  },
};

function setFilter(name) {
  currentFilter = name;
  [...filterOptions.children].forEach(b => b.classList.toggle('active', b.dataset.f === name));
}
filterOptions.addEventListener('click', e => {
  const btn = e.target.closest('button');
  if (!btn) return;
  setFilter(btn.dataset.f);
});
setFilter(currentFilter);

async function startCamera() {
  startBtn.disabled = true;
  startBtn.innerHTML = 'Starting...';
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: 720, height: 720 },
      audio: false
    });
    video.srcObject = stream;
    await video.play();
    streamActive = true;
    status.classList.add('hide');
    shutterBtn.disabled = false;
    sizeCanvas();
    renderLoop();
  } catch (err) {
    console.warn('Camera error:', err);
    startBtn.disabled = false;
    startBtn.innerHTML = 'Camera blocked — tap to retry';
    status.querySelector('p').textContent = 'We need camera permission for the demo. Check your browser settings and try again.';
  }
}
startBtn.addEventListener('click', startCamera);

function sizeCanvas() {
  const rect = filterCanvas.getBoundingClientRect();
  filterCanvas.width = rect.width * (window.devicePixelRatio || 1);
  filterCanvas.height = rect.height * (window.devicePixelRatio || 1);
}
window.addEventListener('resize', () => { if (streamActive) sizeCanvas(); });

function renderLoop() {
  if (!streamActive) return;
  drawFrame(filterCanvas, fctx, currentFilter);
  rafId = requestAnimationFrame(renderLoop);
}

function drawFrame(canvas, ctx, filterName) {
  if (!video.videoWidth) return;
  const f = FILTERS[filterName];
  const w = canvas.width, h = canvas.height;

  // Mirror and draw with CSS filter
  ctx.save();
  ctx.filter = f.css;
  ctx.translate(w, 0);
  ctx.scale(-1, 1);
  // cover
  const vw = video.videoWidth, vh = video.videoHeight;
  const cr = w / h, vr = vw / vh;
  let sx=0, sy=0, sw=vw, sh=vh;
  if (vr > cr) {
    sw = vh * cr; sx = (vw - sw) / 2;
  } else {
    sh = vw / cr; sy = (vh - sh) / 2;
  }
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, w, h);
  ctx.restore();

  // Tint
  ctx.fillStyle = `rgba(${f.tint.r},${f.tint.g},${f.tint.b},${f.tint.alpha})`;
  ctx.fillRect(0, 0, w, h);

  // Vignette
  const grad = ctx.createRadialGradient(w/2, h/2, Math.min(w,h)*0.3, w/2, h/2, Math.max(w,h)*0.7);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, `rgba(30,15,5,${f.vignette})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Light leak (subtle, only on sepia-like)
  if (filterName === 'kodachrome' || filterName === 'sepia') {
    const leak = ctx.createLinearGradient(0, 0, w, h);
    leak.addColorStop(0, 'rgba(255,180,90,.08)');
    leak.addColorStop(.5, 'rgba(255,180,90,0)');
    leak.addColorStop(1, 'rgba(100,30,10,.1)');
    ctx.fillStyle = leak;
    ctx.fillRect(0, 0, w, h);
  }
}

// --- Shutter ---
let shooting = false;
async function shoot() {
  if (!streamActive || shooting) return;
  shooting = true;
  shutterBtn.disabled = true;
  placeholder.style.display = 'none';
  resultStrip.classList.remove('show');
  resultActions.style.display = 'none';

  const capturedImages = [];
  for (let i = 0; i < 4; i++) {
    // Countdown 3..2..1
    for (let n = 3; n > 0; n--) {
      countdown.textContent = n;
      countdown.classList.remove('show');
      void countdown.offsetWidth;
      countdown.classList.add('show');
      await wait(800);
    }
    // Snap
    flash.classList.remove('fire');
    void flash.offsetWidth;
    flash.classList.add('fire');
    const img = captureSnapshot();
    capturedImages.push(img);

    // Show snap in strip progressively
    photosWrap.children[i].innerHTML = `<img src="${img}"/>`;
    if (i === 0) {
      resultStrip.classList.add('show');
    }

    await wait(500);
  }

  // Finish
  const now = new Date();
  resultDate.textContent = now.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }).replace(/ /g, ' · ');
  resultActions.style.display = 'flex';
  shutterBtn.disabled = false;
  shooting = false;
}

function captureSnapshot() {
  const s = 720;
  const c = document.createElement('canvas');
  c.width = s; c.height = s;
  const cx = c.getContext('2d');
  // Render current frame at snapshot size
  const prevW = filterCanvas.width, prevH = filterCanvas.height;
  // Temporarily use this canvas for drawing at snapshot resolution
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = s; tempCanvas.height = s;
  const tctx = tempCanvas.getContext('2d');
  // Re-use drawFrame logic on a fresh canvas
  const save = [filterCanvas, fctx];
  // Monkey: draw directly
  const f = FILTERS[currentFilter];
  tctx.save();
  tctx.filter = f.css;
  tctx.translate(s, 0);
  tctx.scale(-1, 1);
  const vw = video.videoWidth, vh = video.videoHeight;
  let sx=0, sy=0, sw=vw, sh=vh;
  const vr = vw/vh;
  if (vr > 1) { sw = vh; sx = (vw - sw) / 2; }
  else { sh = vw; sy = (vh - sh) / 2; }
  tctx.drawImage(video, sx, sy, sw, sh, 0, 0, s, s);
  tctx.restore();
  tctx.fillStyle = `rgba(${f.tint.r},${f.tint.g},${f.tint.b},${f.tint.alpha})`;
  tctx.fillRect(0, 0, s, s);
  const grad = tctx.createRadialGradient(s/2, s/2, s*0.3, s/2, s/2, s*0.7);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, `rgba(30,15,5,${f.vignette})`);
  tctx.fillStyle = grad;
  tctx.fillRect(0, 0, s, s);
  return tempCanvas.toDataURL('image/jpeg', 0.85);
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

shutterBtn.addEventListener('click', shoot);

// --- Retake & Download ---
document.getElementById('retakeBtn').addEventListener('click', () => {
  resultStrip.classList.remove('show');
  resultActions.style.display = 'none';
  placeholder.style.display = 'block';
  [...photosWrap.children].forEach(p => p.innerHTML = '');
});

document.getElementById('downloadBtn').addEventListener('click', async () => {
  // Composite the strip as a single image
  const sw = 640, sh = 900;
  const c = document.createElement('canvas');
  c.width = sw; c.height = sh;
  const cx = c.getContext('2d');
  cx.fillStyle = '#1a1008';
  cx.fillRect(0, 0, sw, sh);
  // Holes top
  for (let i = 0; i < 12; i++) {
    cx.fillStyle = '#f4ead5';
    cx.fillRect(20 + i*52, 20, 28, 14);
  }
  // Photos 2x2
  const imgEls = [...photosWrap.querySelectorAll('img')];
  const pad = 40, gap = 12, cell = (sw - pad*2 - gap)/2;
  for (let i = 0; i < 4; i++) {
    const r = Math.floor(i/2), col = i%2;
    const x = pad + col*(cell+gap);
    const y = 60 + r*(cell+gap);
    const img = imgEls[i];
    if (img) {
      await new Promise(res => {
        if (img.complete) res();
        else img.onload = res;
      });
      cx.drawImage(img, x, y, cell, cell);
    }
  }
  // Holes bottom
  for (let i = 0; i < 12; i++) {
    cx.fillStyle = '#f4ead5';
    cx.fillRect(20 + i*52, 60 + 2*(cell+gap) + 10, 28, 14);
  }
  // Branding
  cx.fillStyle = '#ffd88a';
  cx.font = 'italic 600 42px "Caveat", cursive';
  cx.textAlign = 'left';
  cx.fillText('Playing With Photo', 40, sh - 34);
  cx.fillStyle = 'rgba(244,234,213,.6)';
  cx.font = '14px "JetBrains Mono", monospace';
  cx.textAlign = 'right';
  cx.fillText(resultDate.textContent, sw - 40, sh - 38);

  const link = document.createElement('a');
  link.download = `playing-with-photo-${Date.now()}.jpg`;
  link.href = c.toDataURL('image/jpeg', 0.92);
  link.click();
});

// ===== Tweaks =====
const tweaksPanel = document.getElementById('tweaksPanel');

function applyTweaks(tw) {
  document.body.dataset.palette = tw.palette || 'sepia';
  document.body.dataset.grain = tw.grain === false ? 'false' : 'true';
  if (tw.filter && filterOptions) setFilter(tw.filter);
  // Update buttons state in panel
  tweaksPanel.querySelectorAll('.opts').forEach(row => {
    const key = row.dataset.tweak;
    row.querySelectorAll('button').forEach(b => {
      const v = b.dataset.v;
      const current = String(tw[key]);
      b.classList.toggle('active', v === current);
    });
  });
}
applyTweaks(window.TWEAKS);

tweaksPanel.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-v]');
  if (!btn) return;
  const row = btn.closest('.opts');
  const key = row.dataset.tweak;
  let v = btn.dataset.v;
  if (v === 'true') v = true;
  else if (v === 'false') v = false;
  window.TWEAKS[key] = v;
  applyTweaks(window.TWEAKS);
  try {
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [key]: v } }, '*');
  } catch (_) {}
});

// Edit mode host protocol — listener FIRST, then announce
window.addEventListener('message', (e) => {
  if (!e.data || typeof e.data !== 'object') return;
  if (e.data.type === '__activate_edit_mode') tweaksPanel.classList.add('show');
  if (e.data.type === '__deactivate_edit_mode') tweaksPanel.classList.remove('show');
});
try {
  window.parent.postMessage({ type: '__edit_mode_available' }, '*');
} catch (_) {}

// --- Nav smooth scroll offset fix (since we have scroll-behavior already) — no-op


// --- Cork-board drag-to-scroll for testimonials ---
(function () {
  const board = document.getElementById('testiBoard');
  if (!board) return;
  let down = false, startX = 0, startScroll = 0;
  board.addEventListener('pointerdown', (e) => {
    down = true; startX = e.pageX; startScroll = board.scrollLeft;
    board.classList.add('grabbing');
    board.setPointerCapture(e.pointerId);
  });
  board.addEventListener('pointermove', (e) => {
    if (!down) return;
    board.scrollLeft = startScroll - (e.pageX - startX);
  });
  const end = (e) => { down = false; board.classList.remove('grabbing'); };
  board.addEventListener('pointerup', end);
  board.addEventListener('pointercancel', end);
  board.addEventListener('pointerleave', end);
  // Keep vertical wheel for page scroll.
  // Only consume true horizontal wheel gestures (trackpad / shift+wheel).
  board.addEventListener('wheel', (e) => {
    const horizontalIntent = Math.abs(e.deltaX) > Math.abs(e.deltaY);
    if (!horizontalIntent) return;

    const maxScroll = board.scrollWidth - board.clientWidth;
    const current = board.scrollLeft;
    const next = Math.max(0, Math.min(maxScroll, current + e.deltaX));
    const moved = Math.abs(next - current) > 0.5;
    if (!moved) return;

    board.scrollLeft = next;
    e.preventDefault();
  }, { passive: false });
})();

// --- Booking form submit ---
(function () {
  const form = document.getElementById('bookForm');
  if (!form) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  const statusEl = document.getElementById('bookFormStatus');
  const defaultBtnHtml = submitBtn ? submitBtn.innerHTML : '';

  function setStatus(message, isError = false) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.style.color = isError ? '#b63a2a' : 'var(--rust)';
  }

  function mailtoFallback(data) {
    const subject = encodeURIComponent(`Booking enquiry — ${data.eventType || 'Event'}`);
    const body = encodeURIComponent(
      [
        'Hello Jeff,',
        '',
        'I would like to enquire about Playing With Photo.',
        '',
        `Name: ${data.name || '-'}`,
        `Email: ${data.email || '-'}`,
        `WhatsApp: ${data.whatsapp || '-'}`,
        `Event type: ${data.eventType || '-'}`,
        `Event date: ${data.eventDate || '-'}`,
        `Venue / city: ${data.venue || '-'}`,
        '',
        'Thank you!'
      ].join('\n')
    );
    window.location.href = `mailto:hello@playingwithphoto.com?subject=${subject}&body=${body}`;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('');

    const data = {
      name: form.elements.name?.value?.trim() || '',
      email: form.elements.email?.value?.trim() || '',
      whatsapp: form.elements.whatsapp?.value?.trim() || '',
      eventType: form.elements.eventType?.value?.trim() || '',
      eventDate: form.elements.eventDate?.value || '',
      venue: form.elements.venue?.value?.trim() || ''
    };

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
    }

    try {
      const endpoint = (form.dataset.endpoint || '').trim();
      const provider = (form.dataset.provider || '').trim().toLowerCase();

      // If no endpoint is configured yet, open email client as a safe fallback.
      if (!endpoint) {
        mailtoFallback(data);
        setStatus('Opened your email app to send this enquiry.');
      } else {
        let res;
        if (provider === 'formspree' || endpoint.includes('formspree.io')) {
          const payload = new FormData();
          payload.append('name', data.name);
          payload.append('email', data.email);
          payload.append('whatsapp', data.whatsapp);
          payload.append('eventType', data.eventType);
          payload.append('eventDate', data.eventDate);
          payload.append('venue', data.venue);
          payload.append('_subject', `Booking enquiry — ${data.eventType || 'Event'}`);

          res = await fetch(endpoint, {
            method: 'POST',
            headers: { Accept: 'application/json' },
            body: payload
          });
        } else {
          res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
        }

        if (!res.ok) throw new Error(`Request failed with ${res.status}`);
        setStatus("Thanks — enquiry sent. I'll reply soon.");
        form.reset();
      }
    } catch (err) {
      console.warn('Booking form error:', err);
      setStatus('Could not send automatically. Opening email fallback...', true);
      mailtoFallback(data);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = defaultBtnHtml;
      }
    }
  });
})();

// ===== Enhancements: Hero lens, Reel scroll, Metamorphosis, Claude AI =====

const SAMPLE_BG = [
  buildFaceBG('#d9b681', '#3a2614', true),
  buildFaceBG('#c89a6a', '#5a3018', false),
  buildFaceBG('#e8c8a0', '#4a2814', true),
  buildFaceBG('#b2824e', '#2a1a0c', false),
];

function buildFaceBG(bg, hair, smile) {
  const skin = '#e8c8a0';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
      <rect width="100" height="100" fill="${bg}"/>
      <circle cx="50" cy="46" r="24" fill="${skin}"/>
      <path d="M26 38 Q28 16 50 15 Q72 16 74 38 Q74 28 66 22 Q58 17 50 18 Q42 17 34 22 Q26 28 26 38Z" fill="${hair}"/>
      <circle cx="42" cy="48" r="1.6" fill="#2a1a0c"/>
      <circle cx="58" cy="48" r="1.6" fill="#2a1a0c"/>
      ${smile
        ? '<path d="M42 62 Q50 70 58 62" stroke="#8a4620" stroke-width="1.8" fill="none" stroke-linecap="round"/>'
        : '<path d="M43 64 L57 64" stroke="#8a4620" stroke-width="1.8" stroke-linecap="round"/>'}
      <path d="M22 100 L22 80 Q50 72 78 80 L78 100 Z" fill="#6b3f25"/>
    </svg>
  `.replace(/\s+/g, ' ');
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

const rootDoc = document.documentElement;

// REEL: 4 frames in the cinema sticky panel. Use real photos from
// photos.config.js if exactly 4 are provided, else fall back to SVG faces.
const reelFromConfig = window.PhotoLib?.reelPhotos() || [];
const reelImages = reelFromConfig.length === 4 ? reelFromConfig : SAMPLE_BG;
reelImages.forEach((bg, i) => rootDoc.style.setProperty(`--reel-img-${i}`, bg));

// METAMORPHOSIS: same idea — 4 strip frames; use real photos if 4 are configured.
const metaFromConfig = window.PhotoLib?.metaPhotos() || [];
const metaImages = metaFromConfig.length === 4 ? metaFromConfig : SAMPLE_BG;
document.querySelectorAll('[data-meta-src]').forEach(el => {
  el.style.backgroundImage = metaImages[parseInt(el.dataset.metaSrc)];
});

// ===== HERO LENS (disabled — creation.js owns the webcam now) =====
const heroLens = document.getElementById('heroLens');
if (heroLens) {
  const heroVideo = document.getElementById('heroVideo');
  const heroFilter = document.getElementById('heroFilter');
  const heroLensOff = document.getElementById('heroLensOff');
  let heroActive = false;

  async function startHeroLens() {
    if (heroActive) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      heroVideo.srcObject = stream;
      await heroVideo.play();
      heroActive = true;
      heroLens.classList.add('live');
      const size = heroLens.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      heroFilter.width = size.width * dpr;
      heroFilter.height = size.height * dpr;
      const ctx = heroFilter.getContext('2d');
      const draw = () => {
        if (!heroActive) return;
        if (heroVideo.videoWidth) {
          const w = heroFilter.width, h = heroFilter.height;
          ctx.save();
          ctx.filter = 'sepia(.8) saturate(1.3) contrast(1.05) brightness(.95) hue-rotate(-5deg)';
          ctx.translate(w, 0); ctx.scale(-1, 1);
          const vw = heroVideo.videoWidth, vh = heroVideo.videoHeight;
          let sx = 0, sy = 0, sw = vw, sh = vh;
          const cr = w / h, vr = vw / vh;
          if (vr > cr) { sw = vh * cr; sx = (vw - sw) / 2; }
          else { sh = vw / cr; sy = (vh - sh) / 2; }
          ctx.drawImage(heroVideo, sx, sy, sw, sh, 0, 0, w, h);
          ctx.restore();
          const g = ctx.createRadialGradient(w/2, h/2, w*0.2, w/2, h/2, w*0.55);
          g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(20,10,0,.7)');
          ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        }
        requestAnimationFrame(draw);
      };
      draw();
    } catch (e) {
      heroLensOff.innerHTML = '<span style="font-size:10px;text-align:center;padding:10px;">Camera blocked<br/>(scroll for demo)</span>';
    }
  }
  heroLens.addEventListener('click', startHeroLens);
}

// ===== REEL =====
const reelChapter = document.getElementById('reel');
const reelFill = document.getElementById('reelFill');
const reelFrames = document.querySelectorAll('.reel-frame');
const reelCaptions = document.querySelectorAll('.reel-caption');
const reelTitle = document.getElementById('reelTitle');
const reelSub = document.getElementById('reelSub');

function onReelScroll() {
  if (!reelChapter) return;
  const rect = reelChapter.getBoundingClientRect();
  const total = reelChapter.offsetHeight - window.innerHeight;
  const scrolled = Math.max(0, Math.min(total, -rect.top));
  const p = total > 0 ? scrolled / total : 0;
  reelFill.style.width = `${(p * 100).toFixed(1)}%`;

  [0.15, 0.38, 0.6, 0.82].forEach((t, i) => reelFrames[i].classList.toggle('dev', p >= t));

  let stage = 0;
  if (p >= 0.78) stage = 3;
  else if (p >= 0.55) stage = 2;
  else if (p >= 0.3) stage = 1;
  reelCaptions.forEach((c, i) => c.classList.toggle('active', i === stage));

  if (p > 0.9) {
    reelTitle.innerHTML = 'A <em>keepsake</em> you\'ll hold for decades.';
    reelSub.textContent = 'Printed in 12 seconds — walking away before your drink gets warm.';
  } else if (p > 0.5) {
    reelTitle.innerHTML = 'Watch the strip <em>develop</em>.';
    reelSub.textContent = 'Each frame re-styled by AI in your chosen film era.';
  } else {
    reelTitle.innerHTML = 'Scroll to <em>develop</em> the strip';
    reelSub.textContent = 'Four poses. Four frames. Each one unfolds as you scroll down.';
  }
}
window.addEventListener('scroll', onReelScroll, { passive: true });
onReelScroll();

// ===== METAMORPHOSIS =====
const metaPicker = document.querySelector('.meta-picker');
const metaAfterLabel = document.getElementById('metaAfterLabel');
const metaAfterBrand = document.getElementById('metaAfterBrand');
const META_NAMES = {
  vintage: 'Vintage · 70s Kodak',
  vangogh: 'Van Gogh · Starry Night',
  monet: 'Monet · Water Lilies',
  picasso: 'Picasso · Cubist',
  warhol: 'Warhol · Pop Art',
  hokusai: 'Hokusai · Ukiyo-e',
};

let claudeBusy = false;
function getOrCreateClaudeBadge() {
  let el = document.getElementById('claudeBadge');
  if (!el) {
    el = document.createElement('div');
    el.id = 'claudeBadge';
    el.className = 'claude-badge';
    metaPicker.parentNode.insertBefore(el, metaPicker.nextSibling);
  }
  return el;
}
async function tryClaudeRestyle(style) {
  if (claudeBusy || !window.claude?.complete) return;
  claudeBusy = true;
  const badge = getOrCreateClaudeBadge();
  const display = META_NAMES[style]?.split(' · ')[0] || style;
  badge.innerHTML = `<span class="claude-dot"></span> Claude is repainting in the style of <b>${display}</b>...`;
  try {
    const text = await window.claude.complete({
      messages: [{
        role: 'user',
        content: `You are a photobooth AI art director. In ONE poetic sentence (max 20 words), describe how you would repaint a vintage 70s film photo of a smiling couple in the style of "${display}". Name 2-3 signature visual elements of that painter's work. No preamble, no quotes, just the sentence.`
      }]
    });
    badge.innerHTML = `<span class="claude-dot live"></span> <b>Claude · ${display}:</b> <i>${text.trim()}</i>`;
  } catch (e) {
    badge.innerHTML = `<span class="claude-dot"></span> AI caption unavailable · rendering locally.`;
  } finally {
    claudeBusy = false;
  }
}

function setMeta(name) {
  document.body.dataset.meta = name;
  metaPicker.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.meta === name));
  const display = META_NAMES[name].split(' · ')[0];
  metaAfterLabel.textContent = 'After — ' + display;
  metaAfterBrand.textContent = 'Playing With Photo · ' + display + ' Edition';
  document.querySelectorAll('.meta-shine').forEach(el => {
    el.classList.remove('shine');
    void el.offsetWidth;
    el.classList.add('shine');
  });
  tryClaudeRestyle(name);
}
metaPicker.addEventListener('click', e => {
  const btn = e.target.closest('button[data-meta]');
  if (btn) setMeta(btn.dataset.meta);
});
setMeta('vangogh');

// Inject Claude badge styles
const claudeStyle = document.createElement('style');
claudeStyle.textContent = `
.claude-badge {
  margin-top: 16px;
  padding: 12px 18px;
  border-radius: 999px;
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.15);
  font-family: var(--ff-mono);
  font-size: 12px;
  letter-spacing: .04em;
  color: rgba(255,255,255,.85);
  display: inline-flex; align-items: center; gap: 10px;
  max-width: 100%;
}
.claude-badge i { font-family: var(--ff-display); font-style: italic; font-size: 13px; color:#ffd88a; letter-spacing: 0; }
.claude-badge b { color:#ffd88a; letter-spacing: .1em; font-weight:500; }
.claude-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: rgba(255,255,255,.3);
  flex-shrink: 0;
}
.claude-dot.live { background: #ffd88a; box-shadow: 0 0 12px #ffd88a; animation: pulse 1.4s infinite; }
`;
document.head.appendChild(claudeStyle);

// ===== Reveal-on-scroll observer =====
(function revealOnScroll() {
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
  els.forEach(el => io.observe(el));
  // Safety fallback — if anything stays hidden after 3s (e.g. display:none ancestor), force show
  setTimeout(() => {
    document.querySelectorAll('.reveal:not(.in)').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight + 200) el.classList.add('in');
    });
  }, 3000);
})();

// ==========================================================
// THREE.JS SCROLL BACKGROUND — simple model
// - Each section has a bg type: 'image' (3-photo crossfade) or 'paper'
// - The canvas always renders TWO stacks: top half + bottom half,
//   split at the section-boundary y that's currently on screen
// - Where paper meets non-paper, a char/flame band is painted on
//   that boundary line. As you scroll, the boundary moves on screen
//   and the band moves with it. No transition progress, no direction.
// ==========================================================

(function () {
  const THREE = window.THREE;
  if (!THREE) { console.warn('[bg] Three.js not loaded'); return; }

  const STACKS = [
    { id: 'hero',         type: 'image', images: [
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1600&q=80',
      'https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=1600&q=80',
      'https://images.unsplash.com/photo-1549887552-cb1071d3e5ca?w=1600&q=80',
    ]},
    { id: 'spark',        type: 'image', images: [
      'https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=1600&q=80',
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1600&q=80',
      'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=1600&q=80',
    ]},
    { id: 'reel',         type: 'image', images: [
      'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=1600&q=80',
      'https://images.unsplash.com/photo-1569587112025-0d460e81a126?w=1600&q=80',
      'https://images.unsplash.com/photo-1502982720700-bfff97f2ecac?w=1600&q=80',
    ]},
    { id: 'demo',         type: 'paper' },
    { id: 'booth',        type: 'paper' },
    { id: 'how',          type: 'image', images: [
      'https://images.unsplash.com/photo-1528716321680-815a8cdb8cbe?w=1600&q=80',
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1600&q=80',
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1600&q=80',
    ]},
    { id: 'styles',       type: 'image', images: [
      'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=1600&q=80',
      'https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=1600&q=80',
      'https://images.unsplash.com/photo-1579541591970-e5cf87e1b675?w=1600&q=80',
    ]},
    { id: 'usecases',     type: 'image', images: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&q=80',
      'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=1600&q=80',
      'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=1600&q=80',
    ]},
    { id: 'testimonials', type: 'image', images: [
      'https://images.unsplash.com/photo-1502982720700-bfff97f2ecac?w=1600&q=80',
      'https://images.unsplash.com/photo-1569587112025-0d460e81a126?w=1600&q=80',
      'https://images.unsplash.com/photo-1549887552-cb1071d3e5ca?w=1600&q=80',
    ]},
    { id: 'pricing',      type: 'paper' },
    { id: 'about',        type: 'paper' },
    { id: 'book',         type: 'paper' },
  ];
  window.__BG_STACKS__ = STACKS;

  const host = document.getElementById('bg-canvas-host');
  if (!host) return;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  host.appendChild(renderer.domElement);

  // ---- Procedural aged-paper texture ----
  function makePaperTexture(seed = 0, w = 1024, h = 1024) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(w*0.5, h*0.45, w*0.15, w*0.5, h*0.5, w*0.7);
    grad.addColorStop(0, '#f8edd0');
    grad.addColorStop(0.6, '#ecd9b0');
    grad.addColorStop(1, '#d8bf90');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    const rng = (() => { let s = 1234 + seed*97; return () => (s = (s*9301+49297) % 233280) / 233280; })();
    ctx.strokeStyle = 'rgba(120, 80, 40, 0.05)'; ctx.lineWidth = 0.7;
    for (let i = 0; i < 4000; i++) {
      const x = rng()*w, y = rng()*h, len = 4+rng()*14, ang = rng()*Math.PI*2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x+Math.cos(ang)*len, y+Math.sin(ang)*len); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(80, 50, 20, 0.03)';
    for (let i = 0; i < 2000; i++) {
      const x = rng()*w, y = rng()*h, len = 8+rng()*24, ang = rng()*Math.PI*2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x+Math.cos(ang)*len, y+Math.sin(ang)*len); ctx.stroke();
    }
    for (let i = 0; i < 14; i++) {
      const x = rng()*w, y = rng()*h, r = 80+rng()*240;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(160, 100, 40, ${0.04+rng()*0.04})`);
      g.addColorStop(1, 'rgba(160, 100, 40, 0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
    }
    const vg = ctx.createRadialGradient(w*0.5, h*0.5, w*0.35, w*0.5, h*0.5, w*0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(50, 30, 15, 0.35)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = false;
    return tex;
  }

  const paperA = makePaperTexture(1);
  const paperB = makePaperTexture(2);
  const paperC = makePaperTexture(3);

  // ---- Shader ----
  // Renders TWO stacks simultaneously (upper + lower) and splits them at uBoundaryY.
  // At paper↔non-paper boundaries, paints a char/flame band straddling the split.
  const vertexShader = `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
  `;
  const fragmentShader = `
    // Upper section (above boundary)
    uniform sampler2D uTopA; uniform sampler2D uTopB; uniform sampler2D uTopC;
    uniform vec2 uTopResA; uniform vec2 uTopResB; uniform vec2 uTopResC;
    uniform float uTopProgress;
    uniform float uTopIsPaper;

    // Lower section (below boundary)
    uniform sampler2D uBotA; uniform sampler2D uBotB; uniform sampler2D uBotC;
    uniform vec2 uBotResA; uniform vec2 uBotResB; uniform vec2 uBotResC;
    uniform float uBotProgress;
    uniform float uBotIsPaper;

    uniform vec2 uViewport;
    uniform float uTime;
    uniform float uBoundaryY;  // 0..1 in uv space; -99 if no boundary on screen
    uniform float uBurn;       // 1 if this boundary is paper↔non-paper, 0 otherwise
    uniform float uScrollVel;  // signed scroll velocity, roughly -1..1 after smoothing
    uniform float uScrollPhase; // monotonically advances with |scroll delta|; idle → frozen
    uniform vec3 uTint;

    varying vec2 vUv;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p) {
      vec2 i = floor(p); vec2 f = fract(p);
      float a = hash(i), b = hash(i+vec2(1,0)), c = hash(i+vec2(0,1)), d = hash(i+vec2(1,1));
      vec2 u = f*f*(3.-2.*f);
      return mix(a,b,u.x) + (c-a)*u.y*(1.-u.x) + (d-b)*u.x*u.y;
    }
    float fbm(vec2 p) {
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 4; i++) { v += a*noise(p); p *= 2.0; a *= 0.5; }
      return v;
    }
    vec2 coverUV(vec2 uv, vec2 texRes, vec2 viewRes) {
      float ta = texRes.x/texRes.y, va = viewRes.x/viewRes.y;
      vec2 sc = vec2(1.0);
      if (ta > va) sc.x = va/ta; else sc.y = ta/va;
      return (uv-0.5)*sc+0.5;
    }
    // Sample a 3-texture stack at a given progress
    vec3 sampleStack(vec2 uv, sampler2D tA, sampler2D tB, sampler2D tC,
                     vec2 rA, vec2 rB, vec2 rC, float prog) {
      vec3 a = texture2D(tA, coverUV(uv, rA, uViewport)).rgb;
      vec3 b = texture2D(tB, coverUV(uv, rB, uViewport)).rgb;
      vec3 c = texture2D(tC, coverUV(uv, rC, uViewport)).rgb;
      if (prog < 0.5) {
        float t = prog*2.0;
        float m = noise(uv*8.0 + uTime*0.05);
        return mix(b, a, smoothstep(t-0.08, t+0.08, m));
      } else {
        float t = (prog-0.5)*2.0;
        float m = noise(uv*8.0 + 20.0 + uTime*0.05);
        return mix(c, b, smoothstep(t-0.08, t+0.08, m));
      }
    }
    // Tonal wash: paper gets neutral, image gets sepia pop
    vec3 tone(vec3 col, float isPaper, vec2 uv) {
      if (isPaper > 0.5) {
        float v = smoothstep(1.2, 0.4, length(uv - 0.5));
        return col * mix(0.75, 1.0, v);
      } else {
        float luma = dot(col, vec3(0.299, 0.587, 0.114));
        vec3 sepia = vec3(luma) * uTint;
        vec3 r = mix(col, sepia, 0.42);
        float v = smoothstep(1.1, 0.35, length(uv - 0.5));
        return r * mix(0.7, 1.0, v);
      }
    }

    void main() {
      vec2 uv = vUv;

      // Sample both halves
      vec3 topCol = sampleStack(uv, uTopA, uTopB, uTopC, uTopResA, uTopResB, uTopResC, uTopProgress);
      vec3 botCol = sampleStack(uv, uBotA, uBotB, uBotC, uBotResA, uBotResB, uBotResC, uBotProgress);
      topCol = tone(topCol, uTopIsPaper, uv);
      botCol = tone(botCol, uBotIsPaper, uv);

      vec3 col;
      if (uBoundaryY < -1.0) {
        // No boundary on screen — just one section
        col = topCol;
        float isPaper = uTopIsPaper;
        float g = (hash(uv*1000.0 + uTime)-0.5)*0.055;
        col += g;
        gl_FragColor = vec4(col, 1.0);
        return;
      }

      // Ragged boundary line — shape is scroll-driven. When idle, line is static.
      // We use cumulative scroll distance (uScrollPhase) as the animation seed
      // instead of uTime, so the line only deforms as you actually scroll.
      float vel = abs(uScrollVel);
      float velBoost = 1.0 + min(vel, 1.5) * 2.2;
      float velPhase = uScrollVel * 3.5;
      float phase = uScrollPhase;  // advances only with scroll

      // Low-freq broad undulation
      float ragLow = (fbm(vec2(uv.x*2.2 + velPhase*0.4, phase*0.9)) - 0.5) * 0.045 * velBoost;
      // Mid-freq ragged variation
      float ragMid = (fbm(vec2(uv.x*6.5 - velPhase*0.6, phase*1.4 + 3.1)) - 0.5) * 0.028 * velBoost;
      // High-freq noisy jitter
      float ragHi  = (fbm(vec2(uv.x*22.0 + velPhase, phase*2.2 + 7.7)) - 0.5) * 0.012 * velBoost;
      // Sharp asymmetric tongues
      float tongueN = fbm(vec2(uv.x*3.4 + phase*0.6, phase*0.4)) - 0.5;
      float tongues = tongueN * tongueN * tongueN * 8.0 * 0.035 * velBoost;
      // Per-x micro-jitter — only while actively scrolling
      float microJ = (hash(vec2(floor(uv.x*180.0), floor(phase*40.0))) - 0.5) * 0.008 * min(vel*2.5, 1.0);

      float lineY = uBoundaryY + ragLow + ragMid + ragHi + tongues + microJ;

      // Above the line: top section. Below: bottom section.
      // Use a narrow smoothstep so the split is crisp but not aliased.
      float aboveMask = smoothstep(lineY - 0.003, lineY + 0.003, uv.y);
      col = mix(botCol, topCol, aboveMask);

      // ---- Burn band — only if this boundary is paper↔non-paper ----
      if (uBurn > 0.5) {
        float dist = uv.y - lineY;          // signed distance from line (positive = above)
        float absDist = abs(dist);

        // CHAR: a dark band hugging the line, wider on the paper side.
        // We char both sides but more on whichever is paper.
        float charUp = smoothstep(0.05, 0.0, dist) * step(0.0, dist) * uTopIsPaper;
        float charDn = smoothstep(0.05, 0.0, -dist) * step(0.0, -dist) * uBotIsPaper;
        // Also a small char on the non-paper side (scorch from the flame)
        float scorchUp = smoothstep(0.02, 0.0, dist) * step(0.0, dist) * (1.0 - uTopIsPaper);
        float scorchDn = smoothstep(0.02, 0.0, -dist) * step(0.0, -dist) * (1.0 - uBotIsPaper);

        float charAmt = (charUp + charDn) * 0.9 + (scorchUp + scorchDn) * 0.5;
        vec3 charCol = vec3(0.05, 0.03, 0.02);
        col = mix(col, charCol, charAmt);

        // FLAME: hot orange band right at the line, ragged
        float flameBand = smoothstep(0.018, 0.0, absDist);
        vec3 glowHot = vec3(1.6, 0.55, 0.08);
        col += flameBand * glowHot * 0.9;

        // Inner white-hot core — very thin
        float core = smoothstep(0.004, 0.0, absDist);
        col += core * vec3(1.8, 1.2, 0.6) * 0.6;

        // Embers floating UP from the line (regardless of scroll direction —
        // embers always rise). Concentrated near the line, fading up.
        float emberY = uv.y - lineY;  // positive = above
        if (emberY > 0.0 && emberY < 0.2) {
          float fade = 1.0 - emberY / 0.2;
          float spark = step(0.996, hash(floor(uv * vec2(400.0, 300.0)) + floor(uTime * 5.0)));
          col += spark * fade * glowHot * 2.2;
          float spark2 = step(0.992, hash(uv * 600.0 + uTime * 2.0));
          col += spark2 * fade * vec3(1.4, 0.6, 0.15) * 0.8;
        }

        // Subtle orange glow spill onto both sides
        float spill = smoothstep(0.12, 0.0, absDist) * 0.12;
        col += spill * vec3(0.9, 0.35, 0.1);
      }

      // Grain
      float g = (hash(uv*1000.0 + uTime)-0.5)*0.055;
      col += g;

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  const placeholder = new THREE.DataTexture(new Uint8Array([230, 210, 170, 255]), 1, 1, THREE.RGBAFormat);
  placeholder.needsUpdate = true;

  const uniforms = {
    uTopA: { value: paperA }, uTopB: { value: paperB }, uTopC: { value: paperC },
    uTopResA: { value: new THREE.Vector2(1024, 1024) },
    uTopResB: { value: new THREE.Vector2(1024, 1024) },
    uTopResC: { value: new THREE.Vector2(1024, 1024) },
    uTopProgress: { value: 0 },
    uTopIsPaper: { value: 1 },

    uBotA: { value: paperA }, uBotB: { value: paperB }, uBotC: { value: paperC },
    uBotResA: { value: new THREE.Vector2(1024, 1024) },
    uBotResB: { value: new THREE.Vector2(1024, 1024) },
    uBotResC: { value: new THREE.Vector2(1024, 1024) },
    uBotProgress: { value: 0 },
    uBotIsPaper: { value: 1 },

    uViewport: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    uTime: { value: 0 },
    uBoundaryY: { value: -99 },
    uBurn: { value: 0 },
    uScrollVel: { value: 0 },
    uScrollPhase: { value: 0 },
    uTint: { value: new THREE.Vector3(1.05, 0.88, 0.62) },
  };

  const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(mesh);

  // ---- Texture loader ----
  const loader = new THREE.TextureLoader();
  loader.crossOrigin = 'anonymous';
  const cache = new Map();
  function loadTexture(url) {
    if (cache.has(url)) return cache.get(url);
    const p = new Promise((resolve) => {
      loader.load(url, (tex) => {
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        resolve(tex);
      }, undefined, () => resolve(placeholder));
    });
    cache.set(url, p);
    return p;
  }

  async function preload() {
    const all = new Set();
    STACKS.forEach(s => (s.images || []).forEach(u => all.add(u)));
    await Promise.all([...all].map(loadTexture));
  }

  // Get textures + sizes for a stack
  async function getStackTextures(stack) {
    if (stack.type === 'paper') {
      const r = new THREE.Vector2(1024, 1024);
      return { tA: paperA, tB: paperB, tC: paperC, rA: r, rB: r.clone(), rC: r.clone(), isPaper: 1 };
    }
    const [uA, uB, uC] = stack.images;
    const [tA, tB, tC] = await Promise.all([loadTexture(uA), loadTexture(uB), loadTexture(uC)]);
    return {
      tA, tB, tC,
      rA: new THREE.Vector2(tA.image?.width || 1600, tA.image?.height || 900),
      rB: new THREE.Vector2(tB.image?.width || 1600, tB.image?.height || 900),
      rC: new THREE.Vector2(tC.image?.width || 1600, tC.image?.height || 900),
      isPaper: 0,
    };
  }

  // Cache loaded stacks so we don't re-resolve promises every frame
  const stackCache = new Map();
  function ensureStack(idx) {
    if (idx < 0 || idx >= STACKS.length) return null;
    if (stackCache.has(idx)) return stackCache.get(idx);
    const p = getStackTextures(STACKS[idx]);
    stackCache.set(idx, p);
    return p;
  }

  // Apply stack textures to top or bottom uniforms
  let appliedTopIdx = -1, appliedBotIdx = -1;
  async function applyTop(idx) {
    if (idx === appliedTopIdx) return;
    appliedTopIdx = idx;
    const s = await ensureStack(idx);
    if (!s || appliedTopIdx !== idx) return;
    uniforms.uTopA.value = s.tA; uniforms.uTopB.value = s.tB; uniforms.uTopC.value = s.tC;
    uniforms.uTopResA.value.copy(s.rA); uniforms.uTopResB.value.copy(s.rB); uniforms.uTopResC.value.copy(s.rC);
    uniforms.uTopIsPaper.value = s.isPaper;
  }
  async function applyBot(idx) {
    if (idx === appliedBotIdx) return;
    appliedBotIdx = idx;
    const s = await ensureStack(idx);
    if (!s || appliedBotIdx !== idx) return;
    uniforms.uBotA.value = s.tA; uniforms.uBotB.value = s.tB; uniforms.uBotC.value = s.tC;
    uniforms.uBotResA.value.copy(s.rA); uniforms.uBotResB.value.copy(s.rB); uniforms.uBotResC.value.copy(s.rC);
    uniforms.uBotIsPaper.value = s.isPaper;
  }

  // ---- Scroll state ----
  // Goal: find the section boundary currently on screen.
  // - If a boundary is within viewport: topIdx = section above, botIdx = section below.
  //   uBoundaryY = screen-space y of the boundary (1=top, 0=bottom in uv coords).
  // - If no boundary on screen: just use the active section for top, uBoundaryY = -99.
  function getScrollState() {
    const sy = window.scrollY;
    const vh = window.innerHeight;

    // Find each section's top in viewport uv space (y=1 at top of viewport)
    const visibleBoundaries = []; // {idx, uvY, topSec, botSec}
    for (let i = 1; i < STACKS.length; i++) {
      const el = document.getElementById(STACKS[i].id);
      if (!el) continue;
      const boundaryPageY = el.offsetTop;
      const screenY = boundaryPageY - sy; // 0=top of viewport, vh=bottom
      if (screenY >= -40 && screenY <= vh + 40) {
        // uv y: 1 at top, 0 at bottom
        const uvY = 1 - screenY / vh;
        visibleBoundaries.push({ idx: i, uvY, topIdx: i - 1, botIdx: i });
      }
    }

    // Pick the boundary closest to the viewport center (most prominent)
    let boundary = null;
    if (visibleBoundaries.length > 0) {
      boundary = visibleBoundaries.reduce((best, b) =>
        Math.abs(b.uvY - 0.5) < Math.abs(best.uvY - 0.5) ? b : best
      );
    }

    // Find active section (what dominates the viewport) for in-stack progress
    const focus = sy + vh * 0.5;
    let activeIdx = 0, bestTop = -Infinity, activeEl = null;
    STACKS.forEach((s, i) => {
      const el = document.getElementById(s.id);
      if (!el) return;
      if (el.offsetTop <= focus && el.offsetTop > bestTop) {
        bestTop = el.offsetTop; activeIdx = i; activeEl = el;
      }
    });
    let activeProgress = 0;
    if (activeEl) {
      activeProgress = Math.max(0, Math.min(1, (focus - activeEl.offsetTop) / activeEl.offsetHeight));
    }

    return { boundary, activeIdx, activeProgress };
  }

  function progressForSection(idx) {
    const el = document.getElementById(STACKS[idx]?.id);
    if (!el) return 0;
    const sy = window.scrollY, vh = window.innerHeight;
    const focus = sy + vh * 0.5;
    return Math.max(0, Math.min(1, (focus - el.offsetTop) / el.offsetHeight));
  }

  function updateFromScroll() {
    const { boundary, activeIdx, activeProgress } = getScrollState();

    if (boundary) {
      // Two sections on screen: top + bottom
      applyTop(boundary.topIdx);
      applyBot(boundary.botIdx);
      uniforms.uBoundaryY.value = boundary.uvY;
      // Compute progress for each side
      uniforms.uTopProgress.value = progressForSection(boundary.topIdx);
      uniforms.uBotProgress.value = progressForSection(boundary.botIdx);
      // Burn if one side is paper, other isn't
      const tP = STACKS[boundary.topIdx].type === 'paper';
      const bP = STACKS[boundary.botIdx].type === 'paper';
      uniforms.uBurn.value = (tP !== bP) ? 1 : 0;
    } else {
      // Only one section visible — put it in top, hide boundary
      applyTop(activeIdx);
      uniforms.uBoundaryY.value = -99;
      uniforms.uBurn.value = 0;
      uniforms.uTopProgress.value = activeProgress;
    }
  }

  // ---- Render loop ----
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    uniforms.uTime.value = clock.getElapsedTime();
    // Decay velocity toward zero each frame + smooth toward raw
    const cur = uniforms.uScrollVel.value;
    uniforms.uScrollVel.value = cur + (rawVel - cur) * 0.25;
    rawVel *= 0.82; // bleed off raw so it settles when scroll stops
    renderer.render(scene, camera);
  }

  // Scroll velocity tracking — smoothed for the shader
  let lastScrollY = window.scrollY;
  let lastScrollT = performance.now();
  let rawVel = 0;
  window.addEventListener('scroll', () => {
    const now = performance.now();
    const dt = Math.max(1, now - lastScrollT);
    const dy = window.scrollY - lastScrollY;
    // px/ms, normalized so typical scrolls land in -1..1
    rawVel = (dy / dt) / 3.0;
    // Advance phase by absolute scroll distance (normalized). Only grows with scroll.
    uniforms.uScrollPhase.value += Math.abs(dy) / 400.0;
    lastScrollY = window.scrollY;
    lastScrollT = now;
    updateFromScroll();
  }, { passive: true });

  function onResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    uniforms.uViewport.value.set(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize);

  preload().then(() => {
    updateFromScroll();
    animate();
  });
})();

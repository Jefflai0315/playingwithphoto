/* ============================================================
   HERO SCRUB — image-sequence scrubber + parallax + radial image reveal
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

  // ----- Preload frames -----
  const frames = new Array(FRAME_COUNT);
  let loadedCount = 0;
  let motionLoopStarted = false;
  let motionLoopUsesSharedTicker = false;
  let readyShown = false;
  let remainingPreloadStarted = false;

  function startMotionLoop() {
    if (motionLoopStarted) return;
    motionLoopStarted = true;
    sizeCanvas();
    updateScrubTargets();
    applyMotion();
    if (!LOW_POWER && !prefersReducedMotion) {
      const addTick = window.__pwpScrollDriver?.addTick;
      if (addTick) {
        motionLoopUsesSharedTicker = true;
        addTick(loop);
      } else {
        loop();
      }
    }
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
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);

    if (dissolveCanvas) {
      const dw = dissolveCanvas.clientWidth;
      const dh = dissolveCanvas.clientHeight;
      dissolveCanvas.width = Math.round(dw * dpr);
      dissolveCanvas.height = Math.round(dh * dpr);
      if (burnGL) burnGL.resize(dissolveCanvas.width, dissolveCanvas.height);
    }
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

  // ----- Radial image reveal shader for the hero scrub's exit transition -----
  // Raw WebGL (no Three.js) keeps this effect available even when the CDN
  // enhancement is unavailable. The shader follows the reference's animated
  // noise + radial opacity field, with a restrained edge highlight.
  const BURN_VERTEX_SRC = `
    attribute vec2 aPosition;
    attribute vec2 aUv;
    varying vec2 vUv;
    void main() {
      vUv = aUv;
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;
  const BURN_FRAGMENT_SRC = `
    precision highp float;
    uniform sampler2D uFrame;
    uniform float uBurnProgress;
    uniform float uCharWidth;
    uniform float uEmberWidth;
    uniform vec3 uCharColor;
    uniform vec3 uEmberColor;
    uniform vec2 uCoverScale;
    uniform vec2 uCoverOffset;
    uniform vec2 uFrameTexel;
    uniform float uTime;
    uniform float uScrollSpeed;
    varying vec2 vUv;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p) {
      vec2 i = floor(p); vec2 f = fract(p);
      float a = hash(i), b = hash(i + vec2(1.0, 0.0)), c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }
    float fbm(vec2 p) {
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
      return v;
    }

    void main() {
      vec2 uv = vUv * uCoverScale - uCoverOffset;
      if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) discard;

      vec4 baseColor = texture2D(uFrame, uv);
      // The frame is the figure cut out on a mostly-transparent background —
      // keep the reveal edge constrained to the image, never the empty space.
      float mask = baseColor.a;
      // Four-neighbour alpha sampling detects the actual character silhouette
      // in the WebP, rather than guessing an edge from the full frame bounds.
      float alphaL = texture2D(uFrame, uv - vec2(uFrameTexel.x, 0.0)).a;
      float alphaR = texture2D(uFrame, uv + vec2(uFrameTexel.x, 0.0)).a;
      float alphaD = texture2D(uFrame, uv - vec2(0.0, uFrameTexel.y)).a;
      float alphaU = texture2D(uFrame, uv + vec2(0.0, uFrameTexel.y)).a;
      float silhouetteEdge = max(
        max(abs(mask - alphaL), abs(mask - alphaR)),
        max(abs(mask - alphaD), abs(mask - alphaU))
      );

      // Organic radial dissolve adapted from the reference reveal shader:
      // animated noise distorts a center-out threshold instead of using a
      // straight vertical wipe.
      vec2 centeredUv = vUv - vec2(0.5);
      float radius = length(centeredUv);
      vec2 direction = centeredUv / max(radius, 0.0001);
      float burstIn = smoothstep(0.0, 0.035, uBurnProgress);
      float burstOut = 1.0 - smoothstep(0.10, 0.24, uBurnProgress);
      float burst = burstIn * burstOut;
      float waveNoise = fbm(vUv * 8.0 + uTime * 0.12);
      float waveAmount = 0.014 + uScrollSpeed * 0.045 + burst * 0.035;
      float wave = sin(radius * 34.0 - uTime * 4.0 + waveNoise * 5.0) * waveAmount;
      vec2 waveUv = vUv + direction * wave;
      vec2 displacedUv = waveUv
        + (vec2(
            fbm(waveUv * 5.0 + vec2(uTime * 0.08, 0.0)),
            fbm(waveUv * 5.0 + vec2(0.0, -uTime * 0.06))
          ) - 0.5) * (0.06 + uScrollSpeed * 0.045 + burst * 0.035);
      float radialDist = length(displacedUv - vec2(0.5));
      float dissolveField = radialDist * 1.15 + fbm(displacedUv * 5.0 + uTime * 0.04) * 0.22;
      float threshold = uBurnProgress * 1.18;
      float edge = dissolveField - threshold;
      float visibility = smoothstep(threshold - 0.065, threshold + 0.065, dissolveField);
      float baseAlpha = baseColor.a * visibility;

      float ch = (1.0 - smoothstep(0.0, uCharWidth, edge)) * mask;
      float emCore = (1.0 - smoothstep(0.0, uEmberWidth, abs(edge))) * mask;
      float emHalo = (1.0 - smoothstep(0.0, uEmberWidth * 3.0, abs(edge))) * mask;
      float burstRadius = (1.0 - burst) * 0.62;
      float burstRing = (1.0 - smoothstep(0.0, 0.055, abs(radialDist - burstRadius))) * burst * mask;
      float burstFlash = (1.0 - smoothstep(0.0, 0.62, radialDist)) * burst * mask;
      float silhouette = smoothstep(0.05, 0.34, silhouetteEdge);
      float edgeBurstNoise = noise(uv * 115.0 + vec2(uTime * 1.6, -uTime * 1.1));
      float edgeBurst = silhouette * burst
        * smoothstep(0.58, 0.94, edgeBurstNoise)
        * (0.55 + uScrollSpeed * 0.9);
      // The whole silhouette flashes first; after the burst, hand the light
      // over to the narrower radial contact band moving from the center out.
      float effectGate = smoothstep(0.012, 0.045, uBurnProgress);
      float contact = 1.0 - smoothstep(0.0, 0.075, abs(edge));
      float edgeNoise = noise(uv * 46.0 + vec2(uTime * 0.35, -uTime * 0.22));
      float postBurst = smoothstep(0.08, 0.26, uBurnProgress);
      float wholeEdgeProfile = 0.30 + contact * 0.70;
      float radialEdgeProfile = contact * (0.80 + edgeNoise * 0.95);
      float edgeProfile = mix(wholeEdgeProfile, radialEdgeProfile, postBurst);
      float burningEdge = silhouette
        * edgeProfile
        * effectGate
        * (0.62 + edgeNoise * 0.58);
      float sparkNoise = noise(uv * 135.0 + vec2(uTime * 1.8, -uTime * 1.25));
      float sparks = burningEdge * smoothstep(0.78, 0.96, sparkNoise)
        * (0.35 + burst * 0.9 + postBurst * 0.8 + uScrollSpeed * 0.8);

      vec3 col = mix(baseColor.rgb, uCharColor, ch)
        + uEmberColor * emCore * (1.0 + burst * 1.6 + uScrollSpeed * 0.8) // sharp bright rim
        + uEmberColor * 0.12 * emHalo;    // soft bloom-like halo around it
      col += uEmberColor * burstRing * (0.8 + uScrollSpeed * 1.4);
      col += uEmberColor * burstFlash * (0.08 + uScrollSpeed * 0.18);
      col += uEmberColor * edgeBurst * (1.5 + uScrollSpeed * 1.2);
      col += uEmberColor * burningEdge * (0.72 + postBurst * 0.68);
      col += uEmberColor * sparks * 1.8;
      // Keep the reveal edge visible after the image has been cut away.
      float emberAlpha = max(emCore * (0.92 + burst * 0.45), emHalo * 0.24);
      emberAlpha = max(emberAlpha, burstRing * (0.28 + uScrollSpeed * 0.42));
      emberAlpha = max(emberAlpha, edgeBurst * (0.6 + uScrollSpeed * 0.35));
      emberAlpha = max(emberAlpha, burningEdge * (0.62 + postBurst * 0.35) + sparks * 0.9);
      gl_FragColor = vec4(col, max(baseAlpha, emberAlpha));
    }
  `;

  function initBurnGL() {
    if (!dissolveCanvas || LOW_POWER || prefersReducedMotion) return null;
    let gl;
    try {
      gl = dissolveCanvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    } catch (e) {
      console.warn('[hero-scrub] burn WebGL context creation threw:', e);
      gl = null;
    }
    if (!gl) {
      console.warn('[hero-scrub] burn effect disabled: no WebGL context available');
      return null;
    }

    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn('[hero-scrub] burn shader compile error:', gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
      }
      return s;
    }
    const vs = compile(gl.VERTEX_SHADER, BURN_VERTEX_SRC);
    const fs = compile(gl.FRAGMENT_SHADER, BURN_FRAGMENT_SRC);
    if (!vs || !fs) return null;
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('[hero-scrub] burn shader link error:', gl.getProgramInfoLog(program));
      return null;
    }

    // Full-screen quad; uv (0,0) = top-left to match canvas/dx-dy-dw-dh space.
    const quad = new Float32Array([
      -1,  1, 0, 0,
       1,  1, 1, 0,
      -1, -1, 0, 1,
       1, -1, 1, 1,
    ]);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

    const aPosition = gl.getAttribLocation(program, 'aPosition');
    const aUv = gl.getAttribLocation(program, 'aUv');

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const u = {};
    ['uBurnProgress', 'uCharWidth', 'uEmberWidth', 'uCharColor', 'uEmberColor', 'uCoverScale', 'uCoverOffset', 'uFrameTexel', 'uTime', 'uScrollSpeed', 'uFrame']
      .forEach((name) => { u[name] = gl.getUniformLocation(program, name); });

    let lastImage = null;

    function resize(w, h) {
      gl.viewport(0, 0, w, h);
    }

    function clear() {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    function render(image, dp, rect, cw, ch, speed = 0) {
      if (!image || !rect || !cw || !ch) return;
      gl.useProgram(program);

      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(aPosition);
      gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 16, 0);
      gl.enableVertexAttribArray(aUv);
      gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 16, 8);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      if (image !== lastImage) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        lastImage = image;
      }
      gl.uniform1i(u.uFrame, 0);
      gl.uniform1f(u.uBurnProgress, dp);
      gl.uniform1f(u.uCharWidth, 0.10);
      gl.uniform1f(u.uEmberWidth, 0.018);
      gl.uniform3f(u.uCharColor, 0.72, 0.58, 0.32);
      gl.uniform3f(u.uEmberColor, 2.4, 2.25, 1.55);
      gl.uniform2f(u.uCoverScale, cw / rect.dw, ch / rect.dh);
      gl.uniform2f(u.uCoverOffset, rect.dx / rect.dw, rect.dy / rect.dh);
      gl.uniform2f(u.uFrameTexel, 1 / image.width, 1 / image.height);
      gl.uniform1f(u.uTime, performance.now() * 0.001);
      gl.uniform1f(u.uScrollSpeed, speed);

      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    return { render, resize, clear };
  }

  const burnGL = initBurnGL();

  function updateAndDrawDissolve(progress, skipDissolve) {
    if (!dissolveCanvas) return;
    if (LOW_POWER || prefersReducedMotion) skipDissolve = true;

    // Start in the final scrub quarter, then continue through the post-hero
    // zoom so the image does not vanish before the transition has landed.
    const DISSOLVE_START = 0.85;
    const DISSOLVE_END = 1.0;
    const scrubReveal = Math.max(0, Math.min(1, (progress - DISSOLVE_START) / (DISSOLVE_END - DISSOLVE_START)));
    const zoomReveal = Math.max(0, Math.min(1, postHeroProgress));
    const rawDp = Math.min(1, scrubReveal * 0.20 + zoomReveal * 0.80);
    const dp = Math.pow(rawDp, 1.8); // hold the image longer, then clear cleanly

    if (skipDissolve || dp <= 0 || !burnGL) {
      dissolveCanvas.style.opacity = 0;
      if (burnGL) burnGL.clear();
      canvas.style.opacity = 1;
      return;
    }

    // The burn canvas becomes the sole visible representation of the frame
    // once the burn starts — its own discard reveals whatever's behind, which
    // wouldn't read correctly if the plain, un-charred frame still showed
    // through underneath.
    dissolveCanvas.style.opacity = 1;
    canvas.style.opacity = 0;

    const img = frames[lastDrawIdx] ?? frames[Math.round(currentIdx)];
    burnGL.render(img, dp, lastFrameRect, canvas.clientWidth, canvas.clientHeight, scrollSpeed);
  }

  // ----- Scroll-driven scrub -----
  let targetIdx = 0;
  let currentIdx = 0;
  let scrubProgress = 0;
  let smoothProgress = 0;
  let heroScrollInto = 0;
  let backdropFadeT = 1; // 1 = backdrop fully showing, 0 = fully faded into next section
  let driverProgress = null;
  let postHeroProgress = 0;
  let scrollSpeed = 0;
  let previousScrubProgress = 0;
  let previousZoomProgress = 0;

  function updateBackdropFade() {
    if (!backdrop || !planGroup) return;
    const planTop = planGroup.getBoundingClientRect().top;
    const vh = window.innerHeight;
    const t = Math.max(0, Math.min(1, (planTop - vh * 0.1) / (vh * 0.55)));
    backdropFadeT = t;
    backdrop.style.opacity = String(t);
  }

  function updateScrubTargets(progressOverride = null) {
    const rect = hero.getBoundingClientRect();
    const vh = window.innerHeight;
    const scrollIntoHero = -rect.top;
    heroScrollInto = scrollIntoHero;
    const scrubRange = hero.offsetHeight - vh;
    const p = progressOverride === null
      ? Math.max(0, Math.min(1, scrollIntoHero / scrubRange))
      : Math.max(0, Math.min(1, progressOverride));
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
    // Keeps growing through the hero->next-section transition itself, driven
    // by how far the backdrop has faded — independent of the hero's own
    // pinned scroll range, so the zoom doesn't freeze the instant it unpins.
    const transitionZoom = Math.max(1 - backdropFadeT, postHeroProgress);
    const scrubScale = 1 + zoomT * 0.14 + transitionZoom * 0.26;
    const bgScale = 1.12 + zoomT * 0.05 + transitionZoom * 0.24;

    if (bgPhoto) {
      bgPhoto.style.transform =
        `translate3d(${Math.round(mx * 12 * pm)}px, ${Math.round(my * 8 * pm)}px, 0) scale(${bgScale.toFixed(4)})`;
    }
    if (canvas) {
      const foregroundTransform =
        `translate3d(${Math.round(mx * -22 * pm)}px, ${Math.round(my * -14 * pm)}px, 0) scale(${scrubScale.toFixed(4)})`;
      canvas.style.transform = foregroundTransform;
      // The reveal canvas replaces the sequence canvas at the dissolve
      // handoff, so it must inherit the exact same transform to avoid a jump.
      if (dissolveCanvas) dissolveCanvas.style.transform = foregroundTransform;
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

  let lastDrawIdx = -1;
  let testBurnOverride = null; // set via window.__testHeroBurn for console testing
  function loop() {
    if (!motionLoopUsesSharedTicker) requestAnimationFrame(loop);
    const heroTransitionActive = transitionTrigger?.isActive;
    if (!pageVisible || (!heroVisible && !heroTransitionActive) || LOW_POWER || prefersReducedMotion) return;

    mx += (tmx - mx) * 0.06;
    my += (tmy - my) * 0.06;
    updateScrubTargets(driverProgress);
    const scrubDelta = Math.abs(scrubProgress - previousScrubProgress);
    const zoomDelta = Math.abs(postHeroProgress - previousZoomProgress);
    const speedTarget = Math.min(1, Math.max(scrubDelta, zoomDelta) * 55);
    scrollSpeed += (speedTarget - scrollSpeed) * 0.24;
    previousScrubProgress = scrubProgress;
    previousZoomProgress = postHeroProgress;
    // Ease quickly, then snap inside a tiny dead zone. Without the snap,
    // asymptotic interpolation can look frozen between frames after a wheel
    // gesture ends.
    smoothProgress += (scrubProgress - smoothProgress) * 0.22;
    if (Math.abs(scrubProgress - smoothProgress) < 0.001) {
      smoothProgress = scrubProgress;
    }
    applyMotion();

    currentIdx += (targetIdx - currentIdx) * 0.38;
    if (Math.abs(targetIdx - currentIdx) < 0.12) currentIdx = targetIdx;
    const drawIdx = Math.round(currentIdx);
    if (frames[drawIdx] && drawIdx !== lastDrawIdx) {
      drawFrame(drawIdx);
      lastDrawIdx = drawIdx;
    }

    updateAndDrawDissolve(testBurnOverride ?? smoothProgress, false);
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

  function renderImmediateProgress() {
    if (!(prefersReducedMotion || LOW_POWER)) return;
    if (!prefersReducedMotion) smoothProgress = scrubProgress;
    applyMotion();
    const drawIdx = Math.round(
      Math.max(0, Math.min(FRAME_COUNT - 1, targetIdx))
    );
    if (frames[drawIdx]) drawFrame(drawIdx);
  }

  const scrubTrigger = window.__pwpScrollDriver?.register({
    id: "hero-scrub",
    trigger: hero,
    start: "top top",
    end: "bottom bottom",
    // Let the user continue naturally into the post-hero zoom once the reveal
    // starts; snapping this trigger to an endpoint creates a visible jump.
    finishOnStop: false,
    onUpdate: (progress) => {
      driverProgress = progress;
      updateScrubTargets(progress);
      renderImmediateProgress();
    },
  });

  // The foreground scrub ends when the hero unpins, but the fixed backdrop
  // should keep moving through the handoff into the next chapter. This gives
  // the scene a soft landing instead of freezing at the scrub endpoint.
  const transitionTrigger = window.__pwpScrollDriver?.register({
    id: "hero-transition-zoom",
    trigger: planGroup,
    start: "top bottom",
    end: "top 10%",
    onUpdate: (progress) => {
      postHeroProgress = progress;
      updateBackdropFade();
      applyMotion();
    },
  });

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
  if (!scrubTrigger) {
    window.addEventListener('scroll', onScrubScroll, { passive: true });
  }
  if (!transitionTrigger) {
    window.addEventListener('scroll', () => {
      updateBackdropFade();
      applyMotion();
    }, { passive: true });
  }

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

  // Console test hooks — run window.__testHeroBurn(0.8) to pin the burn
  // effect at any point (0..1) without scrolling (holds until you call
  // __testHeroBurnRelease() to hand control back to real scroll position).
  window.__testHeroBurn = (p) => {
    testBurnOverride = p;
    updateAndDrawDissolve(p, false);
  };
  window.__testHeroBurnRelease = () => { testBurnOverride = null; };
  window.__heroDebugFull = {
    hasBurnGL: !!burnGL,
    heroVisible: () => heroVisible,
    pageVisible: () => pageVisible,
    LOW_POWER,
    prefersReducedMotion,
    frames: frames,
    canvas,
    dissolveCanvas,
  };
})();

/* ============================================================
   TEXT FOCUS — 7-tap hexagonal blur reveal for headline text
   Renders a heading's real glyphs onto a canvas texture, then runs
   a small WebGL pass over it so the blur radius can be driven by a
   reveal progress value (0 = fully blurred, 1 = in focus). Desktop
   only (mirrors bg.js/load-three.js gating); the real DOM heading
   stays visible as the fallback until a pass has rendered.
   ============================================================ */

(() => {
  const LOW_POWER = window.matchMedia(
    '(max-width: 900px), (hover: none) and (pointer: coarse)'
  ).matches;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (LOW_POWER || prefersReducedMotion) return;

  const style = document.createElement('style');
  style.textContent = `
    .text-focus-active, .text-focus-active * { color: transparent !important; text-shadow: none !important; }
    .text-focus-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; pointer-events: none; opacity: 0; transition: opacity .12s linear; }
  `;
  document.head.appendChild(style);

  const vertexShader = `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
  `;
  const fragmentShader = `
    precision highp float;
    uniform sampler2D uText;
    uniform float uProgress;
    uniform float uMaxBlur;
    uniform vec2 uAspect;
    varying vec2 vUv;

    void main() {
      float blurFactor = 1.0 - uProgress;
      float r = blurFactor * uMaxBlur * 0.003;

      vec2 d0 = vec2( 1.0,       0.0        ) * uAspect;
      vec2 d1 = vec2( 0.5,       0.8660254  ) * uAspect;
      vec2 d2 = vec2(-0.5,       0.8660254  ) * uAspect;
      vec2 d3 = vec2(-1.0,       0.0        ) * uAspect;
      vec2 d4 = vec2(-0.5,      -0.8660254  ) * uAspect;
      vec2 d5 = vec2( 0.5,      -0.8660254  ) * uAspect;

      vec4 sum = texture2D(uText, vUv) * 2.0;   // centre, weighted x2
      sum += texture2D(uText, vUv + d0 * r);    // six taps at 60°
      sum += texture2D(uText, vUv + d1 * r);
      sum += texture2D(uText, vUv + d2 * r);
      sum += texture2D(uText, vUv + d3 * r);
      sum += texture2D(uText, vUv + d4 * r);
      sum += texture2D(uText, vUv + d5 * r);

      gl_FragColor = sum / 8.0;
    }
  `;

  // Collect drawable runs (text nodes + inline element children like <em>),
  // capturing each run's real computed style (font/color/letterSpacing) at
  // collection time. This must run before the source element is ever hidden
  // via .text-focus-active — a later resize-triggered redraw must reuse this
  // cached style rather than re-reading getComputedStyle, since by then the
  // element's own color computes to transparent (from the hiding rule) and
  // would silently redraw the glyphs invisibly.
  function collectRuns(el) {
    const runs = [];
    el.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.replace(/\s+/g, ' ');
        if (text) runs.push({ node, text, styleEl: el });
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const text = node.textContent.replace(/\s+/g, ' ');
        if (text) runs.push({ node, text, styleEl: node });
      }
    });
    if (runs.length) {
      runs[0].text = runs[0].text.replace(/^\s+/, '');
      runs[runs.length - 1].text = runs[runs.length - 1].text.replace(/\s+$/, '');
    }
    return runs.filter((r) => r.text.length).map((r) => {
      const cs = getComputedStyle(r.styleEl);
      return {
        node: r.node,
        text: r.text,
        font: fontStringFor(cs),
        color: cs.color,
        letterSpacing: cs.letterSpacing,
      };
    });
  }

  function runLineRects(run, containerRect) {
    const range = document.createRange();
    range.selectNodeContents(run.node);
    return Array.from(range.getClientRects()).map((r) => ({
      x: r.left - containerRect.left,
      y: r.top - containerRect.top,
      width: r.width,
      height: r.height,
    }));
  }

  function fontStringFor(cs) {
    const italic = cs.fontStyle === 'italic' ? 'italic ' : '';
    const smallCaps =
      (cs.fontVariantCaps && cs.fontVariantCaps === 'small-caps') ||
      (cs.fontVariant && cs.fontVariant.includes('small-caps'))
        ? 'small-caps '
        : '';
    return `${italic}${smallCaps}${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  }

  function drawRuns(ctx, runs, containerRect, dpr, dropShadow, baselineFraction) {
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.textBaseline = 'alphabetic';
    ctx.filter = dropShadow || 'none';
    runs.forEach((run) => {
      ctx.font = run.font;
      ctx.fillStyle = run.color;
      if ('letterSpacing' in ctx && run.letterSpacing && run.letterSpacing !== 'normal') {
        ctx.letterSpacing = run.letterSpacing;
      }
      runLineRects(run, containerRect).forEach((r) => {
        ctx.fillText(run.text, r.x, r.y + r.height * baselineFraction);
      });
    });
    ctx.restore();
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function createFocusText(el, opts) {
    const THREE = window.THREE;
    if (!THREE || !el) return null;

    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';

    const canvas = document.createElement('canvas');
    canvas.className = 'text-focus-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    el.appendChild(canvas);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, premultipliedAlpha: false });
    } catch (e) {
      canvas.remove();
      return null;
    }
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      uText: { value: null },
      uProgress: { value: 0 },
      uMaxBlur: { value: opts.maxBlur ?? 10 },
      uAspect: { value: new THREE.Vector2(1, 1) },
    };
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    let w = 0;
    let h = 0;
    let textCanvas = null;
    // Captured once, before el ever gets hidden via .text-focus-active —
    // a later resize-triggered layout() must reuse this cached style rather
    // than re-reading getComputedStyle(el), since by then el's own color
    // computes to transparent and would silently redraw the glyphs invisibly.
    const runs = collectRuns(el);

    // Rebuilds the offscreen text canvas + its GPU texture from scratch on
    // every layout pass (init + each resize) rather than mutating the same
    // canvas/texture repeatedly — reusing one canvas element as a WebGL
    // texture source across many redraws was found to silently degrade into
    // a blank-sampling texture after enough resize/render cycles.
    function layout() {
      const rect = el.getBoundingClientRect();
      w = Math.max(1, Math.round(rect.width));
      h = Math.max(1, Math.round(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      const oldTexture = uniforms.uText.value;

      textCanvas = document.createElement('canvas');
      textCanvas.width = Math.round(w * dpr);
      textCanvas.height = Math.round(h * dpr);
      const textCtx = textCanvas.getContext('2d');
      drawRuns(textCtx, runs, rect, dpr, opts.dropShadow, opts.baselineFraction ?? 0.8);

      const texture = new THREE.CanvasTexture(textCanvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      uniforms.uText.value = texture;
      if (oldTexture) oldTexture.dispose();

      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      // Scale taps relative to canvas height (~font scale), not the full
      // headline width — otherwise wide-but-short text canvases blow the
      // blur radius up hugely and wash the glyphs out entirely.
      uniforms.uAspect.value.set(h / w, 1);
    }

    layout();
    const ro = new ResizeObserver(() => layout());
    ro.observe(el);
    window.addEventListener('orientationchange', layout);

    el.classList.add('text-focus-active');

    let lastProgress = -1;
    function render() {
      if (uniforms.uProgress.value <= 0.002) {
        canvas.style.opacity = '0';
        return;
      }
      canvas.style.opacity = '1';
      renderer.render(scene, camera);
    }

    return {
      setProgress(p) {
        p = Math.max(0, Math.min(1, p));
        if (p === lastProgress) return;
        lastProgress = p;
        uniforms.uProgress.value = p;
        render();
      },
    };
  }

  // ----- Hero title: always plays its blur-in reveal the moment the WebGL
  // canvas is ready, regardless of how long THREE took to load from the CDN —
  // gating this on the hero's own (much shorter) loading-state window meant
  // the reveal window had almost always already closed by init time, so the
  // effect silently never played.
  function initHeroFocus() {
    const el = document.querySelector('.hero-big');
    const instance = createFocusText(el, {
      maxBlur: 12,
      dropShadow: 'drop-shadow(0 2px 10px rgba(0,0,0,.45)) drop-shadow(0 0 24px rgba(0,0,0,.35))',
      baselineFraction: 0.8,
    });
    if (!instance) return;

    window.__heroTitleFocus = instance;
    const duration = 900;
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      instance.setProgress(easeOutCubic(t));
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ----- "The idea" heading: driven by vision-scrub.js's scroll progress -----
  function initIdeaFocus() {
    const el = document.querySelector('#visionScrubHeadline h2');
    const instance = createFocusText(el, {
      maxBlur: 10,
      dropShadow: 'drop-shadow(0 2px 24px rgba(0,0,0,.5))',
      baselineFraction: 0.78,
    });
    if (!instance) return;
    window.__ideaTitleFocus = instance;
  }

  let initStarted = false;
  window.__initTextFocusWebGL = function () {
    if (initStarted) return;
    initStarted = true;
    document.fonts.ready.then(() => {
      try { initHeroFocus(); } catch (e) {}
      try { initIdeaFocus(); } catch (e) {}
    });
  };
})();

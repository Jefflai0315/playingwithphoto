// Load Three.js only on desktop — mobile uses CSS section backgrounds instead.
(function () {
  if (window.matchMedia('(max-width: 900px), (hover: none) and (pointer: coarse)').matches) {
    return;
  }

  function boot() {
    window.__initBgWebGL?.();
    window.__initTextFocusWebGL?.();
  }

  if (window.THREE) {
    boot();
    return;
  }

  const s = document.createElement('script');
  s.src = 'https://unpkg.com/three@0.160.0/build/three.min.js';
  s.async = true;
  s.onload = boot;
  document.head.appendChild(s);
})();

/* ============================================================
   SNAPSHOT SCRUB — 3 panels: AI motion · style board · strips
   ============================================================ */

(() => {
  const STEPS = [
    { label: "AI Motion" },
    { label: "AI Styles" },
    { label: "Guest strips" },
  ];

  const runway = document.querySelector(".snapshot-scrub");
  const stage = document.getElementById("snapshotStage");
  if (!runway || !stage) return;

  const panels = [...stage.querySelectorAll(".snapshot-panel")];
  const aiMotion = document.getElementById("snapshotAiMotion");
  const styleVideos = [...stage.querySelectorAll(".snapshot-style-video")];
  const stepsEl = document.getElementById("snapshotScrubSteps");
  const bar = document.getElementById("snapshotScrubBar");
  const barFill = document.getElementById("snapshotScrubBarFill");
  const thumb = document.getElementById("snapshotScrubThumb");
  const styleLabel = document.getElementById("snapshotStyleLabel");
  const chalkBoard = document.getElementById("chalkBoard");
  const chalkRail = document.getElementById("chalkRail");

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const TOUCH =
    window.matchMedia("(hover: none) and (pointer: coarse)").matches ||
    window.matchMedia("(max-width: 900px)").matches;

  let initialized = false;
  let ready = false;
  let progress = 0;
  let targetProgress = 0;
  let dragging = false;
  let dragArmed = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let userActive = false;
  let lastUserAt = performance.now();
  let runwayVisible = false;
  let pageVisible = !document.hidden;
  let stripsPanelWasActive = false;
  let stripVideos = [];

  function ease(t) {
    return t * t * (3 - 2 * t);
  }

  function styleAt(p) {
    const idx = Math.min(
      STEPS.length - 1,
      Math.round(p * (STEPS.length - 1)),
    );
    return STEPS[idx].label;
  }

  function panelOpacities(p) {
    const scaled = p * (STEPS.length - 1);
    const i = Math.min(STEPS.length - 2, Math.floor(scaled));
    const t = scaled - i;
    const opacities = panels.map(() => 0);

    if (p <= 0) {
      opacities[0] = 1;
      return opacities;
    }
    if (p >= 1) {
      opacities[STEPS.length - 1] = 1;
      return opacities;
    }

    opacities[i] = 1 - ease(t);
    opacities[i + 1] = ease(t);
    return opacities;
  }

  function syncVideos(p, opacities) {
    const canPlay = runwayVisible && pageVisible && !prefersReducedMotion;

    if (aiMotion) {
      const on = canPlay && opacities[0] > 0.35;
      if (on && aiMotion.paused) aiMotion.play().catch(() => {});
      else if (!on && !aiMotion.paused) aiMotion.pause();
    }

    styleVideos.forEach((video) => {
      const on = canPlay && opacities[1] > 0.35;
      if (on && video.paused) video.play().catch(() => {});
      else if (!on && !video.paused) video.pause();
    });
  }

  function updateControls(p) {
    const pct = `${p * 100}%`;
    if (barFill) barFill.style.width = pct;
    if (thumb) thumb.style.left = pct;
    if (styleLabel) styleLabel.textContent = styleAt(p);
    if (bar) bar.setAttribute("aria-valuenow", String(Math.round(p * 100)));

    const idx = Math.round(p * (STEPS.length - 1));
    stepsEl?.querySelectorAll(".snapshot-step[data-step]").forEach((btn) => {
      const step = Number(btn.dataset.step);
      const active = step === idx;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  function restartStripGifs() {
    chalkRail?.querySelectorAll("img[data-is-gif='1']").forEach((img) => {
      const src = img.dataset.gifSrc || img.src;
      if (!src) return;
      img.src = "";
      requestAnimationFrame(() => {
        img.src = src;
      });
    });
  }

  function syncStripVideos(active) {
    const canPlay =
      active && runwayVisible && pageVisible && !prefersReducedMotion;
    stripVideos.forEach((video) => {
      if (canPlay && video.paused) video.play().catch(() => {});
      else if (!canPlay && !video.paused) video.pause();
    });
  }

  function render(p) {
    const opacities = panelOpacities(p);

    panels.forEach((panel, i) => {
      const o = opacities[i];
      panel.style.opacity = String(o);
      panel.style.visibility = "visible";
      panel.style.pointerEvents = o > 0.35 ? "auto" : "none";
      panel.style.zIndex = o > 0.02 ? String(i + 1) : "0";
      panel.classList.toggle("is-active", o > 0.5);
    });

    const onStrips = opacities[2] > 0.5;
    if (onStrips && !stripsPanelWasActive) restartStripGifs();
    stripsPanelWasActive = onStrips;
    syncStripVideos(onStrips);

    stage.style.cursor = onStrips ? "default" : "ew-resize";
    stage.style.touchAction = onStrips ? "pan-x" : TOUCH ? "pan-y" : "none";

    syncVideos(p, opacities);
    updateControls(p);
  }

  function setProgress(p, fromUser = false) {
    targetProgress = Math.min(1, Math.max(0, p));
    if (fromUser) {
      userActive = true;
      lastUserAt = performance.now();
    }
  }

  function barProgress(clientX) {
    const rect = bar.getBoundingClientRect();
    return (clientX - rect.left) / rect.width;
  }

  function stageProgress(clientX) {
    const rect = stage.getBoundingClientRect();
    return (clientX - rect.left) / rect.width;
  }

  function endDrag() {
    dragging = false;
    dragArmed = false;
  }

  function onStagePointerDown(e) {
    if (!ready || prefersReducedMotion || TOUCH) return;
    if (e.target.closest("#chalkBoard")) return;
    if (panels[2]?.classList.contains("is-active")) return;
    dragArmed = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
  }

  function onStagePointerMove(e) {
    if (!dragArmed && !dragging) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    if (!dragging) {
      if (Math.abs(dx) < 10) return;
      if (Math.abs(dx) <= Math.abs(dy)) {
        dragArmed = false;
        return;
      }
      dragging = true;
      stage.setPointerCapture(e.pointerId);
    }
    setProgress(stageProgress(e.clientX), true);
    progress = targetProgress;
    render(progress);
  }

  if (!TOUCH) {
    stage.addEventListener("pointerdown", onStagePointerDown);
    stage.addEventListener("pointermove", onStagePointerMove);
    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);
    stage.addEventListener("pointerleave", endDrag);
  }

  function onBarPointerDown(e) {
    if (!ready || prefersReducedMotion) return;
    bar.setPointerCapture(e.pointerId);
    setProgress(barProgress(e.clientX), true);
    progress = targetProgress;
    render(progress);
  }

  function onBarPointerMove(e) {
    if (!bar.hasPointerCapture(e.pointerId)) return;
    setProgress(barProgress(e.clientX), true);
    progress = targetProgress;
    render(progress);
  }

  bar?.addEventListener("pointerdown", onBarPointerDown);
  bar?.addEventListener("pointermove", onBarPointerMove);
  bar?.addEventListener("pointerup", (e) => {
    try {
      bar.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  });

  function buildSteps() {
    if (!stepsEl) return;
    stepsEl.innerHTML =
      STEPS.map(
        (step, i) => `
        <button
          type="button"
          class="snapshot-step${i === 0 ? " is-active" : ""}"
          data-step="${i}"
          role="tab"
          aria-selected="${i === 0 ? "true" : "false"}"
        >${step.label}</button>`,
      ).join("") +
      `<button
          type="button"
          class="snapshot-step snapshot-step-more"
          id="snapshotMoreBtn"
          aria-haspopup="dialog"
          aria-label="See the full photobooth experience"
          title="See the full experience"
        ><span class="snapshot-sparkle" aria-hidden="true">✨</span></button>`;

    stepsEl.querySelectorAll(".snapshot-step[data-step]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const step = Number(btn.dataset.step);
        const p = step / (STEPS.length - 1);
        setProgress(p, true);
        progress = p;
        render(p);
      });
    });

    initFullSiteModal();
  }

  function initFullSiteModal() {
    const modal = document.getElementById("snapshotFullModal");
    const backdrop = document.getElementById("snapshotFullModalBackdrop");
    const closeBtn = document.getElementById("snapshotFullModalClose");
    const stayBtn = document.getElementById("snapshotFullModalStay");
    const moreBtn = document.getElementById("snapshotMoreBtn");
    if (!modal || !moreBtn) return;

    let lastFocus = null;

    function openModal() {
      lastFocus = document.activeElement;
      modal.hidden = false;
      modal.classList.add("is-open");
      document.body.classList.add("snapshot-modal-open");
      closeBtn?.focus();
      window.pwpTrack?.("snapshot_full_modal_open");
    }

    function closeModal() {
      modal.classList.remove("is-open");
      modal.hidden = true;
      document.body.classList.remove("snapshot-modal-open");
      lastFocus?.focus?.();
    }

    moreBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openModal();
    });

    closeBtn?.addEventListener("click", closeModal);
    stayBtn?.addEventListener("click", closeModal);
    backdrop?.addEventListener("click", closeModal);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
    });
  }

  function buildChalkboard() {
    if (!chalkRail) return;

    const strips = window.PhotoLib?.snapshotStrips?.() || [];
    const rotations = [-1.5, 1.2, -1, 1.8];
    stripVideos = [];

    if (strips.length === 0) {
      chalkRail.innerHTML =
        '<p class="chalk-strip-empty">Add strips in photos.config.js</p>';
      return;
    }

    chalkRail.innerHTML = strips
      .map((strip, i) => {
        const wide = strip.wide ? " chalk-strip--wide" : "";
        const rot = rotations[i % rotations.length];
        let media = "";

        if (strip.video) {
          media = `<video class="chalk-strip-video" src="${strip.video}" poster="${strip.src || ""}" muted loop playsinline webkit-playsinline preload="auto"></video>`;
        } else if (strip.gif) {
          media = `<img src="${strip.gif}" data-is-gif="1" data-gif-src="${strip.gif}" data-fallback="${strip.src || ""}" alt="${strip.label || "Strip"} example" decoding="async" />`;
        } else {
          media = `<img src="${strip.src}" alt="${strip.label || "Strip"} example" loading="lazy" decoding="async" />`;
        }

        return `
          <figure class="chalk-strip${wide}" style="--r:${rot}deg">
            ${media}
            <figcaption>${strip.label || "strip"}</figcaption>
          </figure>`;
      })
      .join("");

    stripVideos = [...chalkRail.querySelectorAll(".chalk-strip-video")];

    chalkRail.querySelectorAll("img[data-fallback]").forEach((img) => {
      img.addEventListener("error", () => {
        const fallback = img.dataset.fallback;
        if (fallback && img.src !== fallback) {
          img.removeAttribute("data-is-gif");
          img.src = fallback;
        }
      });
    });
  }

  function initChalkDrag() {
    if (!chalkBoard) return;

    let down = false;
    let startX = 0;
    let startScroll = 0;

    chalkBoard.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      down = true;
      startX = e.pageX;
      startScroll = chalkBoard.scrollLeft;
      chalkBoard.classList.add("grabbing");
      chalkBoard.setPointerCapture(e.pointerId);
    });

    chalkBoard.addEventListener("pointermove", (e) => {
      if (!down) return;
      e.stopPropagation();
      chalkBoard.scrollLeft = startScroll - (e.pageX - startX);
    });

    const end = () => {
      down = false;
      chalkBoard.classList.remove("grabbing");
    };

    chalkBoard.addEventListener("pointerup", end);
    chalkBoard.addEventListener("pointercancel", end);
    chalkBoard.addEventListener("pointerleave", end);

    chalkBoard.addEventListener(
      "wheel",
      (e) => {
        const horizontalIntent = Math.abs(e.deltaX) > Math.abs(e.deltaY);
        if (!horizontalIntent) return;

        const maxScroll = chalkBoard.scrollWidth - chalkBoard.clientWidth;
        const next = Math.max(
          0,
          Math.min(maxScroll, chalkBoard.scrollLeft + e.deltaX),
        );
        if (Math.abs(next - chalkBoard.scrollLeft) <= 0.5) return;

        chalkBoard.scrollLeft = next;
        e.preventDefault();
      },
      { passive: false },
    );
  }

  function init() {
    if (initialized) return;
    initialized = true;
    buildSteps();
    buildChalkboard();
    initChalkDrag();

    progress = 0;
    targetProgress = 0;
    render(0);
    ready = true;
    if (!prefersReducedMotion) requestAnimationFrame(tick);
  }

  function tick() {
    if (!ready || !pageVisible || !runwayVisible || prefersReducedMotion) return;

    if (!dragging && performance.now() - lastUserAt > 5000) {
      userActive = false;
    }

    if (!dragging) {
      progress += (targetProgress - progress) * 0.18;
      render(progress);
    }

    requestAnimationFrame(tick);
  }

  document.addEventListener("visibilitychange", () => {
    pageVisible = !document.hidden;
    render(progress);
  });

  const preloadObs = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        preloadObs.disconnect();
        init();
      }
    },
    { rootMargin: "80px 0px" },
  );
  preloadObs.observe(runway);

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      ([e]) => {
        runwayVisible = e.isIntersecting;
        if (initialized) render(progress);
      },
      { rootMargin: "40px 0px" },
    ).observe(runway);
  } else {
    runwayVisible = true;
    init();
  }
})();

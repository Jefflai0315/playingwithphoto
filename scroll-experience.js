/* ============================================================
   SCROLL EXPERIENCE — synchronized smooth scroll + choreography
   ============================================================ */

(() => {
  "use strict";

  const root = document.documentElement;
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const coarsePointer = window.matchMedia(
    "(hover: none) and (pointer: coarse)",
  ).matches;
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;

  // Every animation in this file is progressive. The existing native scroll
  // implementations continue to work if a CDN request fails.
  if (!gsap || !ScrollTrigger) {
    console.warn("[scroll-experience] GSAP unavailable; using native scroll");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  root.classList.add("scroll-enhanced");

  const updateListeners = new Set();
  const tickListeners = new Set();
  const finishTriggers = new Set();
  const driver = {
    addUpdate(listener) {
      if (typeof listener !== "function") return () => {};
      updateListeners.add(listener);
      return () => updateListeners.delete(listener);
    },
    addTick(listener) {
      if (typeof listener !== "function") return () => {};
      tickListeners.add(listener);
      return () => tickListeners.delete(listener);
    },
    register({ id, trigger, start, end, onUpdate, finishOnStop = false }) {
      if (!trigger || typeof onUpdate !== "function") return null;
      const config = {
        id,
        trigger,
        start,
        end,
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => onUpdate(self.progress, self),
      };
      // ScrollTrigger's own snap fights Lenis, so only use it for the native
      // fallback. Lenis gets an equivalent scrollTo handoff below.
      if (finishOnStop && !lenis) {
        config.animation = gsap.to(
          { value: 0 },
          { value: 1, duration: 1, ease: "none", paused: true },
        );
        config.snap = {
          snapTo: [0, 1],
          directional: true,
          delay: 0.08,
          duration: { min: 0.18, max: 0.42 },
          ease: "power2.out",
        };
      }
      const scrollTrigger = ScrollTrigger.create(config);
      if (finishOnStop) finishTriggers.add(scrollTrigger);
      onUpdate(scrollTrigger.progress, scrollTrigger);
      return scrollTrigger;
    },
  };
  window.__pwpScrollDriver = driver;
  ScrollTrigger.addEventListener("update", () => {
    updateListeners.forEach((listener) => listener());
  });

  let lenis = null;

  // Lenis stays off for touch and reduced-motion users. This avoids taking
  // over short, momentum-sensitive mobile gestures while preserving the
  // browser's native scroll and sticky positioning.
  if (!prefersReducedMotion && !coarsePointer && typeof window.Lenis === "function") {
    lenis = new window.Lenis({
      autoRaf: false,
      anchors: true,
      lerp: 0.18,
      smoothWheel: true,
      syncTouch: false,
    });

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    window.__pwpLenis = lenis;
    root.classList.add("has-smooth-scroll");
  }

  // Canvas scrubbers subscribe to this same clock as Lenis and ScrollTrigger.
  // This avoids separate requestAnimationFrame loops drifting apart.
  gsap.ticker.add((time) => {
    tickListeners.forEach((listener) => listener(time));
  });

  // Lenis and ScrollTrigger should not both try to snap the page. Instead,
  // after the user's wheel momentum settles, hand the active scrub to its
  // directional endpoint through Lenis itself.
  if (lenis) {
    let finishTimer = 0;
    let finishing = false;
    const finishActiveScrub = () => {
      if (finishing || document.body.classList.contains("nav-open")) return;
      const active = [...finishTriggers]
        .filter(
          (scrollTrigger) =>
            scrollTrigger.isActive &&
            scrollTrigger.progress > 0.015 &&
            scrollTrigger.progress < 0.985,
        )
        .sort((a, b) => b.progress - a.progress)[0];
      if (!active) return;

      finishing = true;
      const destination = active.direction >= 0 ? active.end : active.start;
      lenis.scrollTo(destination, {
        lerp: 0.34,
        lock: true,
        onComplete: () => {
          finishing = false;
        },
      });
    };
    lenis.on("scroll", () => {
      window.clearTimeout(finishTimer);
      finishTimer = window.setTimeout(finishActiveScrub, 140);
    });
  }

  // Shared by existing CTA handlers so programmatic navigation uses the same
  // easing as the scroll-linked scenes instead of starting a second animation.
  window.__pwpScrollTo = (target) => {
    if (!target) return;
    if (lenis) {
      lenis.scrollTo(target, {
        offset: -84,
        duration: 1.05,
        easing: (t) => 1 - Math.pow(1 - t, 4),
      });
      return;
    }
    target.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  if (prefersReducedMotion) return;

  const mm = gsap.matchMedia();
  mm.add("(prefers-reduced-motion: no-preference)", () => {
    // Replace the old one-shot reveal with a reversible, scrubbed entrance.
    // The vision copy is already controlled by vision-scrub.js and is kept
    // out of this group to avoid two timelines writing the same opacity.
    const revealTargets = gsap.utils.toArray(
      ".reveal:not(#visionScrubCopy)",
    );
    revealTargets.forEach((element) => {
      gsap.fromTo(
        element,
        { autoAlpha: 0, y: 36 },
        {
          autoAlpha: 1,
          y: 0,
          ease: "power3.out",
          scrollTrigger: {
            trigger: element,
            start: "top 88%",
            end: "top 62%",
            scrub: 0.7,
            invalidateOnRefresh: true,
          },
        },
      );
    });

    // Slow editorial drift keeps the large chapter marks and headlines from
    // feeling locked to the page while leaving their layout untouched.
    gsap.utils.toArray(".chapter-numeral").forEach((element, index) => {
      gsap.to(element, {
        y: index % 2 ? -72 : 72,
        rotation: index % 2 ? -3 : 3,
        ease: "none",
        scrollTrigger: {
          trigger: element.closest("section") || element,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.2,
          invalidateOnRefresh: true,
        },
      });
    });

    gsap.utils.toArray(".section-head h2").forEach((element) => {
      gsap.fromTo(
        element,
        { y: 24 },
        {
          y: -18,
          ease: "none",
          scrollTrigger: {
            trigger: element.closest("section") || element,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
            invalidateOnRefresh: true,
          },
        },
      );
    });

    // Gentle depth on physical photo objects. These are separate from the
    // canvas transforms owned by hero/vision/booth scrubbers.
    gsap.utils
      .toArray(".spark-frame, .meta-keepsake-frame")
      .forEach((element, index) => {
        gsap.fromTo(
          element,
          { y: index % 2 ? 18 : -12, scale: 0.97 },
          {
            y: index % 2 ? -18 : 12,
            scale: 1.025,
            ease: "none",
            scrollTrigger: {
              trigger: element.closest("section") || element,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.1,
              invalidateOnRefresh: true,
            },
          },
        );
      });

    // Let the reel arrive with a little weight before its native sticky
    // timeline takes over.
    const reel = document.getElementById("reel");
    const reelStrip = document.getElementById("reelStrip");
    if (reel && reelStrip) {
      gsap.fromTo(
        reelStrip,
        { y: 42, scale: 0.94, rotation: -1.2 },
        {
          y: -10,
          scale: 1,
          rotation: 0,
          ease: "none",
          scrollTrigger: {
            trigger: reel,
            start: "top bottom",
            end: "top 18%",
            scrub: 1,
            invalidateOnRefresh: true,
          },
        },
      );
    }

    requestAnimationFrame(() => ScrollTrigger.refresh());
  });

  // Images and web fonts can change the height of sections after the first
  // refresh, especially on a cold load.
  window.addEventListener("load", () => ScrollTrigger.refresh(), {
    once: true,
  });
  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  // The mobile drawer already owns the nav-open state; pause desktop inertia
  // while it is open so a click cannot move the page behind the drawer.
  if (lenis) {
    const navStateObserver = new MutationObserver(() => {
      if (document.body.classList.contains("nav-open")) lenis.stop();
      else lenis.start();
    });
    navStateObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });
  }
})();

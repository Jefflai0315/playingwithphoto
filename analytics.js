/* Lightweight conversion event tracking — works with GA4 when ga4Id is set in photos.config.js */
(function () {
  const site = window.PhotoLib?.site?.() || {};
  const ga4Id = (site.ga4Id || window.PWP_GA4_ID || "").trim();

  window.dataLayer = window.dataLayer || [];

  window.pwpTrack = function pwpTrack(eventName, params) {
    const payload = { event: eventName, ...(params || {}) };
    window.dataLayer.push(payload);
    if (typeof window.gtag === "function" && ga4Id) {
      window.gtag("event", eventName, params || {});
    }
    if (window.location.search.includes("debug_analytics=1")) {
      console.info("[pwpTrack]", eventName, params || {});
    }
  };

  if (ga4Id) {
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4Id)}`;
    document.head.appendChild(s);
    window.gtag = function gtag() { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", ga4Id, { send_page_view: true });
  }

  function bindTracking() {
    document.addEventListener("click", (e) => {
      const trackEl = e.target.closest("[data-track]");
      if (trackEl) {
        window.pwpTrack(trackEl.dataset.track, {
          label: trackEl.dataset.trackLabel || trackEl.textContent?.trim()?.slice(0, 80) || "",
        });
        return;
      }

      const pkg = e.target.closest("[data-package]");
      if (pkg) {
        window.pwpTrack("click_package", { package: pkg.dataset.package });
        return;
      }

      const lead = e.target.closest("[data-lead-audience]");
      if (lead) {
        window.pwpTrack("click_occasion", { audience: lead.dataset.leadAudience });
        return;
      }

      if (e.target.closest(".wa-fab") || e.target.closest('a[href*="wa.me"]')) {
        window.pwpTrack("click_whatsapp", { location: e.target.closest(".wa-fab") ? "fab" : "link" });
      }

      if (e.target.closest('[data-lead-catalogue="1"]')) {
        window.pwpTrack("click_lookbook_request");
      }
    });

    document.addEventListener("change", (e) => {
      if (e.target.matches("[data-sample-filter]")) {
        window.pwpTrack("filter_samples", { filter: e.target.dataset.sampleFilter });
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindTracking);
  } else {
    bindTracking();
  }
})();

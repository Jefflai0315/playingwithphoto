// ===== Playing With Photo — interactions =====

// --- Nav scroll state ---
const nav = document.getElementById("topnav");
const onScroll = () => {
  nav.classList.toggle("scrolled", window.scrollY > 40);
};
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// --- Reveal on scroll ---
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -60px 0px" },
);
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

// --- Hero floating strip portraits (generated SVG) ---
const FAKE_FACES = [
  {
    bg: "#d9b681",
    hair: "#3a2614",
    skin: "#e8c8a0",
    smile: true,
    glasses: false,
  },
  {
    bg: "#c89a6a",
    hair: "#5a3018",
    skin: "#d9b681",
    smile: true,
    glasses: true,
  },
  {
    bg: "#b2824e",
    hair: "#2a1a0c",
    skin: "#c89a6a",
    smile: false,
    glasses: false,
  },
  {
    bg: "#e8c8a0",
    hair: "#4a2814",
    skin: "#efdcbd",
    smile: true,
    glasses: false,
  },
  {
    bg: "#a06838",
    hair: "#2a1a0c",
    skin: "#c29670",
    smile: true,
    glasses: true,
  },
];

function fakePortraitSVG(i, sepia = true) {
  const f = FAKE_FACES[i % FAKE_FACES.length];
  const filter = sepia
    ? "filter: sepia(.7) contrast(1.1) brightness(.95);"
    : "";
  return `
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%;${filter}">
      <rect width="100" height="100" fill="${f.bg}"/>
      <circle cx="50" cy="44" r="22" fill="${f.skin}"/>
      <path d="M28 38 Q30 18 50 17 Q70 18 72 38 Q72 28 65 23 Q58 19 50 20 Q42 19 35 23 Q28 28 28 38Z" fill="${f.hair}"/>
      <circle cx="42" cy="46" r="1.3" fill="#2a1a0c"/>
      <circle cx="58" cy="46" r="1.3" fill="#2a1a0c"/>
      ${
        f.glasses
          ? `
        <circle cx="42" cy="46" r="5" fill="none" stroke="#2a1a0c" stroke-width=".9"/>
        <circle cx="58" cy="46" r="5" fill="none" stroke="#2a1a0c" stroke-width=".9"/>
        <line x1="47" y1="46" x2="53" y2="46" stroke="#2a1a0c" stroke-width=".7"/>
      `
          : ""
      }
      <path d="M50 50 Q48 56 50 60 Q52 60 53 58" stroke="#8a4620" stroke-width=".8" fill="none"/>
      ${
        f.smile
          ? `<path d="M43 64 Q50 70 57 64" stroke="#8a4620" stroke-width="1.5" fill="none" stroke-linecap="round"/>`
          : `<path d="M44 65 L56 65" stroke="#8a4620" stroke-width="1.5" stroke-linecap="round"/>`
      }
      <path d="M25 100 L25 80 Q50 72 75 80 L75 100 Z" fill="${f.hair === "#3a2614" ? "#8a4620" : "#6b3f25"}"/>
    </svg>
  `;
}

// Populate hero floating strips — real photos from photos.config.js if provided,
// otherwise fall back to the drawn SVG portraits above.
(() => {
  const heroPhotos = window.PhotoLib?.heroPhotos() || [];
  document.querySelectorAll(".floating-strip .frame").forEach((el, i) => {
    const idx = parseInt(el.dataset.portrait || i);
    if (heroPhotos.length) {
      const src = heroPhotos[idx % heroPhotos.length];
      el.innerHTML = "";
      el.style.backgroundImage = `url("${src}")`;
      el.style.backgroundSize = "cover";
      el.style.backgroundPosition = "center";
    } else {
      el.innerHTML = fakePortraitSVG(idx);
    }
  });
})();

// --- Style gallery filmstrip ---
// Each `key` maps to photos.config.js → styles.<key>. Default mode shows
// every photo with its matching filter. Clicking a chip keeps the photo
// variety, then applies that selected filter to every photo.
const STYLES = [
  {
    key: "kodak",
    name: "70s Kodak",
    caption: "Summer of '78",
    filter: "sepia(.5) saturate(1.4) contrast(.95) hue-rotate(-8deg)",
  },
  {
    key: "bw",
    name: "B&W",
    caption: "The classics",
    filter: "grayscale(1) contrast(1.2) brightness(.95)",
  },
  {
    key: "polaroid",
    name: "Polaroid",
    caption: "Say cheese",
    filter: "sepia(.2) saturate(1.3) contrast(1.05) brightness(1.05)",
  },
  {
    key: "kodachrome",
    name: "Kodachrome",
    caption: "Golden hour",
    filter: "sepia(.15) saturate(1.15) contrast(1.04) hue-rotate(-6deg)",
  },
  {
    key: "sepia",
    name: "Studio Sepia",
    caption: "Portrait No. 4",
    filter: "sepia(1) contrast(1.1) brightness(.95)",
  },
];

const filmstripEl = document.getElementById("styleFilmstrip");
const styleChipsEl = document.querySelector(".style-chips");

function renderPolaroid(photoStyle, displayStyle, i) {
  const rot = (Math.sin(i * 1.3) * 3).toFixed(2);
  const photoCss = window.PhotoLib?.stylePhoto(photoStyle.key);
  const inner = photoCss
    ? `<div style="background-image:${photoCss};background-size:cover;background-position:center;width:100%;height:100%;"></div>`
    : fakePortraitSVG(i, false);
  return `
    <div class="polaroid" style="--r:${rot}deg;">
      <span class="tag">${displayStyle.name}</span>
      <div class="img" style="filter:${displayStyle.filter};">
        ${inner}
      </div>
      <div class="caption">${photoStyle.caption}</div>
    </div>
  `;
}

function renderStyleFilmstrip(styleKey = "all") {
  if (!filmstripEl) return;

  const wrap = filmstripEl.closest(".filmstrip-wrap");
  const isMixedMode = styleKey === "all";
  const selectedStyle = STYLES.find((s) => s.key === styleKey) || null;
  const base = STYLES.map((photoStyle, i) => {
    const displayStyle = isMixedMode ? photoStyle : selectedStyle || photoStyle;
    return renderPolaroid(photoStyle, displayStyle, i);
  });
  const autoMode = wrap?.classList.contains("is-auto");
  filmstripEl.innerHTML = autoMode ? base.concat(base).join("") : base.join("");
}

function initFilmstripScroll() {
  const wrap = filmstripEl?.closest(".filmstrip-wrap");
  if (!wrap || !filmstripEl) return;

  let idleTimer;
  const resumeAuto = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (!wrap.matches(":hover")) wrap.classList.add("is-auto");
      renderStyleFilmstrip(
        styleChipsEl?.querySelector("button.active")?.dataset.style || "all",
      );
    }, 4000);
  };

  wrap.classList.add("is-auto");
  renderStyleFilmstrip("all");

  wrap.addEventListener("pointerdown", () => {
    wrap.classList.remove("is-auto");
    renderStyleFilmstrip(
      styleChipsEl?.querySelector("button.active")?.dataset.style || "all",
    );
    clearTimeout(idleTimer);
  });
  wrap.addEventListener("scroll", () => {
    wrap.classList.remove("is-auto");
    resumeAuto();
  }, { passive: true });
  wrap.addEventListener("pointerup", resumeAuto);
  wrap.addEventListener("pointerleave", resumeAuto);
}

if (filmstripEl) {
  initFilmstripScroll();
}

if (styleChipsEl) {
  styleChipsEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-style]");
    if (!btn) return;

    styleChipsEl.querySelectorAll("button[data-style]").forEach((chip) => {
      const isActive = chip === btn;
      chip.classList.toggle("active", isActive);
      chip.setAttribute("aria-pressed", String(isActive));
    });
    renderStyleFilmstrip(btn.dataset.style);
  });
}

// ===== Tweaks =====
const tweaksPanel = document.getElementById("tweaksPanel");

function applyTweaks(tw) {
  document.body.dataset.palette = tw.palette || "sepia";
  document.body.dataset.grain = tw.grain === false ? "false" : "true";
  if (tw.filter && typeof window.pwpDemoSetFilter === "function") {
    window.pwpDemoSetFilter(tw.filter);
  }
  // Update buttons state in panel
  tweaksPanel.querySelectorAll(".opts").forEach((row) => {
    const key = row.dataset.tweak;
    row.querySelectorAll("button").forEach((b) => {
      const v = b.dataset.v;
      const current = String(tw[key]);
      b.classList.toggle("active", v === current);
    });
  });
}
applyTweaks(window.TWEAKS);

tweaksPanel.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-v]");
  if (!btn) return;
  const row = btn.closest(".opts");
  const key = row.dataset.tweak;
  let v = btn.dataset.v;
  if (v === "true") v = true;
  else if (v === "false") v = false;
  window.TWEAKS[key] = v;
  applyTweaks(window.TWEAKS);
  try {
    window.parent.postMessage(
      { type: "__edit_mode_set_keys", edits: { [key]: v } },
      "*",
    );
  } catch (_) {}
});

// Edit mode host protocol — listener FIRST, then announce
window.addEventListener("message", (e) => {
  if (!e.data || typeof e.data !== "object") return;
  if (e.data.type === "__activate_edit_mode") tweaksPanel.classList.add("show");
  if (e.data.type === "__deactivate_edit_mode")
    tweaksPanel.classList.remove("show");
});
try {
  window.parent.postMessage({ type: "__edit_mode_available" }, "*");
} catch (_) {}

// --- Nav smooth scroll offset fix (since we have scroll-behavior already) — no-op

// --- Cork-board drag-to-scroll for testimonials ---
(function () {
  const board = document.getElementById("testiBoard");
  if (!board) return;
  let down = false,
    startX = 0,
    startScroll = 0;
  board.addEventListener("pointerdown", (e) => {
    down = true;
    startX = e.pageX;
    startScroll = board.scrollLeft;
    board.classList.add("grabbing");
    board.setPointerCapture(e.pointerId);
  });
  board.addEventListener("pointermove", (e) => {
    if (!down) return;
    board.scrollLeft = startScroll - (e.pageX - startX);
  });
  const end = (e) => {
    down = false;
    board.classList.remove("grabbing");
  };
  board.addEventListener("pointerup", end);
  board.addEventListener("pointercancel", end);
  board.addEventListener("pointerleave", end);
  // Keep vertical wheel for page scroll.
  // Only consume true horizontal wheel gestures (trackpad / shift+wheel).
  board.addEventListener(
    "wheel",
    (e) => {
      const horizontalIntent = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      if (!horizontalIntent) return;

      const maxScroll = board.scrollWidth - board.clientWidth;
      const current = board.scrollLeft;
      const next = Math.max(0, Math.min(maxScroll, current + e.deltaX));
      const moved = Math.abs(next - current) > 0.5;
      if (!moved) return;

      board.scrollLeft = next;
      e.preventDefault();
    },
    { passive: false },
  );
})();

// --- Lead routing: occasion → package, event type, scroll target ---
(function () {
  const form = document.getElementById("bookForm");

  function setPackage(value) {
    if (!form?.elements.package || !value) return;
    const opt = form.elements.package.querySelector(`option[value="${value}"]`);
    if (opt) form.elements.package.value = value;
  }

  function setEventType(value) {
    const sel =
      document.getElementById("bookEventType") || form?.elements.eventType;
    if (!sel || !value) return;
    const opt = [...sel.options].find((o) => o.value === value);
    if (opt) sel.value = opt.value;
  }

  function setPricingAudience(audience) {
    if (!audience) return;
    const btn = document.querySelector(
      `.pricing-audience button[data-audience="${audience}"]`,
    );
    btn?.click();
  }

  function setCatalogue(checked) {
    const box = document.getElementById("bookCatalogue");
    if (box) box.checked = !!checked;
  }

  function routeLead(el) {
    const audience = el.dataset.leadAudience;
    const event = el.dataset.leadEvent;
    const pkg = el.dataset.leadPackage;
    const scroll = el.dataset.leadScroll || "#book";
    const catalogue = el.dataset.leadCatalogue === "1";

    if (pkg) setPackage(pkg);
    if (event) setEventType(event);
    if (audience) setPricingAudience(audience);
    if (catalogue) setCatalogue(true);

    const target = document.querySelector(scroll);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      const sampleFilter = el.dataset.leadSampleFilter || audience;
      if (scroll === "#samples" && sampleFilter) {
        window.setTimeout(
          () => window.setSampleWallFilter?.(sampleFilter),
          400,
        );
      }
      if (scroll === "#book") {
        if (pkg || event) {
          document.getElementById("bookFormMore")?.setAttribute("open", "");
        }
        window.setTimeout(
          () => form?.elements.name?.focus({ preventScroll: true }),
          400,
        );
      }
    }
  }

  document
    .querySelectorAll(
      "[data-lead-audience], [data-lead-event], [data-lead-catalogue], [data-lead-sample-filter]",
    )
    .forEach((el) => {
      el.addEventListener("click", (e) => {
        if (el.tagName === "A" && el.getAttribute("href")?.startsWith("#"))
          e.preventDefault();
        routeLead(el);
      });
    });

  const params = new URLSearchParams(window.location.search);
  const eventParam = params.get("event");
  if (eventParam) {
    const map = {
      wedding: { audience: "wedding", event: "Wedding", package: "keepsake" },
      corporate: {
        audience: "corporate",
        event: "Corporate / brand",
        package: "activation",
      },
      birthday: {
        audience: "birthday",
        event: "Birthday",
        package: "keepsake",
      },
    };
    const cfg = map[eventParam.toLowerCase()];
    if (cfg) {
      setPackage(cfg.package);
      setEventType(cfg.event);
      setPricingAudience(cfg.audience);
      window.setTimeout(
        () => window.setSampleWallFilter?.(eventParam.toLowerCase()),
        500,
      );
    }
  }

  if (params.get("catalogue") === "1") setCatalogue(true);

  window.routeLead = routeLead;
})();

// --- Booking: package pre-select from pricing CTAs ---
(function () {
  const form = document.getElementById("bookForm");
  if (!form) return;

  const pkgSelect = form.elements.package;
  const DEFAULT_PACKAGE = "keepsake";

  function setPackage(value) {
    if (!pkgSelect || !value) return;
    const opt = pkgSelect.querySelector(`option[value="${value}"]`);
    if (opt) pkgSelect.value = value;
  }

  document.querySelectorAll("[data-package]").forEach((link) => {
    link.addEventListener("click", () => {
      setPackage(link.dataset.package);
      document
        .getElementById("book")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  let hash = window.location.hash;
  if (/^#book$/i.test(hash) && hash !== "#book") {
    history.replaceState(null, "", "#book");
    hash = "#book";
    document.getElementById("book")?.scrollIntoView();
  }

  const hashMatch = hash.match(
    /^#book[-:]?(prelude|keepsake|showpiece|activation)$/i,
  );
  if (hashMatch) setPackage(hashMatch[1].toLowerCase());

  const params = new URLSearchParams(window.location.search);
  const queryPkg = params.get("package");
  if (queryPkg) setPackage(queryPkg.toLowerCase());
})();

// --- Add-ons: toggle from marketing cards → booking checkboxes ---
(function () {
  const form = document.getElementById("bookForm");
  if (!form) return;

  const summaryEmpty = document.getElementById("bookAddonsSummaryEmpty");
  const summaryList = document.getElementById("bookAddonsSummaryList");
  const addonsDetails = document.getElementById("bookAddonsDetails");

  function updateBookAddonsSummary() {
    const selected = getSelectedAddons(form);
    if (summaryEmpty) summaryEmpty.hidden = selected.length > 0;
    if (summaryList) {
      summaryList.hidden = selected.length === 0;
      summaryList.innerHTML = selected
        .map((label) => `<li>${label}</li>`)
        .join("");
    }
  }

  function toggleAddon(id, scrollToBook = true) {
    const inputs = form.querySelectorAll(
      `input[data-addon-id="${id}"][name="addons"]`,
    );
    if (!inputs.length) return;
    const next = ![...inputs].some((i) => i.checked);
    inputs.forEach((i) => {
      i.checked = next;
    });
    updateBookAddonsSummary();
    if (next && addonsDetails && !addonsDetails.open) addonsDetails.open = true;
    if (scrollToBook) {
      document
        .getElementById("book")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      form
        .querySelector(`input[data-addon-id="${id}"]`)
        ?.focus({ preventScroll: true });
    }
  }

  form.querySelectorAll('input[name="addons"]').forEach((input) => {
    input.addEventListener("change", updateBookAddonsSummary);
  });
  form.addEventListener("addons-reset", updateBookAddonsSummary);

  document.querySelectorAll(".addon-card[data-addon-id]").forEach((card) => {
    const id = card.dataset.addonId;
    const activate = () => toggleAddon(id);
    card.addEventListener("click", activate);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        activate();
      }
    });
  });

  updateBookAddonsSummary();
})();

function getSelectedAddons(form) {
  if (!form) return [];
  const seen = new Set();
  const labels = [];
  form.querySelectorAll('input[name="addons"]:checked').forEach((input) => {
    if (seen.has(input.value)) return;
    seen.add(input.value);
    labels.push(input.value);
  });
  return labels;
}

// --- Booking form submit ---
(function () {
  const form = document.getElementById("bookForm");
  if (!form) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  const statusEl = document.getElementById("bookFormStatus");
  const defaultBtnHtml = submitBtn ? submitBtn.innerHTML : "";
  const defaultPackage = "keepsake";

  function setStatus(message, isError = false) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.style.color = isError ? "#b63a2a" : "var(--rust)";
  }

  function mailtoFallback(data) {
    const subject = encodeURIComponent(
      `Booking enquiry — ${data.eventType || "Event"}`,
    );
    const body = encodeURIComponent(
      [
        "Hello Jeff,",
        "",
        "I would like to enquire about Playing With Photo.",
        "",
        `Name: ${data.name || "-"}`,
        `Email: ${data.email || "-"}`,
        `WhatsApp: ${data.whatsapp || "-"}`,
        `Package: ${data.package || "-"}`,
        `Event type: ${data.eventType || "-"}`,
        `Event date: ${data.eventDate || "-"}`,
        `Venue / city: ${data.venue || "-"}`,
        `Add-ons: ${data.addons || "None selected"}`,
        `Style lookbook requested: ${data.catalogue || "No"}`,
        "",
        "Thank you!",
      ].join("\n"),
    );
    window.location.href = `mailto:pencilwithjoy@gmail.com?subject=${subject}&body=${body}`;
  }

  function buildWhatsAppUrl(data) {
    const site = window.PhotoLib?.site?.() || {};
    const num = site.whatsapp || "6589896901";
    const lines = [
      site.whatsappMessage ||
        "Hi Jeff, I'd like to enquire about Playing With Photo.",
      data.name ? `Name: ${data.name}` : "",
      data.eventType ? `Event: ${data.eventType}` : "",
      data.eventDate ? `Date: ${data.eventDate}` : "",
      data.package ? `Package: ${data.package}` : "",
      data.venue ? `Venue: ${data.venue}` : "",
      data.catalogue === "yes" ? "Please send the full style lookbook." : "",
      data.addons && data.addons !== "None selected"
        ? `Add-ons: ${data.addons.replace(/\n/g, ", ")}`
        : "",
    ].filter(Boolean);
    return `https://wa.me/${num}?text=${encodeURIComponent(lines.join("\n"))}`;
  }

  const waBtn = document.getElementById("bookWhatsApp");
  function refreshWhatsAppLink() {
    if (!waBtn || !form) return;
    const addons = getSelectedAddons(form);
    const data = {
      eventType: form.elements.eventType?.value?.trim() || "",
      eventDate: form.elements.eventDate?.value || "",
      package: form.elements.package?.value?.trim() || "",
      venue: form.elements.venue?.value?.trim() || "",
      catalogue: form.elements.catalogue?.checked ? "yes" : "no",
      addons: addons.length ? addons.join("\n") : "None selected",
    };
    waBtn.href = buildWhatsAppUrl(data);
  }

  form?.querySelectorAll("input, select").forEach((el) => {
    el.addEventListener("change", refreshWhatsAppLink);
    el.addEventListener("input", refreshWhatsAppLink);
  });
  refreshWhatsAppLink();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus("");

    const addons = getSelectedAddons(form);
    const rawEmail = form.elements.email?.value?.trim() || "";
    const whatsapp = form.elements.whatsapp?.value?.trim() || "";
    const data = {
      name: form.elements.name?.value?.trim() || "",
      email:
        rawEmail ||
        `enquiry.${whatsapp.replace(/\D/g, "") || Date.now()}@whatsapp.lead`,
      whatsapp,
      package: form.elements.package?.value?.trim() || "",
      eventType: form.elements.eventType?.value?.trim() || "",
      eventDate: form.elements.eventDate?.value || "",
      venue: form.elements.venue?.value?.trim() || "",
      addons: addons.length ? addons.join("\n") : "None selected",
      catalogue: form.elements.catalogue?.checked ? "yes" : "no",
    };

    if (!data.name || !data.whatsapp || !data.eventDate) {
      setStatus("Please fill in your name, WhatsApp, and event date.", true);
      return;
    }

    window.pwpTrack?.("submit_enquiry", {
      package: data.package,
      event_type: data.eventType,
      catalogue: data.catalogue,
    });

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";
    }

    try {
      const endpoint = (form.dataset.endpoint || "").trim();
      const provider = (form.dataset.provider || "").trim().toLowerCase();

      // If no endpoint is configured yet, open email client as a safe fallback.
      if (!endpoint) {
        mailtoFallback(data);
        setStatus("Opened your email app to send this enquiry.");
      } else {
        let res;
        if (provider === "formspree" || endpoint.includes("formspree.io")) {
          const payload = new FormData();
          payload.append("name", data.name);
          payload.append("email", data.email);
          payload.append("whatsapp", data.whatsapp);
          payload.append("package", data.package);
          payload.append("eventType", data.eventType);
          payload.append("eventDate", data.eventDate);
          payload.append("venue", data.venue);
          payload.append("addons", data.addons);
          payload.append("catalogue", data.catalogue);
          addons.forEach((a) => payload.append("addons[]", a));
          const pkgLabel = data.package ? ` · ${data.package}` : "";
          const addonHint = addons.length
            ? ` · ${addons.length} add-on(s)`
            : "";
          const catalogueHint = data.catalogue === "yes" ? " · lookbook" : "";
          payload.append(
            "_subject",
            `Booking enquiry — ${data.eventType || "Event"}${pkgLabel}${addonHint}${catalogueHint}`,
          );

          res = await fetch(endpoint, {
            method: "POST",
            headers: { Accept: "application/json" },
            body: payload,
          });
        } else {
          res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
        }

        if (!res.ok) throw new Error(`Request failed with ${res.status}`);
        window.pwpTrack?.("enquiry_success", { package: data.package });
        setStatus("Thanks — enquiry sent. I'll reply soon.");
        form.reset();
        if (form.elements.package) form.elements.package.value = defaultPackage;
        form.dispatchEvent(new Event("addons-reset", { bubbles: true }));
      }
    } catch (err) {
      console.warn("Booking form error:", err);
      setStatus(
        "Could not send automatically. Opening email fallback...",
        true,
      );
      mailtoFallback(data);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = defaultBtnHtml;
      }
    }
  });
})();

// --- WhatsApp FAB + site contact links from config ---
(function () {
  const site = window.PhotoLib?.site?.() || {};
  const num = site.whatsapp || "6589896901";
  const msg = encodeURIComponent(
    site.whatsappMessage ||
      "Hi Jeff, I'd like to enquire about the photobooth.",
  );
  const baseUrl = `https://wa.me/${num}?text=${msg}`;

  const fab = document.getElementById("waFab");
  if (fab) fab.href = baseUrl;
})();

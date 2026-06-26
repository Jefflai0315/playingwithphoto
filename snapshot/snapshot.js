// Snapshot landing — scrub package pills, booking form, add-on chips
(function () {
  const form = document.getElementById("bookForm");
  if (!form) return;

  const pkgSelect = form.elements.package;
  const addonClear = document.getElementById("addonClear");
  const addonsCount = document.getElementById("addonsCount");
  const addonSummaryEmpty = document.getElementById("addonSummaryEmpty");
  const addonSummaryList = document.getElementById("addonSummaryList");
  const addonsGrid = document.getElementById("addonsGrid");
  const packagePills = document.querySelectorAll(".snapshot-pill[data-package]");

  function setPackage(value) {
    if (!pkgSelect || !value) return;
    const opt = pkgSelect.querySelector(`option[value="${value}"]`);
    if (opt) pkgSelect.value = value;
    packagePills.forEach((pill) => {
      pill.classList.toggle("is-active", pill.dataset.package === value);
    });
  }

  document.querySelectorAll("[data-package]").forEach((el) => {
    el.addEventListener("click", () => {
      setPackage(el.dataset.package);
      document.getElementById("bookFormMore")?.setAttribute("open", "");
    });
  });

  pkgSelect?.addEventListener("change", () => {
    setPackage(pkgSelect.value);
  });

  const params = new URLSearchParams(window.location.search);
  if (params.get("package")) setPackage(params.get("package").toLowerCase());
  else setPackage(pkgSelect?.value || "keepsake");

  if (params.get("event")) {
    const map = {
      wedding: "Wedding",
      corporate: "Corporate / brand",
      birthday: "Birthday",
    };
    const val = map[params.get("event").toLowerCase()];
    if (val && form.elements.eventType) form.elements.eventType.value = val;
  }
  if (params.get("catalogue") === "1" && form.elements.catalogue)
    form.elements.catalogue.checked = true;

  function getSelectedAddons() {
    if (!addonsGrid) return [];
    return [...addonsGrid.querySelectorAll('input[name="addons"]:checked')].map(
      (i) => i.value,
    );
  }

  function updateAddonUI() {
    const selected = getSelectedAddons();
    const n = selected.length;

    if (addonsCount) {
      addonsCount.innerHTML =
        n === 1
          ? "<strong>1</strong> selected"
          : `<strong>${n}</strong> selected`;
    }

    if (addonClear) addonClear.disabled = n === 0;

    if (addonSummaryEmpty) addonSummaryEmpty.hidden = n > 0;
    if (addonSummaryList) {
      addonSummaryList.hidden = n === 0;
      addonSummaryList.innerHTML = selected
        .map((label) => `<li>${label}</li>`)
        .join("");
    }
  }

  addonsGrid?.querySelectorAll('input[name="addons"]').forEach((input) => {
    input.addEventListener("change", updateAddonUI);
  });

  addonClear?.addEventListener("click", () => {
    addonsGrid?.querySelectorAll('input[name="addons"]').forEach((input) => {
      input.checked = false;
    });
    updateAddonUI();
  });

  const submitBtn = form.querySelector('button[type="submit"]');
  const statusEl = document.getElementById("bookFormStatus");

  function setStatus(message, isError = false) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.style.color = isError ? "#b63a2a" : "var(--rust)";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus("");

    const addons = getSelectedAddons();
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
      source: "snapshot",
    };

    if (!data.name || !data.whatsapp || !data.eventDate) {
      setStatus("Please fill in your name, WhatsApp, and event date.", true);
      return;
    }

    window.pwpTrack?.("submit_enquiry", {
      package: data.package,
      source: "snapshot",
      catalogue: data.catalogue,
    });

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";
    }

    try {
      const endpoint = (form.dataset.endpoint || "").trim();
      if (!endpoint) throw new Error("No form endpoint configured");

      const payload = new FormData();
      Object.entries(data).forEach(([k, v]) => payload.append(k, v));
      addons.forEach((a) => payload.append("addons[]", a));
      const pkgLabel = data.package ? ` · ${data.package}` : "";
      const addonHint = addons.length ? ` · ${addons.length} add-on(s)` : "";
      const catalogueHint = data.catalogue === "yes" ? " · lookbook" : "";
      payload.append(
        "_subject",
        `Booking enquiry (snapshot) — ${data.eventType || "Event"}${pkgLabel}${addonHint}${catalogueHint}`,
      );

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: payload,
      });

      if (!res.ok) throw new Error("Submit failed");
      window.pwpTrack?.("enquiry_success", {
        package: data.package,
        source: "snapshot",
      });
      form.reset();
      if (pkgSelect) pkgSelect.value = "keepsake";
      setPackage("keepsake");
      addonsGrid?.querySelectorAll('input[name="addons"]').forEach((input) => {
        input.checked = false;
      });
      updateAddonUI();
      setStatus("Thanks — Jeff will reply within 24 hours.");
    } catch {
      setStatus(
        "Could not send. Please try again in a moment.",
        true,
      );
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Send enquiry";
      }
    }
  });

  updateAddonUI();
})();

(function () {
  const reviews = window.PhotoLib?.snapshotReviews?.() || [];
  const set = document.getElementById("snapshotReviewsSet");
  const track = document.getElementById("snapshotReviewsTrack");
  if (!set || reviews.length === 0) return;

  const rotations = [-2, 1.5, -1, 2, -1.5];

  set.innerHTML = reviews
    .map((review, i) => {
      const photo = review.photo
        ? `<img class="snapshot-quote-photo" src="${review.photo}" alt="" width="44" height="55" loading="lazy" decoding="async" style="--r:${rotations[i % rotations.length]}deg" />`
        : "";
      return `
        <blockquote class="snapshot-quote">
          ${photo}
          <div class="snapshot-quote-body">
            <p>“${review.quote}”</p>
            <cite>— ${review.cite}</cite>
          </div>
        </blockquote>`;
    })
    .join("");

  if (track) {
    const clone = set.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    track.appendChild(clone);
  }
})();

// Mobile nav drawer + sticky book bar
(function () {
  const toggle = document.getElementById("navToggle");
  const drawer = document.getElementById("navDrawer");
  const backdrop = document.getElementById("navDrawerBackdrop");
  const bookBar = document.getElementById("mobileBookBar");
  const bookSection = document.getElementById("book");

  if (toggle && drawer) {
    function setOpen(open) {
      document.body.classList.toggle("nav-open", open);
      drawer.classList.toggle("is-open", open);
      drawer.setAttribute("aria-hidden", open ? "false" : "true");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }
    toggle.addEventListener("click", () =>
      setOpen(!drawer.classList.contains("is-open")),
    );
    backdrop?.addEventListener("click", () => setOpen(false));
    drawer
      .querySelectorAll("a")
      .forEach((a) => a.addEventListener("click", () => setOpen(false)));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });
  }

  if (bookBar && bookSection) {
    let bookSeen = false;

    function updateBookBar() {
      const show = !bookSeen;
      bookBar.classList.toggle("is-visible", show);
      bookBar.setAttribute("aria-hidden", show ? "false" : "true");
      document.body.classList.toggle("book-bar-visible", show);
    }

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) bookSeen = true;
        updateBookBar();
      },
      { threshold: 0.08 },
    );
    io.observe(bookSection);
    updateBookBar();
  }
})();

(function () {
  const site = window.PhotoLib?.site?.() || {};
  const num = site.whatsapp || "6589896901";
  const msg = encodeURIComponent(
    site.whatsappMessage ||
      "Hi Jeff, I'd like to enquire about the photobooth.",
  );
  const fab = document.getElementById("waFab");
  if (fab) fab.href = `https://wa.me/${num}?text=${msg}`;
})();

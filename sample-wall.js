/* Renders the public sample wall from PHOTO_CONFIG.samples */
(function () {
  const grid = document.getElementById("sampleWallGrid");
  if (!grid || !window.PhotoLib?.samples) return;

  const samples = window.PhotoLib.samples();
  const moreBtn = document.getElementById("sampleWallMore");
  const fade = document.getElementById("sampleWallFade");

  const filters = [
    { id: "all", label: "All" },
    { id: "wedding", label: "Wedding" },
    { id: "corporate", label: "Corporate" },
    { id: "birthday", label: "Birthday" },
    { id: "film", label: "Film looks" },
    { id: "painterly", label: "Painterly" },
  ];

  function updateCount() {
    const count = [...grid.querySelectorAll(".sample-tile:not([hidden])")].filter(
      (t) => !t.classList.contains("sample-tile-cta")
    ).length;
    const countEl = document.getElementById("sampleWallCount");
    const isMobile = window.matchMedia("(max-width: 520px)").matches;
    if (countEl) {
      countEl.textContent = isMobile
        ? `${count} samples · swipe →`
        : `${count} samples · click “Show all” for more`;
    }
    updateMoreButton();
  }

  function updateMoreButton() {
    if (!moreBtn || window.matchMedia("(max-width: 520px)").matches) {
      if (moreBtn) moreBtn.hidden = true;
      return;
    }
    const needsExpand = grid.scrollHeight > 300;
    moreBtn.hidden = !needsExpand;
    if (grid.classList.contains("is-expanded")) {
      moreBtn.textContent = "Show less";
    } else {
      moreBtn.textContent = "Show all samples";
    }
  }

  const filterBar = document.getElementById("sampleWallFilters");

  function applyFilter(filter) {
    if (!filterBar) return;
    const btn = filterBar.querySelector(`[data-sample-filter="${filter}"]`);
    if (!btn) return;
    filterBar.querySelectorAll("button").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("active", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    grid.querySelectorAll(".sample-tile").forEach((tile) => {
      const tags = (tile.dataset.tags || "").split(",");
      const show = filter === "all" || tags.includes(filter);
      tile.hidden = !show;
    });
    window.pwpTrack?.("filter_samples", { filter });
    updateCount();
  }

  window.setSampleWallFilter = applyFilter;

  if (filterBar) {
    filterBar.innerHTML = filters.map((f, i) =>
      `<button type="button" class="${i === 0 ? "active" : ""}" data-sample-filter="${f.id}" aria-pressed="${i === 0 ? "true" : "false"}">${f.label}</button>`
    ).join("");

    filterBar.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-sample-filter]");
      if (!btn) return;
      applyFilter(btn.dataset.sampleFilter);
    });
  }

  grid.innerHTML = samples.map((s) => {
    const tags = (s.tags || []).join(",");
    return `<figure class="sample-tile" data-tags="${tags}">
      <img src="${s.src}" alt="${s.label}" loading="lazy" width="200" height="200" />
      <figcaption>${s.label}</figcaption>
    </figure>`;
  }).join("") + `
    <a href="#book" class="sample-tile sample-tile-cta" data-lead-catalogue="1" data-track="click_sample_wall_lookbook">
      <span class="sample-tile-lock" aria-hidden="true">+20</span>
      <strong>Full lookbook</strong>
      <span>On enquiry</span>
    </a>`;

  moreBtn?.addEventListener("click", () => {
    const expanded = grid.classList.toggle("is-expanded");
    moreBtn.textContent = expanded ? "Show less" : "Show all samples";
    if (fade) fade.setAttribute("aria-hidden", expanded ? "true" : "false");
    window.pwpTrack?.("toggle_sample_wall", { expanded });
  });

  updateCount();
  window.addEventListener("resize", updateMoreButton);
})();

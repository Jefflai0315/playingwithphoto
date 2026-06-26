/* Snapshot chalkboard — strip GIF gallery from photos.config.js */

(() => {
  const rail = document.getElementById("chalkRail");
  const board = document.getElementById("chalkBoard");
  if (!rail || !board) return;

  const strips = window.PhotoLib?.snapshotStrips?.() || [];
  const rotations = [-3, 2.5, -2, 3.5, -4, 1.5, -1, 4];

  if (strips.length === 0) {
    rail.innerHTML =
      '<p class="chalk-strip-empty">Add strip GIFs in photos.config.js → snapshotStrips</p>';
    return;
  }

  rail.innerHTML = strips
    .map((strip, i) => {
      const isGif = /\.gif($|\?)/i.test(strip.src || "");
      return `
        <figure class="chalk-strip${strip.wide ? " chalk-strip--wide" : ""}" style="--r:${rotations[i % rotations.length]}deg">
          <div class="chalk-strip-frame">
            <img src="${strip.src}" alt="${strip.label || "Strip"} example" loading="lazy" decoding="async" />
            ${isGif ? '<span class="chalk-strip-badge">GIF</span>' : ""}
          </div>
          <figcaption>${strip.label || "strip"}</figcaption>
        </figure>`;
    })
    .join("");

  let down = false;
  let startX = 0;
  let startScroll = 0;

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

  const end = () => {
    down = false;
    board.classList.remove("grabbing");
  };

  board.addEventListener("pointerup", end);
  board.addEventListener("pointercancel", end);
  board.addEventListener("pointerleave", end);

  board.addEventListener(
    "wheel",
    (e) => {
      const horizontalIntent = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      if (!horizontalIntent) return;

      const maxScroll = board.scrollWidth - board.clientWidth;
      const next = Math.max(
        0,
        Math.min(maxScroll, board.scrollLeft + e.deltaX),
      );
      if (Math.abs(next - board.scrollLeft) <= 0.5) return;

      board.scrollLeft = next;
      e.preventDefault();
    },
    { passive: false },
  );
})();

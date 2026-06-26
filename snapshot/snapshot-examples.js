/* Snapshot page — testimonial photos, corkboard drag, lazy video */

(function () {
  document.querySelectorAll(".strip-card[data-strip]").forEach((card) => {
    const key = card.dataset.strip;
    const sourcePhotos = window.PhotoLib?.testimonialSourcePhotos?.(key) || [];
    const photos = window.PhotoLib?.testimonialPhotos(key) || [];
    if (photos.length === 0) return;

    const stripFrames = card.querySelector(".strip-frames");
    const frames = card.querySelectorAll(".strip-frame");
    const existingSingle = card.querySelector(".strip-single-photo");

    if (sourcePhotos.length === 1 && stripFrames) {
      card.classList.add("single-photo");
      const singleSrc = sourcePhotos[0].replace(
        /^url\((['"]?)(.*?)\1\)$/,
        "$2",
      );
      if (singleSrc) {
        let img = existingSingle;
        if (!img) {
          img = document.createElement("img");
          img.className = "strip-single-photo";
          img.alt = `${key} testimonial photo`;
          stripFrames.appendChild(img);
        }
        img.src = singleSrc;
      }
    } else {
      card.classList.remove("single-photo");
      if (existingSingle) existingSingle.remove();
    }

    frames.forEach((frame, i) => {
      if (!photos[i]) return;
      frame.style.backgroundImage = photos[i];
      frame.style.backgroundSize = "cover";
      frame.style.backgroundPosition = "center";
    });
  });
})();

(function () {
  const board = document.getElementById("testiBoard");
  if (!board) return;

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

(function () {
  const video = document.getElementById("aiAnimationVideo");
  if (!video || !("IntersectionObserver" in window)) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) video.play().catch(() => {});
        else video.pause();
      });
    },
    { threshold: 0.25, rootMargin: "40px 0px" },
  );

  io.observe(video);
})();

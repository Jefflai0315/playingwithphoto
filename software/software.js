(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const track = (name, params) => window.pwpTrack?.(name, params);

  /* ───────── Split-flap cells ───────── */

  const FLAP_CHARS = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:+-";
  const FLIP_MS = 140;

  function makeCell(ch) {
    const el = document.createElement("span");
    el.className = "fl";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML =
      '<span class="t"><b></b></span><span class="b"><b></b></span>' +
      '<span class="ft"><b></b></span><span class="fb"><b></b></span>';
    const [t, b, ft, fb] = el.querySelectorAll("b");
    el._p = { t, b, ft, fb };
    setStatic(el, ch);
    return el;
  }

  function setStatic(el, ch) {
    const p = el._p;
    p.t.textContent = p.b.textContent = p.ft.textContent = p.fb.textContent = ch;
    el._ch = ch;
  }

  function flipOnce(el, next) {
    const p = el._p;
    const cur = el._ch;
    p.t.textContent = next;
    p.ft.textContent = cur;
    p.fb.textContent = next;
    p.b.textContent = cur;
    el.classList.remove("flipping");
    void el.offsetWidth;
    el.classList.add("flipping");
    el._ch = next;
    return new Promise((resolve) =>
      setTimeout(() => {
        p.b.textContent = next;
        el.classList.remove("flipping");
        resolve();
      }, FLIP_MS),
    );
  }

  async function flipTo(el, target, delay) {
    const token = (el._token = (el._token || 0) + 1);
    if (reduceMotion || el._ch === target) {
      setStatic(el, target);
      return;
    }
    if (delay) await new Promise((r) => setTimeout(r, delay));
    const hops = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < hops; i += 1) {
      if (el._token !== token) return;
      await flipOnce(el, FLAP_CHARS[1 + Math.floor(Math.random() * (FLAP_CHARS.length - 1))]);
    }
    if (el._token !== token) return;
    await flipOnce(el, target);
  }

  function makeGroup(size, cls) {
    const grp = document.createElement("span");
    grp.className = `grp ${cls}`;
    for (let i = 0; i < size; i += 1) grp.appendChild(makeCell(" "));
    grp._size = size;
    return grp;
  }

  function setGroup(grp, text, baseDelay) {
    const padded = String(text).toUpperCase().padEnd(grp._size, " ").slice(0, grp._size);
    [...grp.children].forEach((cell, i) => flipTo(cell, padded[i], (baseDelay || 0) + i * 22));
  }

  /* ───────── Photo flap: the board's mechanism applied to a print ───────── */

  const loaded = new Map();
  function preload(src) {
    if (!loaded.has(src)) {
      const img = new Image();
      img.src = src;
      loaded.set(src, (img.decode ? img.decode() : Promise.resolve()).catch(() => {}));
    }
    return loaded.get(src);
  }

  function PhotoFlap(root) {
    const fallback = root.querySelector(".pf-fallback");
    let src = root.dataset.src;
    let busy = false;
    let pending = null;
    const half = (cls) => {
      const h = document.createElement("div");
      h.className = `pf-h ${cls}`;
      h.setAttribute("aria-hidden", "true");
      const img = document.createElement("img");
      img.alt = "";
      img.decoding = "async";
      img.src = src;
      h.appendChild(img);
      root.appendChild(h);
      return img;
    };
    const t = half("pf-t");
    const b = half("pf-b");
    const ft = half("pf-ft");
    const fb = half("pf-fb");
    root.setAttribute("role", "img");
    root.setAttribute("aria-label", fallback ? fallback.alt : "");
    root.classList.add("is-ready");

    async function flip(next, alt) {
      if (alt) root.setAttribute("aria-label", alt);
      if (next === src) return;
      if (busy) {
        pending = [next, alt];
        return;
      }
      busy = true;
      await preload(next);
      if (reduceMotion || !ft.parentNode.animate) {
        t.src = b.src = ft.src = fb.src = next;
        src = next;
      } else {
        ft.src = src;
        fb.src = next;
        t.src = next;
        const ftBox = ft.parentNode;
        const fbBox = fb.parentNode;
        ftBox.style.visibility = "visible";
        await ftBox.animate(
          [{ transform: "rotateX(0deg)", filter: "brightness(1)" }, { transform: "rotateX(-90deg)", filter: "brightness(0.55)" }],
          { duration: 230, easing: "cubic-bezier(.55,0,.9,.45)", fill: "forwards" },
        ).finished;
        ftBox.style.visibility = "hidden";
        fbBox.style.visibility = "visible";
        await fbBox.animate(
          [{ transform: "rotateX(90deg)", filter: "brightness(1.35)" }, { transform: "rotateX(0deg)", filter: "brightness(1)" }],
          { duration: 360, easing: "cubic-bezier(.16,1,.3,1)", fill: "forwards" },
        ).finished;
        b.src = next;
        fbBox.style.visibility = "hidden";
        ftBox.getAnimations().forEach((a) => a.cancel());
        fbBox.getAnimations().forEach((a) => a.cancel());
        src = next;
      }
      busy = false;
      if (pending) {
        const [n, a] = pending;
        pending = null;
        flip(n, a);
      }
    }
    return { flip };
  }

  /* ───────── Hero departure board ───────── */

  function initHeroBoard() {
    const board = document.getElementById("heroBoard");
    const list = document.getElementById("heroRows");
    const flapEl = document.getElementById("heroFlap");
    if (!board || !list || !flapEl) return;

    const flap = PhotoFlap(flapEl);
    const nowEl = board.querySelector(".now");
    const nowLabel = document.getElementById("nowLabel");
    const nowStyle = document.getElementById("nowStyle");
    const clock = document.getElementById("boardClock");

    const POOL = [
      { style: "Monet", out: "Strip", before: "/photos/spark/myra.webp", after: "/photos/spark/myra-monet.webp", alt: "a sweet sixteen trio" },
      { style: "Picasso", out: "4x6", before: "/photos/spark/co.webp", after: "/photos/spark/co-picasso.webp", alt: "a corporate team" },
      { style: "Warhol", out: "QR+4x6", before: "/photos/spark/olivebirthday.webp", after: "/photos/spark/olivebirthday-warhol.webp", alt: "a family at a seventh birthday" },
      { style: "Hokusai", out: "Strip", before: "/photos/spark/jenmikeguests.webp", after: "/photos/spark/jenmikeguests-hokusai.webp", alt: "wedding guests" },
      { style: "Van Gogh", out: "4x6", before: "/photos/spark/jenmike.webp", after: "/photos/spark/jenmike-vangogh.webp", alt: "a wedding couple" },
    ];
    const STAGES = [
      { key: "boarding", label: "Boarding", now: "Guest in booth" },
      { key: "styling", label: "Styling", now: "AI styling" },
      { key: "printing", label: "Printing", now: "Now printing" },
      { key: "printed", label: "Printed", now: "Printed" },
    ];
    const ROWS = 8;

    let minutes = 19 * 60 + 42;
    let guest = 142;
    let poolIdx = 0;
    const fmt = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

    // Newest first. The top row is the live session; the rest already printed.
    let sessions = [];
    for (let i = 0; i < ROWS; i += 1) {
      const p = POOL[(i + 0) % POOL.length];
      sessions.push({ ...p, time: fmt(minutes - i * 3), guest: String(guest - i).padStart(4, "0"), stage: i === 0 ? 0 : 3 });
    }
    poolIdx = 1;

    const rows = sessions.map(() => {
      const li = document.createElement("li");
      li.className = "board-row";
      li.setAttribute("aria-hidden", "true");
      const g = {
        time: makeGroup(5, "grp-time"),
        guest: makeGroup(4, "grp-guest"),
        style: makeGroup(8, "grp-style"),
        out: makeGroup(5, "grp-out"),
        status: makeGroup(8, "grp-status"),
      };
      Object.values(g).forEach((el) => li.appendChild(el));
      list.appendChild(li);
      return { li, g };
    });

    function paintRow(i, s, delay) {
      const r = rows[i];
      r.li.className = `board-row st-${STAGES[s.stage].key}`;
      setGroup(r.g.time, s.time, delay);
      setGroup(r.g.guest, s.guest, delay + 40);
      setGroup(r.g.style, s.style, delay + 80);
      setGroup(r.g.out, s.out, delay + 120);
      setGroup(r.g.status, STAGES[s.stage].label, delay + 160);
    }

    function paintNow() {
      const s = sessions[0];
      const st = STAGES[s.stage];
      nowLabel.textContent = st.now;
      nowStyle.textContent = s.style;
      nowEl.classList.toggle("is-done", s.stage === 3);
      const styled = s.stage >= 2;
      flap.flip(styled ? s.after : s.before, styled ? `Booth output: ${s.alt} restyled as ${s.style}` : `Booth capture: ${s.alt}, before AI styling`);
      clock.textContent = s.time;
      if (s.stage === 0) preload(s.after);
    }

    sessions.forEach((s, i) => paintRow(i, s, 200 + i * 90));
    paintNow();

    if (reduceMotion) {
      sessions[0].stage = 2;
      paintRow(0, sessions[0], 0);
      paintNow();
      return;
    }

    function step() {
      const top = sessions[0];
      if (top.stage < 3) {
        top.stage += 1;
        paintRow(0, top, 0);
        paintNow();
        return;
      }
      minutes += 2 + Math.floor(Math.random() * 3);
      guest += 1;
      const p = POOL[poolIdx % POOL.length];
      poolIdx += 1;
      sessions = [{ ...p, time: fmt(minutes), guest: String(guest).padStart(4, "0"), stage: 0 }, ...sessions.slice(0, ROWS - 1)];
      sessions.forEach((s, i) => paintRow(i, s, i * 70));
      paintNow();
    }

    let timer = null;
    let visible = true;
    let hovered = false;
    const run = () => {
      clearInterval(timer);
      timer = null;
      if (visible && !hovered && !document.hidden) timer = setInterval(step, 2600);
    };
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      run();
    }).observe(board);
    document.addEventListener("visibilitychange", run);
    board.addEventListener("mouseenter", () => { hovered = true; run(); });
    board.addEventListener("mouseleave", () => { hovered = false; run(); });
    POOL.forEach((p) => preload(p.before));
  }

  /* ───────── AI style picker ───────── */

  function initStyles() {
    const flapEl = document.getElementById("styleFlap");
    const cap = document.getElementById("styleCap");
    const buttons = [...document.querySelectorAll(".style-btn")];
    if (!flapEl || !buttons.length) return;
    let flap = null;
    const ensure = () => (flap = flap || PhotoFlap(flapEl));

    new IntersectionObserver((entries, obs) => {
      if (!entries[0].isIntersecting) return;
      ensure();
      buttons.forEach((b) => preload(b.dataset.src));
      obs.disconnect();
    }, { rootMargin: "400px" }).observe(flapEl);

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        buttons.forEach((b) => {
          const on = b === btn;
          b.classList.toggle("is-on", on);
          b.setAttribute("aria-pressed", String(on));
        });
        ensure().flip(btn.dataset.src, btn.dataset.alt);
        cap.textContent = btn.textContent;
        track("software_style_pick", { style: btn.textContent });
      });
    });
  }

  /* ───────── Offline status board ───────── */

  function initOffline() {
    const list = document.getElementById("statusRows");
    const toggle = document.getElementById("wifiToggle");
    if (!list || !toggle) return;
    const boardEl = list.closest(".board");
    const net = document.getElementById("netState");
    const foot = document.getElementById("statusFoot");
    const toggleText = document.getElementById("wifiToggleText");

    const SERVICES = [
      { name: "Capture", label: "Capture", needsNet: false },
      { name: "Filters", label: "Frames and filters", needsNet: false },
      { name: "Printing", label: "Printing", needsNet: false },
      { name: "AI Styles", label: "AI styles", needsNet: true },
      { name: "QR Download", label: "QR downloads", needsNet: true },
    ];
    const rows = SERVICES.map((svc) => {
      const li = document.createElement("li");
      li.className = "board-row st-ok";
      const name = makeGroup(11, "grp-label");
      const status = makeGroup(10, "grp-status");
      li.append(name, status);
      list.appendChild(li);
      return { li, name, status, svc };
    });

    function paint(offline, first) {
      rows.forEach((r, i) => {
        const down = offline && r.svc.needsNet;
        r.li.className = `board-row ${down ? "st-down" : "st-ok"}`;
        r.li.setAttribute("aria-label", `${r.svc.label}: ${down ? "needs network" : "running"}`);
        if (first) setGroup(r.name, r.svc.name, i * 60);
        setGroup(r.status, down ? "No network" : "On time", (first ? 300 : 0) + i * 60);
      });
      boardEl.classList.toggle("is-down", offline);
      net.textContent = offline ? "Offline" : "Online";
      net.classList.toggle("is-down", offline);
      foot.textContent = offline
        ? "Capture, frames and printing keep running. AI styles and QR downloads come back with the connection."
        : "All services running.";
      toggleText.textContent = offline ? "Plug it back in" : "Pull the Wi‑Fi";
      toggle.setAttribute("aria-pressed", String(offline));
    }

    let started = false;
    new IntersectionObserver((entries, obs) => {
      if (!entries[0].isIntersecting || started) return;
      started = true;
      paint(false, true);
      obs.disconnect();
    }, { threshold: 0.3 }).observe(boardEl);

    toggle.addEventListener("click", () => {
      const offline = toggle.getAttribute("aria-pressed") !== "true";
      if (!started) {
        started = true;
        rows.forEach((r) => setGroup(r.name, r.svc.name, 0));
      }
      paint(offline, false);
      track("software_offline_toggle", { offline });
    });
  }

  /* ───────── Nav: current section ───────── */

  function initNav() {
    const links = [...document.querySelectorAll(".top-nav a")];
    const map = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a) => a.classList.remove("is-current"));
        map.get(e.target.id)?.classList.add("is-current");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    map.forEach((_, id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }

  /* ───────── Demo form ───────── */

  function initForm() {
    const form = document.getElementById("demoForm");
    if (!form) return;
    const btn = document.getElementById("demoSubmit");
    const status = document.getElementById("demoStatus");
    const btnHTML = btn.innerHTML;

    document.querySelectorAll("[data-plan]").forEach((a) => {
      a.addEventListener("click", () => {
        const radio = form.querySelector(`input[name="plan"][value="${a.dataset.plan}"]`);
        if (radio) radio.checked = true;
        track("software_plan_click", { plan: a.dataset.plan });
      });
    });

    const required = [
      ["name", "Add your name."],
      ["email", "Add an email we can reply to."],
      ["country", "Add your country so we can schedule the call."],
      ["booths", "Choose how many booths you run."],
    ];

    function setError(input, msg) {
      const field = input.closest(".field");
      let err = field.querySelector(".err");
      if (!msg) {
        field.classList.remove("is-invalid");
        input.removeAttribute("aria-invalid");
        err?.remove();
        return;
      }
      if (!err) {
        err = document.createElement("span");
        err.className = "err";
        err.id = `${input.id}-err`;
        field.appendChild(err);
      }
      err.textContent = msg;
      field.classList.add("is-invalid");
      input.setAttribute("aria-invalid", "true");
      input.setAttribute("aria-describedby", err.id);
    }

    function validate() {
      let first = null;
      required.forEach(([name, msg]) => {
        const input = form.elements[name];
        let bad = !input.value.trim();
        let text = msg;
        if (!bad && name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) {
          bad = true;
          text = "That email doesn't look right. Check for typos.";
        }
        setError(input, bad ? text : "");
        if (bad && !first) first = input;
      });
      return first;
    }

    form.addEventListener("input", (e) => {
      if (e.target.closest(".field.is-invalid")) setError(e.target, "");
    });

    function setStatus(msg, kind) {
      status.textContent = msg;
      status.className = `form-status${kind ? ` is-${kind}` : ""}`;
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      setStatus("");
      const firstBad = validate();
      if (firstBad) {
        firstBad.focus();
        setStatus("A few details are missing. They're marked above.", "err");
        return;
      }
      if (form.elements._gotcha.value) return;

      const data = new FormData(form);
      data.delete("_gotcha");
      data.append("source", "software-demo");
      data.append("_subject", `Software demo request: ${data.get("name")} (${data.get("country")})`);

      btn.disabled = true;
      btn.textContent = "Sending…";
      track("software_demo_submit", { plan: data.get("plan"), booths: data.get("booths") });

      try {
        const res = await fetch(form.dataset.endpoint, { method: "POST", body: data, headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error(`Form endpoint returned ${res.status}`);
        form.reset();
        setStatus("Request received. We'll email you to set a time for the demo.", "ok");
      } catch (err) {
        console.error(err);
        status.className = "form-status is-err";
        status.innerHTML = 'We couldn’t send that. Check your connection and try again, or email <a href="mailto:pencilwithjoy@gmail.com?subject=Software%20demo%20request">pencilwithjoy@gmail.com</a>.';
      } finally {
        btn.disabled = false;
        btn.innerHTML = btnHTML;
      }
    });
  }

  initHeroBoard();
  initStyles();
  initOffline();
  initNav();
  initForm();
})();

(function () {
  // Chip visual toggle
  document.querySelectorAll(".sw-chip").forEach((chip) => {
    const input = chip.querySelector("input");
    if (!input) return;
    const sync = () => chip.classList.toggle("is-selected", input.checked);
    input.addEventListener("change", sync);
    sync();
  });

  const form = document.getElementById("waitlistForm");
  if (!form) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  const statusEl = document.getElementById("swStatus");
  const defaultBtnText = submitBtn ? submitBtn.textContent : "";

  function setStatus(message, isError = false) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.style.color = isError ? "#b63a2a" : "var(--rust)";
  }

  function mailtoFallback(data) {
    const subject = encodeURIComponent("Photo booth software waitlist");
    const body = encodeURIComponent(
      [
        "Hi Jeff,",
        "",
        "I'd like to join the photo booth software waitlist.",
        "",
        `Name: ${data.name || "-"}`,
        `Email: ${data.email || "-"}`,
        `WhatsApp: ${data.whatsapp || "-"}`,
        `Interested as: ${data.audience || "-"}`,
        `Location: ${data.location || "-"}`,
        `Use case: ${data.useCase || "-"}`,
        `Wishlist: ${data.wishlist || "None selected"}`,
        `Other: ${data.other || "-"}`,
        "",
        "Thanks!",
      ].join("\n"),
    );
    window.location.href = `mailto:pencilwithjoy@gmail.com?subject=${subject}&body=${body}`;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus("");

    const wishlist = Array.from(
      form.querySelectorAll('input[name="wishlist"]:checked'),
    ).map((el) => el.value);

    const data = {
      name: form.elements.name?.value?.trim() || "",
      email: form.elements.email?.value?.trim() || "",
      whatsapp: form.elements.whatsapp?.value?.trim() || "",
      audience: form.elements.audience?.value || "",
      location: form.elements.location?.value?.trim() || "",
      useCase: form.elements.useCase?.value?.trim() || "",
      wishlist: wishlist.length ? wishlist.join(", ") : "None selected",
      other: form.elements.other?.value?.trim() || "",
    };

    if (!data.name || !data.email || !data.audience || !data.useCase) {
      setStatus("Please fill in your name, email, interest, and use case.", true);
      return;
    }

    window.pwpTrack?.("submit_waitlist", { audience: data.audience });

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";
    }

    try {
      const endpoint = (form.dataset.endpoint || "").trim();
      const provider = (form.dataset.provider || "").trim().toLowerCase();

      if (!endpoint) {
        mailtoFallback(data);
        setStatus("Opened your email app to send this — thank you!");
      } else if (provider === "formspree" || endpoint.includes("formspree.io")) {
        const payload = new FormData();
        Object.entries(data).forEach(([key, value]) => payload.append(key, value));
        const res = await fetch(endpoint, {
          method: "POST",
          body: payload,
          headers: { Accept: "application/json" },
        });
        if (res.ok) {
          form.reset();
          document.querySelectorAll(".sw-chip").forEach((chip) => chip.classList.remove("is-selected"));
          setStatus("You're on the waitlist — thank you!");
        } else {
          throw new Error("Formspree request failed");
        }
      } else {
        mailtoFallback(data);
        setStatus("Opened your email app to send this — thank you!");
      }
    } catch (err) {
      console.error(err);
      setStatus("Something went wrong — please try again or reach out on WhatsApp.", true);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = defaultBtnText;
      }
    }
  });
})();

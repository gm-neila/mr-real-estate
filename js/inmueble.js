(function () {
  const WHATSAPP = "34653108039";
  const root = document.getElementById("ficha-root");
  if (!root) return;

  const id = new URLSearchParams(location.search).get("id");

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function formatDescription(text) {
    if (!text) return "<p>Consulta disponibilidad, visitas y condiciones por WhatsApp.</p>";
    const escaped = escapeHtml(text).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    return `<p>${escaped.replace(/\n{2,}/g, "</p><p>").replace(/\n/g, "<br>")}</p>`;
  }

  function render(item) {
    const photos = (item.images && item.images.length ? item.images : [item.image]).filter(Boolean);
    const meta = [item.area, item.rooms, item.baths, item.floor && `Planta ${item.floor}`, item.city]
      .filter(Boolean);
    const extras = (item.extras || []).map((bit) => `<li>${escapeHtml(bit)}</li>`).join("");
    const specs = (item.specs || []).map((row) => `<li><span>${escapeHtml(row.label)}</span><strong>${escapeHtml(row.value)}</strong></li>`).join("");
    const thumbs = photos.map((src, i) => (
      `<button type="button" class="ficha-thumb${i === 0 ? " is-on" : ""}" data-src="${escapeHtml(src)}" aria-label="Foto ${i + 1}">
        <img src="${escapeHtml(src)}" alt="" loading="lazy" decoding="async">
      </button>`
    )).join("");
    const waText = `Hola, me interesa este inmueble de MR. Real Estate: ${item.title} (${item.price}). Ref. ${item.id}`;
    const waHref = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(waText)}`;

    document.title = `${item.title} | MR. Real Estate Salamanca`;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", `${item.title} en ${item.city || "Salamanca"}. ${item.price}.`);

    root.innerHTML = `
      <div class="ficha-grid">
        <div class="ficha-gallery">
          <div class="ficha-stage">
            <img id="ficha-stage-img" src="${escapeHtml(photos[0] || "assets/fachada.jpg")}" alt="${escapeHtml(item.title)}">
            ${item.reserved ? '<span class="sold ficha-sold">Reservado</span>' : ""}
          </div>
          ${photos.length > 1 ? `<div class="ficha-thumbs">${thumbs}</div>` : ""}
        </div>
        <aside class="ficha-side">
          <p class="pill">${escapeHtml(item.operation || "Inmueble")}</p>
          <h1>${escapeHtml(item.title)}</h1>
          <p class="ficha-price">${escapeHtml(item.price)}</p>
          <ul class="ficha-meta">${meta.map((bit) => `<li>${escapeHtml(bit)}</li>`).join("")}</ul>
          ${extras ? `<ul class="ficha-extras">${extras}</ul>` : ""}
          ${specs ? `<ul class="ficha-specs">${specs}</ul>` : ""}
          <div class="ficha-actions">
            <a class="btn btn-solid" href="${waHref}" target="_blank" rel="noreferrer">WhatsApp sobre este inmueble</a>
            <a class="btn btn-ghost" href="tel:+34653108039">Llamar 653 108 039</a>
          </div>
        </aside>
      </div>
      <section class="ficha-copy">
        <h2>Descripción</h2>
        <div class="ficha-desc">${formatDescription(item.description)}</div>
      </section>
    `;

    const stage = document.getElementById("ficha-stage-img");
    root.querySelectorAll(".ficha-thumb").forEach((btn) => {
      btn.addEventListener("click", () => {
        root.querySelectorAll(".ficha-thumb").forEach((other) => other.classList.remove("is-on"));
        btn.classList.add("is-on");
        if (stage) stage.src = btn.dataset.src;
      });
    });

    const wa = document.getElementById("ficha-wa");
    if (wa) wa.href = waHref;
  }

  function missing() {
    root.innerHTML = `
      <div class="ficha-empty">
        <h1>No encontramos este inmueble</h1>
        <p>Puede haberse alquilado o vendido. Mira la cartera actual o escríbenos.</p>
        <a class="btn btn-solid" href="index.html#inmuebles">Ver inmuebles</a>
      </div>`;
  }

  function boot(data) {
    const listings = (data && data.listings) || [];
    const item = listings.find((row) => String(row.id) === String(id));
    if (!item) missing();
    else render(item);
  }

  if (!id) {
    missing();
    return;
  }
  if (window.MR_LISTINGS && Array.isArray(window.MR_LISTINGS.listings)) {
    boot(window.MR_LISTINGS);
  } else {
    fetch("data/listings.json", { cache: "no-cache" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(boot)
      .catch(missing);
  }
}());

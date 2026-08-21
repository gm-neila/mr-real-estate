const WHATSAPP = "34653108039";

const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

const toggle = document.querySelector(".menu-toggle");
toggle?.addEventListener("click", () => {
  const open = document.body.classList.toggle("nav-open");
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
});
document.querySelectorAll(".nav a").forEach((link) => {
  link.addEventListener("click", () => {
    document.body.classList.remove("nav-open");
    toggle?.setAttribute("aria-expanded", "false");
    toggle?.setAttribute("aria-label", "Abrir menú");
  });
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !document.body.classList.contains("nav-open")) return;
  document.body.classList.remove("nav-open");
  toggle?.setAttribute("aria-expanded", "false");
  toggle?.setAttribute("aria-label", "Abrir menú");
  toggle?.focus();
});

const revealNodes = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -8% 0px" });
  revealNodes.forEach((el) => io.observe(el));
} else {
  revealNodes.forEach((el) => el.classList.add("is-in"));
}

document.querySelectorAll("[data-open]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.getElementById(btn.dataset.open)?.showModal();
  });
});
document.querySelectorAll("[data-close]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.getElementById(btn.dataset.close)?.close();
  });
});

document.querySelectorAll("[data-intent]").forEach((el) => {
  el.addEventListener("click", () => {
    const radio = document.querySelector(`input[name="intencion"][value="${el.dataset.intent}"]`);
    if (radio) radio.checked = true;
  });
});

const more = document.querySelector(".form-more");
if (more && window.matchMedia("(max-width: 767px)").matches) {
  more.removeAttribute("open");
}

const form = document.getElementById("captacion");
const statusEl = document.getElementById("form-status");
form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const nombre = String(data.get("nombre") || "").trim();
  const email = String(data.get("email") || "").trim();
  const telefono = String(data.get("telefono") || "").trim();
  const intencion = String(data.get("intencion") || "");
  const mensaje = String(data.get("mensaje") || "").trim();
  const privacidad = form.querySelector('input[name="privacidad"]')?.checked;

  if (!nombre || !telefono || !intencion) {
    statusEl.textContent = "Completa nombre, teléfono e intención.";
    return;
  }
  if (!privacidad) {
    statusEl.textContent = "Debes aceptar la política de privacidad.";
    return;
  }

  if (!/^[0-9+\s]{9,16}$/.test(telefono) || telefono.replace(/\D/g, "").length < 9) {
    statusEl.textContent = "Indica un teléfono español válido.";
    return;
  }

  const text = [
    "Hola, os escribo desde la web de MR. Real Estate.",
    `Nombre: ${nombre}`,
    email ? `Email: ${email}` : "",
    `Teléfono: ${telefono}`,
    `Intención: ${intencion}`,
    mensaje ? `Mensaje: ${mensaje}` : "",
  ].filter(Boolean).join("\n");

  const waUrl = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
  const submitBtn = form.querySelector("[type=submit]");
  if (submitBtn) submitBtn.disabled = true;
  const popup = window.open(waUrl, "_blank", "noopener");
  if (!popup) {
    statusEl.innerHTML = `Si no se abre WhatsApp, <a href="${waUrl}">pulsa aquí</a> o llama al 653 108 039.`;
  } else {
    statusEl.textContent = "Abriendo WhatsApp…";
  }
  if (submitBtn) submitBtn.disabled = false;
});

const video = document.querySelector(".band-video");

if (video) {
  const src = video.dataset.src;
  video.addEventListener("pointerdown", () => {
    if (video.dataset.ready || !src) return;
    const source = document.createElement("source");
    source.src = src;
    source.type = "video/mp4";
    video.appendChild(source);
    video.dataset.ready = "1";
    video.load();
  }, { once: true });
}

let listingsPayload = { listings: [] };
const propTrack = document.getElementById("prop-track");
const propViewport = document.getElementById("prop-viewport");
const listingsEmpty = document.getElementById("listings-empty");

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

function cardWidth() {
  const card = propTrack?.querySelector(".prop-card");
  if (!card || !propTrack) return 340;
  const gap = parseFloat(getComputedStyle(propTrack).gap) || 16;
  return card.getBoundingClientRect().width + gap;
}

function listingHref(item) {
  if (item.href) return item.href;
  if (item.id) return `inmuebles/${encodeURIComponent(item.id)}/`;
  return "#inmuebles";
}

function listingCard(item, eager) {
  const href = listingHref(item);
  const meta = (item.meta || [item.area, item.rooms, item.baths]).filter(Boolean)
    .map((bit) => `<li>${escapeHtml(bit)}</li>`).join("");
  const reserved = item.reserved ? `<span class="sold">Reservado</span>` : `<span>Disponible</span>`;
  const loading = eager ? `fetchpriority="high"` : `loading="lazy"`;
  const kind = item.kind ? `<span>${escapeHtml(item.kind)}</span>` : "";
  return `<a class="prop-card" href="${escapeHtml(href)}">
      <div class="prop-photo">
        <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" width="640" height="400" ${loading} decoding="async">
        <div class="prop-badges">${reserved}${kind}<span>${escapeHtml(item.operation)}</span></div>
      </div>
      <div class="prop-body">
        <p class="prop-price" data-price="${escapeHtml(item.price)}">0 €</p>
        <h3>${escapeHtml(item.title)}</h3>
        <ul class="prop-meta">${meta}</ul>
      </div>
    </a>`;
}

function matchesFilter(item, filter) {
  if (!filter || filter === "all") return true;
  if (filter === "Habitación") return item.kind === "Habitación";
  return item.operation === filter;
}

function featuredOf(list) {
  const sale = list.filter((item) => item.operation === "Venta").slice(0, 4);
  const rent = list.filter((item) => item.operation === "Alquiler").slice(0, 4);
  return [...rent, ...sale];
}

function activeFilter() {
  return new URLSearchParams(location.search).get("tipo") || "all";
}

function renderListings(filter) {
  const all = listingsPayload.listings || [];
  const shown = all.filter((item) => matchesFilter(item, filter));
  const highlight = filter === "all" ? featuredOf(all) : shown.slice(0, 8);
  const grid = document.getElementById("prop-grid");
  if (listingsEmpty) listingsEmpty.hidden = shown.length > 0;
  if (propTrack) {
    propTrack.innerHTML = highlight.map((item, i) => listingCard(item, i === 0)).join("");
    if (propViewport) propViewport.scrollTo({ left: 0, behavior: "auto" });
    animatePrices(propTrack.querySelectorAll("[data-price]"));
  }
  if (grid) {
    grid.innerHTML = shown.map((item) => listingCard(item, false)).join("");
    animatePrices(grid.querySelectorAll("[data-price]"));
  }
  document.querySelectorAll(".listing-filters button").forEach((btn) => {
    btn.classList.toggle("is-on", btn.dataset.filter === filter);
  });
}

function payloadHasListings(data) {
  return Boolean(data && Array.isArray(data.listings) && data.listings.length);
}

function bootListings(data) {
  listingsPayload = payloadHasListings(data) ? data : { listings: [] };
  renderListings(activeFilter());
}

if (payloadHasListings(window.MR_LISTINGS)) {
  bootListings(window.MR_LISTINGS);
} else {
  fetch("data/listings.json", { cache: "no-cache" })
    .then((res) => (res.ok ? res.json() : Promise.reject()))
    .then(bootListings)
    .catch(() => bootListings({ listings: [] }));
}

function parseEuro(text) {
  const n = Number(String(text).replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function formatEuro(value) {
  return `${Math.round(value).toLocaleString("es-ES")} €`;
}

function countUp(el, target) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || target <= 0) {
    el.textContent = formatEuro(target);
    return;
  }
  const duration = Math.min(1600, 700 + target / 400);
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = formatEuro(target * eased);
    if (t < 1) window.requestAnimationFrame(tick);
  };
  window.requestAnimationFrame(tick);
}

function animatePrices(nodes) {
  if (!nodes.length) return;
  if (!("IntersectionObserver" in window)) {
    nodes.forEach((el) => countUp(el, parseEuro(el.dataset.price)));
    return;
  }
  const ioPrice = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      ioPrice.unobserve(el);
      countUp(el, parseEuro(el.dataset.price));
    });
  }, { threshold: 0.4 });
  nodes.forEach((el) => ioPrice.observe(el));
}

document.querySelectorAll(".listing-filters button").forEach((btn) => {
  btn.addEventListener("click", () => {
    const filter = btn.dataset.filter || "all";
    const url = new URL(location.href);
    if (filter === "all") url.searchParams.delete("tipo");
    else url.searchParams.set("tipo", filter);
    history.replaceState({}, "", url);
    renderListings(filter);
  });
});

document.querySelectorAll(".prop-nav").forEach((btn) => {
  btn.addEventListener("click", () => {
    const dir = Number(btn.dataset.dir) || 1;
    propViewport?.scrollBy({ left: dir * cardWidth(), behavior: "smooth" });
  });
});


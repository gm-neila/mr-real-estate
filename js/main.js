const WHATSAPP = "34653108039";

window.addEventListener("load", () => {
  window.setTimeout(() => document.body.classList.remove("is-loading"), 700);
});
window.setTimeout(() => document.body.classList.remove("is-loading"), 2400);

document.getElementById("year").textContent = new Date().getFullYear();

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

const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-in");
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.16 });
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

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

  const text = [
    "Hola, os escribo desde la web de MR. Real Estate.",
    `Nombre: ${nombre}`,
    email ? `Email: ${email}` : "",
    `Teléfono: ${telefono}`,
    `Intención: ${intencion}`,
    mensaje ? `Mensaje: ${mensaje}` : "",
  ].filter(Boolean).join("\n");

  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  statusEl.textContent = "Abriendo WhatsApp…";
});

const video = document.querySelector(".band-video");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (video && !reduceMotion) {
  const src = video.dataset.src;
  const loadAndPlay = () => {
    if (!video.querySelector("source") && src) {
      const source = document.createElement("source");
      source.src = src;
      source.type = "video/mp4";
      video.appendChild(source);
      video.load();
    }
    video.play().catch(() => {});
  };
  const videoIo = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        loadAndPlay();
        videoIo.disconnect();
      }
    });
  }, { rootMargin: "180px" });
  videoIo.observe(video);
  video.addEventListener("error", () => video.closest(".band-reel")?.remove());
}

const WHATSAPP = "34653108039";

const loader = document.getElementById("loader");
window.addEventListener("load", () => {
  window.setTimeout(() => document.body.classList.remove("is-loading"), 700);
});
window.setTimeout(() => document.body.classList.remove("is-loading"), 2400);

document.getElementById("year").textContent = new Date().getFullYear();

const toggle = document.querySelector(".menu-toggle");
toggle?.addEventListener("click", () => {
  const open = document.body.classList.toggle("nav-open");
  toggle.setAttribute("aria-expanded", String(open));
});
document.querySelectorAll(".nav a").forEach((link) => {
  link.addEventListener("click", () => {
    document.body.classList.remove("nav-open");
    toggle?.setAttribute("aria-expanded", "false");
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

document.querySelectorAll("[data-intent]").forEach((el) => {
  el.addEventListener("click", () => {
    const radio = document.querySelector(`input[name="intencion"][value="${el.dataset.intent}"]`);
    if (radio) radio.checked = true;
  });
});

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

  if (!nombre || !email || !telefono || !intencion) {
    statusEl.textContent = "Completa nombre, email, teléfono e intención.";
    return;
  }

  const text = [
    "Hola, os escribo desde la web de MR. Real Estate.",
    `Nombre: ${nombre}`,
    `Email: ${email}`,
    `Teléfono: ${telefono}`,
    `Intención: ${intencion}`,
    mensaje ? `Mensaje: ${mensaje}` : "",
  ].filter(Boolean).join("\n");

  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  statusEl.textContent = "Abriendo WhatsApp…";
});

const video = document.querySelector(".band-video");
video?.addEventListener("error", () => {
  video.closest(".band-reel")?.remove();
});
if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  video?.pause();
}

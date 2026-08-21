import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { enrichListing, featuredListings, SITE } from "./listing-model.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function esc(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

function descHtml(text) {
  const escaped = esc(text).replace(/\n{2,}/g, "</p><p>").replace(/\n/g, "<br>");
  return `<p>${escaped}</p>`;
}

function cardHtml(item, eager) {
  const meta = (item.meta || [item.area, item.rooms, item.baths]).filter(Boolean)
    .map((bit) => `<li>${esc(bit)}</li>`).join("");
  const reserved = item.reserved ? "<span class=\"sold\">Reservado</span>" : "<span>Disponible</span>";
  const loading = eager ? "fetchpriority=\"high\"" : "loading=\"lazy\"";
  return `        <a class="prop-card" href="${esc(item.href)}">
          <div class="prop-photo">
            <img src="${esc(item.image)}" alt="${esc(item.title)}" width="640" height="400" ${loading} decoding="async">
            <div class="prop-badges">${reserved}<span>${esc(item.kind)}</span><span>${esc(item.operation)}</span></div>
          </div>
          <div class="prop-body">
            <p class="prop-price" data-price="${esc(item.price)}">${esc(item.price)}</p>
            <h3>${esc(item.title)}</h3>
            <ul class="prop-meta">${meta}</ul>
          </div>
        </a>`;
}

function listingPage(item) {
  const photos = (item.images && item.images.length ? item.images : [item.image]).filter(Boolean);
  const og = `${SITE}/${photos[0] || "assets/fachada.jpg"}`;
  const url = item.url;
  const wa = `https://wa.me/34653108039?text=${encodeURIComponent(`Hola, me interesa: ${item.title} (${item.price}). Ref. ${item.id}`)}`;
  const thumbs = photos.slice(1).map((src, i) => (
    `<a class="ficha-thumb" href="${esc("../../" + src)}"><img src="${esc("../../" + src)}" alt="" width="160" height="160" loading="lazy"></a>`
  )).join("");
  const specs = (item.specs || []).map((row) => `<li><span>${esc(row.label)}</span><strong>${esc(row.value)}</strong></li>`).join("");
  const extras = (item.extras || []).map((bit) => `<li>${esc(bit)}</li>`).join("");
  const schema = {
    "@context": "https://schema.org",
    "@type": item.kind === "Garaje" ? "ParkingFacility" : "Accommodation",
    name: item.title,
    url,
    image: og,
    description: (item.description || "").slice(0, 280),
    address: { "@type": "PostalAddress", addressLocality: item.city, addressRegion: "Castilla y León", addressCountry: "ES" },
    offers: {
      "@type": "Offer",
      price: item.priceValue || undefined,
      priceCurrency: "EUR",
      availability: item.reserved ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
      url,
    },
  };
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <base href="../../">
  <title>${esc(item.title)} | MR. Real Estate Salamanca</title>
  <meta name="description" content="${esc(`${item.kind} en ${item.city}. ${item.price}. ${item.area || ""} ${item.energyCert}.`.replace(/\s+/g, " ").trim())}">
  <link rel="canonical" href="${esc(url)}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(item.title)}">
  <meta property="og:description" content="${esc(item.price + " · " + item.kind + " en " + item.city)}">
  <meta property="og:url" content="${esc(url)}">
  <meta property="og:image" content="${esc(og)}">
  <meta name="theme-color" content="#1c1c1c">
  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="css/styles.css">
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
</head>
<body>
  <a class="skip" href="#ficha">Saltar al contenido</a>
  <header class="site-header frost">
    <a class="brand" href="index.html"><img src="assets/logo.svg" alt=""><span class="brand-name"><strong>MR.</strong><span>Real Estate</span></span></a>
    <nav class="nav" aria-label="Principal">
      <a href="index.html#inmuebles">Inmuebles</a>
      <a href="index.html#contacto">Contacto</a>
    </nav>
  </header>
  <main id="ficha" class="ficha">
    <p class="ficha-back"><a href="index.html#inmuebles">← Volver a inmuebles</a></p>
    <div class="ficha-grid">
      <div class="ficha-gallery">
        <div class="ficha-stage">
          <img src="${esc(photos[0] || "assets/fachada.jpg")}" width="960" height="600" alt="${esc(item.title)}">
          ${item.reserved ? '<span class="sold ficha-sold">Reservado</span>' : ""}
        </div>
        ${thumbs ? `<div class="ficha-thumbs">${thumbs}</div>` : ""}
      </div>
      <aside class="ficha-side">
        <p class="pill">${esc(item.kind)} · ${esc(item.operation)}</p>
        <h1>${esc(item.title)}</h1>
        <p class="ficha-price">${esc(item.price)}</p>
        <ul class="ficha-meta">${(item.meta || []).map((bit) => `<li>${esc(bit)}</li>`).join("")}</ul>
        ${extras ? `<ul class="ficha-extras">${extras}</ul>` : ""}
        ${specs ? `<ul class="ficha-specs">${specs}</ul>` : ""}
        <div class="ficha-actions">
          <a class="btn btn-solid" href="${esc(wa)}">WhatsApp sobre este inmueble</a>
          <a class="btn btn-ghost" href="tel:+34653108039">Llamar 653 108 039</a>
        </div>
      </aside>
    </div>
    <section class="ficha-copy">
      <h2>Descripción</h2>
      <div class="ficha-desc">${descHtml(item.description)}</div>
    </section>
  </main>
  <footer class="site-footer">
    <div><h2>MR. Real Estate</h2><p>Av. Campoamor, 18, 37003 Salamanca</p></div>
    <div><a href="aviso.html">Aviso legal</a><br><a href="privacidad.html">Privacidad</a></div>
  </footer>
</body>
</html>
`;
}

function patchIndex(listings) {
  const featured = featuredListings(listings);
  const indexPath = path.join(ROOT, "index.html");
  let html = fs.readFileSync(indexPath, "utf8");
  const cards = featured.map((item, i) => cardHtml(item, i === 0)).join("\n");
  html = html.replace(
    /<!--TRACK_START-->[\s\S]*?<!--TRACK_END-->/,
    `<!--TRACK_START-->\n        <div class="prop-track" id="prop-track">\n${cards}\n        </div>\n        <!--TRACK_END-->`
  );
  const grid = listings.map((item) => cardHtml(item, false)).join("\n");
  html = html.replace(
    /<!--GRID_START-->[\s\S]*?<!--GRID_END-->/,
    `<!--GRID_START-->\n      <div class="prop-grid" id="prop-grid">\n${grid}\n      </div>\n      <!--GRID_END-->`
  );
  fs.writeFileSync(indexPath, html);
}

export function rebuildFromPayload(payload) {
  const listings = (payload.listings || []).map(enrichListing);
  const out = { ...payload, listings };
  fs.writeFileSync(path.join(ROOT, "data", "listings.json"), JSON.stringify(out, null, 2));
  fs.writeFileSync(path.join(ROOT, "js", "listings-data.js"), `window.MR_LISTINGS = ${JSON.stringify(out)};\n`);

  const dir = path.join(ROOT, "inmuebles");
  fs.mkdirSync(dir, { recursive: true });
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) fs.rmSync(full, { recursive: true, force: true });
  }
  for (const item of listings) {
    const dest = path.join(dir, item.id);
    fs.mkdirSync(dest, { recursive: true });
    fs.writeFileSync(path.join(dest, "index.html"), listingPage(item));
  }

  const urls = [`${SITE}/`, `${SITE}/aviso.html`, `${SITE}/privacidad.html`, ...listings.map((item) => item.url)];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((loc) => `  <url><loc>${loc}</loc></url>`).join("\n")}
</urlset>
`;
  fs.writeFileSync(path.join(ROOT, "sitemap.xml"), sitemap);
  fs.writeFileSync(path.join(ROOT, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
  patchIndex(listings);
  return listings;
}

const runningDirect = process.argv[1] && path.normalize(process.argv[1]).endsWith("build-listings.mjs");
if (runningDirect) {
  const payload = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "listings.json"), "utf8"));
  const listings = rebuildFromPayload(payload);
  console.log(`Rebuild ${listings.length} fichas estáticas`);
}

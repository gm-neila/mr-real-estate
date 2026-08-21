import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
const ORIGIN = "https://www.milanuncios.com";
const MAX_IMAGES = 12;
const DELAY_MS = 550;

const config = JSON.parse(fs.readFileSync(path.join(__dirname, "portals.json"), "utf8"));

function cleanShopUrl(raw) {
  try {
    const parsed = new URL(String(raw || "").trim());
    return `${parsed.origin}${parsed.pathname}`.replace(/\/$/, "");
  } catch {
    return String(raw || "").split("?")[0].replace(/\/$/, "");
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseProps(html) {
  const match = html.match(/window\.__INITIAL_PROPS__ = JSON\.parse\("(.+?)"\);<\/script>/);
  if (!match) return null;
  return JSON.parse(JSON.parse(`"${match[1]}"`));
}

async function fetchHtml(url, attempts = 3) {
  let last = "";
  for (let i = 0; i < attempts; i += 1) {
    if (i) await sleep(1200 * i);
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        "Accept-Language": "es-ES,es;q=0.9",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) {
      last = String(res.status);
      continue;
    }
    const html = await res.text();
    if (parseProps(html)) return html;
    last = "sin __INITIAL_PROPS__";
  }
  throw new Error(`No se pudo leer ${url} (${last})`);
}

function attr(ad, type) {
  return (ad.attributes || []).find((item) => item.type === type) || null;
}

function tagText(ad, type) {
  return ((ad.tags || []).find((item) => item.type === type) || {}).text || "";
}

function displayTitle(ad) {
  const desc = ad.description || "";
  const matches = [...desc.matchAll(/\*\*([^*\n]{4,80})\*\*/g)].map((m) => m[1].trim());
  const good = matches.find((text) => {
    const clean = text.replace(/\s*\|\s*MR\.?\s*REAL ESTATE.*/i, "").trim();
    if (/^\d[\d.,]*\s*m/i.test(clean)) return false;
    if (/^(mr\.?\s*)?real estate$/i.test(clean)) return false;
    if (clean.length > 58) return false;
    if (/^(ref|¡)/i.test(clean)) return false;
    if (/(presenta|situado|ofrece|buscas|este fantástico)/i.test(clean)) return false;
    return true;
  });
  if (good) return good.replace(/\s*\|\s*MR\.?\s*REAL ESTATE.*/i, "").trim();
  const category = (ad.category && ad.category.name) || "Inmueble";
  const city = (ad.location && ad.location.city && ad.location.city.name) || ad.city || "Salamanca";
  return `${category} en ${city}`;
}

function operationOf(ad) {
  const blob = `${ad.category?.name || ""} ${ad.category?.slug || ""}`;
  if (/alquiler/i.test(blob)) return "Alquiler";
  if (/venta/i.test(blob)) return "Venta";
  return "Inmueble";
}

function formatPrice(value) {
  if (!Number.isFinite(value) || value <= 0) return "Consultar";
  return `${Math.round(value).toLocaleString("es-ES")} €`;
}

function listingHref(id) {
  return `inmueble.html?id=${id}`;
}

function imageUrl(raw) {
  if (!raw) return "";
  if (typeof raw === "object") raw = raw.src || raw.url || raw.href || "";
  if (typeof raw !== "string") return "";
  return raw.replace(/\?rule=hw\d+$/i, "");
}

function cardHtml(item, eager) {
  const meta = [item.area, item.rooms, item.baths].filter(Boolean)
    .map((bit) => `<li>${esc(bit)}</li>`).join("");
  const reserved = item.reserved ? "<span class=\"sold\">Reservado</span>" : "<span>Disponible</span>";
  const loading = eager ? "fetchpriority=\"high\"" : "loading=\"lazy\"";
  return `        <a class="prop-card" href="${esc(item.href)}">
          <div class="prop-photo">
            <img src="${esc(item.image)}" alt="${esc(item.title)}" ${loading} decoding="async">
            <div class="prop-badges">${reserved}<span>${esc(item.operation)}</span></div>
          </div>
          <div class="prop-body">
            <p class="prop-price" data-price="${esc(item.price)}">${esc(item.price)}</p>
            <h3>${esc(item.title)}</h3>
            <ul class="prop-meta">${meta}</ul>
          </div>
        </a>`;
}

function esc(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

function priceValueOf(ad) {
  const n = Number(ad.price?.cashPrice?.value);
  if (Number.isFinite(n) && n > 0) return n;
  const text = ad.price?.cashPrice?.text || "";
  const parsed = Number(String(text).replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function areaOf(ad) {
  return attr(ad, "squareMeters")?.valueFormatted || tagText(ad, "metros cuadrados") || tagText(ad, "m²");
}

function mapAd(ad) {
  const id = String(ad.id);
  const priceValue = priceValueOf(ad);
  const bedrooms = attr(ad, "bedrooms")?.valueFormatted || tagText(ad, "dormitorios");
  const bathrooms = attr(ad, "bathrooms")?.valueFormatted || tagText(ad, "baños");
  const area = areaOf(ad);
  const city = ad.location?.city?.name || ad.city || ad.title || "Salamanca";
  const remoteImages = (ad.images || []).slice(0, MAX_IMAGES).map(imageUrl).filter(Boolean);
  const images = remoteImages.map((_, i) => `assets/listings/${id}/${String(i + 1).padStart(2, "0")}.jpg`);
  return {
    id,
    title: displayTitle(ad),
    category: ad.category?.name || "Inmueble",
    operation: operationOf(ad),
    price: formatPrice(priceValue),
    priceValue,
    city,
    rooms: bedrooms ? (/dorm/i.test(bedrooms) ? bedrooms : `${bedrooms} dorm.`) : "",
    baths: bathrooms ? (/baño/i.test(bathrooms) ? bathrooms : `${bathrooms} baños`) : "",
    area: area || "",
    floor: attr(ad, "floor")?.valueFormatted || "",
    reserved: Boolean(ad.isReserved),
    image: images[0] || "",
    images,
    remoteImages,
    description: ad.description || "",
    extras: (ad.extras || [])
      .filter((item) => /sí|yes/i.test(item.valueFormatted || item.value || ""))
      .map((item) => item.fieldFormatted || item.type)
      .concat([...(ad.description || "").matchAll(/#\s*([^#\n]+)/g)].map((m) => m[1].trim()))
      .filter((item, i, arr) => item && item.length < 42 && arr.indexOf(item) === i)
      .slice(0, 12),
    specs: (ad.attributes || [])
      .filter((item) => item.type !== "squareMeterPrice")
      .map((item) => ({ label: item.fieldFormatted, value: item.valueFormatted })),
    href: listingHref(id),
    sourceUrl: ad.url ? (ad.url.startsWith("http") ? ad.url : ORIGIN + ad.url) : "",
  };
}

async function downloadImage(url, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (fs.existsSync(dest) && fs.statSync(dest).size > 2000) return true;
  const candidates = [...new Set([
    url,
    url.replace(/\?rule=hw\d+$/i, ""),
    /\?/.test(url) ? url : `${url}?rule=hw545`,
  ].filter(Boolean))];
  for (const candidate of candidates) {
    const res = await fetch(candidate, {
      headers: {
        "User-Agent": UA,
        Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
        "Accept-Language": "es-ES,es;q=0.9",
      },
    });
    if (!res.ok) continue;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 800) continue;
    fs.writeFileSync(dest, buf);
    return true;
  }
  console.warn("img fail", url);
  return false;
}

function patchIndex(listings) {
  const indexPath = path.join(ROOT, "index.html");
  let html = fs.readFileSync(indexPath, "utf8");
  const cards = listings.map((item, i) => cardHtml(item, i < 2)).join("\n");
  const next = html.replace(
    /<div class="prop-track" id="prop-track">[\s\S]*?<\/div>(?=\s*<\/div>\s*<button class="prop-nav" type="button" data-dir="1")/,
    `<div class="prop-track" id="prop-track">\n${cards}\n        </div>`
  );
  if (next === html) {
    console.warn("No se pudo incrustar el carrusel en index.html (el marcador no coincidió).");
    return;
  }
  html = next.replace(
    /Anuncios reales de nuestra tienda en Milanuncios\.[^<]*/,
    "Cartera propia en Salamanca. Abre cada ficha en esta web: fotos, texto y contacto directo."
  );
  html = html.replace(
    /No hay anuncios en este filtro\. Mira la tienda completa en Milanuncios\./,
    "No hay anuncios en este filtro."
  );
  html = html.replace(
    /<a class="btn btn-solid" href="https:\/\/www\.milanuncios\.com\/tiendas-profesionales\/mr-real-estate-554544"[^>]*>Ver todos los anuncios<\/a>\s*/,
    ""
  );
  fs.writeFileSync(indexPath, html);
}

function pruneOldThumbs(keepIds) {
  const dir = path.join(ROOT, "assets", "listings");
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isFile() && /\.jpe?g$/i.test(name)) {
      fs.unlinkSync(full);
    }
    if (stat.isDirectory() && !keepIds.has(name)) {
      fs.rmSync(full, { recursive: true, force: true });
    }
  }
}

async function syncMilanuncios() {
  if (config.idealistaProUrl) {
    if (/pro\/mr-realestate/i.test(config.idealistaProUrl) || /palma/i.test(config.idealistaProUrl)) {
      throw new Error("La URL de Idealista configurada es la de Palma / otra empresa. No se importa.");
    }
    console.warn("Idealista Pro aún no está conectado. Se usa la tienda de Milanuncios (Fotocasa Pro).");
  }

  const shopUrl = cleanShopUrl(config.milanunciosShop);
  const shopHtml = await fetchHtml(shopUrl);
  const shop = parseProps(shopHtml);
  if (!shop || !Array.isArray(shop.ads)) {
    throw new Error("Milanuncios devolvió captcha o HTML sin anuncios. Ábrelo en el navegador y vuelve a ejecutar el script.");
  }

  const listings = [];
  for (const [index, teaser] of shop.ads.entries()) {
    process.stdout.write(`[${index + 1}/${shop.ads.length}] ${teaser.id} `);
    const item = mapAd(teaser);
    const kept = [];
    for (let i = 0; i < item.remoteImages.length; i += 1) {
      const dest = path.join(ROOT, item.images[i]);
      const ok = await downloadImage(item.remoteImages[i], dest);
      if (ok) kept.push(item.images[i]);
      await sleep(60);
    }
    item.images = kept;
    item.image = kept[0] || "";
    delete item.remoteImages;
    listings.push(item);
    console.log(`${kept.length} fotos · ${item.title}`);
  }

  const payload = {
    source: shopUrl,
    updated: new Date().toISOString().slice(0, 10),
    listings,
  };
  fs.mkdirSync(path.join(ROOT, "data"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "data", "listings.json"), JSON.stringify(payload, null, 2));
  fs.writeFileSync(
    path.join(ROOT, "js", "listings-data.js"),
    `window.MR_LISTINGS = ${JSON.stringify(payload)};\n`
  );
  pruneOldThumbs(new Set(listings.map((item) => item.id)));
  patchIndex(listings);
  console.log(`OK ${listings.length} inmuebles → data/listings.json`);
}

syncMilanuncios().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

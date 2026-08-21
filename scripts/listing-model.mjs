const SITE = "https://gm-neila.github.io/mr-real-estate";

const TITLES = {
  "610471112": "Piso amueblado de 70 m² para el curso, 3 dormitorios",
  "610910295": "Piso de estudiantes de 90 m², 5 habitaciones",
  "586931041": "Habitación de 14 m² a 5 minutos de Plaza Mayor",
  "610769974": "Habitación en piso compartido, zona universitaria",
  "594791102": "Piso de 90 m² y 3 dormitorios en Salamanca",
  "594941186": "Ático de 66 m² y 1 dormitorio en Salamanca",
  "610472737": "Habitación para estudiantes en piso compartido",
  "609938217": "Piso de 100 m² en 2ª planta con ascensor",
  "591884823": "Piso de 100 m² y 4 dormitorios en Salamanca",
  "609940888": "Piso de estudiantes de 112 m², 4 habitaciones",
  "609939973": "Habitación en piso de estudiantes, 270 € al mes",
  "602529188": "Garaje en calle Méjico, 13 m²",
  "609806618": "Piso de 100 m² para grupo de estudiantes",
  "609798299": "Habitación en Avenida Filiberto Villalobos, 370 €",
  "609797677": "Habitación en Avenida Filiberto Villalobos, 360 €",
  "609796669": "Habitación en calle Lucero, 375 € al mes",
  "609535248": "Habitación de 17 m² en Salamanca, 420 €",
  "608986102": "Bajo reformado de 65 m² y 2 dormitorios",
  "594210918": "Loft-estudio de 55 m² junto a San Esteban",
  "585471870": "Piso de 86 m² en San Cristóbal de la Cuesta",
  "587030127": "Habitación de 12 m² en Plaza del Oeste",
  "596918803": "Piso de 55 m² en 4ª planta, sin ascensor",
  "585613278": "Piso de 70 m² en Calvarrasa de Abajo",
  "606831251": "Piso de 105 m² en Camino de las Aguas",
  "587451792": "Piso de 115 m² y 4 dormitorios en Salamanca",
  "593685222": "Piso de 60 m² y 3 dormitorios, 975 € al mes",
  "594212769": "Loft de 55 m² en alquiler junto a San Esteban",
  "585600025": "Piso de 62 m² y 2 dormitorios en Salamanca",
};

const KINDS = {
  "586931041": "Habitación",
  "610769974": "Habitación",
  "610472737": "Habitación",
  "609939973": "Habitación",
  "609798299": "Habitación",
  "609797677": "Habitación",
  "609796669": "Habitación",
  "609535248": "Habitación",
  "587030127": "Habitación",
  "602529188": "Garaje",
  "594941186": "Ático",
  "594210918": "Estudio",
  "594212769": "Estudio",
};

const AREA_OVERRIDES = {
  "602529188": "13 m²",
  "610769974": "12 m²",
};

function countFrom(text) {
  const n = parseInt(String(text || "").replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

function dormLabel(raw) {
  const n = countFrom(raw);
  if (!n) return "";
  return n === 1 ? "1 dorm." : `${n} dorm.`;
}

function bathLabel(raw) {
  const n = countFrom(raw);
  if (!n) return "";
  return n === 1 ? "1 baño" : `${n} baños`;
}

function detectKind(item, desc) {
  if (KINDS[item.id]) return KINDS[item.id];
  const cat = `${item.category || ""} ${item.title || ""}`;
  if (/garaje/i.test(cat)) return "Garaje";
  if (/ático|atico/i.test(cat)) return "Ático";
  if (/\bestudio\b|loft/i.test(cat + " " + desc)) return "Estudio";
  const area = parseInt(String(item.area || "").replace(/[^\d]/g, ""), 10) || 0;
  const roomWord = /\bhabitaci[oó]n\b/i.test(`${item.title} ${desc}`);
  if (item.operation === "Alquiler" && roomWord && (area <= 30 || /habitaci[oó]n en/i.test(desc))) {
    return "Habitación";
  }
  return "Piso";
}

function extractFloor(desc, fallback) {
  if (fallback) return fallback;
  const m = desc.match(/(\d+(?:ª|º)?)\s*planta/i) || desc.match(/\ben\s+(bajo)\b/i);
  if (!m) return "";
  if (/bajo/i.test(m[1] || m[0])) return "Bajo";
  return m[1].replace("º", "ª") + (/planta/i.test(m[0]) && !/planta/i.test(m[1]) ? " planta" : "");
}

function hasElevator(desc) {
  if (/sin ascensor/i.test(desc)) return false;
  if (/con ascensor|ascensor/i.test(desc)) return true;
  return null;
}

function expensesIncluded(desc) {
  if (/gastos incluidos/i.test(desc)) return true;
  if (/luz y gas a parte|gastos a parte|no incluye gastos/i.test(desc)) return false;
  return null;
}

function energyCert(desc) {
  const m = desc.match(/certificad[oa]\s+energ[eé]tic[oa][^.\n]{0,40}([A-G])/i)
    || desc.match(/\bCEE\b[^.\n]{0,20}([A-G])/i);
  if (m) return `Clase ${m[1].toUpperCase()}`;
  return "Consultar certificado energético";
}

function cleanDescription(id, raw) {
  let text = String(raw || "");
  text = text.replace(/\*\*/g, "");
  text = text.replace(/^Ref:\s*[\/\*0-9]+\.?\s*/i, "");
  text = text.replace(/\s*#\s*[^#\n]+/g, "");
  text = text.replace(/[#\s]+$/g, "").trim();
  text = text.replace(/(\d+)\s*€\s*€/gi, "$1 €");
  text = text.replace(/Llama o escribe al y ven/gi, "Llama o escribe al 653 108 039 y ven");
  text = text.replace(/HABITACIÓN SOLO PARA CHICAS[^\n]*/gi, "Habitación en piso compartido");
  text = text.replace(/preferentemente a?\s*grupo de chicas estudiantes/gi, "pensada para un grupo de estudiantes");
  text = text.replace(/SOLO PARA CHICAS,?\s*tanto estudiantes como trabajadoras/gi, "para estudiantes o profesionales");
  text = text.replace(/ideal para una chica que/gi, "ideal para quien");
  text = text.replace(/conviven otras chicas/gi, "conviven otras personas");
  text = text.replace(/\n+\s*para estudiantes o profesionales\.?/gi, "\n\nHabitación pensada para estudiantes o profesionales.");
  if (id === "606831251") text = text.replace(/249\.?900/g, "244.900");
  text = text.replace(/\n{3,}/g, "\n\n").trim();
  return text;
}

export function enrichListing(item) {
  const description = cleanDescription(item.id, item.description);
  const kind = detectKind(item, description);
  const title = TITLES[item.id] || item.title;
  const floor = extractFloor(description, item.floor);
  const elevator = hasElevator(description);
  const expenses = expensesIncluded(description);
  const city = String(item.city || "Salamanca").replace(/Cristobal/g, "Cristóbal");
  const area = AREA_OVERRIDES[item.id] || item.area || "";
  const dwellingRooms = dormLabel(item.rooms);
  const baths = bathLabel(item.baths);
  const extras = [];
  if (elevator === true) extras.push("Ascensor");
  if (elevator === false) extras.push("Sin ascensor");
  if (expenses === true) extras.push("Gastos incluidos");
  if (expenses === false) extras.push("Gastos no incluidos");
  if (floor) extras.push(floor);

  const rooms = kind === "Habitación" && dwellingRooms
    ? `en piso de ${dwellingRooms.replace(" dorm.", " dorm.")}`
    : dwellingRooms;

  const meta = kind === "Habitación"
    ? [area, rooms, baths].filter(Boolean)
    : [area, dwellingRooms, baths].filter(Boolean);

  return {
    ...item,
    title,
    kind,
    city,
    area,
    rooms: kind === "Habitación" ? rooms : dwellingRooms,
    baths,
    floor,
    energyCert: energyCert(description),
    expensesIncluded: expenses,
    elevator,
    extras,
    specs: [
      area && { label: kind === "Habitación" ? "Superficie de la pieza" : "Superficie", value: area },
      kind === "Habitación" && dwellingRooms && { label: "Piso", value: dwellingRooms },
      baths && { label: "Baños", value: baths },
      floor && { label: "Planta", value: floor },
      { label: "Certificado energético", value: energyCert(description) },
    ].filter(Boolean),
    description,
    href: `inmuebles/${item.id}/`,
    url: `${SITE}/inmuebles/${item.id}/`,
    meta,
  };
}

export function featuredListings(listings) {
  const sale = listings.filter((item) => item.operation === "Venta").slice(0, 4);
  const rent = listings.filter((item) => item.operation === "Alquiler").slice(0, 4);
  return [...rent, ...sale];
}

export { SITE };

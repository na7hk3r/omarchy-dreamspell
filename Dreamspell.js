// Dreamspell — Jose Arguelles' 13-Moon / Tzolkin calendar maths.
//
// Plain QML-compatible script: top-level `var` and `function` only, no ESM
// `export` and no `.pragma`, so the exact same file can be unit-tested outside
// QML (see test/dreamspell.test.js).
//
// Correlation verified against independent sources:
//   1987-07-26 -> Kin 34, White Galactic Wizard   (Dreamspell anchor, Julian-free count)
//   2026-10-15 -> Kin 50, White Spectral Dog      (cross-checked against a live calculator)
// February 29 folds onto February 28 ("0.0 Hunab Ku") and never advances the kin.

var SEALS = [
  "Dragon", "Wind", "Night", "Seed", "Serpent",
  "World-Bridger", "Hand", "Star", "Moon", "Dog",
  "Monkey", "Human", "Skywalker", "Wizard", "Eagle",
  "Warrior", "Earth", "Mirror", "Storm", "Sun"
];

// Mesoamerican day-sign names, shown as a secondary label in the panel.
var GLYPHS = [
  "Imix", "Ik", "Akbal", "Kan", "Chicchan",
  "Cimi", "Manik", "Lamat", "Muluc", "Oc",
  "Chuen", "Eb", "Ben", "Ix", "Men",
  "Cib", "Caban", "Etznab", "Cauac", "Ahau"
];

var TONES = [
  "Magnetic", "Lunar", "Electric", "Self-Existing", "Overtone",
  "Rhythmic", "Resonant", "Galactic", "Solar", "Planetary",
  "Spectral", "Crystal", "Cosmic"
];

// The same thirteen tones written in Yucatec Maya, because the day sign beside
// them in the glyph label is Mayan. Modern orthography, as in Wiktionary's
// "Appendix:Yucatec Maya numerals": the glottal stop is U+02BC rather than an
// apostrophe, and the long high-tone vowels take an acute accent. The colonial
// spellings (hun, ca, ox, uaxac, buluc) are the same words in 16th-century
// missionary dress -- which is the dress the day-sign names in GLYPHS wear.
var TONE_WORDS = [
  "jun", "kaʼa", "óox", "kan", "joʼo",
  "wak", "wuk", "waxak", "bolon", "lajun",
  "buluk", "lajkaʼa", "óoxlajun"
];

var COLORS = ["Red", "White", "Blue", "Yellow"];

var CASTLES = [
  "Red Eastern Castle of Turning",
  "White Northern Castle of Crossing",
  "Blue Western Castle of Burning",
  "Yellow Southern Castle of Giving",
  "Green Central Castle of Enchantment"
];

var WEEKDAYS = ["Dali", "Seli", "Gamma", "Kali", "Alpha", "Limi", "Sillio"];

// Cumulative days before each month in a 365-day year.
var MONTH_DAYS = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

// The guide sits in the same colour family, its position chosen by the tone.
var GUIDE_OFFSETS = [0, -8, 4, -4, 8];

// The right-click cycle, in order. "icon" is the one that is not words: the bar
// draws the seal's glyph itself, so labelForKin returns an empty string for it.
// The right-click cycle, in order. The tone's number leads and its name follows,
// so one stop from "11 Dog" is "Spectral Dog" (S16).
var LABEL_FORMATS = ["toneSeal", "toneNameSeal", "kin", "glyph", "icon"];

var MS_PER_DAY = 86400000;

// ---------------------------------------------------------------- small utils

function isWhole(value) {
  return typeof value === "number" && isFinite(value) && Math.floor(value) === value;
}

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonth(year, month) {
  var lengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month === 2 && isLeapYear(year)) return 29;
  return lengths[month - 1];
}

function isValidDate(year, month, day) {
  if (!isWhole(year) || !isWhole(month) || !isWhole(day)) return false;
  if (year < 1) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > daysInMonth(year, month)) return false;
  return true;
}

// Map any integer onto the 1..260 range of the sacred cycle.
function norm260(value) {
  var rest = ((value % 260) + 260) % 260;
  return rest === 0 ? 260 : rest;
}

// Map any integer onto the 1..20 range of the solar seals.
function norm20(value) {
  var rest = ((value % 20) + 20) % 20;
  return rest === 0 ? 20 : rest;
}

// ------------------------------------------------------------------ the kin

// Kin (1..260) of a Gregorian date, or null when the date does not exist.
function kinForDate(year, month, day) {
  if (!isValidDate(year, month, day)) return null;
  // February 29 is the "0.0 Hunab Ku" day: it carries the kin of February 28.
  var effectiveDay = (month === 2 && day === 29) ? 28 : day;
  return norm260(((year * 365) % 260) + MONTH_DAYS[month - 1] + effectiveDay - 28);
}

function sealForKin(kin) {
  return norm20(norm260(kin));
}

function toneForKin(kin) {
  var rest = norm260(kin) % 13;
  return rest === 0 ? 13 : rest;
}

function colorForSeal(seal) {
  return COLORS[(norm20(seal) - 1) % 4];
}

function colorForKin(kin) {
  return colorForSeal(sealForKin(kin));
}

function sealName(seal) {
  return SEALS[norm20(seal) - 1];
}

function glyphName(seal) {
  return GLYPHS[norm20(seal) - 1];
}

// The glyph artwork ships next to the panel as seals/<NN>-<day-sign>.svg, so a
// seal number alone is enough to find it. The file names follow this slug, which
// is why the day-sign spelling in GLYPHS is load-bearing rather than cosmetic.
function sealSlug(seal) {
  return GLYPHS[norm20(seal) - 1].toLowerCase();
}

function pad2(value) {
  return (value < 10 ? "0" : "") + value;
}

function sealAsset(seal) {
  var value = norm20(seal);
  return "seals/" + pad2(value) + "-" + sealSlug(value) + ".svg";
}

// Every seal ships in two polarities: the pristine Commons tracing, whose fill
// is black, and a generated -light sibling. Choosing between two files is
// deliberate: tinting one file at runtime proved unreliable, and a black glyph
// is invisible on a dark bar.
var GLYPH_LIGHT_SUFFIX = "-light";
var GLYPH_LUMINANCE_THRESHOLD = 0.55;

function assetVariant(asset, variant) {
  if (!asset) {
    return "";
  }
  if (variant !== "light") {
    return asset;
  }
  return asset.replace(/\.svg$/, GLYPH_LIGHT_SUFFIX + ".svg");
}

// Component values are the 0..1 floats QML reports for a color. Two questions
// share one threshold: which shipped polarity matches a wanted color, and which
// one stays legible on a fill. They are opposites, so each keeps its own name.
function glyphVariant(r, g, b) {
  var luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > GLYPH_LUMINANCE_THRESHOLD ? "light" : "dark";
}

// The bar asks which polarity matches its foreground; a plate asks which one
// contrasts with its own fill. Answering the wrong question is how a black
// glyph ended up on a black bar.
function glyphAgainstFill(r, g, b) {
  return glyphVariant(r, g, b) === "light" ? "dark" : "light";
}

function toneName(tone) {
  var index = ((tone - 1) % 13 + 13) % 13;
  return TONES[index];
}

function toneWord(tone) {
  var index = ((tone - 1) % 13 + 13) % 13;
  return TONE_WORDS[index];
}

function normalizeTone(tone) {
  return (((tone - 1) % 13) + 13) % 13 + 1;
}

// A Dreamspell tone is written as its Mayan numeral: dots for 1-4, a bar for 5,
// bar plus dots for 6-9, two bars plus dots for 10-13. Those numerals live at
// U+1D2E0, one code point per number, and the block is astral -- so the pair is
// assembled by hand rather than through String.fromCodePoint, which Qt's QML JS
// engine is not guaranteed to expose, and never through String.fromCharCode,
// which would silently truncate an astral code point to a wrong glyph.
var MAYAN_NUMERAL_ZERO = 0x1D2E0;

function astralChar(codePoint) {
  var offset = codePoint - 0x10000;
  return String.fromCharCode(0xD800 + (offset >> 10), 0xDC00 + (offset & 0x3FF));
}

function mayaNumeral(tone) {
  return astralChar(MAYAN_NUMERAL_ZERO + normalizeTone(tone));
}

function moonName(moon) {
  var index = ((moon - 1) % 13 + 13) % 13;
  return TONES[index];
}

function castleName(castle) {
  var index = Math.min(Math.max(castle, 1), 5) - 1;
  return CASTLES[index];
}

// --------------------------------------------------------------- the oracle

// The four supporting seals around a kin. All five share the kin's tone.
function oracleForKin(kin) {
  var kinValue = norm260(kin);
  var seal = sealForKin(kinValue);
  var tone = toneForKin(kinValue);
  var offset = GUIDE_OFFSETS[(tone - 1) % 5];
  return {
    guide: norm20(seal + offset),
    analog: norm20(19 - seal),
    antipode: norm20(seal < 11 ? seal + 10 : seal - 10),
    occult: norm20(21 - seal)
  };
}

// ----------------------------------------------------- wavespell and castle

// The 13-day wavespell a kin belongs to: the seal of its opening day names it.
function wavespellForKin(kin) {
  var kinValue = norm260(kin);
  var tone = toneForKin(kinValue);
  var opening = kinValue - tone + 1;
  return {
    kin: opening,
    seal: sealForKin(opening),
    day: tone
  };
}

function castleForKin(kin) {
  return Math.floor((norm260(kin) - 1) / 52) + 1;
}

// --------------------------------------------------- the 13 Moon year (365)

// The 13-Moon year opens on July 26 and closes on July 25 (Day Out of Time).
function moonYearStart(year, month, day) {
  if (month > 7 || (month === 7 && day >= 26)) return year;
  return year - 1;
}

function moonDateFor(year, month, day) {
  if (!isValidDate(year, month, day)) return null;
  var startYear = moonYearStart(year, month, day);
  var start = Date.UTC(startYear, 6, 26);
  var target = Date.UTC(year, month - 1, day);
  var offset = Math.round((target - start) / MS_PER_DAY);

  if (offset >= 364) {
    return { kind: "out-of-time", moon: 0, moonName: "", day: 0, weekday: "", offset: offset };
  }

  var moon = Math.floor(offset / 28) + 1;
  var dayOfMoon = (offset % 28) + 1;
  return {
    kind: "moon",
    moon: moon,
    moonName: moonName(moon),
    day: dayOfMoon,
    weekday: WEEKDAYS[(dayOfMoon - 1) % 7],
    offset: offset
  };
}

// The solar ring ("anillo solar") is a cycle of 52 thirteen-moon years, written
// in the synchronary as NS<ring>.<year>. The epoch is the 1987/88 year, which is
// NS1.0 -- the year number is a zero-based offset from 1987, NOT a one-based
// ordinal. This was the one reading our first implementation got wrong (it said
// 40 for 2026/27); it is corroborated two ways:
//   13lunas.net's own synchronary for 2026/27 is published as "Anillo Solar
//     NS1.39 codificado por el Kin 229: Luna Galactica Roja (Ano 2026/2027)"
//   and its 2024/25 synchronary is published as NS1.37 (2024 - 1987 = 37).
var RING_EPOCH = 1987;
var RING_LENGTH = 52;

// The year is named after the kin that opens it on July 26.
function yearBearerFor(year, month, day) {
  if (!isValidDate(year, month, day)) return null;
  var startYear = moonYearStart(year, month, day);
  var kin = kinForDate(startYear, 7, 26);
  var seal = sealForKin(kin);
  var offset = startYear - RING_EPOCH;
  var ring = 1 + Math.floor(offset / RING_LENGTH);
  // Years before the epoch fold back into ring 1 rather than running into ring 0
  // or below, so the ring number is never less than one.
  if (ring < 1) ring = 1;
  var yearInRing = ((offset % RING_LENGTH) + RING_LENGTH) % RING_LENGTH;
  return {
    kin: kin,
    startYear: startYear,
    seal: seal,
    sealName: sealName(seal),
    toneName: toneName(toneForKin(kin)),
    color: colorForSeal(seal),
    asset: sealAsset(seal),
    ring: ring,
    yearInRing: yearInRing,
    ns: "NS" + ring + "." + yearInRing
  };
}

// ------------------------------------------------------------ presentation

function labelForKin(kin, format) {
  var kinValue = norm260(kin);
  var tone = toneForKin(kinValue);
  var seal = sealForKin(kinValue);

  if (format === "kin") return "Kin " + kinValue;
  // The day-sign name in this format is the Mayan one, so its tone is written in
  // Maya too: the number word, not the Dreamspell tone name.
  if (format === "glyph") return toneWord(tone) + " " + glyphName(seal);
  // This one keeps the Dreamspell tone name, because the seal beside it is a
  // Dreamspell seal rather than a day sign.
  if (format === "toneNameSeal") return toneName(tone) + " " + sealName(seal);
  // No words on purpose: the bar renders the seal's glyph for this format, and
  // a text fallback would print the seal name beside the image.
  if (format === "icon") return "";
  return tone + " " + sealName(seal);
}

function nextLabelFormat(current) {
  var index = LABEL_FORMATS.indexOf(current);
  if (index < 0) return LABEL_FORMATS[0];
  return LABEL_FORMATS[(index + 1) % LABEL_FORMATS.length];
}

function moonLabel(moon) {
  if (!moon || moon.kind === "out-of-time") return "Day Out of Time";
  return "Moon " + moon.moon + " · Day " + moon.day;
}

// One object with everything the panel renders, so the QML stays declarative.
function describeDate(year, month, day) {
  var kin = kinForDate(year, month, day);
  if (kin === null) return null;

  var seal = sealForKin(kin);
  var tone = toneForKin(kin);
  var wavespell = wavespellForKin(kin);
  var oracle = oracleForKin(kin);
  var moon = moonDateFor(year, month, day);
  var yearBearer = yearBearerFor(year, month, day);

  function oracleEntry(sealValue) {
    return {
      seal: sealValue,
      sealName: sealName(sealValue),
      glyphName: glyphName(sealValue),
      asset: sealAsset(sealValue),
      color: colorForSeal(sealValue)
    };
  }

  return {
    kin: kin,
    seal: seal,
    sealName: sealName(seal),
    glyphName: glyphName(seal),
    asset: sealAsset(seal),
    tone: tone,
    toneName: toneName(tone),
    toneNumeral: mayaNumeral(tone),
    color: colorForSeal(seal),
    isGuideSelf: oracle.guide === seal,
    wavespell: {
      kin: wavespell.kin,
      day: wavespell.day,
      seal: wavespell.seal,
      sealName: sealName(wavespell.seal),
      glyphName: glyphName(wavespell.seal),
      asset: sealAsset(wavespell.seal),
      color: colorForSeal(wavespell.seal)
    },
    castle: castleForKin(kin),
    castleName: castleName(castleForKin(kin)),
    moon: moon,
    moonLabel: moonLabel(moon),
    yearBearer: yearBearer,
    oracle: {
      guide: oracleEntry(oracle.guide),
      analog: oracleEntry(oracle.analog),
      antipode: oracleEntry(oracle.antipode),
      occult: oracleEntry(oracle.occult)
    }
  };
}

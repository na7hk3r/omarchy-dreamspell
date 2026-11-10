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
//
// The Haab (see its own section) is the traditional 365-day count, read off the
// Long Count with the standard correlation 584283 rather than off the kin.

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

// The colour as a stable 1..4 index. The display name is translated, so the QML
// reads this index for the plaque palette instead of matching on a word that
// changes with the language.
function colorIndexForSeal(seal) {
  return (norm20(seal) - 1) % 4 + 1;
}

function colorIndexForKin(kin) {
  return colorIndexForSeal(sealForKin(kin));
}

function sealName(seal) {
  return SEALS[norm20(seal) - 1];
}

function glyphName(seal) {
  return GLYPHS[norm20(seal) - 1];
}

// The glyph's own name, as the tooltips spell it (L36) and as the WAVESPELL
// row's value already reads: the modern seal with the classic day sign beside
// it -- "Dog (Oc)". The day sign is a proper name and never translates; the
// seal name does, through the optional translator.
function sealFullName(seal, t) {
  return sealNameIn(seal, t) + " (" + glyphName(seal) + ")";
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

// Each of the thirteen moons is named by its tone AND its animal totem, which
// is how a synchronary writes them: the third moon is the Electric Deer, and
// the thirteenth -- the one that closes the year -- is the Cosmic Turtle.
var MOON_TOTEMS = [
  "Bat", "Scorpion", "Deer", "Owl", "Peacock",
  "Lizard", "Monkey", "Hawk", "Jaguar", "Dog",
  "Serpent", "Rabbit", "Turtle"
];

function moonTotem(moon) {
  var index = ((moon - 1) % 13 + 13) % 13;
  return MOON_TOTEMS[index];
}

function moonFullName(moon) {
  return moonName(moon) + " " + moonTotem(moon);
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
    return {
      kind: "out-of-time", moon: 0, moonName: "", totem: "", fullName: "",
      day: 0, weekday: "", offset: offset
    };
  }

  var moon = Math.floor(offset / 28) + 1;
  var dayOfMoon = (offset % 28) + 1;
  return {
    kind: "moon",
    moon: moon,
    moonName: moonName(moon),
    totem: moonTotem(moon),
    fullName: moonFullName(moon),
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
    tone: toneForKin(kin),
    toneName: toneName(toneForKin(kin)),
    color: colorForSeal(seal),
    colorIndex: colorIndexForSeal(seal),
    asset: sealAsset(seal),
    ring: ring,
    yearInRing: yearInRing,
    ns: "NS" + ring + "." + yearInRing
  };
}

// ------------------------------------------------- the Haab (365-day count)

// The Haab is the traditional Maya solar year: eighteen months ("uinals") of
// twenty days each, plus Wayeb, five days that belong to no month. It is read
// off the Long Count, NOT off the Dreamspell kin -- the two are different
// traditions and the panel shows them side by side rather than mixing them.
// The standard (GMT) correlation below turns a proleptic Gregorian date into a
// Long Count day number; the whole Haab moves with this one constant, so
// following another reference means changing exactly one line.
var LONG_COUNT_CORRELATION = 584283;

// Conventional modern spellings; the glottal stop is U+02BC, the same
// character the tone words use.
var HAAB_MONTHS = [
  "Pop", "Woʼ", "Sip", "Sotzʼ", "Sek", "Xul",
  "Yaxkʼin", "Mol", "Chʼen", "Yax", "Sakʼ", "Keh",
  "Mak", "Kʼankʼin", "Muwan", "Pax", "Kʼayab", "Kumkʼu"
];

var HAAB_YEAR_DAYS = 365;
var HAAB_WAYEB = 19; // Wayeb counts as the nineteenth month here

// Julian Day Number of a proleptic Gregorian date, with astronomical year
// numbering (3114 BCE is the year -3113). Integer arithmetic only, which is
// why it can trust dates a JS Date cannot represent.
function julianDayNumber(year, month, day) {
  var a = Math.floor((14 - month) / 12);
  var y = year + 4800 - a;
  var m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y
    + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

function longCountDays(year, month, day) {
  return julianDayNumber(year, month, day) - LONG_COUNT_CORRELATION;
}

// The Haab date of a Gregorian day, or null when the input is not a date.
// A month's day 0 is its seating day and is written like the rest ("0 Pop");
// Wayeb runs "0 Wayeb" to "4 Wayeb". Unlike the kin this is a plain proleptic
// calculation, so it does not carry the modern-year guard.
function haabForDate(year, month, day) {
  if (!isWhole(year) || !isWhole(month) || !isWhole(day)) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > daysInMonth(year, month)) return null;

  // The epoch 0.0.0.0.0 fell on 8 Kumkʼu: the eighteenth month, day 8, which
  // sits 348 days into the Haab year.
  var position = (((longCountDays(year, month, day) + 348) % HAAB_YEAR_DAYS)
    + HAAB_YEAR_DAYS) % HAAB_YEAR_DAYS;
  if (position >= 360) {
    return {
      month: HAAB_WAYEB,
      monthName: "Wayeb",
      day: position - 360,
      label: (position - 360) + " Wayeb"
    };
  }
  var index = Math.floor(position / 20);
  var dayOfMonth = position - index * 20;
  return {
    month: index + 1,
    monthName: HAAB_MONTHS[index],
    day: dayOfMonth,
    label: dayOfMonth + " " + HAAB_MONTHS[index]
  };
}

// ------------------------------------------------------------ localization
//
// The model owns the arithmetic and the canonical English vocabulary; the words
// it renders come from the plugin's own catalogs (i18n/*.json) through a lookup
// function. `t` is Commons.Translations' `t`, or any function with the same
// shape: t(key) returns the translation, and returns the key itself when the
// catalog has no entry. Every helper below therefore falls back to the English
// table in this file instead of printing a key at the reader.
//
// Nothing here touches the maths: describeDate builds the same object it always
// did and then rewrites only the display fields, so a reading is identical in
// every language except for its words.

// Action, power and essence -- the three keywords the tradition attaches to
// every seal and tone, and the reason a reader can do something with the day
// beyond naming it.
var SEAL_KEYWORDS = [
  ["Birth", "Nurturing", "Being"],
  ["Communicate", "Spirit", "Breath"],
  ["Dream", "Abundance", "Intuition"],
  ["Target", "Flowering", "Awareness"],
  ["Survive", "Life Force", "Instinct"],
  ["Equalize", "Death", "Opportunity"],
  ["Know", "Accomplishment", "Healing"],
  ["Beautify", "Elegance", "Art"],
  ["Flow", "Universal Water", "Emotion"],
  ["Love", "Heart", "Loyalty"],
  ["Play", "Magic", "Illusion"],
  ["Influence", "Free Will", "Wisdom"],
  ["Explore", "Space", "Wakefulness"],
  ["Receptivity", "Timelessness", "Enchantment"],
  ["Create", "Vision", "Mind"],
  ["Question", "Fearlessness", "Intelligence"],
  ["Evolve", "Synchronicity", "Navigation"],
  ["Reflect", "Endlessness", "Order"],
  ["Catalyze", "Self-Generation", "Energy"],
  ["Enlighten", "Universal Fire", "Life"]
];

var TONE_KEYWORDS = [
  ["Attract", "Unify", "Purpose"],
  ["Polarize", "Stabilize", "Challenge"],
  ["Activate", "Bond", "Service"],
  ["Define", "Measure", "Form"],
  ["Empower", "Command", "Radiance"],
  ["Organize", "Balance", "Equality"],
  ["Channel", "Inspire", "Attunement"],
  ["Harmonize", "Model", "Integrity"],
  ["Pulse", "Realize", "Intention"],
  ["Perfect", "Produce", "Manifestation"],
  ["Dissolve", "Release", "Liberation"],
  ["Dedicate", "Universalize", "Cooperation"],
  ["Endure", "Transcend", "Presence"]
];

// Each of the four colours carries one verb: the stage a day's energy is at.
var COLOR_ESSENCES = ["Initiation", "Refinement", "Transformation", "Maturation"];

function translate(t, key, fallback) {
  if (typeof t !== "function") return fallback;
  var value = t(key);
  return (typeof value === "string" && value.length > 0 && value !== key)
    ? value
    : fallback;
}

// Templates carry %1..%5 placeholders, the same shape Commons.Translations
// documents for its plural entries, so a translation can reorder them. Spanish
// needs exactly that: "White Spectral Dog" is "Perro Espectral Blanco".
function fill(template, values) {
  var out = String(template);
  for (var i = 0; i < values.length; i++)
    out = out.replace("%" + (i + 1), String(values[i]));
  return out;
}

function sealNameIn(seal, t) {
  return translate(t, "seal." + norm20(seal), sealName(seal));
}

function toneNameIn(tone, t, gender) {
  var slot = normalizeTone(tone);
  var neutral = translate(t, "tone." + slot, toneName(tone));
  // A language whose adjectives inflect ships the other form beside the neutral
  // one ("Galáctica" next to "Galáctico"); English has no such key and gets the
  // neutral form back.
  return gender === "f" ? translate(t, "tone." + slot + ".f", neutral) : neutral;
}

function colorNameIn(index, t, gender) {
  var slot = ((index - 1) % 4 + 4) % 4;
  var neutral = translate(t, "color." + (slot + 1), COLORS[slot]);
  return gender === "f" ? translate(t, "color." + (slot + 1) + ".f", neutral) : neutral;
}

// The gender of the noun a tone or colour adjective has to agree with. The
// model only reports it; whether the language uses it is the catalog's business.
function sealGender(seal, t) {
  return translate(t, "seal." + norm20(seal) + ".gender", "m") === "f" ? "f" : "m";
}

function totemGender(moon, t) {
  return translate(t, "totem." + normalizeTone(moon) + ".gender", "m") === "f" ? "f" : "m";
}

function totemNameIn(moon, t) {
  return translate(t, "totem." + normalizeTone(moon), moonTotem(moon));
}

function castleNameIn(castle, t) {
  return translate(t, "castle." + Math.min(Math.max(castle, 1), 5), castleName(castle));
}

function sealTriad(seal, t) {
  var slot = norm20(seal) - 1;
  return [
    translate(t, "seal." + (slot + 1) + ".action", SEAL_KEYWORDS[slot][0]),
    translate(t, "seal." + (slot + 1) + ".power", SEAL_KEYWORDS[slot][1]),
    translate(t, "seal." + (slot + 1) + ".essence", SEAL_KEYWORDS[slot][2])
  ];
}

function toneTriad(tone, t) {
  var slot = normalizeTone(tone) - 1;
  return [
    translate(t, "tone." + (slot + 1) + ".action", TONE_KEYWORDS[slot][0]),
    translate(t, "tone." + (slot + 1) + ".power", TONE_KEYWORDS[slot][1]),
    translate(t, "tone." + (slot + 1) + ".essence", TONE_KEYWORDS[slot][2])
  ];
}

function colorEssenceIn(index, t) {
  var slot = ((index - 1) % 4 + 4) % 4;
  return translate(t, "color." + (slot + 1) + ".essence", COLOR_ESSENCES[slot]);
}

// The hover text of one glyph: what it is called and what it is for. A reader
// who does not know the calendar should learn something from the bubble.
function sealTip(seal, t) {
  var words = sealTriad(seal, t);
  return fill(
    translate(t, "tip.seal", "%1 (%2) — Action: %3 · Power: %4 · Essence: %5"),
    [sealNameIn(seal, t), glyphName(seal), words[0], words[1], words[2]])
}

function toneTip(tone, t) {
  var words = toneTriad(tone, t)
  return fill(
    translate(t, "tip.tone", "%1 — Action: %2 · Power: %3 · Essence: %4"),
    [toneNameIn(tone, t), words[0], words[1], words[2]])
}

function colorTip(index, t) {
  return fill(translate(t, "tip.color", "%1 — %2"),
    [colorNameIn(index, t), colorEssenceIn(index, t)])
}

// The three beats that orient a day: what the seal is here to do, what the tone
// is about, and which stage the colour is at.
function energyLine(seal, tone, colorIndex, t) {
  return fill(translate(t, "energy.line", "Energy: %1 · %2 · %3"), [
    sealTriad(seal, t)[2],
    toneTriad(tone, t)[2],
    colorEssenceIn(colorIndex, t)
  ])
}

// "Red Galactic Moon" and "Luna Galáctica Roja" are the same three facts in two
// word orders, so the order is a template rather than a concatenation. The
// adjectives take the seal's gender.
function fullNameIn(colorIndex, tone, seal, t) {
  var gender = sealGender(seal, t);
  return fill(translate(t, "hero.fullName", "%1 %2 %3"), [
    colorNameIn(colorIndex, t, gender),
    toneNameIn(tone, t, gender),
    sealNameIn(seal, t)
  ])
}

function moonFullNameIn(moon, t) {
  var gender = totemGender(moon, t);
  return fill(translate(t, "moon.fullName", "%1 %2"),
    [toneNameIn(moon, t, gender), totemNameIn(moon, t)])
}

// The bar's tooltip: the kin, its full name, and the seal's three keywords.
function barHover(reading, t) {
  if (!reading) return ""
  return fill(translate(t, "bar.hover", "Kin %1 · %2 — %3"), [
    reading.kin,
    fullNameIn(reading.colorIndex, reading.tone, reading.seal, t),
    sealTriad(reading.seal, t).join(" · ")
  ])
}

// Rewrites the display fields of a reading in place -- well, into a copy: the
// numbers stay untouched so nothing downstream can disagree with the maths.
function localize(reading, t) {
  if (!reading || typeof t !== "function") return reading

  var out = {}
  for (var key in reading) out[key] = reading[key]

  out.sealName = sealNameIn(reading.seal, t)
  out.toneName = toneNameIn(reading.tone, t)
  out.color = colorNameIn(reading.colorIndex, t)
  out.fullName = fullNameIn(reading.colorIndex, reading.tone, reading.seal, t)
  out.energy = energyLine(reading.seal, reading.tone, reading.colorIndex, t)
  out.sealTip = sealTip(reading.seal, t)
  out.toneTip = toneTip(reading.tone, t)
  out.colorTip = colorTip(reading.colorIndex, t)

  if (reading.wavespell) {
    var wave = {}
    for (var wk in reading.wavespell) wave[wk] = reading.wavespell[wk]
    wave.sealName = sealNameIn(reading.wavespell.seal, t)
    out.wavespell = wave
  }

  if (reading.moon) {
    var moonCopy = {}
    for (var mk in reading.moon) moonCopy[mk] = reading.moon[mk]
    if (moonCopy.kind === "moon") {
      moonCopy.moonName = toneNameIn(moonCopy.moon, t)
      moonCopy.totem = totemNameIn(moonCopy.moon, t)
      moonCopy.fullName = moonFullNameIn(moonCopy.moon, t)
    }
    out.moon = moonCopy
  }
  out.moonLabel = moonLabel(reading.moon, t)

  if (reading.yearBearer) {
    var bearer = {}
    for (var bk in reading.yearBearer) bearer[bk] = reading.yearBearer[bk]
    bearer.sealName = sealNameIn(reading.yearBearer.seal, t)
    bearer.toneName = toneNameIn(reading.yearBearer.tone, t)
    bearer.color = colorNameIn(reading.yearBearer.colorIndex, t)
    bearer.fullName = fullNameIn(reading.yearBearer.colorIndex, reading.yearBearer.tone,
      reading.yearBearer.seal, t)
    out.yearBearer = bearer
  }

  var oracleCopy = {}
  var arms = ["guide", "analog", "antipode", "occult"]
  for (var a = 0; a < arms.length; a++) {
    var arm = {}
    for (var ok in reading.oracle[arms[a]]) arm[ok] = reading.oracle[arms[a]][ok]
    arm.sealName = sealNameIn(arm.seal, t)
    arm.color = colorNameIn(arm.colorIndex, t)
    arm.tip = sealTip(arm.seal, t)
    oracleCopy[arms[a]] = arm
  }
  out.oracle = oracleCopy

  out.castleName = castleNameIn(reading.castle, t)
  return out
}

// ------------------------------------------------------------ presentation

function labelForKin(kin, format, t) {
  var kinValue = norm260(kin);
  var tone = toneForKin(kinValue);
  var seal = sealForKin(kinValue);

  if (format === "kin") return "Kin " + kinValue;
  // The day-sign name in this format is the Mayan one, so its tone is written in
  // Maya too: the number word, not the Dreamspell tone name. Both are proper
  // names and stay in their own language.
  if (format === "glyph") return toneWord(tone) + " " + glyphName(seal);
  // This one keeps the Dreamspell tone name, because the seal beside it is a
  // Dreamspell seal rather than a day sign. Spanish writes it noun-first and
  // inflects the adjective, so the word order is a template too.
  if (format === "toneNameSeal") {
    var gender = sealGender(seal, t);
    return fill(translate(t, "bar.toneNameSeal", "%1 %2"),
      [toneNameIn(tone, t, gender), sealNameIn(seal, t)]);
  }
  // No words on purpose: the bar renders the seal's glyph for this format, and
  // a text fallback would print the seal name beside the image.
  if (format === "icon") return "";
  return tone + " " + sealNameIn(seal, t);
}

function nextLabelFormat(current) {
  var index = LABEL_FORMATS.indexOf(current);
  if (index < 0) return LABEL_FORMATS[0];
  return LABEL_FORMATS[(index + 1) % LABEL_FORMATS.length];
}

function moonLabel(moon, t) {
  if (!moon || moon.kind === "out-of-time")
    return translate(t, "moon.outOfTime", "Day Out of Time");
  return fill(translate(t, "moon.label", "Moon %1 · Day %2"), [moon.moon, moon.day]);
}

// One object with everything the panel renders, so the QML stays declarative.
// Pass a translator to get the display words in that language; omit it and the
// reading comes back in the model's canonical English, which is what the tests
// and any non-UI caller want.
function describeDate(year, month, day, t) {
  var kin = kinForDate(year, month, day);
  if (kin === null) return null;

  var seal = sealForKin(kin);
  var tone = toneForKin(kin);
  var colorIndex = colorIndexForSeal(seal);
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
      color: colorForSeal(sealValue),
      colorIndex: colorIndexForSeal(sealValue)
    };
  }

  var reading = {
    kin: kin,
    seal: seal,
    sealName: sealName(seal),
    glyphName: glyphName(seal),
    asset: sealAsset(seal),
    tone: tone,
    toneName: toneName(tone),
    toneNumeral: mayaNumeral(tone),
    color: colorForSeal(seal),
    colorIndex: colorIndex,
    fullName: fullNameIn(colorIndex, tone, seal, t),
    energy: energyLine(seal, tone, colorIndex, t),
    sealTip: sealTip(seal, t),
    toneTip: toneTip(tone, t),
    colorTip: colorTip(colorIndex, t),
    isGuideSelf: oracle.guide === seal,
    wavespell: {
      kin: wavespell.kin,
      day: wavespell.day,
      seal: wavespell.seal,
      sealName: sealName(wavespell.seal),
      glyphName: glyphName(wavespell.seal),
      asset: sealAsset(wavespell.seal),
      color: colorForSeal(wavespell.seal),
      colorIndex: colorIndexForSeal(wavespell.seal)
    },
    castle: castleForKin(kin),
    castleName: castleName(castleForKin(kin)),
    moon: moon,
    moonLabel: moonLabel(moon, t),
    haab: haabForDate(year, month, day),
    yearBearer: yearBearer,
    oracle: {
      guide: oracleEntry(oracle.guide),
      analog: oracleEntry(oracle.analog),
      antipode: oracleEntry(oracle.antipode),
      occult: oracleEntry(oracle.occult)
    }
  };

  return localize(reading, t);
}

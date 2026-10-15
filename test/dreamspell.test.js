// Regression tests for the Dreamspell calendar maths.
//
// Run: node --test test/dreamspell.test.js
//
// The module is a QML-compatible plain script (no ESM export, no .pragma), so
// it is loaded into a fresh VM context to keep the plugin file untouched.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const MODEL = path.join(__dirname, '..', 'Dreamspell.js');

function load() {
  const context = {};
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(MODEL, 'utf8'), context, { filename: MODEL });
  return context;
}

const D = load();

// ---------------------------------------------------------------- S1 anchors

test('anchor: 1987-07-26 is Kin 34, White Galactic Wizard', () => {
  const kin = D.kinForDate(1987, 7, 26);
  assert.equal(kin, 34);
  assert.equal(D.sealName(D.sealForKin(kin)), 'Wizard');
  assert.equal(D.toneName(D.toneForKin(kin)), 'Galactic');
  assert.equal(D.colorForKin(kin), 'White');
});

test('anchor: 2026-10-15 is Kin 50, White Spectral Dog', () => {
  const kin = D.kinForDate(2026, 10, 15);
  assert.equal(kin, 50);
  assert.equal(D.sealName(D.sealForKin(kin)), 'Dog');
  assert.equal(D.toneName(D.toneForKin(kin)), 'Spectral');
  assert.equal(D.colorForKin(kin), 'White');
});

test('anchor: 2026-07-26 (year start) is Kin 229, Red Galactic Moon', () => {
  const kin = D.kinForDate(2026, 7, 26);
  assert.equal(kin, 229);
  assert.equal(D.sealName(D.sealForKin(kin)), 'Moon');
  assert.equal(D.toneName(D.toneForKin(kin)), 'Galactic');
  assert.equal(D.colorForKin(kin), 'Red');
});

test('cycle bounds: Kin 1 is Red Magnetic Dragon, Kin 260 is Yellow Cosmic Sun', () => {
  assert.equal(D.sealName(D.sealForKin(1)), 'Dragon');
  assert.equal(D.toneName(D.toneForKin(1)), 'Magnetic');
  assert.equal(D.colorForKin(1), 'Red');
  assert.equal(D.sealName(D.sealForKin(260)), 'Sun');
  assert.equal(D.toneName(D.toneForKin(260)), 'Cosmic');
  assert.equal(D.colorForKin(260), 'Yellow');
});

test('consecutive days advance the kin by one across a year boundary', () => {
  assert.equal(D.kinForDate(1987, 12, 31), 192);
  assert.equal(D.kinForDate(1988, 1, 1), 193);
});

test('the 52-year cycle returns the same kin', () => {
  for (const y of [1987, 1990, 2026]) {
    assert.equal(D.kinForDate(y, 7, 26), D.kinForDate(y + 52, 7, 26));
  }
});

// ------------------------------------------------------- S1 leap-year folding

test('February 29 folds onto February 28 and does not advance the kin', () => {
  assert.equal(D.kinForDate(1988, 2, 29), D.kinForDate(1988, 2, 28));
});

test('March 1 still advances exactly one day past February 28', () => {
  assert.equal(D.kinForDate(1988, 3, 1), D.kinForDate(1988, 2, 28) + 1);
});

test('a year divisible by 52 stays inside 1..260 early in January (negative-modulo guard)', () => {
  for (const day of [1, 2, 15, 27, 28]) {
    const kin = D.kinForDate(2028, 1, day);
    assert.ok(kin >= 1 && kin <= 260, `kin ${kin} out of range for 2028-01-${day}`);
  }
});

// --------------------------------------------------------------- S2 the oracle

test('oracle seam: tones 1, 6 and 11 guide themselves', () => {
  for (const kin of [1, 6, 11, 14, 19, 24]) {
    const tone = D.toneForKin(kin);
    const seal = D.sealForKin(kin);
    assert.ok([1, 6, 11].includes(tone), `expected a self-guiding tone, got ${tone}`);
    assert.equal(D.oracleForKin(kin).guide, seal);
  }
});

test('oracle: guide offset follows the (tone-1) % 5 ring', () => {
  // Kin 34 is tone 8 -> ring 2 -> offset +4 -> seal 14 + 4 = 18 (Mirror)
  assert.equal(D.oracleForKin(34).guide, 18);
  // Kin 2 is tone 2 -> ring 1 -> offset -8 -> seal 2 - 8 wraps to 14 (Wizard)
  assert.equal(D.oracleForKin(2).guide, 14);
});

test('oracle: analog, antipode and occult seal relations', () => {
  assert.equal(D.oracleForKin(1).analog, 18);
  assert.equal(D.oracleForKin(1).antipode, 11);
  assert.equal(D.oracleForKin(1).occult, 20);
  assert.equal(D.oracleForKin(20).analog, 19);
  assert.equal(D.oracleForKin(20).antipode, 10);
  assert.equal(D.oracleForKin(20).occult, 1);
  assert.equal(D.oracleForKin(11).antipode, 1);
});

test('oracle seals always land inside 1..20', () => {
  for (let kin = 1; kin <= 260; kin++) {
    const o = D.oracleForKin(kin);
    for (const key of ['guide', 'analog', 'antipode', 'occult']) {
      assert.ok(o[key] >= 1 && o[key] <= 20, `${key} ${o[key]} out of range at kin ${kin}`);
    }
  }
});

// -------------------------------------------------- S3 wavespell and castle

test('wavespell: kin 1 opens the Dragon wavespell on day 1', () => {
  const w = D.wavespellForKin(1);
  assert.equal(w.seal, 1);
  assert.equal(w.day, 1);
  assert.equal(D.sealName(w.seal), 'Dragon');
});

test('wavespell: kin 13 closes it, kin 14 opens the Wizard wavespell', () => {
  assert.equal(D.wavespellForKin(13).day, 13);
  assert.equal(D.wavespellForKin(14).day, 1);
  assert.equal(D.sealName(D.wavespellForKin(14).seal), 'Wizard');
});

test('wavespell: every wavespell runs 1..13 and there are exactly 20 of them', () => {
  const seen = new Set();
  for (let kin = 1; kin <= 260; kin++) {
    const w = D.wavespellForKin(kin);
    assert.ok(w.day >= 1 && w.day <= 13);
    seen.add(w.seal);
  }
  assert.equal(seen.size, 20);
});

test('castle: five castles of 52 days', () => {
  assert.equal(D.castleForKin(1), 1);
  assert.equal(D.castleForKin(52), 1);
  assert.equal(D.castleForKin(53), 2);
  assert.equal(D.castleForKin(105), 3);
  assert.equal(D.castleForKin(157), 4);
  assert.equal(D.castleForKin(209), 5);
  assert.equal(D.castleForKin(260), 5);
});

test('castle: the Red Eastern Castle is the Dragon/Wizard/Hand/Sun wavespells', () => {
  assert.equal(D.castleForKin(1), 1);
  assert.equal(D.castleForKin(14), 1);
  assert.equal(D.castleForKin(27), 1);
  assert.equal(D.castleForKin(40), 1);
  assert.equal(D.castleForKin(53), 2);
});

// -------------------------------------------------------- S4 the 13 Moon year

test('13 Moon: July 26 opens Moon 1 Day 1, July 25 is the Day Out of Time', () => {
  const opening = D.moonDateFor(2026, 7, 26);
  assert.equal(opening.kind, 'moon');
  assert.equal(opening.moon, 1);
  assert.equal(opening.day, 1);

  const closing = D.moonDateFor(2027, 7, 25);
  assert.equal(closing.kind, 'out-of-time');
});

test('13 Moon: moons are 28 days and Moon 13 Day 28 is July 24', () => {
  assert.equal(D.moonDateFor(2026, 8, 22).moon, 1);
  assert.equal(D.moonDateFor(2026, 8, 22).day, 28);
  const next = D.moonDateFor(2026, 8, 23);
  assert.equal(next.moon, 2);
  assert.equal(next.day, 1);

  const last = D.moonDateFor(2027, 7, 24);
  assert.equal(last.moon, 13);
  assert.equal(last.day, 28);
});

test('13 Moon: day 1 is Dali and day 28 is Sillio', () => {
  assert.equal(D.moonDateFor(2026, 7, 26).weekday, 'Dali');
  assert.equal(D.moonDateFor(2026, 8, 22).weekday, 'Sillio');
});

test('13 Moon: every year has 365 day-slots', () => {
  let count = 0;
  for (let offset = 0; offset <= 364; offset++) {
    const d = new Date(Date.UTC(2026, 6, 26) + offset * 86400000);
    const md = D.moonDateFor(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
    assert.ok(md.kind === 'moon' || md.kind === 'out-of-time');
    count++;
  }
  assert.equal(count, 365);
});

// ------------------------------------------------------------- input handling

test('invalid input is rejected instead of silently producing a kin', () => {
  assert.equal(D.kinForDate(2026, 13, 1), null);
  assert.equal(D.kinForDate(2026, 0, 1), null);
  assert.equal(D.kinForDate(2026, 4, 31), null);
});

// ------------------------------------------------------- S5 label formatting

test('label formats render the tone and seal', () => {
  const kin = D.kinForDate(2026, 10, 15);
  assert.equal(D.labelForKin(kin, 'toneSeal'), '11 Dog');
  assert.equal(D.labelForKin(kin, 'kin'), 'Kin 50');
  // The day sign in this format is the Mayan one, so the tone in front of it is
  // written in Maya too: its number word, not the Dreamspell tone name (S16).
  assert.equal(D.labelForKin(kin, 'glyph'), 'buluk Oc');
  assert.equal(D.labelForKin(34, 'toneSeal'), '8 Wizard');
  assert.equal(D.labelForKin(34, 'glyph'), 'waxak Ix');
});

test('the tone in Maya: thirteen words, pinned by code point', () => {
  // Built from escapes on purpose. A typewriter apostrophe and U+02BC look
  // almost identical, and so do the several "o with an accent" characters:
  // typing the expected value by hand would let a lookalike pass.
  const A = '\u02bc'; // the Yucatec glottal mark
  const O = '\u00f3'; // the high-tone o
  const words = [
    'jun', 'ka' + A + 'a', O + 'ox', 'kan', 'jo' + A + 'o',
    'wak', 'wuk', 'waxak', 'bolon', 'lajun',
    'buluk', 'lajka' + A + 'a', O + 'oxlajun'
  ];
  assert.equal(D.TONE_WORDS.length, 13);
  assert.equal(D.TONE_WORDS.join(','), words.join(','));
  for (let tone = 1; tone <= 13; tone++) {
    assert.equal(D.toneWord(tone), words[tone - 1], 'tone ' + tone);
  }
  assert.equal(D.toneWord(14), 'jun', 'the tone normalises like its neighbours');
});

test('label formats: the tone name can label the seal instead of the tone number', () => {
  // "Spectral Dog" beside "11 Dog": the same seal, with the tone in words (S16).
  assert.equal(D.labelForKin(50, 'toneNameSeal'), 'Spectral Dog');
  assert.equal(D.labelForKin(34, 'toneNameSeal'), 'Galactic Wizard');
  assert.equal(D.labelForKin(1, 'toneNameSeal'), 'Magnetic Dragon');
});

test('an unknown label format falls back to the tone and seal', () => {
  assert.equal(D.labelForKin(50, 'nonsense'), '11 Dog');
});

// ------------------------------------------------------- S8 seal glyph assets

test('seal assets: zero-padded index and glyph slug, one distinct asset per seal', () => {
  assert.equal(D.sealAsset(1), 'seals/01-imix.svg');
  assert.equal(D.sealAsset(10), 'seals/10-oc.svg');
  assert.equal(D.sealAsset(20), 'seals/20-ahau.svg');

  const seen = new Set();
  for (let seal = 1; seal <= 20; seal++) {
    const asset = D.sealAsset(seal);
    assert.match(asset, /^seals\/\d{2}-[a-z]+\.svg$/, `unexpected path for seal ${seal}: ${asset}`);
    seen.add(asset);
  }
  assert.equal(seen.size, 20);
});

test('seal assets: every referenced file exists and really is an SVG', () => {
  const dir = path.join(__dirname, '..');
  for (let seal = 1; seal <= 20; seal++) {
    const asset = D.sealAsset(seal);
    const file = path.join(dir, asset);
    assert.ok(fs.existsSync(file), `missing glyph asset for seal ${seal}: ${asset}`);
    const head = fs.readFileSync(file, 'utf8').slice(0, 400);
    assert.ok(head.includes('<svg'), `asset for seal ${seal} is not an SVG: ${asset}`);
  }
});

test('seal assets: the reading carries an asset for the kin, the wavespell and every oracle seal', () => {
  const d = D.describeDate(2026, 10, 15);
  assert.equal(d.asset, D.sealAsset(d.seal));
  assert.equal(d.wavespell.asset, D.sealAsset(d.wavespell.seal));
  assert.equal(d.wavespell.color, D.colorForSeal(d.wavespell.seal));
  assert.equal(d.yearBearer.asset, D.sealAsset(d.yearBearer.seal));
  for (const key of ['guide', 'analog', 'antipode', 'occult']) {
    assert.equal(d.oracle[key].asset, D.sealAsset(d.oracle[key].seal), `oracle ${key} asset mismatch`);
  }
});

test('seal assets: an out-of-range seal still resolves inside 1..20', () => {
  assert.equal(D.sealAsset(0), D.sealAsset(20));
  assert.equal(D.sealAsset(21), D.sealAsset(1));
});

// ------------------------------------------------- S9 the tone as a Maya numeral

test('maya numeral: every tone is the Mayan numeral of that number', () => {
  for (let tone = 1; tone <= 13; tone++) {
    assert.equal(D.mayaNumeral(tone).codePointAt(0), 0x1d2e0 + tone, `tone ${tone}`);
  }
  assert.equal(D.mayaNumeral(5).codePointAt(0), 0x1d2e5); // one bar
  assert.equal(D.mayaNumeral(11).codePointAt(0), 0x1d2eb); // two bars and a dot
  assert.equal(D.mayaNumeral(13).codePointAt(0), 0x1d2ed); // two bars and three dots
});

test('the reading exposes the numeral of its own tone', () => {
  const d = D.describeDate(2026, 10, 15);
  assert.equal(d.tone, 11);
  assert.equal(d.toneNumeral, D.mayaNumeral(11));
  assert.equal(d.toneNumeral.codePointAt(0), 0x1d2eb);
});

// ------------------------------------------- S10 the solar ring / NS coordinate

test('solar ring: 2026-2027 is the official NS1.39', () => {
  // Corroborated against 13Lunas.NET's own synchronario for 2026/2027, published
  // as "Anillo Solar NS1.39 codificado por el Kin 229: Luna Galactica Roja".
  const bearer = D.describeDate(2026, 10, 15).yearBearer;
  assert.equal(bearer.kin, 229);
  assert.equal(bearer.ring, 1);
  assert.equal(bearer.yearInRing, 39);
  assert.equal(bearer.ns, 'NS1.39');
});

test('solar ring: the year number counts from zero at 1987, matching NS1.37 for 2024', () => {
  assert.equal(D.describeDate(1987, 8, 1).yearBearer.yearInRing, 0);
  assert.equal(D.describeDate(2024, 8, 1).yearBearer.ns, 'NS1.37');
  assert.equal(D.describeDate(2025, 8, 1).yearBearer.ns, 'NS1.38');
  assert.equal(D.describeDate(2026, 8, 1).yearBearer.ns, 'NS1.39');
  assert.equal(D.describeDate(2027, 8, 1).yearBearer.ns, 'NS1.40');
});

test('solar ring: 52 years to a ring and the next ring opens at zero', () => {
  assert.equal(D.describeDate(2038, 8, 1).yearBearer.yearInRing, 51); // last year of ring 1
  assert.equal(D.describeDate(2038, 8, 1).yearBearer.ring, 1);
  assert.equal(D.describeDate(2039, 8, 1).yearBearer.ring, 2); // ring 2 opens
  assert.equal(D.describeDate(2039, 8, 1).yearBearer.yearInRing, 0);
});

test('solar ring: the year number still turns over on July 26, not January 1', () => {
  assert.equal(D.describeDate(2026, 7, 25).yearBearer.yearInRing, 38);
  assert.equal(D.describeDate(2026, 7, 26).yearBearer.yearInRing, 39);
});

test('solar ring: the ring number never falls below one', () => {
  for (const year of [1987, 1990, 2026, 2038, 2039, 2100]) {
    const bearer = D.describeDate(year, 8, 1).yearBearer;
    assert.ok(bearer.ring >= 1, `ring ${bearer.ring} at ${year}`);
    assert.ok(bearer.yearInRing >= 0 && bearer.yearInRing <= 51, `year ${bearer.yearInRing} at ${year}`);
  }
});

// ------------------------------------------ S14 the seal-icon label format

test('label formats: the seal icon is a step in the right-click cycle', () => {
  // Compared element-wise on purpose: LABEL_FORMATS is built inside the VM
  // context, so a deep-equal against a host array fails on the cross-realm
  // prototype rather than on the contents.
  assert.equal(D.LABEL_FORMATS.length, 5);
  assert.equal(D.LABEL_FORMATS.join(','), 'toneSeal,toneNameSeal,kin,glyph,icon');
  assert.equal(D.nextLabelFormat('toneSeal'), 'toneNameSeal');
  assert.equal(D.nextLabelFormat('toneNameSeal'), 'kin');
  assert.equal(D.nextLabelFormat('kin'), 'glyph');
  assert.equal(D.nextLabelFormat('glyph'), 'icon');
  assert.equal(D.nextLabelFormat('icon'), 'toneSeal');
});

test('label formats: the icon format yields no text, because the bar draws the seal instead', () => {
  // Every other format is words; this one is the glyph itself, so the text
  // label has to come back empty and the widget supplies the image. An empty
  // string here is the contract, not an oversight -- a text fallback would
  // render the seal name next to the glyph and defeat the point of the format.
  assert.equal(D.labelForKin(50, 'icon'), '');
  assert.equal(D.labelForKin(34, 'icon'), '');
  assert.equal(D.labelForKin(1, 'icon'), '');
});

test('label formats: the icon format leaves the seal it should draw untouched', () => {
  // The bar resolves the image from the reading's own asset, so selecting the
  // icon format must not change which glyph is asked for.
  const glyph = D.describeDate(2026, 10, 15);
  assert.equal(D.labelForKin(glyph.kin, 'icon'), '');
  assert.equal(glyph.asset, 'seals/10-oc.svg');
  assert.equal(glyph.sealName, 'Dog');
});

// --------------------------------------- S15 glyph polarity: two baked assets

test('assetVariant: dark is the pristine Commons file, light is its sibling', () => {
  assert.equal(D.assetVariant('seals/10-oc.svg', 'dark'), 'seals/10-oc.svg');
  assert.equal(D.assetVariant('seals/10-oc.svg', 'light'), 'seals/10-oc-light.svg');
  assert.equal(D.assetVariant('seals/01-imix.svg', 'light'), 'seals/01-imix-light.svg');
  // Nothing to vary when there is no asset, and an unknown variant must not
  // invent a file name that does not exist.
  assert.equal(D.assetVariant('', 'light'), '');
  assert.equal(D.assetVariant('', 'dark'), '');
  assert.equal(D.assetVariant('seals/10-oc.svg', 'chartreuse'), 'seals/10-oc.svg');
});

test('glyphVariant: the shipped polarity that matches a wanted color', () => {
  // Components are the 0..1 floats QML reports for a color, not 0..255.
  assert.equal(D.glyphVariant(1, 1, 1), 'light');
  assert.equal(D.glyphVariant(0, 0, 0), 'dark');
  assert.equal(D.glyphVariant(0.957, 0.961, 0.961), 'light'); // #f4f5f5 bar text
  assert.equal(D.glyphVariant(0.063, 0.075, 0.082), 'dark'); // #101315 bar text
});

test('glyphAgainstFill: a light plate takes the dark glyph, a saturated one the light glyph', () => {
  assert.equal(D.glyphAgainstFill(0.843, 0.859, 0.867), 'dark'); // White plaque #d7dbdd
  assert.equal(D.glyphAgainstFill(0.788, 0.635, 0.153), 'dark'); // Yellow plaque #c9a227
  assert.equal(D.glyphAgainstFill(0.753, 0.314, 0.302), 'light'); // Red plaque #c0504d
  assert.equal(D.glyphAgainstFill(0.290, 0.498, 0.710), 'light'); // Blue plaque #4a7fb5

  // The defect worth pinning twice: a white bar foreground must ask for the
  // light glyph, and the two questions must never collapse into one answer.
  assert.equal(D.glyphVariant(0.957, 0.961, 0.961), 'light');
  const plates = [
    [0.843, 0.859, 0.867], [0.788, 0.635, 0.153],
    [0.753, 0.314, 0.302], [0.290, 0.498, 0.710]
  ];
  for (const plate of plates) {
    assert.notEqual(D.glyphAgainstFill(...plate), D.glyphVariant(...plate));
  }
});

test('both polarities exist on disk for every seal, and the light one is light', () => {
  const dir = path.join(__dirname, '..');
  for (let seal = 1; seal <= 20; seal++) {
    const dark = D.assetVariant(D.sealAsset(seal), 'dark');
    const light = D.assetVariant(D.sealAsset(seal), 'light');
    assert.notEqual(dark, light, `seal ${seal} resolves to the same file either way`);
    for (const asset of [dark, light]) {
      const file = path.join(dir, asset);
      assert.ok(fs.existsSync(file), `missing glyph asset: ${asset}`);
      assert.ok(fs.readFileSync(file, 'utf8').includes('<svg'), `not an SVG: ${asset}`);
    }
    assert.ok(fs.readFileSync(path.join(dir, light), 'utf8').includes('fill="#f4f5f5"'),
      `light glyph for seal ${seal} does not carry the light fill`);
    assert.ok(fs.readFileSync(path.join(dir, dark), 'utf8').includes('fill="#000000"'),
      `dark glyph for seal ${seal} should stay the pristine Commons file`);
  }
});

// -------------------------------------------------- S18 the moon's full name

test('13 Moon: the moons carry their animal totems, Bat first and Turtle last', () => {
  assert.equal(D.MOON_TOTEMS.length, 13);
  assert.equal(D.moonTotem(1), 'Bat');
  assert.equal(D.moonTotem(3), 'Deer');
  assert.equal(D.moonTotem(13), 'Turtle');
  // Normalises like the moon name does, so a wrapped moon still answers.
  assert.equal(D.moonTotem(14), 'Bat');
  assert.equal(D.moonTotem(0), 'Turtle');
});

test('13 Moon: the full name is the tone plus the totem', () => {
  assert.equal(D.moonFullName(1), 'Magnetic Bat');
  assert.equal(D.moonFullName(3), 'Electric Deer');
  assert.equal(D.moonFullName(13), 'Cosmic Turtle');
});

test('13 Moon: the reading carries the moon name, its totem and the day plasma', () => {
  const md = D.moonDateFor(2026, 10, 15);
  assert.equal(md.moon, 3);
  assert.equal(md.day, 26);
  assert.equal(md.moonName, 'Electric');
  assert.equal(md.totem, 'Deer');
  assert.equal(md.fullName, 'Electric Deer');
  assert.equal(md.weekday, 'Alpha');
  // The Day Out of Time belongs to no moon and must not invent a totem.
  const out = D.moonDateFor(2026, 7, 25);
  assert.equal(out.kind, 'out-of-time');
  assert.equal(out.fullName, '');
});

// ------------------------------------ S19 the Haab, the traditional count

test('Haab: 13.0.0.0.0, 21 December 2012, is 3 Kankin', () => {
  const G = '\u02bc';
  const haab = D.haabForDate(2012, 12, 21);
  assert.equal(haab.day, 3);
  assert.equal(haab.monthName, 'K' + G + 'ank' + G + 'in');
  assert.equal(haab.label, '3 K' + G + 'ank' + G + 'in');
});

test('Haab: the Long Count epoch is 8 Kumku', () => {
  const G = '\u02bc';
  // Astronomical year -3113 is 3114 BCE, which is what the proleptic
  // Gregorian formula needs for the epoch's Julian Day Number, 584283.
  const haab = D.haabForDate(-3113, 8, 11);
  assert.equal(haab.day, 8);
  assert.equal(haab.monthName, 'Kumk' + G + 'u');
  assert.equal(haab.label, '8 Kumk' + G + 'u');
});

test('Haab: today is 19 Yax under the standard correlation', () => {
  assert.equal(D.haabForDate(2026, 10, 15).label, '19 Yax');
  // The seating day of the next month follows the 19th.
  assert.equal(D.haabForDate(2026, 10, 16).label, '0 Sak\u02bc');
});

test('Haab: Wayeb is the five-day month that closes the year', () => {
  assert.equal(D.haabForDate(2013, 3, 28).label, '0 Wayeb');
  assert.equal(D.haabForDate(2013, 3, 29).label, '1 Wayeb');
  assert.equal(D.haabForDate(2013, 4, 1).label, '4 Wayeb');
  assert.equal(D.haabForDate(2013, 4, 2).label, '0 Pop');
  assert.equal(D.haabForDate(2013, 4, 3).label, '1 Pop');
});

test('Haab: invalid input is rejected instead of silently answered', () => {
  assert.equal(D.haabForDate(2026, 13, 1), null);
  assert.equal(D.haabForDate(2026, 0, 1), null);
  assert.equal(D.haabForDate(2026, 4, 31), null);
});

test('Haab: one full year passes through all eighteen months and five Wayeb days', () => {
  const months = new Set();
  let wayebDays = 0;
  for (let i = 0; i < 365; i++) {
    const dt = new Date(Date.UTC(2013, 3, 2) + i * 86400000);
    const haab = D.haabForDate(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
    months.add(haab.month);
    if (haab.month === 19) wayebDays++;
    assert.ok(haab.day >= 0 && haab.day <= (haab.month === 19 ? 4 : 19));
  }
  assert.equal(months.size, 19);
  assert.equal(wayebDays, 5);
});

test('the reading carries the Haab date and the moon full name', () => {
  const d = D.describeDate(2026, 10, 15);
  assert.equal(d.haab.label, '19 Yax');
  assert.equal(d.moon.fullName, 'Electric Deer');
  assert.equal(d.moonLabel, 'Moon 3 \u00b7 Day 26');
});

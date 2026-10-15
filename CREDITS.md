# Credits and third-party assets

This plugin redistributes artwork and a font that are **not** covered by its MIT
license. Both keep their own terms, reproduced here.

The calendar code (`Dreamspell.js`, the QML, the tests) is MIT — see [LICENSE](LICENSE).
The two asset groups below are separate works, bundled alongside it.

---

## Seal glyphs — `seals/`

The twenty glyphs are the Mesoamerican day signs of the Tzolkin, drawn as
standard inscription-form cartouches.

They are what the panel shows for a seal. A Dreamspell "seal" and a Mesoamerican
"day sign" are the same twenty signs — Argüelles reused them under new names —
so the panel names both: `Dog · Oc` is one sign, not two.

| | |
|---|---|
| **Author** | Bluebalam |
| **License** | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| **Source** | Wikimedia Commons — [Category:Maya glyphs of days](https://commons.wikimedia.org/wiki/Category:Maya_glyphs_of_days) |

### What was changed

Every seal keeps its **Commons file unmodified** as the dark polarity, and gains
one generated sibling. Neither change touches the drawing:

1. **Renamed.** Each file moved from its Commons title to `<seal number>-<day sign>.svg`,
   so a seal number alone resolves to its artwork (`sealAsset()` in `Dreamspell.js`).
   Day-sign spellings here follow the plugin's own transliteration; the Commons
   title keeps its own, and both are given per row below.
2. **A light polarity was generated.** Beside each file sits
   `<seal number>-<day sign>-light.svg`, identical except that the single
   `fill="#000000"` becomes `fill="#f4f5f5"`. The pair exists because a glyph has
   to survive being placed on a saturated plaque and on a dark bar, and tinting
   one file at runtime proved unreliable — the artwork kept the fill baked into
   the asset and disappeared against its own background.

The Commons originals are redistributed byte for byte. The `-light` siblings are
derivatives of them and stay under CC BY-SA 4.0: if you fork this and ship them,
keep the attribution and the share-alike term. Replacing the fill is the only
edit made; no path data was touched.

### The twenty files

| Seal | Dreamspell seal | Day sign | Commons file | License |
|-----:|-----------------|----------|--------------|---------|
| 1 | Dragon | Imix | `MAYA-g-log-cal-D01-Imix.svg` | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| 2 | Wind | Ik | `MAYA-g-log-cal-D02-Ik.svg` | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| 3 | Night | Akbal | `MAYA-g-log-cal-D03-Akbal.svg` | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| 4 | Seed | Kan | `MAYA-g-log-cal-D04-Kan.svg` | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| 5 | Serpent | Chicchan | `MAYA-g-log-cal-D05-Chikchan.svg` | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| 6 | World-Bridger | Cimi | `MAYA-g-log-cal-D06-Kimi.svg` | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| 7 | Hand | Manik | `MAYA-g-log-cal-D07-Manik.svg` | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| 8 | Star | Lamat | `MAYA-g-log-cal-D08-Lamat.svg` | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| 9 | Moon | Muluc | `MAYA-g-log-cal-D09-Muluk.svg` | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| 10 | Dog | Oc | `MAYA-g-log-cal-D10-Ok b.svg` | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| 11 | Monkey | Chuen | `MAYA-g-log-cal-D11-Chuwen.svg` | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| 12 | Human | Eb | `MAYA-g-log-cal-D12-Eb.svg` | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| 13 | Skywalker | Ben | `MAYA-g-log-cal-D13-Ben.svg` | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| 14 | Wizard | Ix | `MAYA-g-log-cal-D14-Ix.svg` | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| 15 | Eagle | Men | `MAYA-g-log-cal-D15-Men.svg` | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| 16 | Warrior | Cib | `MAYA-g-log-cal-D16-Kib.svg` | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| 17 | Earth | Caban | `MAYA-g-log-cal-D17-Kaban.svg` | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| 18 | Mirror | Etznab | `MAYA-g-log-cal-D18-Etznab.svg` | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| 19 | Storm | Cauac | `MAYA-g-log-cal-D19-Kawak.svg` | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| 20 | Sun | Ahau | `MAYA-g-log-cal-D20-Ajaw.svg` | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |

---

## Tone numerals — `fonts/`

A Dreamspell tone is written as its Mayan numeral: dots for 1–4, a bar for 5,
bar plus dots for 6–9, two bars plus dots for 10–13. That is not decoration — it
is the notation the tone system uses. The panel renders the tone that way, and
falls back to the plain digit if the font fails to load.

| | |
|---|---|
| **Font** | Noto Sans Mayan Numerals |
| **Author** | The Noto Project Authors |
| **License** | [SIL Open Font License 1.1](fonts/OFL.txt) |
| **Source** | <https://github.com/notofonts/mayan-numerals> |
| **Bundled as** | `fonts/NotoSansMayanNumerals-Regular.ttf` |

The font file is redistributed **unmodified**, and its license travels with it as
`fonts/OFL.txt`.

It is bundled rather than assumed present: a missing font would render every tone
as a tofu box, and no glyph renders correctly without it.

## Tone words — `TONE_WORDS` in `Dreamspell.js`

The `glyph` bar label writes the tone in Yucatec Maya, so the thirteen words live
in the model as `TONE_WORDS`: jun, kaʼa, óox, kan, joʼo, wak, wuk, waxak, bolon,
lajun, buluk, lajkaʼa, óoxlajun.

| | |
|---|---|
| **Source** | [Wiktionary: Appendix:Yucatec Maya numerals](https://en.wiktionary.org/wiki/Appendix:Yucatec_Maya_numerals) |
| **Cited there** | Beltrán de Santa Rosa María, *Arte de el idioma maya* (1746); Montgomery, *Maya-English, English-Maya (Yucatec) Dictionary & Phrasebook* (2004) |
| **License** | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |

The orthography is the modern one, which is a deliberate choice rather than a
default: the colonial spellings (hun, ca, ox, uaxac, buluc) are the same words
and are not wrong, but the day-sign names in `GLYPHS` already use their own
classic forms, and mixing the two within one label reads worse than either.

Twelve is `lajkaʼa`, the classical form, rather than the also-current
`kaʼalajun`; six and seven are the short `wak` and `wuk` rather than `wáak` and
`úuk`. The glottal stop is U+02BC and not an apostrophe, and a test pins every
code point so a lookalike character cannot slip in unnoticed.

## Preview banner — `preview.png`

The image the repository and the marketplace listing show. It frames a real
capture of the running panel on a generated background, so it reproduces the
seal glyphs illustrated above and stays under **CC BY-SA 4.0**, with the
attribution given in that section. The panel is a capture, not a mock-up.

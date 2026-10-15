import QtQuick
import Quickshell
import qs.Commons
import qs.Ui
import "Dreamspell.js" as Dreamspell

// The Dreamspell popup: today's kin read out in full — seal, tone, colour,
// oracle, wavespell, castle and its place in the 13-Moon year.
//
// BarWidget.qml owns the bar label and hands this panel the button to
// anchor against.
Panel {
  id: root
  moduleName: "nathker.dreamspell"
  ipcTarget: "nathker.dreamspell"
  manageIpc: false

  property var anchorItem: null

  // The bar tracks the widget mounted in its slot — BarWidget.qml — not this
  // nested panel. Everything the bar identifies a panel by has to be that
  // widget: the popout coordinator (and with it the open-panel dot under the
  // pill) compares against `slot.activeItem`, and switchPanelFrom looks the
  // slot up the same way.
  property var hostWidget: null
  readonly property var barIdentity: hostWidget || root

  // ---- Today. SystemClock keeps this honest across midnight so the reading
  //      rolls over without the panel being reopened.
  property date today: new Date()
  readonly property var reading: Dreamspell.describeDate(
    today.getFullYear(), today.getMonth() + 1, today.getDate())

  // Guarded so the panel renders before the bar is injected (the bar-widget
  // contract instantiates it bare).
  readonly property color contentForeground: bar ? bar.foreground : Color.foreground
  readonly property string contentFontFamily: bar ? bar.fontFamily : Style.font.family

  // The four Dreamspell colours are the calendar's own symbols, so they are
  // stated as colours rather than borrowed from the theme: a themed "red"
  // that renders pink would be a lie about the day.
  readonly property var sealColors: ({
    Red: "#c0504d",
    White: "#d7dbdd",
    Blue: "#4a7fb5",
    Yellow: "#c9a227"
  })

  // The bar is tuned for 26px of height; this panel is a wide reading surface,
  // so its type runs a step larger than the shell default instead of reusing
  // the bar's scale. Everything below derives from these, so moving the scale
  // moves the whole panel together.
  readonly property real typeScale: 1.2
  readonly property int labelSize: Math.round(Style.font.bodySmall * root.typeScale)
  // Two steps under the panel scale: the value answers the label beside it, and
  // at the title token the data read as loudly as the hero.
  readonly property int valueSize: Math.round(Style.font.title * root.typeScale) - 2
  readonly property int sectionSize: Math.round(Style.font.caption * root.typeScale)
  readonly property int heroSize: Math.round(Style.font.displayLarge * root.typeScale)
  readonly property int heroSubtitleSize: Math.round(Style.font.subtitle * root.typeScale)
  readonly property int noteSize: Math.round(Style.font.bodySmall * root.typeScale)

  // How much of a plate the seal glyph fills. Past roughly 0.86 the artwork's
  // corners reach the plate's own corner radius and get cut, so this sits near
  // the ceiling: the drawing has to be readable, not merely present.
  readonly property real glyphFill: 0.84
  // Rows are tall enough for the mark, not for the text.
  readonly property int rowHeight: Math.max(
    Math.round(root.valueSize * 1.8),
    root.markSize + Style.space(6))
  readonly property int labelWidth: Math.round(Style.space(104) * root.typeScale)
  // A seal mark is the glyph on a plaque of the seal's own colour, sized for the
  // artwork inside it: at the old size every day sign collapsed into the same
  // grey blob.
  readonly property int markSize: Math.round(Style.space(26) * root.typeScale)
  readonly property int plaqueSize: Math.round(Style.space(96) * root.typeScale)
  // The reading sits in two columns of sections, so the panel reads wide
  // rather than as one long strip.
  readonly property int columnGap: Style.space(28)
  readonly property int sectionGap: Style.space(14)

  // The tone is drawn as its Mayan numeral when the bundled font resolves.
  // FontLoader reports its own failure, so the fallback is the plain digit
  // rather than a missing-glyph box.
  readonly property bool numeralReady: numerals.status === FontLoader.Ready
  readonly property string toneMark: !root.reading
    ? ""
    : (root.numeralReady ? root.reading.toneNumeral : String(root.reading.tone))

  function sealColor(name) {
    var value = root.sealColors[name]
    return value === undefined ? root.contentForeground : value
  }

  // Which of the two shipped glyph polarities stays legible on a given fill.
  // The rule lives in the model, so the bar and the panel cannot answer it
  // differently.
  function glyphFor(fill) {
    return Dreamspell.glyphAgainstFill(fill.r, fill.g, fill.b)
  }

  // ---- Rows are built here rather than in the QML body so the layout below
  //      stays a plain list of sections.
  readonly property var dayRows: {
    var d = root.reading
    if (!d) return []
    return [
      { label: "SEAL", value: d.seal + " \u00b7 " + d.sealName },
      { label: "TONE", value: d.tone + " \u00b7 " + d.toneName },
      { label: "COLOR", value: d.color },
      { label: "MAYA GLYPH", value: d.glyphName }
    ]
  }

  readonly property var yearRows: {
    var d = root.reading
    if (!d) return []
    var bearer = d.yearBearer
    var rows = [
      { label: "13-MOON DATE", value: d.moonLabel },
      {
        label: "YEAR BEARER",
        sealColor: bearer.color,
        asset: bearer.asset,
        value: "Kin " + bearer.kin + " \u00b7 " + bearer.color + " " + bearer.toneName + " " + bearer.sealName
      },
      { label: "YEAR", value: bearer.startYear + " \u2013 " + (bearer.startYear + 1) },
      { label: "ANILLO SOLAR", value: bearer.ns + " \u00b7 year " + bearer.yearInRing + " of 52" }
    ]
    // The Day Out of Time belongs to no moon, so it has no moon name to show.
    if (d.moon && d.moon.kind === "moon")
      rows.splice(1, 0, { label: "MOON", value: d.moon.moonName + " \u00b7 " + d.moon.weekday })
    return rows
  }

  readonly property var wavespellRows: {
    var d = root.reading
    if (!d) return []
    return [
      {
        label: "WAVESPELL",
        sealColor: d.wavespell.color,
        asset: d.wavespell.asset,
        value: d.wavespell.sealName + " (" + d.wavespell.glyphName + ")"
      },
      { label: "DAY", value: d.wavespell.day + " of 13" },
      { label: "OPENED", value: "Kin " + d.wavespell.kin },
      { label: "CASTLE", value: d.castle + " \u00b7 " + d.castleName }
    ]
  }

  readonly property var oracleRows: {
    var d = root.reading
    if (!d) return []
    function entry(label, seal) {
      return {
        label: label,
        sealColor: seal.color,
        asset: seal.asset,
        value: seal.sealName + " \u00b7 " + seal.glyphName
      }
    }
    return [
      // The guide is the kin's own seal on tones 1, 6 and 11, which is worth
      // saying out loud rather than leaving as an unexplained repeat.
      entry(d.isGuideSelf ? "GUIDE (SELF)" : "GUIDE", d.oracle.guide),
      entry("ANALOG", d.oracle.analog),
      entry("ANTIPODE", d.oracle.antipode),
      entry("OCCULT", d.oracle.occult)
    ]
  }

  function open() {
    refresh()
    root.controller.show()
    // Set after showing, not before: showing hands the popout coordinator
    // over, which closes whichever panel was open, and that close clears the
    // shared flag. Deferring means the panel taking over always wins, while
    // a handoff to a panel that does not manage the flag still leaves it
    // cleared rather than stuck on.
    Qt.callLater(function() {
      if (root.opened) setCenterHoverRevealSuppressed(true)
    })
  }

  function close() {
    setCenterHoverRevealSuppressed(false)
    root.controller.hide()
  }

  function toggle() {
    if (root.opened) root.close()
    else root.open()
  }

  function switchPanel(direction) {
    if (root.bar && typeof root.bar.switchPanelFrom === "function")
      return root.bar.switchPanelFrom(root.barIdentity, direction)
    return false
  }

  // Summoning by hotkey moves no pointer, so a hover the bar was still
  // holding must not keep the center indicators revealed behind the panel.
  function setCenterHoverRevealSuppressed(value) {
    if (root.bar && typeof root.bar.setCenterHoverRevealSuppressed === "function")
      root.bar.setCenterHoverRevealSuppressed(value)
    else if (root.bar && "centerHoverRevealSuppressed" in root.bar)
      root.bar.centerHoverRevealSuppressed = value
  }

  function refresh() {
    root.today = new Date()
  }

  SystemClock {
    id: clock
    precision: SystemClock.Minutes
    onDateChanged: {
      if (Qt.formatDate(clock.date, "yyyy-MM-dd") === Qt.formatDate(root.today, "yyyy-MM-dd")) return
      root.today = clock.date
    }
  }

  // The tone is rendered as its Mayan numeral, so the font travels with the
  // plugin instead of being assumed present on the machine.
  FontLoader {
    id: numerals
    source: Qt.resolvedUrl("fonts/NotoSansMayanNumerals-Regular.ttf")
  }

  // A bundled seal glyph is monochrome line art, so its polarity is chosen from
  // the two files that ship: the plate asks for whichever one contrasts with its
  // own fill, and the asset is drawn exactly as it is.
  component SealGlyph: Item {
    id: glyphRoot

    property string asset: ""
    property string variant: "dark"
    property int extent: root.markSize

    implicitWidth: extent
    implicitHeight: extent

    // Two assets instead of one tinted at runtime: the tint never applied, so
    // every glyph drew in the black fill baked into its file and the saturated
    // plates lost the drawing inside their own colour.
    readonly property string glyphAsset: Dreamspell.assetVariant(glyphRoot.asset, glyphRoot.variant)

    Image {
      anchors.fill: parent
      source: glyphRoot.glyphAsset ? Qt.resolvedUrl(glyphRoot.glyphAsset) : ""
      // Rasterise the SVG at the size it is actually drawn, so it stays sharp on
      // HiDPI instead of being upscaled from its intrinsic box.
      sourceSize.width: Math.round(width * Screen.devicePixelRatio)
      sourceSize.height: Math.round(height * Screen.devicePixelRatio)
      fillMode: Image.PreserveAspectFit
    }
  }

  // One row shape for every section: a small-caps label, an optional seal mark,
  // then the value. A mark is the glyph on a plaque of the seal's colour, so it
  // carries both the shape and the colour and the value repeats neither.
  Component {
    id: detailRow

    Row {
      width: parent ? parent.width : implicitWidth
      height: root.rowHeight
      spacing: Style.space(10)

      Text {
        textFormat: Text.PlainText
        width: root.labelWidth
        height: parent.height
        verticalAlignment: Text.AlignVCenter
        text: String(modelData.label || "")
        color: Qt.darker(root.contentForeground, 1.6)
        font.family: root.contentFontFamily
        font.pixelSize: root.labelSize
        font.letterSpacing: 1
        font.bold: true
        elide: Text.ElideRight
      }

      Item {
        id: markCell
        width: modelData.asset ? root.markSize : 0
        height: parent.height

        Rectangle {
          id: markPlaque
          anchors.centerIn: parent
          width: root.markSize
          height: root.markSize
          radius: Math.round(root.markSize * 0.24)
          visible: !!modelData.asset
          color: modelData.sealColor ? root.sealColor(modelData.sealColor) : root.contentForeground

          SealGlyph {
            anchors.centerIn: parent
            extent: Math.round(parent.width * root.glyphFill)
            asset: modelData.asset || ""
            variant: root.glyphFor(markPlaque.color)
          }
        }
      }

      Text {
        textFormat: Text.PlainText
        width: Math.max(0, parent.width - root.labelWidth - markCell.width - parent.spacing * 2)
        height: parent.height
        verticalAlignment: Text.AlignVCenter
        text: String(modelData.value || "")
        color: root.contentForeground
        font.family: root.contentFontFamily
        font.pixelSize: root.valueSize
        elide: Text.ElideRight
      }
    }
  }

  KeyboardPanel {
    id: panel
    anchorItem: root.anchorItem
    owner: root.barIdentity
    bar: root.bar
    open: root.opened
    // Anchored under the bar icon, not centered on screen: the reading belongs
    // to the widget you clicked, and popping it up mid-screen would break the
    // connection between the click and the thing it opened.
    centerOnBar: false
    focusTarget: keyCatcher
    contentWidth: panel.fittedContentWidth(Style.space(960))
    contentHeight: panel.fittedContentHeight(contentColumn.implicitHeight)

    PanelKeyCatcher {
      id: keyCatcher
      anchors.fill: parent
      onMoveRequested: function(dx, dy) {
        if (dy === 0) return
        var limit = Math.max(0, scroll.contentHeight - scroll.height)
        scroll.contentY = Math.max(0, Math.min(limit, scroll.contentY + dy * Style.space(40)))
      }
      onActivateRequested: root.refresh()
      onCloseRequested: root.close()
      onTabRequested: function(direction) { root.switchPanel(direction) }
      onTextKey: function(t) {
        if (t === "r" || t === "R") root.refresh()
      }

      Flickable {
        id: scroll
        anchors.fill: parent
        contentWidth: contentColumn.width
        contentHeight: contentColumn.implicitHeight
        clip: true
        boundsBehavior: Flickable.StopAtBounds
        interactive: contentHeight > height

        Column {
          id: contentColumn
          width: scroll.width
          spacing: Style.space(12)

          // ---- Hero: the kin's two halves, side by side. The seal is the codex
          //      glyph on a plaque of its own colour; the tone is its Mayan
          //      numeral, which is what a Dreamspell tone is written as. The
          //      bundled artwork is a square cartouche, so the plaque follows the
          //      drawing rather than the round seat a bare number would get.
          Item {
            width: parent.width
            height: Math.max(plaque.height, Math.max(heroLabels.implicitHeight, toneMark.implicitHeight))

            Rectangle {
              id: plaque
              anchors.left: parent.left
              anchors.verticalCenter: parent.verticalCenter
              width: root.plaqueSize
              height: width
              radius: Math.round(width * 0.24)
              color: root.reading ? root.sealColor(root.reading.color) : root.contentForeground

              SealGlyph {
                anchors.centerIn: parent
                extent: Math.round(parent.width * root.glyphFill)
                asset: root.reading ? root.reading.asset : ""
                variant: root.glyphFor(plaque.color)
              }
            }

            Column {
              id: toneMark
              anchors.right: parent.right
              anchors.verticalCenter: parent.verticalCenter
              width: Style.space(72)
              spacing: Style.space(1)

              Text {
                textFormat: Text.PlainText
                width: parent.width
                horizontalAlignment: Text.AlignHCenter
                text: root.toneMark
                color: root.contentForeground
                font.family: root.numeralReady ? numerals.name : root.contentFontFamily
                font.pixelSize: root.heroSize
              }

              Text {
                textFormat: Text.PlainText
                width: parent.width
                horizontalAlignment: Text.AlignHCenter
                text: root.reading ? "TONE " + root.reading.tone : ""
                color: Qt.darker(root.contentForeground, 1.6)
                font.family: root.contentFontFamily
                font.pixelSize: root.labelSize
                font.letterSpacing: 1
                font.bold: true
              }
            }

            Column {
              id: heroLabels
              anchors.left: plaque.right
              anchors.leftMargin: Style.space(16)
              anchors.right: toneMark.left
              anchors.rightMargin: Style.space(12)
              anchors.verticalCenter: parent.verticalCenter
              spacing: Style.space(2)

              Text {
                textFormat: Text.PlainText
                text: root.reading ? "Kin " + root.reading.kin : ""
                color: root.contentForeground
                font.family: root.contentFontFamily
                font.pixelSize: root.heroSize
                font.bold: true
              }

              Text {
                textFormat: Text.PlainText
                width: parent.width
                elide: Text.ElideRight
                text: root.reading
                  ? root.reading.color + " " + root.reading.toneName + " " + root.reading.sealName
                  : ""
                color: Qt.darker(root.contentForeground, 1.4)
                font.family: root.contentFontFamily
                font.pixelSize: root.heroSubtitleSize
              }
            }
          }

          // ---- The reading is laid out as two columns of sections rather than
          //      one long list. Seventeen rows in a single column make the
          //      panel tall and narrow — the same shape as the bar it drops
          //      from — and the point of opening it is to read it comfortably.
          Row {
            width: parent.width
            spacing: root.columnGap

            readonly property real columnWidth: Math.round((width - spacing) / 2)

            // A section is its own Column so its rows sit tight against their
            // header, while the outer spacing keeps whole sections apart.
            // Without that nesting the sections would either drift apart row
            // by row or run together.
            // ---- Left: the day's identity, then where it sits in the year.
            Column {
              width: parent.columnWidth
              spacing: root.sectionGap

              Column {
                width: parent.width
                spacing: Style.space(2)

                PanelSeparator {
                  foreground: root.contentForeground
                }

                PanelSectionHeader {
                  text: "DAY"
                  foreground: root.contentForeground
                  fontFamily: root.contentFontFamily
                  fontSize: root.sectionSize
                }

                Repeater {
                  model: root.dayRows
                  delegate: detailRow
                }
              }

              Column {
                width: parent.width
                spacing: Style.space(2)

                PanelSeparator {
                  foreground: root.contentForeground
                }

                PanelSectionHeader {
                  text: "13-MOON YEAR"
                  foreground: root.contentForeground
                  fontFamily: root.contentFontFamily
                  fontSize: root.sectionSize
                }

                Repeater {
                  model: root.yearRows
                  delegate: detailRow
                }
              }
            }

            // ---- Right: the 13-day wavespell, the 52-day castle, the oracle.
            Column {
              width: parent.columnWidth
              spacing: root.sectionGap

              Column {
                width: parent.width
                spacing: Style.space(2)

                PanelSeparator {
                  foreground: root.contentForeground
                }

                PanelSectionHeader {
                  text: "WAVESPELL & CASTLE"
                  foreground: root.contentForeground
                  fontFamily: root.contentFontFamily
                  fontSize: root.sectionSize
                }

                Repeater {
                  model: root.wavespellRows
                  delegate: detailRow
                }
              }

              Column {
                width: parent.width
                spacing: Style.space(2)

                PanelSeparator {
                  foreground: root.contentForeground
                }

                PanelSectionHeader {
                  text: "ORACLE"
                  foreground: root.contentForeground
                  fontFamily: root.contentFontFamily
                  fontSize: root.sectionSize
                }

                Text {
                  textFormat: Text.PlainText
                  width: parent.width
                  wrapMode: Text.WordWrap
                  text: root.reading
                    ? "Guide, analog, antipode and occult all carry tone " + root.reading.tone + ", like the kin itself."
                    : ""
                  color: Qt.darker(root.contentForeground, 1.9)
                  font.family: root.contentFontFamily
                  font.pixelSize: root.noteSize
                }

                Repeater {
                  model: root.oracleRows
                  delegate: detailRow
                }
              }
            }
          }
        }
      }
    }
  }
}

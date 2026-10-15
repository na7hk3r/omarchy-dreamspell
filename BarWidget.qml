import QtQuick
import Quickshell
import Quickshell.Io
import qs.Commons
import qs.Ui
import "Dreamspell.js" as Dreamspell

// Dreamspell label for the bar, and the host for the reading popup.
//
// Left click opens the full breakdown — a kin is a reading, not a number —
// and right click walks the five label formats. The chosen format is stored
// in shell.json, so it is the format from then on rather than something that
// reverts on restart.
BarWidget {
  id: root
  moduleName: "nathker.dreamspell"

  property date displayDate: clock.date

  // "toneSeal" (11 Dog) · "toneNameSeal" (Spectral Dog) · "kin" (Kin 50)
  // · "glyph" (buluk Oc) · "icon" (the tone numeral and the seal, drawn)
  readonly property string configuredFormat: String(setting("labelFormat", "toneSeal"))

  readonly property var reading: Dreamspell.describeDate(
    displayDate.getFullYear(), displayDate.getMonth() + 1, displayDate.getDate())

  readonly property string displayText: reading
    ? Dreamspell.labelForKin(reading.kin, configuredFormat)
    : ""
  // "11 Dog" reads as two lines in a vertical bar; every format is one or two
  // words, so splitting on the space is enough.
  readonly property var verticalLines: displayText.length > 0 ? displayText.split(" ") : []

  // The icon format has no words: the seal's own glyph carries it, with the tone
  // beside it as a Mayan numeral, so the pair is the whole reading.
  readonly property bool iconOnly: configuredFormat === "icon" && reading !== null
  // Sized against the bar rather than Style.bar.iconCanvas. Every other bar icon
  // is a simple glyph that still reads at that 16px canvas; these cartouches do
  // not -- measured at 16px all twenty day signs render as the same grey blob,
  // and they only separate again from about 24px.
  readonly property int iconExtent: Math.round(Style.bar.sizeHorizontal * 0.92)

  // The tone written the way the Maya wrote it. The font travels with the plugin
  // and reports its own failure, so the fallback is the plain digit rather than
  // a missing-glyph box.
  readonly property bool numeralReady: numerals.status === FontLoader.Ready
  readonly property string toneMark: !reading
    ? ""
    : (root.numeralReady ? reading.toneNumeral : String(reading.tone))

  // The full traditional name, for anyone who hovers and wants to know what
  // the bar label is short for.
  readonly property string hoverText: reading
    ? "Kin " + reading.kin + " · " + reading.color + " " + reading.toneName + " " + reading.sealName
    : ""

  function refresh() {
    displayDate = new Date()
    if (panelLoader.item && panelLoader.item.refresh) panelLoader.item.refresh()
  }

  function cycleFormat() {
    var next = Dreamspell.nextLabelFormat(configuredFormat)
    if (next === configuredFormat) return

    var entry = { id: root.moduleName }
    for (var key in root.settings) if (key !== "id") entry[key] = root.settings[key]
    entry.labelFormat = next

    // Applied locally first so the label changes on the click itself; the
    // shell.json write comes back through the bar as the same value.
    root.settings = entry
    if (root.bar && root.bar.shell && typeof root.bar.shell.updateEntryInline === "function")
      root.bar.shell.updateEntryInline(root.moduleName, entry)
  }

  // ---- Reading popup. Shape contract for shell.summon/hide/toggle routing:
  //      Bar.findPanelWidget requires open/close/opened on the bar-widget root.
  readonly property bool opened: panelLoader.item ? panelLoader.item.opened === true : false

  function open() {
    if (panelLoader.item) panelLoader.item.open()
  }

  function close() {
    if (panelLoader.item) panelLoader.item.close()
  }

  function togglePanel() {
    if (panelLoader.item) panelLoader.item.toggle()
  }

  readonly property real openPanelIndicatorWidth: button.labelWidth
  readonly property real openPanelIndicatorHeight: Math.max(Style.space(10), Math.round(Style.bar.iconSlot * 0.55))

  // Forwarded so this widget can stand in for the panel as the bar's popout
  // identity: Bar.requestPopout prefers closeForPopoutSwitch over close, and
  // KeyboardPanel reads popoutSwitchClosing back off its owner.
  readonly property bool popoutSwitchClosing: panelLoader.item ? panelLoader.item.popoutSwitchClosing === true : false

  function closeForPopoutSwitch() {
    if (panelLoader.item) panelLoader.item.closeForPopoutSwitch()
  }

  function injectPanel() {
    var target = panelLoader.item
    if (!target) return
    if ("bar" in target) target.bar = root.bar
    if ("settings" in target) target.settings = root.settings
    if ("anchorItem" in target) target.anchorItem = button
    if ("hostWidget" in target) target.hostWidget = root
  }

  implicitWidth: button.implicitWidth
  implicitHeight: button.implicitHeight

  onBarChanged: injectPanel()
  onSettingsChanged: injectPanel()

  SystemClock {
    id: clock
    precision: SystemClock.Minutes
    onDateChanged: root.displayDate = date
  }

  Loader {
    id: panelLoader
    active: true
    source: Qt.resolvedUrl("Panel.qml")
    visible: false
    onLoaded: {
      root.injectPanel()
      Qt.callLater(root.injectPanel)
    }
  }

  IpcHandler {
    target: "nathker.dreamspell"

    function refresh(): void { root.broadcast("refresh") }
    function cycleFormat(): void { root.cycleFormat() }
    function open(): void { root.open() }
    function close(): void { root.close() }
    function show(): void { root.open() }
    function hide(): void { root.close() }
    function toggle(): void { root.togglePanel() }
  }

  WidgetButton {
    id: button
    anchors.fill: parent
    bar: root.bar
    text: root.vertical || root.iconOnly ? "" : root.displayText
    labelVisible: !root.vertical && !root.iconOnly
    hasVisualContent: root.iconOnly
      ? true
      : (root.vertical ? root.verticalLines.length > 0 : text !== "")
    // In icon mode there is no label to give the button a width, so it takes the
    // first-party icon slot every other icon-only bar widget uses, widened to
    // hold the tone's numeral beside the glyph.
    fixedWidth: root.iconOnly && !root.vertical
      ? Math.max(Style.bar.iconSlot, iconCanvas.implicitWidth + Style.space(2))
      : -1
    fixedHeight: root.vertical
      ? (root.iconOnly ? Style.bar.iconSlot : root.verticalLines.length * Style.bar.iconSlot)
      : -1
    horizontalMargin: 8.75
    verticalPadding: 8.75
    tooltipText: root.hoverText

    onPressed: function(b) {
      if (b === Qt.RightButton) root.cycleFormat()
      else root.togglePanel()
    }

    Column {
      visible: root.vertical
      anchors.fill: parent

      Repeater {
        model: root.verticalLines

        OpticalGlyph {
          required property string modelData
          width: button.width
          height: Style.bar.iconSlot
          text: modelData
          fontFamily: button.fontFamily
          fontSize: modelData.length > 3
            ? button.fontSize * 0.9
            : button.fontSize
          color: button.foreground
        }
      }
    }

    // The reading as two marks: the tone's Mayan numeral, then the seal's own
    // glyph. The glyph ships in two polarities, so this picks the file that
    // matches the button colour. Tinting one file at runtime was tried first and
    // never applied: every glyph kept the fill baked into the asset, which is
    // invisible on a dark bar.
    Row {
      id: iconCanvas
      anchors.centerIn: parent
      spacing: Style.space(2)
      visible: root.iconOnly

      // A white foreground asks for the light glyph, a near-black one for the
      // dark glyph. This is the question the old black-on-black icon was
      // answering backwards.
      readonly property string glyphAsset: root.reading
        ? Dreamspell.assetVariant(root.reading.asset, Dreamspell.glyphVariant(
            button.foreground.r, button.foreground.g, button.foreground.b))
        : ""

      // Empty rather than hidden in a vertical bar, which has no width for the
      // pair: an empty Text takes no room, so the Row is the glyph alone there.
      Text {
        textFormat: Text.PlainText
        text: root.vertical ? "" : root.toneMark
        height: root.iconExtent
        verticalAlignment: Text.AlignVCenter
        color: button.foreground
        font.family: root.numeralReady ? numerals.name : button.fontFamily
        font.pixelSize: Math.round(button.fontSize * 1.4)
      }

      Image {
        width: root.iconExtent
        height: root.iconExtent
        source: iconCanvas.glyphAsset ? Qt.resolvedUrl(iconCanvas.glyphAsset) : ""
        // Rasterise the SVG at the size it is actually drawn, or HiDPI upscales
        // the intrinsic box and softens it.
        sourceSize.width: Math.round(width * Screen.devicePixelRatio)
        sourceSize.height: Math.round(height * Screen.devicePixelRatio)
        fillMode: Image.PreserveAspectFit
      }
    }
  }

  // The tone's Mayan numeral travels with the plugin rather than being assumed
  // present: no system font carries it.
  FontLoader {
    id: numerals
    source: Qt.resolvedUrl("fonts/NotoSansMayanNumerals-Regular.ttf")
  }
}

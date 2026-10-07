import L from "leaflet";

const ICON_COLORS = { farm: "#059669", shop: "#d97706", user: "#2563eb", pick: "#dc2626" };

/** Pin-shaped markers drawn with CSS, so no image assets are needed. */
export function pinIcon(kind: keyof typeof ICON_COLORS, options: { approximate?: boolean; selected?: boolean } = {}) {
  const color = ICON_COLORS[kind];
  const glyph = kind === "farm" ? "🐔" : kind === "shop" ? "🏪" : kind === "user" ? "" : "📍";
  if (kind === "user") {
    // A round dot centred on the position, not a pin standing on it.
    return L.divIcon({
      className: "",
      html: `<span class="map-pin map-pin--user" style="--pin:${color}"></span>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
      popupAnchor: [0, -10]
    });
  }
  return L.divIcon({
    className: "",
    html: `<span class="map-pin map-pin--${kind}${options.approximate ? " is-approximate" : ""}${options.selected ? " is-selected" : ""}" style="--pin:${color}"><span>${glyph}</span></span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -30]
  });
}


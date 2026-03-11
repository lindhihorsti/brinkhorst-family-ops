export const HOME_LAYOUT_KEY = "home_layout";
export const HOME_LAYOUT_STANDARD = "standard";
export const HOME_LAYOUT_TILES = "tiles";
export const LIGHT_BG_COLOR_KEY = "light_bg_color";
export const LIGHT_BG_DEFAULT = "#fefefe";

export function normalizeHomeLayout(value) {
  return value === HOME_LAYOUT_TILES ? HOME_LAYOUT_TILES : HOME_LAYOUT_STANDARD;
}

export function normalizeLightBgColor(value) {
  if (typeof value !== "string") return LIGHT_BG_DEFAULT;
  const trimmed = value.trim().toLowerCase();
  if (!/^#[0-9a-f]{6}$/.test(trimmed)) return LIGHT_BG_DEFAULT;
  return trimmed === "#ffffff" ? LIGHT_BG_DEFAULT : trimmed;
}

export function applyHomeLayout(root, value) {
  if (!root) return;
  root.setAttribute("data-home-layout", normalizeHomeLayout(value));
}

export function applyLightBgColor(root, value) {
  if (!root) return;
  root.style.setProperty("--user-light-bg", normalizeLightBgColor(value));
}

export const HOME_LAYOUT_KEY = "home_layout";
export const HOME_LAYOUT_STANDARD = "standard";
export const HOME_LAYOUT_TILES = "tiles";

export function normalizeHomeLayout(value) {
  return value === HOME_LAYOUT_TILES ? HOME_LAYOUT_TILES : HOME_LAYOUT_STANDARD;
}

export function applyHomeLayout(root, value) {
  if (!root) return;
  root.setAttribute("data-home-layout", normalizeHomeLayout(value));
}

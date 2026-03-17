export const MAP_STYLE = "mapbox://styles/mapbox/light-v11";

export const MAP_COLORS = {
  route: "#059669",
  markerOrigin: "#059669",
  markerDestination: "#059669",
  markerDriver: "#059669",
  markerDriverGlow: "rgba(5,150,105,0.3)",
  water: "#d1fae5",
  park: "#a7f3d0",
  building: "#f3f4f6",
  background: "#f9fafb",
};

export const MAP_DEFAULT_OPTIONS = {
  attributionControl: false,
};

const THEME_LAYERS: [string[], Record<string, string>][] = [
  [["water"], { "fill-color": MAP_COLORS.water }],
  [["landuse"], { "fill-color": MAP_COLORS.park }],
  [["building"], { "fill-color": MAP_COLORS.building }],
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyThemeStyle(map: any) {
  for (const [layerIds, paint] of THEME_LAYERS) {
    for (const id of layerIds) {
      if (!map.getLayer(id)) continue;
      for (const [prop, value] of Object.entries(paint)) {
        map.setPaintProperty(id, prop, value);
      }
    }
  }
}

export function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs} hr ${rem} min` : `${hrs} hr`;
}

export function formatDistance(meters: number): string {
  const miles = meters / 1609.344;
  if (miles < 0.1) return `${Math.round(meters * 3.28084)} ft`;
  return `${miles.toFixed(1)} mi`;
}

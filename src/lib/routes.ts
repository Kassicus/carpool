export interface RouteCoords {
  origin: { lat: number; lng: number; name: string };
  destination: { lat: number; lng: number; name: string };
}

// Coordinates for the Anatolia College campus area in Thessaloniki
export const ROUTE_COORDS: Record<string, RouteCoords> = {
  "To Seminary": {
    origin: { lat: 40.5872, lng: 22.9584, name: "Anatolia College" },
    destination: { lat: 40.5941, lng: 22.9473, name: "Seminary" },
  },
  "To School from Seminary": {
    origin: { lat: 40.5941, lng: 22.9473, name: "Seminary" },
    destination: { lat: 40.5872, lng: 22.9584, name: "Anatolia College" },
  },
  "To School": {
    origin: { lat: 40.6301, lng: 22.9407, name: "City Center" },
    destination: { lat: 40.5872, lng: 22.9584, name: "Anatolia College" },
  },
  "Home from School": {
    origin: { lat: 40.5872, lng: 22.9584, name: "Anatolia College" },
    destination: { lat: 40.6301, lng: 22.9407, name: "City Center" },
  },
};

export function getRouteDisplayNames(carpool: {
  route: string;
  customRoute?: string | null;
  originName?: string | null;
  destinationName?: string | null;
}): { origin: string; destination: string } | null {
  // Prefer stored names
  if (carpool.originName || carpool.destinationName) {
    return {
      origin: carpool.originName || "",
      destination: carpool.destinationName || "",
    };
  }
  // Fall back to preset coords
  const coords = ROUTE_COORDS[carpool.route];
  if (coords) {
    return { origin: coords.origin.name, destination: coords.destination.name };
  }
  // Fall back to custom route text
  if ((carpool.route === "Other" || carpool.route === "Custom") && carpool.customRoute) {
    return { origin: carpool.customRoute, destination: "" };
  }
  return null;
}

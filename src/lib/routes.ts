export interface RouteCoords {
  origin: { lat: number; lng: number; name: string };
  destination: { lat: number; lng: number; name: string };
}

export function getRouteDisplayNames(carpool: {
  route: string;
  originName?: string | null;
  destinationName?: string | null;
}): { origin: string; destination: string } | null {
  if (carpool.originName || carpool.destinationName) {
    return {
      origin: carpool.originName || "",
      destination: carpool.destinationName || "",
    };
  }
  return null;
}

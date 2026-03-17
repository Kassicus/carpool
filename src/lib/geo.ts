/** Haversine distance between two coordinates in meters */
export function distanceBetween(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Distance-based status message for rider tracking */
export function getStatusMessage(distanceMeters: number): string {
  if (distanceMeters < 100) return "Driver is here";
  if (distanceMeters < 500) return "Arriving soon";
  if (distanceMeters < 2000) return "Getting close";
  return "On the way";
}

/** Get a CSS class for the status color */
export function getStatusColor(distanceMeters: number): string {
  if (distanceMeters < 100) return "text-primary";
  if (distanceMeters < 500) return "text-accent";
  if (distanceMeters < 2000) return "text-amber-500";
  return "text-text-secondary";
}

/** Fetch ETA from Mapbox Directions API */
export async function fetchETA(
  driverPos: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<{ eta: number; distance: number } | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return null;

  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${driverPos.lng},${driverPos.lat};${destination.lng},${destination.lat}?overview=false&access_token=${token}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const route = data.routes?.[0];
    if (!route) return null;
    return { eta: Math.round(route.duration), distance: Math.round(route.distance) };
  } catch {
    return null;
  }
}

/** ETA-based status message, falls back to distance-based */
export function getETAMessage(etaSeconds: number | null, distanceMeters: number): string {
  if (etaSeconds != null) {
    if (etaSeconds < 60) return "Arriving now";
    const mins = Math.round(etaSeconds / 60);
    return `Arriving in ~${mins} min`;
  }
  return getStatusMessage(distanceMeters);
}

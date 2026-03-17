"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Button from "./ui/button";
import RouteMap from "./map/route-map";

interface DriverTrackingProps {
  carpoolId: string;
  routeName: string;
  destinationLat?: number | null;
  destinationLng?: number | null;
  destinationName?: string | null;
  originLat?: number | null;
  originLng?: number | null;
  routeGeometry?: string | null;
  isActive?: boolean;
}

export default function DriverTracking({
  carpoolId,
  routeName,
  destinationLat,
  destinationLng,
  destinationName,
  originLat,
  originLng,
  routeGeometry,
  isActive: isActiveProp = false,
}: DriverTrackingProps) {
  const [active, setActive] = useState(isActiveProp);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Resume geolocation watching if the trip was already active on mount
  useEffect(() => {
    if (!isActiveProp || !navigator.geolocation) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => sendLocation(pos),
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 }
    );

    intervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => sendLocation(pos),
        () => {},
        { enableHighAccuracy: true, maximumAge: 5000 }
      );
    }, 5000);

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActiveProp]);

  const sendLocation = useCallback(
    async (position: GeolocationPosition) => {
      const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
      setDriverPos(pos);
      try {
        await fetch("/api/tracking/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            carpoolId,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            heading: position.coords.heading,
          }),
        });
      } catch {
        // Silently fail - next update will try again
      }
    },
    [carpoolId]
  );

  const startTracking = useCallback(async () => {
    setLoading(true);
    setError("");

    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      setLoading(false);
      return;
    }

    try {
      // Start trip on server
      const res = await fetch("/api/tracking/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carpoolId }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to start trip");
        setLoading(false);
        return;
      }

      // Watch position
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => sendLocation(pos),
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            setError("Location permission denied. Please allow location access.");
            stopTracking();
          }
        },
        { enableHighAccuracy: true, maximumAge: 5000 }
      );

      // Also send location every 5s as backup
      intervalRef.current = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          (pos) => sendLocation(pos),
          () => {},
          { enableHighAccuracy: true, maximumAge: 5000 }
        );
      }, 5000);

      setActive(true);
    } catch {
      setError("Failed to start tracking");
    }
    setLoading(false);
  }, [carpoolId, sendLocation]);

  const stopTracking = useCallback(async () => {
    setLoading(true);

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    try {
      await fetch("/api/tracking/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carpoolId }),
      });
    } catch {
      // ignore
    }

    setActive(false);
    setDriverPos(null);
    setLoading(false);
  }, [carpoolId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const hasDestination = destinationLat != null && destinationLng != null;
  const hasOrigin = originLat != null && originLng != null;

  async function handleNavigate() {
    if (!hasDestination) return;
    // Auto-start tracking so riders can see the driver's location
    if (!active) {
      await startTracking();
    }
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destinationLat},${destinationLng}`;
    window.open(url, "_blank");
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {active && (
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
            </span>
            <span className="text-xs font-medium text-primary">Live</span>
          </div>
        )}
        <Button
          variant={active ? "danger" : "primary"}
          size="sm"
          onClick={active ? stopTracking : startTracking}
          disabled={loading}
        >
          {loading
            ? "..."
            : active
              ? "End Trip"
              : "Start Trip"}
        </Button>
        {hasDestination && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleNavigate}
          >
            <span className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
              </svg>
              Navigate
            </span>
          </Button>
        )}
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>

      {/* Show route map when tracking is active */}
      {active && hasOrigin && hasDestination && (
        <RouteMap
          origin={{ lat: originLat!, lng: originLng! }}
          destination={{ lat: destinationLat!, lng: destinationLng! }}
          routeGeometry={routeGeometry}
          driverPosition={driverPos}
          className="h-48 rounded-2xl"
        />
      )}
    </div>
  );
}

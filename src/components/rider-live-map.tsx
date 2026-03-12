"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ROUTE_COORDS } from "@/lib/routes";
import { distanceBetween, getStatusMessage, getStatusColor } from "@/lib/geo";
import RouteMap from "./map/route-map";
import Card from "./ui/card";

interface RiderLiveMapProps {
  carpoolId: string;
  route: string;
  originLat?: number | null;
  originLng?: number | null;
  destinationLat?: number | null;
  destinationLng?: number | null;
  routeGeometry?: string | null;
}

export default function RiderLiveMap({
  carpoolId,
  route,
  originLat,
  originLng,
  destinationLat,
  destinationLng,
  routeGeometry,
}: RiderLiveMapProps) {
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number } | null>(null);
  const [status, setStatus] = useState<string>("Connecting...");
  const [statusColor, setStatusColor] = useState("text-text-secondary");
  const [stopped, setStopped] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const fallbackRef = useRef<NodeJS.Timeout | null>(null);

  const routeCoords = ROUTE_COORDS[route];

  // Resolve coordinates: prefer explicit props, fall back to preset
  const origin = (originLat != null && originLng != null)
    ? { lat: originLat, lng: originLng }
    : routeCoords?.origin ?? null;
  const destination = (destinationLat != null && destinationLng != null)
    ? { lat: destinationLat, lng: destinationLng }
    : routeCoords?.destination ?? null;

  const destLat = destination?.lat;
  const destLng = destination?.lng;

  const updateStatus = useCallback(
    (lat: number, lng: number) => {
      if (destLat != null && destLng != null) {
        const dist = distanceBetween(lat, lng, destLat, destLng);
        setStatus(getStatusMessage(dist));
        setStatusColor(getStatusColor(dist));
      } else {
        setStatus("Driver is active");
        setStatusColor("text-primary");
      }
    },
    [destLat, destLng]
  );

  useEffect(() => {
    // Try SSE first
    const es = new EventSource(`/api/tracking/${carpoolId}/stream`);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "stopped") {
          setStopped(true);
          setStatus("Trip ended");
          setStatusColor("text-text-muted");
          es.close();
          return;
        }
        if (data.type === "location") {
          setDriverPos({ lat: data.latitude, lng: data.longitude });
          updateStatus(data.latitude, data.longitude);
        }
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      // Fallback to polling if SSE fails
      es.close();

      fallbackRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/tracking/${carpoolId}/stream`);
          if (!res.ok) {
            setStopped(true);
            setStatus("Trip ended");
            if (fallbackRef.current) clearInterval(fallbackRef.current);
            return;
          }
        } catch {
          // ignore
        }
      }, 5000);
    };

    return () => {
      es.close();
      if (fallbackRef.current) clearInterval(fallbackRef.current);
    };
  }, [carpoolId, updateStatus]);

  if (!origin || !destination) return null;

  return (
    <Card className="overflow-hidden">
      <RouteMap
        origin={origin}
        destination={destination}
        routeGeometry={routeGeometry}
        driverPosition={driverPos}
        className="h-48 sm:h-64"
      />
      <div className="p-4">
        <div className="flex items-center gap-2">
          {!stopped && (
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
            </span>
          )}
          <span className={`text-sm font-semibold ${statusColor}`}>{status}</span>
        </div>
      </div>
    </Card>
  );
}

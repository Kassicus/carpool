"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import RiderLiveMap from "@/components/rider-live-map";
import DriverInfoCard from "@/components/driver-info-card";
import { formatTime } from "@/lib/utils";
import SetPageHeader from "@/components/set-page-header";

interface RideInfo {
  carpoolId: string;
  driverName: string;
  route: string;
  originName?: string | null;
  destinationName?: string | null;
  originLat?: number | null;
  originLng?: number | null;
  destinationLat?: number | null;
  destinationLng?: number | null;
  routeGeometry?: string | null;
  routeDistance?: number | null;
  routeDuration?: number | null;
  time: string;
}

export default function RideDetailPage() {
  const params = useParams();
  const carpoolId = params.id as string;
  const [ride, setRide] = useState<RideInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRide() {
      const res = await fetch("/api/my-rides");
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const rides = await res.json();
      const found = rides.find((r: RideInfo) => r.carpoolId === carpoolId);
      if (found) {
        setRide(found);
      }
      setLoading(false);
    }
    fetchRide();
  }, [carpoolId]);

  const routeName = ride?.route || "";

  return (
    <div className="mx-auto max-w-2xl px-4">
      <SetPageHeader title="Live Tracking" backHref="/rider" />

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-48 rounded-2xl bg-gray-200" />
          <div className="h-20 rounded-2xl bg-gray-200" />
        </div>
      ) : ride ? (
        <div className="space-y-4">
          <h1 className="text-xl font-bold text-text hidden sm:block">Live Tracking</h1>
          <RiderLiveMap
            carpoolId={carpoolId}
            originLat={ride.originLat}
            originLng={ride.originLng}
            destinationLat={ride.destinationLat}
            destinationLng={ride.destinationLng}
            routeGeometry={ride.routeGeometry}
          />
          <DriverInfoCard
            name={ride.driverName}
            route={routeName}
            time={formatTime(ride.time)}
            routeDistance={ride.routeDistance}
            routeDuration={ride.routeDuration}
          />
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-text-secondary">Ride not found</p>
        </div>
      )}
    </div>
  );
}

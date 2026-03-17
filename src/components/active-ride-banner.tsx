"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "./ui/card";
import Badge from "./ui/badge";

interface ActiveRide {
  carpoolId: string;
  route: string;
  originName?: string | null;
  destinationName?: string | null;
  driverName: string;
  time: string;
}

export default function ActiveRideBanner() {
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null);

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch("/api/tracking/active");
        if (!res.ok) return;
        const data = await res.json();
        setActiveRide(data || null);
      } catch {
        // ignore
      }
    }

    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!activeRide) return null;

  return (
    <Link href={`/rider/ride/${activeRide.carpoolId}`}>
      <Card className="mb-6 bg-primary-50 border-primary/20 p-4">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-primary">
              Your driver is on the way!
            </p>
            <p className="text-xs text-text-secondary truncate">
              {activeRide.route} &middot; {activeRide.driverName}
            </p>
          </div>
          <Badge variant="primary">Track</Badge>
        </div>
      </Card>
    </Link>
  );
}

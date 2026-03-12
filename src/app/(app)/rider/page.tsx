"use client";

import { useState } from "react";
import SearchCarpools from "@/components/search-carpools";
import MyRidesList from "@/components/my-rides-list";
import ActiveRideBanner from "@/components/active-ride-banner";
import SetPageHeader from "@/components/set-page-header";

export default function RiderPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="mx-auto max-w-3xl px-4">
      <SetPageHeader title="Find a Ride" />

      <ActiveRideBanner />
      <h1 className="mb-6 text-2xl font-bold text-text hidden sm:block">Find a Ride</h1>
      <SearchCarpools onBooked={() => setRefreshKey((k) => k + 1)} />

      <div className="mt-10">
        <h2 className="mb-3 text-sm font-semibold text-text-secondary uppercase tracking-wide">
          My Booked Rides
        </h2>
        <MyRidesList refreshKey={refreshKey} />
      </div>
    </div>
  );
}

"use client";

import SearchCarpools from "@/components/search-carpools";
import ActiveRideBanner from "@/components/active-ride-banner";
import SetPageHeader from "@/components/set-page-header";

export default function RiderPage() {
  return (
    <div className="mx-auto max-w-3xl px-4">
      <SetPageHeader title="Find a Ride" />

      <ActiveRideBanner />
      <h1 className="mb-6 text-2xl font-bold text-text hidden sm:block">Find a Ride</h1>
      <SearchCarpools onBooked={() => {}} />
    </div>
  );
}

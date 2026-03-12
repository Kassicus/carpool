"use client";

import { useState } from "react";
import Link from "next/link";
import CreateCarpoolForm from "@/components/create-carpool-form";
import MyCarpoolsList from "@/components/my-carpools-list";
import Card from "@/components/ui/card";
import SetPageHeader from "@/components/set-page-header";

export default function DriverPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<"carpools" | "create">("carpools");

  return (
    <div className="mx-auto max-w-4xl px-4">
      <SetPageHeader
        title="Driver"
        rightAction={
          <Link
            href="/driver/blocks"
            className="rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-gray-200 transition-colors"
          >
            Blocked
          </Link>
        }
      />

      <div className="mb-6 hidden sm:flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">Driver</h1>
        <Link
          href="/driver/blocks"
          className="rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-gray-200 transition-colors"
        >
          Blocked Riders
        </Link>
      </div>

      {/* Mobile tab switcher */}
      <div className="mb-4 sm:hidden">
        <div className="flex rounded-xl bg-gray-100 p-1">
          <button
            onClick={() => setActiveTab("carpools")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              activeTab === "carpools"
                ? "bg-white text-text shadow-sm"
                : "text-text-secondary"
            }`}
          >
            My Carpools
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              activeTab === "create"
                ? "bg-white text-text shadow-sm"
                : "text-text-secondary"
            }`}
          >
            Create New
          </button>
        </div>
      </div>

      {/* Mobile: conditional rendering based on active tab */}
      <div className="sm:hidden">
        {activeTab === "carpools" && (
          <div>
            <MyCarpoolsList refreshKey={refreshKey} />
          </div>
        )}
        {activeTab === "create" && (
          <div>
            <Card className="p-6">
              <CreateCarpoolForm
                onCreated={() => {
                  setRefreshKey((k) => k + 1);
                  setActiveTab("carpools");
                }}
              />
            </Card>
          </div>
        )}
      </div>

      {/* Desktop: two-column grid */}
      <div className="hidden sm:grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-semibold text-text-secondary uppercase tracking-wide">
            Create Carpool
          </h2>
          <Card className="p-6">
            <CreateCarpoolForm
              onCreated={() => setRefreshKey((k) => k + 1)}
            />
          </Card>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-text-secondary uppercase tracking-wide">
            My Carpools
          </h2>
          <MyCarpoolsList refreshKey={refreshKey} />
        </div>
      </div>
    </div>
  );
}

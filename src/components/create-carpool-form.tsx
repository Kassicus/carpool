"use client";

import { useState } from "react";
import { DAY_LABELS } from "@/types";
import { ROUTE_COORDS } from "@/lib/routes";
import Button from "./ui/button";
import Input from "./ui/input";
import LocationPicker from "./location-picker";

interface LocationValue {
  lat: number;
  lng: number;
  name: string;
}

const PRESET_ROUTES = [
  "To Seminary",
  "To School from Seminary",
  "To School",
  "Home from School",
] as const;

export default function CreateCarpoolForm({
  onCreated,
}: {
  onCreated: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [route, setRoute] = useState("");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [origin, setOrigin] = useState<LocationValue | null>(null);
  const [destination, setDestination] = useState<LocationValue | null>(null);
  const [isCustomEditing, setIsCustomEditing] = useState(false);

  function selectPreset(presetName: string) {
    setRoute(presetName);
    setIsCustomEditing(false);
    const coords = ROUTE_COORDS[presetName];
    if (coords) {
      setOrigin(coords.origin);
      setDestination(coords.destination);
    }
  }

  function selectCustom() {
    setRoute("Custom");
    setIsCustomEditing(true);
    setOrigin(null);
    setDestination(null);
  }

  function toggleDay(day: number) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!route) {
      setError("Select a route");
      return;
    }

    if (selectedDays.length === 0) {
      setError("Select at least one day");
      return;
    }

    if (route === "Custom" && (!origin || !destination)) {
      setError("Set both origin and destination for custom routes");
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const res = await fetch("/api/carpools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        route,
        daysOfWeek: selectedDays,
        time: formData.get("time"),
        totalSeats: Number(formData.get("totalSeats")),
        originLat: origin?.lat,
        originLng: origin?.lng,
        originName: origin?.name,
        destinationLat: destination?.lat,
        destinationLng: destination?.lng,
        destinationName: destination?.name,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to create carpool");
    } else {
      (e.target as HTMLFormElement).reset();
      setRoute("");
      setSelectedDays([]);
      setOrigin(null);
      setDestination(null);
      setIsCustomEditing(false);
      onCreated();
    }
  }

  const isPreset = PRESET_ROUTES.includes(route as typeof PRESET_ROUTES[number]);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      {/* Route preset chips */}
      <div>
        <label className="mb-2 block text-sm font-medium text-text-secondary">
          Route
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESET_ROUTES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => selectPreset(r)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                route === r
                  ? "bg-primary text-white shadow-sm"
                  : "border border-border text-text-secondary hover:bg-primary-50 hover:text-primary"
              }`}
            >
              {r}
            </button>
          ))}
          <button
            type="button"
            onClick={selectCustom}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              route === "Custom"
                ? "bg-primary text-white shadow-sm"
                : "border border-border text-text-secondary hover:bg-primary-50 hover:text-primary"
            }`}
          >
            Custom
          </button>
        </div>
      </div>

      {/* Location pickers */}
      {route && (
        <div className="space-y-4">
          {isPreset && !isCustomEditing && (
            <button
              type="button"
              onClick={() => {
                setRoute("Custom");
                setIsCustomEditing(true);
              }}
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Edit locations
            </button>
          )}
          <LocationPicker
            label="Origin"
            value={origin}
            onChange={setOrigin}
            placeholder="Search for pickup location..."
            readOnly={isPreset && !isCustomEditing}
          />
          <LocationPicker
            label="Destination"
            value={destination}
            onChange={setDestination}
            placeholder="Search for drop-off location..."
            readOnly={isPreset && !isCustomEditing}
          />
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium text-text-secondary">
          Days
        </label>
        <div className="flex gap-2">
          {DAY_LABELS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => toggleDay(i)}
              className={`h-10 w-10 rounded-full text-sm font-medium transition-colors ${
                selectedDays.includes(i)
                  ? "bg-primary text-white shadow-sm"
                  : "border border-border text-text-secondary hover:bg-primary-50 hover:text-primary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">
          Time
        </label>
        <Input name="time" type="time" required />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">
          Available Seats
        </label>
        <Input
          name="totalSeats"
          type="number"
          min={1}
          max={10}
          required
          defaultValue={3}
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full" size="lg">
        {loading ? "Creating..." : "Create Carpool"}
      </Button>
    </form>
  );
}

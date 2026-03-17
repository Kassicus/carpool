"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { DAY_LABELS } from "@/types";
import { fetchDirections } from "@/lib/mapbox";
import { formatDuration, formatDistance } from "@/lib/map-style";
import Button from "./ui/button";
import Input from "./ui/input";
import LocationPicker from "./location-picker";
import RouteMap from "./map/route-map";

interface LocationValue {
  lat: number;
  lng: number;
  name: string;
}

interface SavedRoute {
  id: string;
  name: string;
  originLat: number;
  originLng: number;
  originName: string;
  destinationLat: number;
  destinationLng: number;
  destinationName: string;
  routeGeometry: string | null;
  routeDistance: number | null;
  routeDuration: number | null;
}

export default function CreateCarpoolForm({
  onCreated,
}: {
  onCreated: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [routeName, setRouteName] = useState("");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [origin, setOrigin] = useState<LocationValue | null>(null);
  const [destination, setDestination] = useState<LocationValue | null>(null);
  const [routePreview, setRoutePreview] = useState<{
    geometry: string;
    distance: number;
    duration: number;
  } | null>(null);
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [selectedSavedRouteId, setSelectedSavedRouteId] = useState<string | null>(null);
  const [saveRoute, setSaveRoute] = useState(false);
  const debouncePreviewRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSavedRoutes = useCallback(async () => {
    try {
      const res = await fetch("/api/saved-routes");
      if (res.ok) {
        const data = await res.json();
        setSavedRoutes(data);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchSavedRoutes();
  }, [fetchSavedRoutes]);

  useEffect(() => {
    if (debouncePreviewRef.current) clearTimeout(debouncePreviewRef.current);
    if (!origin || !destination) {
      setRoutePreview(null);
      return;
    }
    debouncePreviewRef.current = setTimeout(async () => {
      const result = await fetchDirections(origin, destination);
      if (result) {
        setRoutePreview(result);
      }
    }, 500);
    return () => {
      if (debouncePreviewRef.current) clearTimeout(debouncePreviewRef.current);
    };
  }, [origin, destination]);

  function selectSavedRoute(sr: SavedRoute) {
    setSelectedSavedRouteId(sr.id);
    setRouteName(sr.name);
    setOrigin({ lat: sr.originLat, lng: sr.originLng, name: sr.originName });
    setDestination({ lat: sr.destinationLat, lng: sr.destinationLng, name: sr.destinationName });
    if (sr.routeGeometry && sr.routeDistance != null && sr.routeDuration != null) {
      setRoutePreview({ geometry: sr.routeGeometry, distance: sr.routeDistance, duration: sr.routeDuration });
    }
    setSaveRoute(false);
  }

  function selectNewRoute() {
    setSelectedSavedRouteId(null);
    setRouteName("");
    setOrigin(null);
    setDestination(null);
    setRoutePreview(null);
    setSaveRoute(false);
  }

  function toggleDay(day: number) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  }

  async function handleDeleteSavedRoute(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!confirm("Delete this saved route?")) return;
    const res = await fetch(`/api/saved-routes/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSavedRoutes((prev) => prev.filter((r) => r.id !== id));
      if (selectedSavedRouteId === id) {
        selectNewRoute();
      }
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!routeName.trim()) {
      setError("Enter a route name");
      return;
    }

    if (!origin || !destination) {
      setError("Set both origin and destination");
      return;
    }

    if (selectedDays.length === 0) {
      setError("Select at least one day");
      return;
    }

    // Read form data synchronously before any async work
    const formData = new FormData(e.currentTarget);
    const time = formData.get("time") as string;
    const totalSeats = Number(formData.get("totalSeats"));

    setLoading(true);

    // Save route if requested
    if (saveRoute && !selectedSavedRouteId) {
      try {
        await fetch("/api/saved-routes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: routeName.trim(),
            originLat: origin.lat,
            originLng: origin.lng,
            originName: origin.name,
            destinationLat: destination.lat,
            destinationLng: destination.lng,
            destinationName: destination.name,
            routeGeometry: routePreview?.geometry,
            routeDistance: routePreview?.distance,
            routeDuration: routePreview?.duration,
          }),
        });
        fetchSavedRoutes();
      } catch {
        // non-critical
      }
    }

    const res = await fetch("/api/carpools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        route: routeName.trim(),
        daysOfWeek: selectedDays,
        time,
        totalSeats,
        originLat: origin.lat,
        originLng: origin.lng,
        originName: origin.name,
        destinationLat: destination.lat,
        destinationLng: destination.lng,
        destinationName: destination.name,
        routeGeometry: routePreview?.geometry,
        routeDistance: routePreview?.distance,
        routeDuration: routePreview?.duration,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to create carpool");
    } else {
      (e.target as HTMLFormElement).reset();
      setRouteName("");
      setSelectedDays([]);
      setOrigin(null);
      setDestination(null);
      setRoutePreview(null);
      setSelectedSavedRouteId(null);
      setSaveRoute(false);
      onCreated();
    }
  }

  const isUsingSavedRoute = selectedSavedRouteId !== null;
  const showForm = isUsingSavedRoute || routeName !== "" || origin !== null;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      {/* Route selection */}
      <div>
        <label className="mb-2 block text-sm font-medium text-text-secondary">
          Route
        </label>
        <div className="flex flex-wrap gap-2">
          {savedRoutes.map((sr) => (
            <button
              key={sr.id}
              type="button"
              onClick={() => selectSavedRoute(sr)}
              className={`group relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                selectedSavedRouteId === sr.id
                  ? "bg-primary text-white shadow-sm"
                  : "border border-border text-text-secondary hover:bg-primary-50 hover:text-primary"
              }`}
            >
              {sr.name}
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => handleDeleteSavedRoute(e, sr.id)}
                onKeyDown={(e) => { if (e.key === "Enter") handleDeleteSavedRoute(e as unknown as React.MouseEvent, sr.id); }}
                className={`ml-1.5 inline-flex items-center opacity-0 group-hover:opacity-100 transition-opacity ${
                  selectedSavedRouteId === sr.id ? "text-white/70 hover:text-white" : "text-text-muted hover:text-red-500"
                }`}
              >
                &times;
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={selectNewRoute}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              !isUsingSavedRoute && showForm
                ? "bg-primary text-white shadow-sm"
                : "border border-border text-text-secondary hover:bg-primary-50 hover:text-primary"
            }`}
          >
            + New Route
          </button>
        </div>
      </div>

      {/* Route name + locations */}
      {(isUsingSavedRoute || !isUsingSavedRoute) && (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">
              Route Name
            </label>
            <Input
              type="text"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              placeholder="e.g. Morning Commute"
              readOnly={isUsingSavedRoute}
              className={isUsingSavedRoute ? "bg-gray-50" : ""}
            />
          </div>
          <LocationPicker
            label="Origin"
            value={origin}
            onChange={setOrigin}
            placeholder="Search for pickup location..."
            readOnly={isUsingSavedRoute}
          />
          <LocationPicker
            label="Destination"
            value={destination}
            onChange={setDestination}
            placeholder="Search for drop-off location..."
            readOnly={isUsingSavedRoute}
          />
          {origin && destination && (
            <div>
              <RouteMap
                origin={origin}
                destination={destination}
                routeGeometry={routePreview?.geometry}
                className="h-48"
              />
              {routePreview && (
                <p className="text-xs text-text-muted text-center mt-2">
                  {formatDistance(routePreview.distance)} &middot; {formatDuration(routePreview.duration)}
                </p>
              )}
            </div>
          )}
          {!isUsingSavedRoute && origin && destination && routeName.trim() && (
            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={saveRoute}
                onChange={(e) => setSaveRoute(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary"
              />
              Save this route for future use
            </label>
          )}
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

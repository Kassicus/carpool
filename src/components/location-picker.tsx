"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Input from "./ui/input";

interface LocationValue {
  lat: number;
  lng: number;
  name: string;
}

interface LocationPickerProps {
  label: string;
  value: LocationValue | null;
  onChange: (location: LocationValue | null) => void;
  placeholder?: string;
  readOnly?: boolean;
}

interface GeoResult {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
  text: string;
}

export default function LocationPicker({
  label,
  value,
  onChange,
  placeholder = "Search for a location...",
  readOnly = false,
}: LocationPickerProps) {
  const [query, setQuery] = useState(value?.name || "");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  // Sync query text when value changes externally
  useEffect(() => {
    setQuery(value?.name || "");
  }, [value?.name]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const searchLocations = useCallback(async (text: string) => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || text.length < 2) {
      setResults([]);
      return;
    }

    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(text)}.json?proximity=22.9584,40.5872&limit=5&access_token=${token}`
      );
      if (!res.ok) return;
      const data = await res.json();
      setResults(data.features || []);
      setShowDropdown(true);
    } catch {
      // ignore
    }
  }, []);

  function handleInputChange(text: string) {
    setQuery(text);
    if (readOnly) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchLocations(text), 300);
  }

  function selectResult(result: GeoResult) {
    const location: LocationValue = {
      lng: result.center[0],
      lat: result.center[1],
      name: result.place_name,
    };
    onChange(location);
    setQuery(result.place_name);
    setShowDropdown(false);

    // Update map marker if map is open
    if (mapRef.current && markerRef.current) {
      markerRef.current.setLngLat([location.lng, location.lat]);
      mapRef.current.flyTo({ center: [location.lng, location.lat], zoom: 15 });
    }
  }

  // Init map for "pick on map"
  useEffect(() => {
    if (!showMap || !mapContainerRef.current) return;
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;

    let map: mapboxgl.Map;

    async function initMap() {
      const mapboxgl = (await import("mapbox-gl")).default;
      mapboxgl.accessToken = token!;

      const center: [number, number] = value
        ? [value.lng, value.lat]
        : [22.9584, 40.5872];

      map = new mapboxgl.Map({
        container: mapContainerRef.current!,
        style: "mapbox://styles/mapbox/light-v11",
        center,
        zoom: value ? 15 : 13,
        attributionControl: false,
      });

      mapRef.current = map;

      const marker = new mapboxgl.Marker({ draggable: true })
        .setLngLat(center)
        .addTo(map);
      markerRef.current = marker;

      async function reverseGeocode(lng: number, lat: number) {
        try {
          const res = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}`
          );
          if (!res.ok) return;
          const data = await res.json();
          const name = data.features?.[0]?.place_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          onChange({ lat, lng, name });
          setQuery(name);
        } catch {
          onChange({ lat, lng, name: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
        }
      }

      marker.on("dragend", () => {
        const lngLat = marker.getLngLat();
        reverseGeocode(lngLat.lng, lngLat.lat);
      });

      map.on("click", (e) => {
        marker.setLngLat(e.lngLat);
        reverseGeocode(e.lngLat.lng, e.lngLat.lat);
      });
    }

    initMap();
    return () => {
      map?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMap]);

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1.5 block text-sm font-medium text-text-secondary">
        {label}
      </label>
      <div className="relative">
        <Input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => { if (results.length > 0 && !readOnly) setShowDropdown(true); }}
          placeholder={placeholder}
          readOnly={readOnly}
          className={readOnly ? "bg-gray-50" : ""}
        />
        {!readOnly && (
          <button
            type="button"
            onClick={() => setShowMap(!showMap)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-text-muted hover:text-primary hover:bg-primary-50 transition-colors"
            title={showMap ? "Hide map" : "Pick on map"}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </button>
        )}
      </div>

      {/* Autocomplete dropdown */}
      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-white shadow-lg overflow-hidden">
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => selectResult(r)}
              className="w-full px-4 py-3 text-left text-sm hover:bg-primary-50 transition-colors border-b border-border-light last:border-0"
            >
              <span className="font-medium text-text">{r.text}</span>
              <span className="block text-xs text-text-muted truncate">
                {r.place_name}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Inline map */}
      {showMap && !readOnly && (
        <div
          ref={mapContainerRef}
          className="mt-2 h-48 rounded-2xl overflow-hidden border border-border"
        />
      )}
    </div>
  );
}

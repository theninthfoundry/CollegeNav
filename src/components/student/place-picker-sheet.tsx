"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X, Search, Locate, MapPin, Bookmark, Clock, ArrowRight } from "lucide-react";

export interface SelectedPlace {
  type: "stop" | "point" | "campus";
  id?: string;
  name: string;
  lat: number;
  lng: number;
  code?: string;
  landmark?: string;
}

interface PlacePickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onSelect: (place: SelectedPlace) => void;
  initialQuery?: string;
}

interface StopItem {
  id: string;
  code: string;
  name: string;
  landmark?: string | null;
  lat: number;
  lng: number;
  step_free?: boolean;
  distance_m?: number;
  routes?: Array<{ code: string; color_index: number }>;
}

export function PlacePickerSheet({
  isOpen,
  onClose,
  title,
  onSelect,
  initialQuery = "",
}: PlacePickerSheetProps) {
  const [query, setQuery] = useState(initialQuery);
  const [stops, setStops] = useState<StopItem[]>([]);
  const [recentSearches, setRecentSearches] = useState<SelectedPlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  // Load stops from API
  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    fetch("/api/v1/stops")
      .then((res) => res.json())
      .then((data) => {
        if (data.items) setStops(data.items);
      })
      .catch((err) => console.error("Failed to load stops:", err))
      .finally(() => setIsLoading(false));

    // Load recent searches from localStorage
    try {
      const stored = localStorage.getItem("collegenav_recent_searches");
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, [isOpen]);

  // Trigram & alias filter
  const filteredStops = useMemo(() => {
    if (!query.trim()) return stops;
    const q = query.toLowerCase().trim();
    return stops.filter((s) => {
      const nameMatch = s.name.toLowerCase().includes(q);
      const codeMatch = s.code.toLowerCase().includes(q);
      const landmarkMatch = s.landmark ? s.landmark.toLowerCase().includes(q) : false;
      return nameMatch || codeMatch || landmarkMatch;
    });
  }, [stops, query]);

  if (!isOpen) return null;

  const handlePickPlace = (place: SelectedPlace) => {
    // Save to recents
    try {
      const updated = [
        place,
        ...recentSearches.filter((r) => r.id !== place.id || r.name !== place.name),
      ].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem("collegenav_recent_searches", JSON.stringify(updated));
    } catch {
      // ignore
    }
    onSelect(place);
    onClose();
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        handlePickPlace({
          type: "point",
          name: "Current location",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        setLocating(false);
        console.warn("Location error:", err.message);
        // Fallback to campus/default stop
        handlePickPlace({
          type: "point",
          name: "Current location (Hyderabad)",
          lat: 17.4948,
          lng: 78.3996,
        });
      },
      { timeout: 8000 }
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex flex-col bg-paper animate-in fade-in duration-200"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-line bg-paper">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center text-ink hover:bg-neutral-100 transition-colors focus-visible:outline-accent"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Search Input Box */}
      <div className="p-4 border-b border-line bg-neutral-50/50">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-ink-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stop, code (e.g. KPHB) or landmark"
            autoFocus
            className="w-full h-11 pl-10 pr-10 text-sm bg-paper border border-line rounded-lg text-ink placeholder:text-ink-3 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 text-ink-3 hover:text-ink text-xs font-semibold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Quick category filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2.5 text-xs">
          <button
            type="button"
            onClick={() => setQuery("")}
            className={`px-2.5 py-1 rounded-full shrink-0 font-medium transition-colors ${
              !query ? "bg-ink text-paper" : "bg-paper border border-line text-ink-2 hover:bg-neutral-100"
            }`}
          >
            All Stops
          </button>
          <button
            type="button"
            onClick={() => setQuery("Metro")}
            className={`px-2.5 py-1 rounded-full shrink-0 font-medium transition-colors ${
              query === "Metro" ? "bg-ink text-paper" : "bg-paper border border-line text-ink-2 hover:bg-neutral-100"
            }`}
          >
            Metro Stations
          </button>
          <button
            type="button"
            onClick={() => setQuery("Colony")}
            className={`px-2.5 py-1 rounded-full shrink-0 font-medium transition-colors ${
              query === "Colony" ? "bg-ink text-paper" : "bg-paper border border-line text-ink-2 hover:bg-neutral-100"
            }`}
          >
            Colonies
          </button>
          <button
            type="button"
            onClick={() => setQuery("Campus")}
            className={`px-2.5 py-1 rounded-full shrink-0 font-medium transition-colors ${
              query === "Campus" ? "bg-accent text-white" : "bg-accent/10 text-accent border border-accent/20"
            }`}
          >
            Campus Hub
          </button>
        </div>
      </div>

      {/* Body List */}
      <div className="flex-1 overflow-y-auto divide-y divide-line">
        {/* Quick actions */}
        {!query && (
          <div className="p-2 space-y-1">
            <button
              type="button"
              onClick={handleUseLocation}
              disabled={locating}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-medium text-accent hover:bg-accent/5 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                <Locate className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-ink font-medium">Use my location</div>
                <div className="text-xs text-ink-3 font-normal">
                  {locating ? "Determining position..." : "Find stops within walking distance"}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                handlePickPlace({
                  type: "campus",
                  id: "10000000-0000-0000-0000-000000000010",
                  name: "Main campus",
                  lat: 17.5449,
                  lng: 78.5718,
                  code: "CAMPUS",
                });
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-medium hover:bg-neutral-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-ink-2">
                <MapPin className="w-4 h-4 text-accent" />
              </div>
              <div className="flex-1">
                <div className="text-ink font-medium">Main campus</div>
                <div className="text-xs text-ink-3 font-normal">Central Bus Terminus, Gate 1</div>
              </div>
            </button>
          </div>
        )}

        {/* Recent Searches */}
        {!query && recentSearches.length > 0 && (
          <div className="py-2">
            <div className="px-4 py-1 text-xs font-semibold text-ink-3 tracking-wide uppercase">
              Recent searches
            </div>
            {recentSearches.map((place, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePickPlace(place)}
                className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-neutral-50 transition-colors"
              >
                <Clock className="w-4 h-4 text-ink-3 shrink-0" />
                <span className="text-sm text-ink truncate flex-1">{place.name}</span>
                <ArrowRight className="w-3.5 h-3.5 text-ink-3" />
              </button>
            ))}
          </div>
        )}

        {/* Stops List */}
        <div className="py-2">
          <div className="px-4 py-1.5 text-xs font-semibold text-ink-3 tracking-wide uppercase flex items-center justify-between">
            <span>{query ? `Matching Stops (${filteredStops.length})` : "All College Stops"}</span>
          </div>

          {filteredStops.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-ink-3">
              No stops found matching &ldquo;{query}&rdquo;.
            </div>
          ) : (
            filteredStops.map((stop) => (
              <button
                key={stop.id}
                type="button"
                onClick={() =>
                  handlePickPlace({
                    type: "stop",
                    id: stop.id,
                    name: stop.name,
                    lat: stop.lat,
                    lng: stop.lng,
                    code: stop.code,
                    landmark: stop.landmark || undefined,
                  })
                }
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-neutral-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-ink-2 shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-ink truncate">{stop.name}</span>
                    {stop.code && (
                      <span className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-neutral-100 text-ink-2">
                        {stop.code}
                      </span>
                    )}
                  </div>
                  {stop.landmark && (
                    <div className="text-xs text-ink-3 truncate mt-0.5">{stop.landmark}</div>
                  )}
                  {stop.routes && stop.routes.length > 0 && (
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      {stop.routes.map((r) => (
                        <span
                          key={r.code}
                          className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-accent/10 text-accent font-mono"
                        >
                          {r.code}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

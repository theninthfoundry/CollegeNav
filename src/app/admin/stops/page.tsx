"use client";

import React, { useState, useEffect } from "react";
import { Plus, MapPin, Check, ShieldCheck, X, Search } from "lucide-react";
import { MapView } from "@/components/map/map-view";

interface Stop {
  id: string;
  code: string;
  name: string;
  landmark?: string | null;
  lat: number;
  lng: number;
  step_free?: boolean;
  is_campus?: boolean;
}

export default function AdminStopsPage() {
  const [stops, setStops] = useState<Stop[]>([]);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Form modal
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newLandmark, setNewLandmark] = useState("");
  const [newLat, setNewLat] = useState("17.4948");
  const [newLng, setNewLng] = useState("78.3996");
  const [newStepFree, setNewStepFree] = useState(true);

  const loadStops = () => {
    setLoading(true);
    fetch("/api/v1/stops")
      .then((res) => res.json())
      .then((data) => {
        setStops(data.items || []);
        if (data.items?.length > 0) {
          setSelectedStopId(data.items[0].id);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadStops();
  }, []);

  const filteredStops = stops.filter((s) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
  });

  const selectedStop = stops.find((s) => s.id === selectedStopId) || stops[0];

  const handleAddStopSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newStop: Stop = {
      id: `stop-${Date.now()}`,
      code: newCode.toUpperCase(),
      name: newName,
      landmark: newLandmark,
      lat: parseFloat(newLat),
      lng: parseFloat(newLng),
      step_free: newStepFree,
    };
    setStops([newStop, ...stops]);
    setSelectedStopId(newStop.id);
    setIsAdding(false);
    setNewName("");
    setNewCode("");
    setNewLandmark("");
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-normal tracking-tight text-ink">
            Campus Stops & Landmarks
          </h1>
          <p className="text-sm text-ink-3">
            Manage physical stop coordinates, landmark aliases, and accessibility tags.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-accent text-white text-xs font-semibold shadow-xs hover:bg-accent/90"
        >
          <Plus className="w-4 h-4" />
          <span>Add Stop</span>
        </button>
      </div>

      {/* Split View: Table on Left, Interactive Map on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Table List */}
        <div className="bg-paper border border-line rounded-xl overflow-hidden space-y-3 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-ink-3" />
            <input
              type="text"
              placeholder="Search stop name or code..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs bg-neutral-50 border border-line rounded-lg text-ink focus:outline-accent"
            />
          </div>

          <div className="max-h-[500px] overflow-y-auto divide-y divide-line">
            {filteredStops.map((stop) => {
              const isSelected = stop.id === selectedStopId;
              return (
                <div
                  key={stop.id}
                  onClick={() => setSelectedStopId(stop.id)}
                  className={`p-3.5 flex items-start justify-between cursor-pointer transition-colors ${
                    isSelected ? "bg-accent/5 border-l-4 border-l-accent" : "hover:bg-neutral-50"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-ink">{stop.name}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-neutral-100 text-ink-2 font-bold">
                        {stop.code}
                      </span>
                    </div>
                    {stop.landmark && (
                      <div className="text-xs text-ink-3 mt-0.5">{stop.landmark}</div>
                    )}
                    <div className="text-[11px] text-ink-4 font-mono mt-1">
                      {stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        stop.step_free
                          ? "bg-emerald-50 text-emerald-800"
                          : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {stop.step_free ? "Step-Free" : "Standard"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Map View */}
        <div className="h-[560px] rounded-xl border border-line overflow-hidden sticky top-20 shadow-xs">
          <MapView
            stops={stops.map((s) => ({
              id: s.id,
              name: s.name,
              code: s.code,
              lat: s.lat,
              lng: s.lng,
            }))}
            selectedStopId={selectedStopId}
            onStopSelect={(id) => setSelectedStopId(id)}
            center={
              selectedStop
                ? [selectedStop.lng, selectedStop.lat]
                : [78.4867, 17.44]
            }
            zoom={13}
            className="w-full h-full"
          />
        </div>
      </div>

      {/* Add Stop Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-neutral-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-line">
              <h3 className="font-serif text-2xl font-normal text-ink">Add Campus Stop</h3>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-ink-3 hover:text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStopSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">
                  Stop Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hitec City Metro"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full h-10 px-3 border border-line rounded-lg text-sm text-ink"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">
                    Stop Code (3-5 letters)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HITEC"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full h-10 px-3 border border-line rounded-lg text-sm text-ink font-mono font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">
                    Landmark / Colony
                  </label>
                  <input
                    type="text"
                    placeholder="Near Pillar 124"
                    value={newLandmark}
                    onChange={(e) => setNewLandmark(e.target.value)}
                    className="w-full h-10 px-3 border border-line rounded-lg text-sm text-ink"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">
                    Latitude
                  </label>
                  <input
                    type="text"
                    value={newLat}
                    onChange={(e) => setNewLat(e.target.value)}
                    className="w-full h-10 px-3 border border-line rounded-lg text-sm text-ink font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">
                    Longitude
                  </label>
                  <input
                    type="text"
                    value={newLng}
                    onChange={(e) => setNewLng(e.target.value)}
                    className="w-full h-10 px-3 border border-line rounded-lg text-sm text-ink font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="stepFreeCheck"
                  checked={newStepFree}
                  onChange={(e) => setNewStepFree(e.target.checked)}
                  className="w-4 h-4 rounded text-accent"
                />
                <label htmlFor="stepFreeCheck" className="text-xs font-medium text-ink cursor-pointer">
                  Step-free wheelchair accessibility verified
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 rounded-lg border border-line text-xs font-semibold text-ink-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent/90"
                >
                  Save Stop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

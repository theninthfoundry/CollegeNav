"use client";
/* eslint-disable react-hooks/exhaustive-deps */

import React, { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import { Locate, Plus, Minus, Layers } from "lucide-react";

export interface MapStop {
  id: string;
  name: string;
  code?: string;
  lat: number;
  lng: number;
  active?: boolean;
}

export interface MapRoute {
  id: string;
  code: string;
  name: string;
  color?: string;
  lineGeoJson: any;
}

export interface MapBus {
  trip_instance_id: string;
  route_code: string;
  lat: number;
  lng: number;
  heading?: number;
  speed_kmh?: number;
  tracking: "live" | "stale" | "lost" | "not_tracked";
}

export interface MapViewProps {
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  stops?: MapStop[];
  selectedStopId?: string | null;
  onStopSelect?: (stopId: string) => void;
  routes?: MapRoute[];
  selectedRouteCode?: string | null;
  onRouteSelect?: (code: string) => void;
  journeyGeometry?: {
    walk_in?: any;
    ride?: any;
    walk_out?: any;
  } | null;
  liveBuses?: MapBus[];
  onBusSelect?: (bus: MapBus) => void;
  interactive?: boolean;
  className?: string;
  signatureAnimation?: boolean;
}

const DEFAULT_CENTER: [number, number] = [78.4867, 17.44]; // Hyderabad center lng, lat
const DEFAULT_ZOOM = 11.5;

// Offline-safe style fallback
const POSITRON_STYLE = "https://tiles.openfreemap.org/styles/positron";
const FALLBACK_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "osm-tiles",
      type: "raster",
      source: "osm",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

export function MapView({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  stops = [],
  selectedStopId = null,
  onStopSelect,
  routes = [],
  selectedRouteCode = null,
  onRouteSelect,
  journeyGeometry = null,
  liveBuses = [],
  onBusSelect,
  interactive = true,
  className = "w-full h-full min-h-[220px]",
  signatureAnimation = true,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainerRef.current) return;

    let styleToLoad: string | maplibregl.StyleSpecification = POSITRON_STYLE;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: styleToLoad,
      center: center,
      zoom: zoom,
      interactive: interactive,
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right"
    );

    map.on("load", () => {
      setMapLoaded(true);
    });

    map.on("error", (e) => {
      // If positron fails due to offline or CSP, fallback gracefully to raster OSM
      if (!map.getSource("osm") && map.getStyle()?.name !== "fallback") {
        try {
          map.setStyle(FALLBACK_STYLE);
        } catch {
          // ignore fallback error
        }
      }
    });

    mapRef.current = map;

    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => {
      const frame = animFrameRef.current;
      if (frame) cancelAnimationFrame(frame);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync center and zoom
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    mapRef.current.easeTo({
      center,
      zoom,
      duration: 500,
    });
  }, [center, zoom, mapLoaded]);

  // Update Route Layers and Animations
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Remove prior route source & layers
    if (map.getLayer("journey-ride-line")) map.removeLayer("journey-ride-line");
    if (map.getLayer("journey-walk-in")) map.removeLayer("journey-walk-in");
    if (map.getLayer("journey-walk-out")) map.removeLayer("journey-walk-out");
    if (map.getSource("journey-ride")) map.removeSource("journey-ride");
    if (map.getSource("journey-walk")) map.removeSource("journey-walk");

    routes.forEach((route) => {
      const lineLayerId = `route-line-${route.id}`;
      const lineCasingId = `route-casing-${route.id}`;
      const sourceId = `route-source-${route.id}`;
      if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
      if (map.getLayer(lineCasingId)) map.removeLayer(lineCasingId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    });

    // 1. Render routes
    routes.forEach((route) => {
      const sourceId = `route-source-${route.id}`;
      const lineCasingId = `route-casing-${route.id}`;
      const lineLayerId = `route-line-${route.id}`;

      let geoJsonData = route.lineGeoJson;
      if (geoJsonData?.type === "LineString") {
        geoJsonData = {
          type: "Feature",
          properties: {},
          geometry: geoJsonData,
        };
      }

      if (!geoJsonData) return;

      const isSelected = selectedRouteCode === route.code;
      const color = route.color || (isSelected ? "#0F2F6B" : "#5B6471");

      map.addSource(sourceId, {
        type: "geojson",
        data: geoJsonData,
      });

      // Hairline casing
      map.addLayer({
        id: lineCasingId,
        type: "line",
        source: sourceId,
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": "#FFFFFF",
          "line-width": isSelected ? 6 : 4,
          "line-opacity": 0.8,
        },
      });

      // Colored route line
      map.addLayer({
        id: lineLayerId,
        type: "line",
        source: sourceId,
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": color,
          "line-width": isSelected ? 4 : 2.5,
          "line-opacity": isSelected || !selectedRouteCode ? 1 : 0.35,
        },
      });

      map.on("click", lineLayerId, () => {
        if (onRouteSelect) onRouteSelect(route.code);
      });
    });

    // 2. Render Journey Option if present
    if (journeyGeometry?.ride) {
      map.addSource("journey-ride", {
        type: "geojson",
        data: journeyGeometry.ride,
      });

      map.addLayer({
        id: "journey-ride-line",
        type: "line",
        source: "journey-ride",
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": "#0F2F6B", // Sapphire
          "line-width": 5,
        },
      });

      // Fit bounds to journey
      try {
        const coords = journeyGeometry.ride.coordinates || journeyGeometry.ride.geometry?.coordinates;
        if (coords && coords.length > 0) {
          const bounds = new maplibregl.LngLatBounds(coords[0], coords[0]);
          for (const coord of coords) {
            bounds.extend(coord);
          }
          map.fitBounds(bounds, { padding: 48, maxZoom: 15 });
        }
      } catch {
        // Bounds calc fallback
      }
    }
  }, [routes, selectedRouteCode, journeyGeometry, mapLoaded, onRouteSelect]);

  // Update Stop and Bus HTML Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Clear existing HTML markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add Stop markers
    stops.forEach((stop) => {
      const isSelected = selectedStopId === stop.id;
      const el = document.createElement("button");
      el.type = "button";
      el.className = "group relative flex items-center justify-center focus:outline-none";
      el.setAttribute("aria-label", `Stop: ${stop.name}`);

      if (isSelected) {
        el.innerHTML = `
          <div class="relative flex items-center justify-center">
            <span class="absolute w-8 h-8 rounded-full bg-accent/20 animate-ping"></span>
            <div class="relative w-5 h-5 rounded-full bg-accent border-2 border-white shadow-sm flex items-center justify-center">
              <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
            </div>
          </div>
          <div class="absolute -top-7 whitespace-nowrap px-2 py-0.5 rounded bg-ink text-paper text-xs font-medium shadow pointer-events-none">
            ${stop.name}
          </div>
        `;
      } else {
        el.innerHTML = `
          <div class="w-3.5 h-3.5 rounded-full bg-paper border-2 border-accent hover:border-ink transition-colors flex items-center justify-center shadow-xs">
            <div class="w-1 h-1 rounded-full bg-accent"></div>
          </div>
        `;
      }

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        if (onStopSelect) onStopSelect(stop.id);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([stop.lng, stop.lat])
        .addTo(map);

      markersRef.current.push(marker);
    });

    // Add Live Bus markers
    liveBuses.forEach((bus) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "relative flex items-center justify-center group focus:outline-none";
      el.setAttribute("aria-label", `Bus ${bus.route_code}: ${bus.tracking}`);

      const isLive = bus.tracking === "live";
      const isStale = bus.tracking === "stale";
      const colorBg = isLive ? "bg-accent" : isStale ? "bg-amber-600" : "bg-neutral-500";

      el.innerHTML = `
        <div class="relative flex items-center justify-center">
          ${isLive ? '<span class="absolute -inset-1.5 rounded-sm bg-accent/30 animate-pulse"></span>' : ""}
          <div class="relative w-7 h-7 rounded-sm ${colorBg} text-white flex items-center justify-center font-bold text-[10px] tracking-tight border border-white shadow-md">
            ${bus.route_code}
          </div>
        </div>
        <div class="absolute -bottom-5 whitespace-nowrap px-1.5 py-0.2 bg-paper/90 backdrop-blur-xs border border-line rounded text-[9px] font-mono text-ink shadow-xs">
          ${isLive ? "Live" : isStale ? "Stale" : "Lost"}
        </div>
      `;

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        if (onBusSelect) onBusSelect(bus);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([bus.lng, bus.lat])
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [stops, selectedStopId, liveBuses, mapLoaded, onStopSelect, onBusSelect]);

  // Geolocation Handler
  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation || !mapRef.current) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { longitude, latitude } = pos.coords;
        mapRef.current?.flyTo({
          center: [longitude, latitude],
          zoom: 14,
          duration: 1200,
        });
      },
      (err) => {
        console.warn("Location error:", err.message);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }, []);

  return (
    <div className={`relative overflow-hidden bg-neutral-100 ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Map Controls */}
      {interactive && (
        <div className="absolute right-3 top-3 z-10 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={handleLocateMe}
            className="w-9 h-9 rounded-md bg-paper border border-line shadow-xs flex items-center justify-center text-ink hover:bg-neutral-50 active:bg-neutral-100 transition-colors focus-visible:outline-accent"
            title="Locate me"
            aria-label="Locate me"
          >
            <Locate className="w-4 h-4 text-accent" />
          </button>
          <div className="flex flex-col rounded-md bg-paper border border-line shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={() => mapRef.current?.zoomIn()}
              className="w-9 h-9 flex items-center justify-center text-ink hover:bg-neutral-50 border-b border-line transition-colors"
              title="Zoom in"
              aria-label="Zoom in"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => mapRef.current?.zoomOut()}
              className="w-9 h-9 flex items-center justify-center text-ink hover:bg-neutral-50 transition-colors"
              title="Zoom out"
              aria-label="Zoom out"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

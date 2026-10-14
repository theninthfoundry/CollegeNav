"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Bus, MapPin, AlertCircle, Play, Check, ShieldAlert, Clock, Power } from "lucide-react";

interface DriverSession {
  token: string;
  driver: { id: string; name: string; phone: string };
  bus: { id: string; reg_no: string; name: string; default_route_code: string };
}

interface DriverTrip {
  instance_id: string;
  trip_id: string;
  route_code: string;
  route_name: string;
  direction: "to_campus" | "from_campus";
  scheduled_depart: string;
  scheduled_arrive: string;
  status: "scheduled" | "running" | "completed";
  first_stop: string;
  last_stop: string;
}

export default function DriverModePage() {
  const [session, setSession] = useState<DriverSession | null>(null);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [trips, setTrips] = useState<DriverTrip[]>([]);
  const [activeTrip, setActiveTrip] = useState<DriverTrip | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [simulatedDriving, setSimulatedDriving] = useState(false);

  // Press-and-hold state for End Trip button (1000ms)
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const holdStartRef = useRef<number>(0);

  // Wake lock
  const wakeLockRef = useRef<any>(null);

  // Check existing session
  useEffect(() => {
    try {
      const stored = localStorage.getItem("collegenav_driver_session");
      if (stored) {
        const parsed = JSON.parse(stored);
        setSession(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  // Request Wake Lock when driving
  useEffect(() => {
    if (activeTrip && "wakeLock" in navigator) {
      (navigator as any).wakeLock
        .request("screen")
        .then((lock: any) => {
          wakeLockRef.current = lock;
        })
        .catch(() => {});
    }
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [activeTrip]);

  // Load trips when session is active
  useEffect(() => {
    if (!session) return;
    fetch("/api/v1/driver/today")
      .then((res) => res.json())
      .then((data) => {
        if (data.trips) {
          setTrips(data.trips);
          const running = data.trips.find((t: DriverTrip) => t.status === "running");
          if (running) {
            setActiveTrip(running);
            setIsBroadcasting(true);
          }
        }
      })
      .catch((err) => console.error(err));
  }, [session]);

  // Handle PIN Login
  const handlePinSubmit = async (enteredPin: string) => {
    setPinError("");
    try {
      const res = await fetch("/api/v1/driver/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: enteredPin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPinError(data.error?.message || "Invalid driver code");
        setPin("");
        return;
      }
      setSession(data);
      localStorage.setItem("collegenav_driver_session", JSON.stringify(data));
    } catch {
      setPinError("Connection error. Try 246810");
    }
  };

  const handleKeypadPress = (val: string) => {
    if (pin.length < 6) {
      const newPin = pin + val;
      setPin(newPin);
      if (newPin.length === 6) {
        handlePinSubmit(newPin);
      }
    }
  };

  // Start Trip
  const handleStartTrip = async (trip: DriverTrip) => {
    try {
      await fetch(`/api/v1/driver/trips/${trip.instance_id}/start`, { method: "POST" });
      setActiveTrip({ ...trip, status: "running" });
      setIsBroadcasting(true);
    } catch (e) {
      console.error(e);
    }
  };

  // Broadcast Position Loop (every 5 seconds)
  useEffect(() => {
    if (!activeTrip || !isBroadcasting) return;

    let step = 0;
    // Simulated coordinate path for R1
    const r1Points = [
      { lat: 17.4948, lng: 78.3996, heading: 80 },
      { lat: 17.498, lng: 78.405, heading: 78 },
      { lat: 17.505, lng: 78.412, heading: 70 },
      { lat: 17.518, lng: 78.435, heading: 65 },
      { lat: 17.535, lng: 78.48, heading: 82 },
      { lat: 17.5449, lng: 78.5718, heading: 90 },
    ];

    const sendPosition = (lat: number, lng: number, heading = 80, speed = 8.5) => {
      fetch(`/api/v1/driver/trips/${activeTrip.instance_id}/positions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          points: [
            {
              lat,
              lng,
              heading,
              speed,
              accuracy: 10,
              ts: new Date().toISOString(),
            },
          ],
        }),
      }).catch(() => {});
    };

    const interval = setInterval(() => {
      if (simulatedDriving) {
        const pt = r1Points[step % r1Points.length];
        step++;
        sendPosition(pt.lat, pt.lng, pt.heading, 9.0);
      } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLocationError(false);
            sendPosition(
              pos.coords.latitude,
              pos.coords.longitude,
              pos.coords.heading || 80,
              pos.coords.speed || 8
            );
          },
          () => {
            setLocationError(true);
            // Auto fallback to simulation if geolocation denied
            const pt = r1Points[step % r1Points.length];
            step++;
            sendPosition(pt.lat, pt.lng, pt.heading, 8.5);
          },
          { enableHighAccuracy: true, timeout: 4000 }
        );
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [activeTrip, isBroadcasting, simulatedDriving]);

  // Report Late or Breakdown
  const handleReportEvent = async (type: "late" | "breakdown") => {
    if (!activeTrip) return;
    try {
      await fetch(`/api/v1/driver/trips/${activeTrip.instance_id}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          delay_min: type === "late" ? 10 : undefined,
          note: type === "late" ? "10 min traffic delay reported" : "Bus breakdown reported",
        }),
      });
      alert(type === "late" ? "Reported 10 min delay to transport office" : "Breakdown alerted to office");
    } catch (e) {
      console.error(e);
    }
  };

  // Press-and-Hold for End Trip
  const startHold = () => {
    holdStartRef.current = Date.now();
    holdTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - holdStartRef.current;
      const progress = Math.min(100, Math.round((elapsed / 1000) * 100));
      setHoldProgress(progress);
      if (progress >= 100) {
        clearInterval(holdTimerRef.current!);
        completeEndTrip();
      }
    }, 20);
  };

  const cancelHold = () => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setHoldProgress(0);
  };

  const completeEndTrip = async () => {
    if (!activeTrip) return;
    try {
      await fetch(`/api/v1/driver/trips/${activeTrip.instance_id}/end`, { method: "POST" });
      setActiveTrip(null);
      setIsBroadcasting(false);
      setHoldProgress(0);
      // Reload trips
      const res = await fetch("/api/v1/driver/today");
      const data = await res.json();
      if (data.trips) setTrips(data.trips);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("collegenav_driver_session");
    setSession(null);
    setActiveTrip(null);
    setIsBroadcasting(false);
  };

  // Render: Driver PIN Entry Screen
  if (!session) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-between p-6 max-w-md mx-auto select-none">
        <div className="text-center pt-8 space-y-2">
          <div className="w-14 h-14 rounded-xl bg-accent text-white flex items-center justify-center mx-auto shadow-md">
            <Bus className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight font-serif">CollegeNav Driver</h1>
          <p className="text-sm text-neutral-400">Enter your 6-digit assigned PIN</p>
          <p className="text-xs text-neutral-500 font-mono">Demo PIN: 246810</p>
        </div>

        {/* PIN Display Dots */}
        <div className="flex gap-3 my-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                pin.length > i ? "bg-white border-white scale-110" : "border-neutral-600"
              }`}
            />
          ))}
        </div>

        {pinError && (
          <div className="text-red-400 text-sm font-semibold mb-2">{pinError}</div>
        )}

        {/* Numeric Keypad: 64px targets per spec */}
        <div className="w-full grid grid-cols-3 gap-3 pb-8">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handleKeypadPress(String(n))}
              className="h-16 rounded-xl bg-neutral-900 border border-neutral-800 text-2xl font-bold active:bg-neutral-800 text-white flex items-center justify-center transition-colors"
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPin("")}
            className="h-16 rounded-xl bg-neutral-900/50 text-sm font-semibold active:bg-neutral-800 text-neutral-400 flex items-center justify-center"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleKeypadPress("0")}
            className="h-16 rounded-xl bg-neutral-900 border border-neutral-800 text-2xl font-bold active:bg-neutral-800 text-white flex items-center justify-center"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => setPin((p) => p.slice(0, -1))}
            className="h-16 rounded-xl bg-neutral-900/50 text-sm font-semibold active:bg-neutral-800 text-neutral-400 flex items-center justify-center"
          >
            ⌫
          </button>
        </div>
      </div>
    );
  }

  // Render: Active Trip View (Driver Cockpit)
  if (activeTrip) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col justify-between p-5 max-w-md mx-auto select-none">
        {/* Top Status Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div>
              <div className="text-xl font-bold font-serif">
                {activeTrip.route_code} {activeTrip.direction === "to_campus" ? "To campus" : "From campus"}
              </div>
              <div className="text-xs text-neutral-400 font-mono">{session.bus.reg_no}</div>
            </div>

            {/* Broadcasting Live Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/20 border border-accent/40 text-accent text-xs font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
              <span>Broadcasting</span>
            </div>
          </div>

          {/* Location error banner */}
          {locationError && (
            <div className="p-3 bg-red-950/80 border border-red-700 rounded-xl flex items-center gap-2.5 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>Location off. Turn on GPS to keep students updated.</span>
            </div>
          )}

          {/* Simulation Toggle */}
          <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-xl border border-neutral-800">
            <span className="text-xs text-neutral-300">Simulate bus driving</span>
            <button
              type="button"
              onClick={() => setSimulatedDriving(!simulatedDriving)}
              className={`px-3 py-1 rounded-md text-xs font-semibold ${
                simulatedDriving ? "bg-accent text-white" : "bg-neutral-800 text-neutral-400"
              }`}
            >
              {simulatedDriving ? "ON" : "OFF"}
            </button>
          </div>
        </div>

        {/* Current & Next Stop Hero */}
        <div className="my-auto space-y-4 py-6">
          <div className="p-4 bg-neutral-900/90 rounded-2xl border border-neutral-800">
            <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">
              Now Boarding
            </div>
            <div className="text-2xl font-bold text-white">{activeTrip.first_stop}</div>
          </div>

          <div className="p-4 bg-accent/15 rounded-2xl border border-accent/30">
            <div className="text-xs font-bold text-accent uppercase tracking-wider mb-1">
              Next Stop
            </div>
            <div className="text-2xl font-bold text-white">Kukatpally HB</div>
            <div className="text-xs text-neutral-400 mt-1">in about 6 min</div>
          </div>
        </div>

        {/* Action Buttons (64px high per spec) */}
        <div className="space-y-3 pb-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleReportEvent("late")}
              className="h-16 rounded-xl bg-neutral-900 border border-neutral-800 font-semibold text-amber-400 active:bg-neutral-800 flex items-center justify-center gap-2"
            >
              <Clock className="w-5 h-5" />
              <span>Running late</span>
            </button>

            <button
              type="button"
              onClick={() => handleReportEvent("breakdown")}
              className="h-16 rounded-xl bg-neutral-900 border border-neutral-800 font-semibold text-red-400 active:bg-neutral-800 flex items-center justify-center gap-2"
            >
              <ShieldAlert className="w-5 h-5" />
              <span>Breakdown</span>
            </button>
          </div>

          {/* Press and Hold End Trip Button */}
          <div className="relative overflow-hidden rounded-xl border border-red-800">
            <button
              type="button"
              onMouseDown={startHold}
              onMouseUp={cancelHold}
              onTouchStart={startHold}
              onTouchEnd={cancelHold}
              onMouseLeave={cancelHold}
              className="w-full h-16 bg-red-950/60 text-red-100 font-bold text-base flex items-center justify-center gap-2 relative z-10 select-none"
            >
              <Power className="w-5 h-5 text-red-400" />
              <span>{holdProgress > 0 ? `Hold to End (${holdProgress}%)` : "Press & Hold to End Trip"}</span>
            </button>
            <div
              style={{ width: `${holdProgress}%` }}
              className="absolute top-0 bottom-0 left-0 bg-red-600 transition-all duration-75 ease-linear pointer-events-none"
            />
          </div>
        </div>
      </div>
    );
  }

  // Render: Driver Dashboard (Assigned Trips)
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col justify-between p-5 max-w-md mx-auto select-none">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div>
            <h1 className="text-xl font-bold font-serif">CollegeNav Driver</h1>
            <p className="text-xs text-neutral-400">Driver: {session.driver.name}</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-xs text-neutral-500 hover:text-white px-2 py-1 rounded"
          >
            Sign out
          </button>
        </div>

        {/* Bus Info Card */}
        <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800 flex items-center gap-3">
          <Bus className="w-8 h-8 text-accent" />
          <div>
            <div className="font-bold text-base">{session.bus.reg_no}</div>
            <div className="text-xs text-neutral-400">{session.bus.name}</div>
          </div>
        </div>

        {/* Today's Trips */}
        <div className="space-y-3 pt-2">
          <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Today&apos;s Assigned Trips
          </h2>

          <div className="space-y-3">
            {trips.map((trip) => (
              <div
                key={trip.instance_id}
                className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-base font-bold text-white">
                      {trip.scheduled_depart} — {trip.route_code}
                    </div>
                    <div className="text-xs text-neutral-400">
                      {trip.first_stop} to {trip.last_stop}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-neutral-800 text-neutral-300">
                    {trip.direction === "to_campus" ? "To campus" : "From campus"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleStartTrip(trip)}
                  className="w-full h-14 rounded-xl bg-accent hover:bg-accent/90 text-white font-bold text-base flex items-center justify-center gap-2 shadow-md transition-colors"
                >
                  <Play className="w-5 h-5 fill-white" />
                  <span>Start Trip</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

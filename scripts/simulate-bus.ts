/**
 * CollegeNav Bus Simulator
 * Usage: tsx scripts/simulate-bus.ts --route R1 --speed 8
 */

interface Point {
  lat: number;
  lng: number;
  name: string;
}

// R1 Waypoints from Miyapur to Campus Terminus
const R1_WAYPOINTS: Point[] = [
  { lat: 17.4948, lng: 78.3996, name: "Miyapur Cross Roads" },
  { lat: 17.4955, lng: 78.402, name: "Kukatpally Housing Board" },
  { lat: 17.501, lng: 78.411, name: "JNTU Metro" },
  { lat: 17.518, lng: 78.435, name: "Nizampet X Road" },
  { lat: 17.53, lng: 78.49, name: "Outer Ring Road Exit" },
  { lat: 17.5449, lng: 78.5718, name: "Main Campus Central Terminus" },
];

async function runSimulator() {
  const args = process.argv.slice(2);
  const routeArg = args.includes("--route") ? args[args.indexOf("--route") + 1] : "R1";
  const speedArg = args.includes("--speed") ? parseFloat(args[args.indexOf("--speed") + 1]) : 8;

  const instanceId = "inst-r1-live";
  const baseUrl = process.env.API_BASE_URL || "http://localhost:3000";

  console.log(`\n======================================================`);
  console.log(`🚌 CollegeNav Bus Simulator: Route ${routeArg}`);
  console.log(`📍 Speed: ${speedArg} m/s (~${Math.round(speedArg * 3.6)} km/h)`);
  console.log(`🌐 Target: ${baseUrl}/api/v1/driver/trips/${instanceId}/positions`);
  console.log(`======================================================\n`);

  // Start trip first
  try {
    await fetch(`${baseUrl}/api/v1/driver/trips/${instanceId}/start`, { method: "POST" });
    console.log(`✅ Started trip instance ${instanceId}`);
  } catch (err: any) {
    console.log(`⚠️ Note: dev server not responding on ${baseUrl}: ${err.message}`);
  }

  let index = 0;
  const timer = setInterval(async () => {
    const current = R1_WAYPOINTS[index % R1_WAYPOINTS.length];
    const next = R1_WAYPOINTS[(index + 1) % R1_WAYPOINTS.length];
    index++;

    const payload = {
      points: [
        {
          lat: current.lat,
          lng: current.lng,
          speed: speedArg,
          heading: 80,
          accuracy: 8,
          ts: new Date().toISOString(),
        },
      ],
    };

    try {
      const res = await fetch(`${baseUrl}/api/v1/driver/trips/${instanceId}/positions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        console.log(`[${new Date().toLocaleTimeString()}] 📍 Bus at ${current.name} (${current.lat.toFixed(4)}, ${current.lng.toFixed(4)})`);
      }
    } catch {
      // Offline fallback log
      console.log(`[${new Date().toLocaleTimeString()}] 📍 Simulated Bus step at ${current.name}`);
    }

    if (index >= R1_WAYPOINTS.length * 2) {
      console.log(`\n🏁 Simulation loop complete. Arrived at Main Campus.`);
      clearInterval(timer);
    }
  }, 4000);
}

runSimulator().catch(console.error);

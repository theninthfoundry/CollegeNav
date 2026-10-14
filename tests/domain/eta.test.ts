import { describe, it, expect } from "vitest";
import { calculateStopEta } from "@/domain/eta";

describe("calculateStopEta domain engine", () => {
  const scheduledTime = new Date(Date.now() + 15 * 60 * 1000); // 15 min from now

  it("returns live source when GPS age is <= 30 seconds", () => {
    const result = calculateStopEta({
      busProgressM: 2000,
      stopProgressM: 5000,
      speedKmh: 36, // 10 m/s
      scheduledTime,
      lastPositionAgeSec: 10,
    });

    expect(result.source).toBe("live");
    expect(result.isPast).toBe(false);
    expect(result.etaMinutes).toBeGreaterThan(0);
  });

  it("degrades to estimated when GPS age is between 31 and 120 seconds", () => {
    const result = calculateStopEta({
      busProgressM: 2000,
      stopProgressM: 5000,
      speedKmh: 36,
      scheduledTime,
      lastPositionAgeSec: 45,
    });

    expect(result.source).toBe("estimated");
  });

  it("degrades to scheduled when GPS signal is lost (age > 120 seconds)", () => {
    const result = calculateStopEta({
      busProgressM: 2000,
      stopProgressM: 5000,
      speedKmh: 36,
      scheduledTime,
      lastPositionAgeSec: 180,
    });

    expect(result.source).toBe("scheduled");
  });

  it("marks as past when bus has moved beyond the stop", () => {
    const result = calculateStopEta({
      busProgressM: 6000,
      stopProgressM: 5000,
      speedKmh: 36,
      scheduledTime,
      lastPositionAgeSec: 15,
    });

    expect(result.isPast).toBe(true);
    expect(result.etaMinutes).toBe(0);
  });

  it("accurately computes arrival minutes for 3 km at 36 km/h (10 m/s)", () => {
    // 3000m / 10 m/s = 300s = 5 min + 30s dwell = 5.5 min => rounds to 5 or 6 min
    const result = calculateStopEta({
      busProgressM: 2000,
      stopProgressM: 5000,
      speedKmh: 36,
      scheduledTime,
      lastPositionAgeSec: 5,
      nominalDwellSec: 30,
    });

    expect(result.etaMinutes).toBeGreaterThanOrEqual(5);
    expect(result.etaMinutes).toBeLessThanOrEqual(6);
  });
});

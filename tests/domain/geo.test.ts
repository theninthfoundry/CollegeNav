import { describe, it, expect } from "vitest";
import {
  haversineDistanceMeters,
  calculateWalk,
  findCandidateStops,
} from "../../src/domain/geo";
import { StopLike } from "../../src/domain/types";

describe("domain/geo", () => {
  it("calculates accurate haversine distance between two points", () => {
    // Distance between Miyapur (17.4969, 78.3548) and KPHB (17.4948, 78.3996) is ~4.7 km
    const dist = haversineDistanceMeters(17.4969, 78.3548, 17.4948, 78.3996);
    expect(dist).toBeGreaterThan(4700);
    expect(dist).toBeLessThan(4800);
  });

  it("calculates walk time using circuity factor and walking speed", () => {
    // 400m straight-line * 1.25 circuity = 500m walk.
    // 500m / 80 m/min = 6.25 -> 7 minutes.
    const walk = calculateWalk(400);
    expect(walk.meters).toBe(500);
    expect(walk.minutes).toBe(7);
  });

  it("finds candidate stops within walking radius and excludes far stops", () => {
    const stops: StopLike[] = [
      { id: "s1", name: "Nearby Stop", lat: 17.4950, lng: 78.3990 }, // ~100m away
      { id: "s2", name: "Far Stop", lat: 17.4000, lng: 78.5000 },    // ~14km away
    ];

    const candidates = findCandidateStops(
      { type: "point", lat: 17.4948, lng: 78.3996 },
      stops,
      800
    );

    expect(candidates).toHaveLength(1);
    expect(candidates[0].stop.id).toBe("s1");
    expect(candidates[0].straightLineMeters).toBeLessThan(200);
  });

  it("returns exact stop with 0 walk when querying by stop ID", () => {
    const stops: StopLike[] = [
      { id: "s1", name: "KPHB", lat: 17.4948, lng: 78.3996 },
    ];
    const candidates = findCandidateStops({ type: "stop", stopId: "s1" }, stops);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].walkMinutes).toBe(0);
    expect(candidates[0].walkMeters).toBe(0);
  });
});

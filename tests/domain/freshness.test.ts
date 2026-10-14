import { describe, it, expect } from "vitest";
import { computeFreshness } from "../../src/domain/freshness";
import { RouteLike } from "../../src/domain/types";

describe("domain/freshness", () => {
  const baseRoute: RouteLike = {
    id: "r1",
    code: "R1",
    name: "Miyapur to Campus",
    color_index: 1,
    status: "active",
  };

  const now = new Date("2026-10-14T10:00:00+05:30");
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);

  it("identifies verified routes within 14 days", () => {
    const route: RouteLike = {
      ...baseRoute,
      verified_at: daysAgo(3),
    };
    const f = computeFreshness(route, now);
    expect(f.state).toBe("verified");
    expect(f.message).toBe("Verified 3 days ago");
    expect(f.days_since).toBe(3);
  });

  it("identifies aging routes between 15 and 45 days", () => {
    const route: RouteLike = {
      ...baseRoute,
      verified_at: daysAgo(30),
    };
    const f = computeFreshness(route, now);
    expect(f.state).toBe("aging");
    expect(f.message).toBe("Last verified 30 days ago");
  });

  it("identifies outdated routes beyond 45 days", () => {
    const route: RouteLike = {
      ...baseRoute,
      verified_at: daysAgo(70),
    };
    const f = computeFreshness(route, now);
    expect(f.state).toBe("outdated");
    expect(f.message).toBe("Schedule may be outdated");
  });

  it("identifies unverified routes when verified_at is missing", () => {
    const route: RouteLike = {
      ...baseRoute,
      verified_at: null,
    };
    const f = computeFreshness(route, now);
    expect(f.state).toBe("unverified");
    expect(f.message).toBe("Not yet verified by the transport office");
  });

  it("identifies suspended routes as outdated with suspension reason", () => {
    const route: RouteLike = {
      ...baseRoute,
      status: "suspended",
      status_reason: "Road widening near Gachibowli",
      verified_at: daysAgo(5),
    };
    const f = computeFreshness(route, now);
    expect(f.state).toBe("outdated");
    expect(f.message).toBe("Road widening near Gachibowli");
  });

  it("identifies expired validity as outdated", () => {
    const route: RouteLike = {
      ...baseRoute,
      valid_to: "2026-10-01",
      verified_at: daysAgo(5),
    };
    const f = computeFreshness(route, now);
    expect(f.state).toBe("outdated");
    expect(f.message).toBe("Schedule ended on 2026-10-01");
  });
});

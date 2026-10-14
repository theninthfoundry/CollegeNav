import { Freshness, FreshnessSettings, FreshnessState, RouteLike } from "../types";

export const DEFAULT_FRESHNESS_SETTINGS: FreshnessSettings = {
  verifiedDays: 14,
  agingDays: 45,
};

const STATE_SEVERITY_ORDER: Record<FreshnessState, number> = {
  verified: 1,
  aging: 2,
  unverified: 3,
  outdated: 4,
};

/**
 * Computes freshness state according to docs/09-CORE-LOGIC.md section 2.
 */
export function computeFreshness(
  route: RouteLike,
  now: Date = new Date(),
  settings: FreshnessSettings = DEFAULT_FRESHNESS_SETTINGS
): Freshness {
  const verifiedIso = route.verified_at
    ? typeof route.verified_at === "string"
      ? route.verified_at
      : route.verified_at.toISOString()
    : null;

  // 1. Suspended routes
  if (route.status === "suspended") {
    return {
      state: "outdated",
      verified_at: verifiedIso,
      days_since: null,
      valid_to: route.valid_to ?? null,
      message: route.status_reason ?? "Route is not running",
    };
  }

  // 2. Validity period expired (end of valid_to date in IST)
  if (route.valid_to) {
    const endOfValidTo = new Date(`${route.valid_to}T23:59:59+05:30`);
    if (now > endOfValidTo) {
      return {
        state: "outdated",
        verified_at: verifiedIso,
        days_since: null,
        valid_to: route.valid_to,
        message: `Schedule ended on ${route.valid_to}`,
      };
    }
  }

  // 3. Not verified
  if (!route.verified_at) {
    return {
      state: "unverified",
      verified_at: null,
      days_since: null,
      valid_to: route.valid_to ?? null,
      message: "Not yet verified by the transport office",
    };
  }

  // 4. Time delta calculation
  const verifiedDate = typeof route.verified_at === "string" ? new Date(route.verified_at) : route.verified_at;
  const diffDays = Math.floor((now.getTime() - verifiedDate.getTime()) / (24 * 60 * 60 * 1000));
  const days = Math.max(0, diffDays);

  if (days <= settings.verifiedDays) {
    const rel = days === 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`;
    return {
      state: "verified",
      verified_at: verifiedIso,
      days_since: days,
      valid_to: route.valid_to ?? null,
      message: `Verified ${rel}`,
    };
  }

  if (days <= settings.agingDays) {
    return {
      state: "aging",
      verified_at: verifiedIso,
      days_since: days,
      valid_to: route.valid_to ?? null,
      message: `Last verified ${days} days ago`,
    };
  }

  return {
    state: "outdated",
    verified_at: verifiedIso,
    days_since: days,
    valid_to: route.valid_to ?? null,
    message: "Schedule may be outdated",
  };
}

/**
 * Returns the worse of two freshness states.
 */
export function mergeFreshness(a: Freshness, b: Freshness): Freshness {
  const orderA = STATE_SEVERITY_ORDER[a.state];
  const orderB = STATE_SEVERITY_ORDER[b.state];
  return orderA >= orderB ? a : b;
}

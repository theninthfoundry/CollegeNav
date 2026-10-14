/**
 * Client API wrapper for CollegeNav.
 * Components use this module to communicate with /api/v1 endpoints.
 */

async function fetcher<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    let errorData;
    try {
      errorData = await res.json();
    } catch {
      // not JSON
    }
    const message = errorData?.error?.message || `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return res.json();
}

export const api = {
  config: {
    get: () => fetcher<any>("/api/v1/config"),
  },
  stops: {
    search: (params?: { q?: string; near?: string; radius?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.q) q.set("q", params.q);
      if (params?.near) q.set("near", params.near);
      if (params?.radius) q.set("radius", String(params.radius));
      if (params?.limit) q.set("limit", String(params.limit));
      return fetcher<{ items: any[] }>(`/api/v1/stops?${q.toString()}`);
    },
    get: (id: string) => fetcher<any>(`/api/v1/stops/${id}`),
    departures: (id: string, params?: { date?: string; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.date) q.set("date", params.date);
      if (params?.limit) q.set("limit", String(params.limit));
      return fetcher<any>(`/api/v1/stops/${id}/departures?${q.toString()}`);
    },
  },
  routes: {
    list: () => fetcher<{ items: any[] }>("/api/v1/routes"),
    get: (code: string) => fetcher<any>(`/api/v1/routes/${code}`),
    timetable: (code: string, params?: { direction?: string; date?: string }) => {
      const q = new URLSearchParams();
      if (params?.direction) q.set("direction", params.direction);
      if (params?.date) q.set("date", params.date);
      return fetcher<any>(`/api/v1/routes/${code}/timetable?${q.toString()}`);
    },
  },
  notices: {
    list: (params?: { route?: string; stop?: string; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.route) q.set("route", params.route);
      if (params?.stop) q.set("stop", params.stop);
      if (params?.limit) q.set("limit", String(params.limit));
      return fetcher<{ items: any[] }>(`/api/v1/notices?${q.toString()}`);
    },
  },
  plan: {
    search: (params: {
      from: string;
      to?: string;
      mode?: string;
      at?: string;
      walkMax?: number;
      limit?: number;
    }) => {
      const q = new URLSearchParams();
      q.set("from", params.from);
      if (params.to) q.set("to", params.to);
      if (params.mode) q.set("mode", params.mode);
      if (params.at) q.set("at", params.at);
      if (params.walkMax) q.set("walk_max", String(params.walkMax));
      if (params.limit) q.set("limit", String(params.limit));
      return fetcher<any>(`/api/v1/plan?${q.toString()}`);
    },
  },
};

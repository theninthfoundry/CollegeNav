import { formatKolkataTime } from "@/domain/time";

export function formatTime(date: Date | string, is24Hour = false): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatKolkataTime(d, is24Hour);
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMin = minutes % 60;
  return remainingMin > 0 ? `${hours} h ${remainingMin} min` : `${hours} h`;
}

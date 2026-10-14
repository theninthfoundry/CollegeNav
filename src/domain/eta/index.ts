import { Source } from "../types";

export interface EtaCalculationInput {
  busProgressM: number;
  stopProgressM: number;
  speedKmh: number;
  scheduledTime: Date;
  lastPositionAgeSec: number;
  nominalDwellSec?: number;
}

export interface EtaCalculationResult {
  expectedTime: Date;
  etaMinutes: number;
  source: Source;
  isPast: boolean;
  deltaMinutes: number;
}

/**
 * Calculates arrival ETA and source degradation based on GPS progress and age.
 * - Live: GPS age <= 30s
 * - Estimated: 30s < GPS age <= 120s
 * - Scheduled: GPS age > 120s (lost GPS tracking fallback to schedule)
 */
export function calculateStopEta(input: EtaCalculationInput): EtaCalculationResult {
  const {
    busProgressM,
    stopProgressM,
    speedKmh,
    scheduledTime,
    lastPositionAgeSec,
    nominalDwellSec = 30,
  } = input;

  // Determine Source Degradation
  let source: Source = "live";
  if (lastPositionAgeSec > 120) {
    source = "scheduled";
  } else if (lastPositionAgeSec > 30) {
    source = "estimated";
  }

  // If GPS signal is lost (age > 120s), fallback to scheduled timetable
  if (source === "scheduled") {
    const scheduledMin = Math.max(
      0,
      Math.round((scheduledTime.getTime() - Date.now()) / (60 * 1000))
    );
    return {
      expectedTime: new Date(scheduledTime),
      etaMinutes: scheduledMin,
      source: "scheduled",
      isPast: scheduledTime.getTime() < Date.now(),
      deltaMinutes: 0,
    };
  }

  // Distance remaining to stop
  const remainingM = stopProgressM - busProgressM;
  if (remainingM <= -50) {
    // Bus already passed this stop by > 50m
    return {
      expectedTime: new Date(scheduledTime),
      etaMinutes: 0,
      source,
      isPast: true,
      deltaMinutes: 0,
    };
  }

  if (remainingM <= 20) {
    // Bus is currently at the stop
    return {
      expectedTime: new Date(),
      etaMinutes: 0,
      source,
      isPast: false,
      deltaMinutes: 0,
    };
  }

  // Convert speed km/h to m/s, clamped to realistic city transit speeds [2 m/s to 18 m/s]
  const effectiveSpeedMps = Math.min(Math.max(speedKmh / 3.6, 2.0), 18.0);
  const travelSec = remainingM / effectiveSpeedMps + nominalDwellSec;
  const etaMinutes = Math.max(1, Math.round(travelSec / 60));

  const expectedTime = new Date(Date.now() + travelSec * 1000);
  const deltaMinutes = Math.round(
    (expectedTime.getTime() - scheduledTime.getTime()) / (60 * 1000)
  );

  return {
    expectedTime,
    etaMinutes,
    source,
    isPast: false,
    deltaMinutes: Math.max(0, deltaMinutes),
  };
}

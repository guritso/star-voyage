// Utility functions for physics calculations

import { SPEED_OF_LIGHT, LIGHT_YEAR_IN_METERS, TIME_CONVERSION } from '../constants';
import type { ShipParams, ShipMetrics } from '../types';

/**
 * Calculate the Lorentz factor (gamma) for a given velocity fraction
 * @param vFraction - Velocity as fraction of speed of light
 * @returns Lorentz factor
 */
export function gamma(vFraction: number): number {
    const v = vFraction;
    const denom = Math.sqrt(1 - v * v);
    return 1 / denom;
}

/**
 * Calculate the proper time factor for time dilation
 * @param vFraction - Velocity as fraction of speed of light
 * @returns Proper time factor
 */
export function properTimeFactor(vFraction: number): number {
    return Math.sqrt(1 - vFraction * vFraction);
}

/**
 * Convert years to seconds
 * @param years - Number of years
 * @returns Number of seconds
 */
export function yearsToSeconds(years: number): number {
    return years * TIME_CONVERSION.SECONDS_PER_YEAR;
}

/**
 * Convert meters to light-years
 * @param meters - Distance in meters
 * @returns Distance in light-years
 */
export function metersToLy(meters: number): number {
    return meters / LIGHT_YEAR_IN_METERS;
}

/**
 * Convert light-years to meters
 * @param ly - Distance in light-years
 * @returns Distance in meters
 */
export function lyToMeters(ly: number): number {
    return ly * LIGHT_YEAR_IN_METERS;
}

/**
 * Calculate ship metrics for a given ship at a specific simulation time
 * @param ship - Ship parameters
 * @param starDistanceLy - Current distance to destination star
 * @param simTimeYears - Current simulation time in years
 * @returns Ship metrics including distances, times, and relativistic effects
 */
export function shipMetrics(
    ship: ShipParams,
    starDistanceLy: number,
    simTimeYears: number
): ShipMetrics {
    const v = ship.speedFraction; // fraction of c

    // Using natural units: 1 ly per year for light. So if v is fraction of c,
    // speed in ly/year = v. This simplifies many calculations and avoids
    // unnecessary meter/second conversions.
    const elapsedYears = Math.max(0, simTimeYears - ship.startTime);

    const totalDistanceLy = starDistanceLy;
    // distance travelled in light-years = v (ly/year) * elapsedYears (years)
    const distanceLy = v * elapsedYears;
    const distanceCoveredLy = Math.min(distanceLy, totalDistanceLy);
    const distanceRemainingLy = Math.max(0, totalDistanceLy - distanceCoveredLy);

    const timeTerraYears = elapsedYears;
    const tauFactor = properTimeFactor(v);
    const timeShipYears = timeTerraYears * tauFactor;

    const timeRemainingTerraYears = v > 0 ? distanceRemainingLy / v : Infinity;
    const timeRemainingShipYears = timeRemainingTerraYears * tauFactor;

    const lorentz = gamma(v);

    // arrival (Earth simulation year) and confirmation year (Earth receives light/signal)
    const timeOfArrivalTerra = ship.startTime + totalDistanceLy / Math.max(v, 1e-12);
    const timeOfConfirmationTerra = timeOfArrivalTerra + totalDistanceLy; // light takes distance (years) to return

    return {
        elapsedYears,
        distanceCoveredLy,
        distanceRemainingLy,
        timeTerraYears,
        timeShipYears,
        timeRemainingTerraYears,
        timeRemainingShipYears,
        lorentz,
        timeOfConfirmationTerra,
        timeOfArrivalTerra,
    };
}

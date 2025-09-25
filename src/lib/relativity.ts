const C = 299792458; // speed of light in m/s
const LY_IN_METERS = 9.4607e15; // meters in one light-year (approx)

export type ShipParams = {
  id: string;
  name: string;
  starId: string;
  speedFraction: number; // fraction of c, e.g., 0.5 = 50% c
  startTime: number; // simulation time when launched (years)
};

export function gamma(vFraction: number) {
  const v = vFraction;
  const denom = Math.sqrt(1 - v * v);
  return 1 / denom;
}

export function properTimeFactor(vFraction: number) {
  return Math.sqrt(1 - vFraction * vFraction);
}

// Convert years to seconds
export function yearsToSeconds(years: number) {
  return years * 365.25 * 24 * 3600;
}

// Convert meters travelled to light-years
export function metersToLy(meters: number) {
  return meters / LY_IN_METERS;
}

// Given ship parameters and a global simulation time (years), compute metrics
export function shipMetrics(
  ship: ShipParams,
  starDistanceLy: number,
  simTimeYears: number
) {
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
    timeOfArrivalTerra
  };
}

export { C };

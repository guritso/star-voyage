// Centralized type definitions for the Star Voyage project

export type Star = {
  id: string;
  name: string;
  distanceLy: number; // distance in light years
  description?: string;
  raHours?: number; // right ascension in hours (0-24)
  decDeg?: number; // declination in degrees (-90..+90)
  constellation?: string; // constellation name
  color?: string; // hex color code for stellar classification
  magnitude?: number; // magnitude of the star
};

export type ShipParams = {
  id: string;
  name: string;
  starId: string;
  // snapshot of destination distance at creation time to keep physics stable
  starDistanceLy: number;
  speedFraction: number; // fraction of c, e.g., 0.5 = 50% c
  startTime: number; // simulation time when launched (years)
};

export type ShipMetrics = {
  elapsedYears: number;
  distanceCoveredLy: number;
  distanceRemainingLy: number;
  timeTerraYears: number;
  timeShipYears: number;
  timeRemainingTerraYears: number;
  timeRemainingShipYears: number;
  lorentz: number;
  timeOfConfirmationTerra: number;
  timeOfArrivalTerra: number;
};

export type CanvasState = {
  width: number;
  height: number;
  scale: number;
  panX: number;
  panY: number;
  centerX: number;
  centerY: number;
  starsSize: number;
};

export type SimulationState = {
  time: number;
  speed: number;
  isRunning: boolean;
};

// Physical constants used in the Star Voyage simulation

// Speed of light in m/s
export const SPEED_OF_LIGHT = 299792458;

// Meters in one light-year (approximate)
export const LIGHT_YEAR_IN_METERS = 9.4607e15;

// Canvas visualization constants
export const CANVAS_CONFIG = {
    DEFAULT_SCALE: 1000,
    MIN_SCALE: 0.1,
    MAX_SCALE: 50000,
    DEFAULT_STAR_SIZE: 3,
    DEFAULT_WIDTH: 800,
    DEFAULT_HEIGHT: 600,
} as const;

// Simulation constants
export const SIMULATION_CONFIG = {
    DEFAULT_SPEED: 0.1, // years per second
    MIN_SPEED_PERCENT: 0.01,
    MAX_SPEED_PERCENT: 99.999,
} as const;

// Time conversion constants
export const TIME_CONVERSION = {
    SECONDS_PER_YEAR: 365.25 * 24 * 3600,
} as const;

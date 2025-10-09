// Simulation state stores

import { writable } from 'svelte/store';
import { SIMULATION_CONFIG } from '../constants';

// Global simulation time in years
export const simTime = writable<number>(0);

// Simulation speed: how many simulated years pass per real second
export const simSpeed = writable<number>(SIMULATION_CONFIG.DEFAULT_SPEED);

// Simulation running state
export const isSimulationRunning = writable<boolean>(false);

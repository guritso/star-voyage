import { writable } from 'svelte/store';
import type { ShipParams } from './relativity';

// Global simulation time in years
export const simTime = writable<number>(0);

// Simulation speed: how many simulated years pass per real second
export const simSpeed = writable<number>(0.1); // default 0.1 year per second

// Ships
export const ships = writable<ShipParams[]>([]);

// Selected ship id
export const selectedShipId = writable<string | null>(null);

// Selected star id (when user clicks a star)
export const selectedStarId = writable<string | null>(null);

// Current target star id (used as default when adding a new ship)
export const targetStarId = writable<string | null>(null);

// Tag visibility
export const tagShow = writable<boolean>(true);

// Imperative zoom request: when set to a star id, the canvas should zoom to it and then clear back to null
export const zoomToStarId = writable<string | null>(null);

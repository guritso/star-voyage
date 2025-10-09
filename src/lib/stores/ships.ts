// Ship-related stores

import { writable } from 'svelte/store';
import type { ShipParams } from '../types';

// Ships array
export const ships = writable<ShipParams[]>([]);

// Selected ship id
export const selectedShipId = writable<string | null>(null);

// Current target star id (used as default when adding a new ship)
export const targetStarId = writable<string | null>(null);

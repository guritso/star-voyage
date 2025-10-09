// Star-related stores

import { writable } from 'svelte/store';

// Selected star id (when user clicks a star)
export const selectedStarId = writable<string | null>(null);

// Imperative zoom request: when set to a star id, the canvas should zoom to it and then clear back to null
export const zoomToStarId = writable<string | null>(null);

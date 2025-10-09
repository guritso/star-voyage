// UI state stores

import { writable } from 'svelte/store';

// Tag visibility
export const tagShow = writable<boolean>(true);

// Canvas state
export const canvasState = writable({
  scale: 1000,
  panX: 0,
  panY: 0,
  centerX: 0,
  centerY: 0,
  starsSize: 3,
});

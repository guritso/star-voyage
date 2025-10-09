// Utility functions for canvas operations

import { CANVAS_CONFIG } from '../constants';

/**
 * Convert world coordinates to screen coordinates
 * @param worldX - World X coordinate
 * @param worldY - World Y coordinate
 * @param scale - Current scale factor
 * @param panX - Pan offset X
 * @param panY - Pan offset Y
 * @param centerX - Canvas center X
 * @param centerY - Canvas center Y
 * @returns Screen coordinates
 */
export function worldToScreen(
  worldX: number,
  worldY: number,
  scale: number,
  panX: number,
  panY: number,
  centerX: number,
  centerY: number
): { x: number; y: number } {
  return {
    x: centerX + worldX * scale + panX,
    y: centerY + worldY * scale + panY,
  };
}

/**
 * Convert screen coordinates to world coordinates
 * @param screenX - Screen X coordinate
 * @param screenY - Screen Y coordinate
 * @param scale - Current scale factor
 * @param panX - Pan offset X
 * @param panY - Pan offset Y
 * @param centerX - Canvas center X
 * @param centerY - Canvas center Y
 * @returns World coordinates
 */
export function screenToWorld(
  screenX: number,
  screenY: number,
  scale: number,
  panX: number,
  panY: number,
  centerX: number,
  centerY: number
): { x: number; y: number } {
  return {
    x: (screenX - centerX - panX) / scale,
    y: (screenY - centerY - panY) / scale,
  };
}

/**
 * Calculate distance between two points
 * @param x1 - First point X
 * @param y1 - First point Y
 * @param x2 - Second point X
 * @param y2 - Second point Y
 * @returns Distance between points
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Clamp a value between min and max
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Scale a value proportionally
 * @param value - Value to scale
 * @param oldMin - Old minimum value
 * @param oldMax - Old maximum value
 * @param newMin - New minimum value
 * @param newMax - New maximum value
 * @returns Scaled value
 */
export function scaleValue(
  value: number,
  oldMin: number,
  oldMax: number,
  newMin: number,
  newMax: number
): number {
  return ((value - oldMin) / (oldMax - oldMin)) * (newMax - newMin) + newMin;
}

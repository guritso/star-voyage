// Utility functions for star data processing

import type { Star } from '../types';

/**
 * Normalize a string for comparison (lowercase and trim)
 * @param str - String to normalize
 * @returns Normalized string
 */
export function normalizeString(str: string): string {
    return str.toLowerCase().trim();
}

/**
 * Deduplicate stars by normalized name, preferring closer stars
 * @param stars - Array of stars to deduplicate
 * @returns Deduplicated array of stars
 */
export function deduplicateStars(stars: Star[]): Star[] {
    const byName = new Map<string, Star>();

    for (const star of stars) {
        const key = normalizeString(star.name);
        if (!byName.has(key)) {
            byName.set(key, star);
        } else {
            // prefer entry with smaller distance (closer) if duplicate name
            const prev = byName.get(key)!;
            if (star.distanceLy < prev.distanceLy) {
                byName.set(key, star);
            }
        }
    }

    return Array.from(byName.values());
}

/**
 * Sort stars by distance (nearest first)
 * @param stars - Array of stars to sort
 * @returns Sorted array of stars
 */
export function sortStarsByDistance(stars: Star[]): Star[] {
    return [...stars].sort((a, b) => a.distanceLy - b.distanceLy);
}

/**
 * Find a star by its ID
 * @param stars - Array of stars to search
 * @param id - Star ID to find
 * @returns Found star or undefined
 */
export function findStarById(stars: Star[], id: string): Star | undefined {
    return stars.find((star) => star.id === id);
}

/**
 * Generate a unique ID for a star based on its name
 * @param name - Star name
 * @returns Unique ID
 */
export function generateStarId(name: string): string {
    return normalizeString(name).replace(/\s+/g, '-');
}

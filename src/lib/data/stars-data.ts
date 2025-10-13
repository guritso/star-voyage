import type { Star } from '$lib/types';
import csv from '$lib/assets/stars.csv?raw';

export type LocalCsvRow = {
    id: string;
    name: string;
    constellation: string;
    RA_hour: number;
    RA_min: number;
    RA_sec: number;
    dec_deg: number;
    dec_min: number;
    dec_sec: number;
    magnitude: number;
    LY_distance: number;
};

function hmsToHours(h: number, m: number, s: number): number | null {
    if (!Number.isFinite(h) || !Number.isFinite(m) || !Number.isFinite(s)) return null;
    const value = h + m / 60 + s / 3600;
    return Number.isFinite(value) ? value : null;
}
// Cache for local data
let localStarsCache: LocalCsvRow[] | null = null;

async function loadLocalStars(): Promise<LocalCsvRow[]> {
    if (localStarsCache) {
        return localStarsCache;
    }

    try {
        const lines = csv.trim().split('\n');
        const dataLines = lines.slice(1); // skip header
        const stars: LocalCsvRow[] = dataLines.map((line, index) => {
            const [
                name,
                constellation,
                raHour,
                raMin,
                raSec,
                decDeg,
                decMin,
                decSec,
                magnitude,
                lyDistance,
            ] = line.split(',');
            return {
                id: index.toString(),
                name: name,
                constellation: constellation,
                RA_hour: Number(raHour),
                RA_min: Number(raMin),
                RA_sec: Number(raSec),
                dec_deg: Number(decDeg),
                dec_min: Number(decMin),
                dec_sec: Number(decSec),
                magnitude: Number(magnitude),
                LY_distance: Number(lyDistance),
            };
        });

        localStarsCache = stars;
        return stars;
    } catch (error) {
        console.error('Error loading local stars:', error);
        return [];
    }
}

export async function fetchLocalStars(): Promise<Star[]> {
    const localStars = await loadLocalStars();
    if (localStars.length === 0) {
        console.warn('No local stars data available');
        return [];
    }

    // Filter stars with distance > 0 and magnitude if specified
    let filteredStars = localStars.filter((star) => {
        if (star.LY_distance <= 0 || !Number.isFinite(star.LY_distance)) {
            return false;
        }
        return true;
    });

    // Sort by distance (nearest first)
    filteredStars.sort((a, b) => a.LY_distance - b.LY_distance);

    // Convert to Star format
    const mapped: Star[] = filteredStars.map((item, index) => {
        const raHours = hmsToHours(item.RA_hour, item.RA_min, item.RA_sec) ?? undefined;

        return {
            id: item.id,
            name: item.name || `Star ${index}`,
            distanceLy: item.LY_distance,
            raHours,
            decDeg: undefined, // Not used in the project
            constellation: item.constellation ?? undefined,
            color: undefined,
            magnitude: item.magnitude ?? undefined,
        };
    });

    return mapped;
}

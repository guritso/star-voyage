import type { Star } from '$lib/stars';
import csv from '$lib/assets/stars.csv?raw';

export type LocalCsvRow = {
  ID: string;
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


function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40);
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
    const stars: LocalCsvRow[] = dataLines.map((line) => {
      const [id, name, constellation, raHour, raMin, raSec, decDeg, decMin, decSec, magnitude, lyDistance] = line.split(',');
      return {
        ID: id,
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

    const baseId = slugify(item.name || `star-${index}`);
    const id = `local-${baseId}-${index}`;

    return {
      id,
      name: item.name || `Star ${index}`,
      distanceLy: item.LY_distance,
      raHours,
      decDeg: undefined, // Not used in the project
      constellation: item.constellation ?? undefined,
      color: undefined,
    };
  });

  return mapped;
}

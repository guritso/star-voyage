import type { Star } from '$lib/stars';
import csv from '$lib/assets/stars.csv?raw';

export type LocalCsvRow = {
  ID: string;
  name: string;
  constellation: string;
  RA_hour: string;
  RA_min: string;
  RA_sec: string;
  dec_deg: string;
  dec_min: string;
  dec_sec: string;
  magnitude: string;
  LY_distance: string;
};

function parseNumberOrNull(input: string): number | null {
  if (input === undefined || input === null) return null;
  const trimmed = String(input).trim();
  if (trimmed === '') return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function numberOrZero(input: string): number {
  const n = parseNumberOrNull(input);
  return n ?? 0;
}

function hmsToHours(h: string, m: string, s: string): number | null {
  const hh = parseNumberOrNull(h) ?? 0;
  const mm = parseNumberOrNull(m) ?? 0;
  const ss = parseNumberOrNull(s) ?? 0;
  const value = hh + mm / 60 + ss / 3600;
  return Number.isFinite(value) ? value : null;
}

function dmsToDegrees(d: string, m: string, s: string): number | null {
  if (!d) return null;
  const sign = d.startsWith('-') ? -1 : 1;
  const absDeg = parseNumberOrNull(d.replace(/^[-+]/, '')) ?? 0;
  const mm = parseNumberOrNull(m) ?? 0;
  const ss = parseNumberOrNull(s) ?? 0;
  const value = sign * (absDeg + mm / 60 + ss / 3600);
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
        RA_hour: raHour,
        RA_min: raMin,
        RA_sec: raSec,
        dec_deg: decDeg,
        dec_min: decMin,
        dec_sec: decSec,
        magnitude: magnitude,
        LY_distance: lyDistance,
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
    const dist = numberOrZero(star.LY_distance);
    if (dist <= 0 || !Number.isFinite(dist)) {
      return false;
    }
    return true;
  });

  // Sort by distance (nearest first)
  filteredStars.sort((a, b) => numberOrZero(a.LY_distance) - numberOrZero(b.LY_distance));

  // Convert to Star format
  const mapped: Star[] = filteredStars.map((item, index) => {
    const raHours = hmsToHours(item.RA_hour, item.RA_min, item.RA_sec) ?? undefined;
    const decDeg = dmsToDegrees(item.dec_deg, item.dec_min, item.dec_sec) ?? undefined;

    const baseId = slugify(item.name || `star-${index}`);
    const id = `local-${baseId}-${index}`;

    return {
      id,
      name: item.name || `Star ${index}`,
      distanceLy: numberOrZero(item.LY_distance),
      raHours,
      decDeg,
      constellation: item.constellation ?? undefined,
      color: undefined,
    };
  });

  return mapped;
}

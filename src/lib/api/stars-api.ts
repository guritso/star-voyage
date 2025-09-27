import type { Star } from '$lib/stars';

export type LocalStar = {
  name: string;
  constellation?: string;
  distance_light_year: number;
  right_ascension?: string;
  declination?: string;
  apparent_magnitude?: string;
};

function parseRAtoHours(ra: string | undefined): number | null {
  if (!ra) return null;
  // Formats like "01h 38m 37s" or "01h38m37s" or "01 38 37"
  const re = /(?:(\d+)(?:h|\s))?\s*(?:(\d+)(?:m|\s))?\s*(?:(\d+(?:\.\d+)?)(?:s)?)?/i;
  const m = ra.match(re);
  if (!m) return null;
  const h = Number(m[1] ?? 0);
  const min = Number(m[2] ?? 0);
  const s = Number(m[3] ?? 0);
  const hours = h + min / 60 + s / 3600;
  return Number.isFinite(hours) ? hours : null;
}

function parseDecToDegrees(dec: string | undefined): number | null {
  if (!dec) return null;
  // Normalize unicode primes to plain characters and remove spaces
  const norm = dec
    .replace(/[′'‛᾽`]/g, "'")
    .replace(/[″""]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
  // Formats like "+44° 01′ 22″" or "-22 30 00"
  const re = /([+\-−]?)(\d+)[°\s]\s*(\d+)?['\s]?\s*(\d+(?:\.\d+)?)?["\s]?/;
  const m = norm.match(re);
  if (!m) return null;
  const sign = m[1] === '-' || m[1] === '−' ? -1 : 1;
  const deg = Number(m[2] ?? 0);
  const min = Number(m[3] ?? 0);
  const sec = Number(m[4] ?? 0);
  const val = sign * (deg + min / 60 + sec / 3600);
  return Number.isFinite(val) ? val : null;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40);
}

// Cache for local data
let localStarsCache: LocalStar[] | null = null;

async function loadLocalStars(): Promise<LocalStar[]> {
  if (localStarsCache) {
    return localStarsCache;
  }

  try {
    const response = await fetch('/data/all-stars.ndjson');
    if (!response.ok) {
      throw new Error(`Failed to load local stars: ${response.status}`);
    }
    
    const text = await response.text();
    const lines = text.trim().split('\n');
    const stars: LocalStar[] = lines.map(line => JSON.parse(line));
    
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
  let filteredStars = localStars.filter(star => {
    // Always filter stars with distance 0 or invalid
    if (star.distance_light_year <= 0 || !Number.isFinite(star.distance_light_year)) {
      return false;
    }
    
    return true;
  });

  // Sort by distance (nearest first)
  filteredStars.sort((a, b) => a.distance_light_year - b.distance_light_year);

  // Convert to Star format
  const mapped: Star[] = filteredStars.map((item, index) => {
    const raHours = parseRAtoHours(item.right_ascension ?? undefined) ?? undefined;
    const decDeg = parseDecToDegrees(item.declination ?? undefined) ?? undefined;
    
    const baseId = slugify(item.name || `star-${index}`);
    const id = `local-${baseId}-${index}`;
    
    return {
      id,
      name: item.name || `Star ${index}`,
      distanceLy: item.distance_light_year,
      raHours,
      decDeg,
      constellation: item.constellation ?? undefined
    };
  });
  
  return mapped;
}
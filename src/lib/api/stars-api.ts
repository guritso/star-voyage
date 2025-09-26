import type { Star } from '$lib/stars';
import { env } from '$env/dynamic/public';

export type NinjaStar = {
  name: string;
  constellation?: string;
  right_ascension?: string;
  declination?: string;
  apparent_magnitude?: string;
  absolute_magnitude?: string;
  distance_light_year?: string;
  spectral_class?: string;
};

function parseDistance(distance: string | undefined): number | null {
  if (!distance) return null;
  // remove commas and whitespace
  const clean = distance.replace(/[,\s]/g, '');
  const num = Number(clean);
  return Number.isFinite(num) ? num : null;
}

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
    .replace(/[′’‛᾽`]/g, "'")
    .replace(/[″“”]/g, '"')
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

export async function fetchNinjaStars(
  params: { maxDistanceLy?: number; offset?: number; maxApparentMag?: number },
  fetchFn: typeof fetch = fetch
): Promise<Star[]> {
  const { maxDistanceLy = 100, offset = 0, maxApparentMag } = params;
  const apiKey = env.PUBLIC_API_NINJAS_KEY;
  if (!apiKey) {
    console.warn('API Ninjas key missing. Set PUBLIC_API_NINJAS_KEY in your env. Falling back to empty list.');
    return [];
  }
  const url = new URL('https://api.api-ninjas.com/v1/stars');
  url.searchParams.set('max_distance_light_year', String(maxDistanceLy));
  url.searchParams.set('offset', String(offset));
  if (typeof maxApparentMag === 'number') {
    url.searchParams.set('max_apparent_magnitude', String(maxApparentMag));
  }

  const res = await fetchFn(url.toString(), {
    headers: {
      'X-Api-Key': apiKey
    }
  });
  if (!res.ok) {
    console.error('API Ninjas request failed', res.status, await res.text());
    return [];
  }
  const data: NinjaStar[] = await res.json();
  const mapped: Star[] = [];
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const dist = parseDistance(item.distance_light_year);
    if (dist == null || !Number.isFinite(dist)) continue;
    const raHours = parseRAtoHours(item.right_ascension ?? undefined) ?? undefined;
    const decDeg = parseDecToDegrees(item.declination ?? undefined) ?? undefined;
    // respect max distance (API should filter, but double-check)
    if (dist > maxDistanceLy) continue;
    const baseId = slugify(item.name || `star-${offset + i}`);
    const id = `api-${baseId}-${offset + i}`;
    mapped.push({ id, name: item.name || `Star ${offset + i}`, distanceLy: dist, raHours, decDeg, constellation: item.constellation ?? undefined });
  }
  return mapped;
}

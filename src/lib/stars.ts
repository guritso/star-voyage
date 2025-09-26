import { writable, derived, get } from 'svelte/store';
import { fetchNinjaStars } from '$lib/api/stars-api';

export type Star = {
  id: string;
  name: string;
  distanceLy: number; // distance in light years
  description?: string;
  // Optional sky coordinates from API Ninjas (for better placement)
  raHours?: number; // right ascension in hours (0-24)
  decDeg?: number;  // declination in degrees (-90..+90)
  constellation?: string; // constellation name (from API)
};

// A short curated list of nearby stars with distances in light-years.
// Distances are approximate and meant for the simulation.
export const STARS: Star[] = [
  { id: 'alpha', name: 'Alpha Centauri', distanceLy: 4.247, description: 'The closest known star system to the Sun, located in the constellation Centaurus.' },
  { id: 'barnard', name: "Barnard's Star", distanceLy: 5.96, description: 'The second closest known star to the Sun, located in the constellation Ophiuchus.' },
  { id: 'wolf359', name: 'Wolf 359', distanceLy: 7.78, description: 'A red dwarf star in the constellation Leo, one of the closest stars to the Sun.' },
  { id: 'sirius', name: 'Sirius', distanceLy: 8.58, description: 'The brightest star in the night sky, located in the constellation Canis Major.' },
  { id: 'eps-eri', name: 'Epsilon Eridani', distanceLy: 10.52, description: 'A sun-like star in the constellation Eridanus.' },
  { id: 'lacaille', name: "Lacaille 9352", distanceLy: 10.74, description: 'A red dwarf star in the constellation Pictor.' },
  { id: 'ross248', name: 'Ross 248', distanceLy: 10.32, description: 'A red dwarf star in the constellation Andromeda.' },
  { id: 'epsilon-ind', name: 'Epsilon Indi', distanceLy: 11.82, description: 'A binary star system in the constellation Indus.' },
  { id: 'betelgeuse', name: 'Betelgeuse', distanceLy: 642.5, description: 'A red supergiant star in the constellation Orion.' },
];

// Source selection: 'basic' uses STARS; 'api' uses apiStars
export const starsSource = writable<'basic' | 'api'>('basic');
export const apiStars = writable<Star[]>([]);
export const starsList = derived([starsSource, apiStars], ([$src, $api]) => {
  const list = $src === 'basic' ? STARS : $api;
  return [...list].sort((a, b) => a.distanceLy - b.distanceLy);
});

// API pagination state
export const apiOffset = writable(0);
export const apiMaxDistanceLy = writable(100);
export const apiMaxApparentMag = writable<number | null>(12);
export const apiPageSize = 30;
export const apiLoading = writable(false);

function clearApiPagingState() {
  requestedOffsets.clear();
  apiLoading.set(false);
}

export async function resetApiStars() {
  clearApiPagingState();
  apiStars.set([]);
  apiOffset.set(0);
}

const requestedOffsets = new Set<number>();

export async function loadNextApiPage(fetchFn?: typeof fetch) {
  if (get(apiLoading)) return 0; // prevent concurrent loads
  apiLoading.set(true);
  try {
    let offset = get(apiOffset);
    const maxDist = get(apiMaxDistanceLy);
    const maxMag = get(apiMaxApparentMag);
    let accumulated = 0;
    let attempts = 0;
    while (attempts < 3) {
      // Skip if this exact offset is already requested (prevents duplicates when clicking fast)
      if (requestedOffsets.has(offset)) {
        offset += apiPageSize;
        attempts++;
        continue;
      }
      requestedOffsets.add(offset);
      const list = await fetchNinjaStars({ maxDistanceLy: maxDist, offset, maxApparentMag: maxMag ?? undefined }, fetchFn ?? fetch);
      const count = list.length;
      // Advance offset exactly by page size once per requested page
      const nextOffset = offset + apiPageSize;
      apiOffset.set(nextOffset);
      attempts++;
      if (count > 0) {
        // Sort nearer first
        list.sort((a, b) => a.distanceLy - b.distanceLy);
        // Deduplicate by normalized name (API IDs may repeat across pages)
        const norm = (s: string) => s.toLowerCase().trim();
        apiStars.update((arr) => {
          const byName = new Map<string, Star>();
          for (const s of arr) byName.set(norm(s.name), s);
          for (const s of list) {
            const key = norm(s.name);
            if (!byName.has(key)) {
              byName.set(key, s);
            } else {
              // prefer entry with smaller distance (closer) if duplicate name
              const prev = byName.get(key)!;
              if (s.distanceLy < prev.distanceLy) byName.set(key, s);
            }
          }
          return Array.from(byName.values());
        });
        accumulated += count;
        break; // fetched a usable page
      }
      // If page yielded no usable stars, try the next offset automatically
      offset = nextOffset;
    }
    return accumulated;
  } finally {
    apiLoading.set(false);
  }
}

export function getStarById(id: string) {
  const current = get(starsList);
  return current.find((s) => s.id === id) as Star | undefined;
}

import { writable, derived, get } from 'svelte/store';
import { fetchLocalStars } from '$lib/data/stars-data';

export type Star = {
  id: string;
  name: string;
  distanceLy: number; // distance in light years
  description?: string;
  raHours?: number; // right ascension in hours (0-24)
  decDeg?: number;  // declination in degrees (-90..+90)
  constellation?: string; // constellation name
  color?: string; // hex color code for stellar classification
};



// Use local stars as default
export const stars = writable<Star[]>([]);
export const starsList = derived([stars], ([$data]) => {
  return [...$data].sort((a, b) => a.distanceLy - b.distanceLy);
});

export async function loadAllStars() {
    
    const list = await fetchLocalStars();
    
    // Sort nearer first
    list.sort((a, b) => a.distanceLy - b.distanceLy);
    
    // Deduplicate by normalized name
    const norm = (s: string) => s.toLowerCase().trim();
    const byName = new Map<string, Star>();
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
    
    const uniqueStars = Array.from(byName.values());
  stars.set(uniqueStars);
  return uniqueStars.length;
}

export function getStarById(id: string) {
  const current = get(starsList);
  return current.find((s) => s.id === id) as Star | undefined;
}

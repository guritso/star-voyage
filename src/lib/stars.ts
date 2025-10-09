import { writable, derived, get } from 'svelte/store';
import { fetchLocalStars } from '$lib/data/stars-data';
import type { Star } from '$lib/types';
import { deduplicateStars, sortStarsByDistance, findStarById } from '$lib/utils';
// Use local stars as default
export const stars = writable<Star[]>([]);
export const starsList = derived([stars], ([$data]) => {
  return sortStarsByDistance($data);
});

export async function loadAllStars() {
  const list = await fetchLocalStars();

  // Sort nearer first and deduplicate
  const sortedStars = sortStarsByDistance(list);
  const uniqueStars = deduplicateStars(sortedStars);

  stars.set(uniqueStars);
  return uniqueStars.length;
}

export function getStarById(id: string) {
  const current = get(starsList);
  return findStarById(current, id);
}

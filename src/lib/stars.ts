export type Star = {
  id: string;
  name: string;
  distanceLy: number; // distance in light years
  description?: string;
};

// A short curated list of nearby stars with distances in light-years.
// Distances are approximate and meant for the simulation.
export const STARS: Star[] = [
  { id: 'proxima', name: 'Proxima Centauri', distanceLy: 4.247 },
  { id: 'alpha-a', name: 'Alpha Centauri A', distanceLy: 4.37 },
  { id: 'alpha-b', name: 'Alpha Centauri B', distanceLy: 4.37 },
  { id: 'barnard', name: "Barnard's Star", distanceLy: 5.96 },
  { id: 'wolf359', name: 'Wolf 359', distanceLy: 7.78 },
  { id: 'sirius', name: 'Sirius', distanceLy: 8.58 },
  { id: 'eps-eri', name: 'Epsilon Eridani', distanceLy: 10.52 },
  { id: 'lacaille', name: "Lacaille 9352", distanceLy: 10.74 },
  { id: 'ross248', name: 'Ross 248', distanceLy: 10.32 },
  { id: 'epsilon-ind', name: 'Epsilon Indi', distanceLy: 11.82 }
];

export function getStarById(id: string) {
  return STARS.find((s) => s.id === id) as Star | undefined;
}

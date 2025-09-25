export type Star = {
  id: string;
  name: string;
  distanceLy: number; // distance in light years
  description?: string;
};

// A short curated list of nearby stars with distances in light-years.
// Distances are approximate and meant for the simulation.
export const STARS: Star[] = [
  { id: 'proxima', name: 'Proxima Centauri', distanceLy: 4.247, description: 'The closest known star to the Sun, part of the Alpha Centauri star system.' },
  { id: 'barnard', name: "Barnard's Star", distanceLy: 5.96, description: 'The second closest known star to the Sun, located in the constellation Ophiuchus.' },
  { id: 'wolf359', name: 'Wolf 359', distanceLy: 7.78, description: 'A red dwarf star in the constellation Leo, one of the closest stars to the Sun.' },
  { id: 'sirius', name: 'Sirius', distanceLy: 8.58, description: 'The brightest star in the night sky, located in the constellation Canis Major.' },
  { id: 'eps-eri', name: 'Epsilon Eridani', distanceLy: 10.52, description: 'A sun-like star in the constellation Eridanus.' },
  { id: 'lacaille', name: "Lacaille 9352", distanceLy: 10.74, description: 'A red dwarf star in the constellation Pictor.' },
  { id: 'ross248', name: 'Ross 248', distanceLy: 10.32, description: 'A red dwarf star in the constellation Andromeda.' },
  { id: 'epsilon-ind', name: 'Epsilon Indi', distanceLy: 11.82, description: 'A binary star system in the constellation Indus.' },
  { id: 'betelgeuse', name: 'Betelgeuse', distanceLy: 642.5, description: 'A red supergiant star in the constellation Orion.' },
];

export function getStarById(id: string) {
  return STARS.find((s) => s.id === id) as Star | undefined;
}

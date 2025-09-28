# Star Voyage: Interactive Simulation of Relativistic Space Travel

[![Svelte](https://img.shields.io/badge/Svelte-5.0-orange)]() [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)]()

## About the Project

**Star Voyage** is an advanced interactive simulation that allows exploring the fascinating effects of **special relativity** in interstellar space travel. Based on real astronomical data, this web application demonstrates complex physics concepts in a visual and intuitive way.

### Key Features

- **Real star map**: Uses real astronomical data from nearby stars
- **Precise relativistic simulation**: Implements special relativity formulas
- **Interactive visualization**: Responsive canvas with zoom and navigation controls
- **Real-time metrics**: Track time, distance, and relativistic effects

## Relativistic Effects Implemented

### Lorentz Factor (γ)
```typescript
const gamma = 1 / Math.sqrt(1 - v²/c²)
```
The Lorentz factor γ determines how time and space behave differently for observers in relative motion.

### Time Dilation
- **Earth time**: Time measured by stationary observers
- **Proper time**: Time measured aboard the spacecraft
- **Relationship**: `Δt₀ = Δt × √(1 - v²/c²)`

### Relativistic Travel Time
For speeds close to the speed of light, apparent travel time decreases significantly:

| Speed (% of c) | Lorentz Factor | Travel Time (proper / distance) |
|----------------|----------------|---------------------------------|
| 50%            | 1.15          | 1.73                            |
| 90%            | 2.29          | 0.48                            |
| 99%            | 7.09          | 0.14                            |
| 99.9%          | 22.37         | 0.045                           |

### Visual Effects
- **Light aberration**: Apparent change in star positions
- **Doppler effect**: Change in received light frequency
- **Relativistic synchronization**: Interstellar communication challenges

## How to Use

### Installation
```bash
pnpm install
```

### Development
```bash
pnpm dev
```

### Build
```bash
pnpm build
```

### Interface

1. **Add a ship**: Click on a star and configure speed (% of light speed)
2. **Control simulation**: Use controls to pause/continue time
3. **Navigate**: Zoom, pan, and click on ships/stars to see details
4. **Observe effects**: Compare Earth time vs. ship time

## Physics Implementation

### Natural Units
The project uses **light-years per year** as a natural unit, simplifying calculations:
- Speed of light = 1 ly/year
- Distance = light-years
- Time = years

### Key Formulas

```typescript
export function shipMetrics(ship, starDistanceLy, simTimeYears) {
  const v = ship.speedFraction; // fraction of light speed
  const elapsedYears = Math.max(0, simTimeYears - ship.startTime);

  // Distance traveled (in light-years)
  const distanceCoveredLy = v * elapsedYears;
  const distanceRemainingLy = starDistanceLy - distanceCoveredLy;

  // Earth time vs. Proper time
  const timeTerraYears = elapsedYears;
  const timeShipYears = timeTerraYears * Math.sqrt(1 - v * v);

  // Estimated remaining time
  const timeRemainingTerraYears = distanceRemainingLy / v;
  const timeRemainingShipYears = timeRemainingTerraYears * Math.sqrt(1 - v * v);

  return {
    distanceCoveredLy,
    timeTerraYears,
    timeShipYears,
    timeRemainingTerraYears,
    timeRemainingShipYears,
    lorentz: 1 / Math.sqrt(1 - v * v)
  };
}
```

## Interesting Destinations

| Star | Distance (ly) | Travel Time (99%c) |
|------|---------------|-------------------|
| Proxima Centauri | 4.24 | 0.6 years |
| Sirius | 8.66 | 1.2 years |
| Vega | 25.05 | 3.5 years |
| Betelgeuse | 548 | 77 years |
| Andromeda Galaxy | 2.5M | 350,000 years |

## Technologies

- **Svelte 5**: Modern reactive framework
- **TypeScript**: Static typing
- **Canvas API**: High-performance 2D rendering
- **TailwindCSS**: Responsive styling
- **Vite**: Ultra-fast build tool

## Educational Objectives

This project was developed to:

1. **Demonstrate relativistic concepts** in an interactive way
2. **Visualize time paradoxes** in space travel
3. **Explore practical implications** of relativistic physics
4. **Inspire interest** in astronomy and theoretical physics

## Contributions

Contributions are welcome! Areas of interest:
- New relativistic effects
- Additional astronomical data
- Interface improvements
- Performance optimizations

## License

This project is open source and available under the [MIT License](LICENSE).

---

> "The speed of light is the cosmic speed limit, and traveling near it reveals the deepest aspects of our reality." - Albert Einstein

*Developed with love to explore the mysteries of the cosmos*
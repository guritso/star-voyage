<script lang="ts">
  import { selectedShipId, ships, simTime } from '$lib/stores';
  import { getStarById } from '$lib/stars';
  import { shipMetrics, properTimeFactor } from '$lib/relativity';
  import type { ShipParams } from '$lib/relativity';

  // Use Svelte 5 runes ($derived.by) with explicit types
  let ship: ShipParams | null = $derived.by<ShipParams | null>(() =>
    $selectedShipId ? $ships.find((s) => s.id === $selectedShipId) ?? null : null
  );

  let metrics: ReturnType<typeof shipMetrics> | null = $derived.by<ReturnType<typeof shipMetrics> | null>(() =>
    ship ? shipMetrics(ship, ship.starDistanceLy ?? (getStarById(ship.starId)?.distanceLy ?? 0), $simTime) : null
  );

  // Clamp displayed elapsed times to arrival so they stop increasing after arrival
  let tauFactor: number = $derived.by<number>(() => (ship ? properTimeFactor(ship.speedFraction) : 1));

  let arrivalElapsedTerra: number = $derived.by<number>(() =>
    ship && metrics ? Math.max(0, metrics.timeOfArrivalTerra - ship.startTime) : 0
  );

  let displayTimeTerra: number = $derived.by<number>(() =>
    ship && metrics ? Math.min(metrics.timeTerraYears, arrivalElapsedTerra) : 0
  );

  let displayTimeShip: number = $derived.by<number>(() =>
    ship && metrics ? Math.min(metrics.timeShipYears, arrivalElapsedTerra * tauFactor) : 0
  );

  // Total travel time at Earth frame (distance / v)
  let totalTravelTerra: number = $derived.by<number>(() =>
    ship ? (ship.speedFraction > 0 ? (ship.starDistanceLy ?? (getStarById(ship.starId)?.distanceLy ?? 0)) / ship.speedFraction : Infinity) : 0
  );
  // Count-up style: arrival progress (elapsed toward arrival)
  let arrivalElapsedProgress: number = $derived.by<number>(() => (metrics ? Math.min(metrics.timeTerraYears, totalTravelTerra) : 0));
  // Count-up style: confirmation progress (elapsed toward confirmation)
  let totalConfirmTerra: number = $derived.by<number>(() => (ship ? totalTravelTerra + (ship.starDistanceLy ?? (getStarById(ship.starId)?.distanceLy ?? 0)) : 0));
  let confirmElapsedTerra: number = $derived.by<number>(() => (metrics ? Math.min(metrics.timeTerraYears, totalConfirmTerra) : 0));

  function formatPercent(frac: number) {
    // show percentage with 3 significant digits
    const pct = frac * 100;
    return `${Number(pct.toPrecision(3))}% c`;
  }

  function formatYears(y: number) {
    if (!isFinite(y)) return '—';
    if (y < 1000) return `${y.toFixed(2)} yr`;
    if (y < 1_000_000) return `${(y / 1000).toFixed(2)} kyr`;
    return `${(y / 1_000_000).toFixed(2)} Myr`;
  }

  function yearsToDays(y: number) {
    if (!isFinite(y)) return '—';
    const days = Math.round(y * 365.25);
    return `${days.toLocaleString()} days`;
  }

  function formatLy(v: number) {
    return `${v.toFixed(4)} ly`;
  }

  function formatGamma(g: number) {
    return g.toFixed(4);
  }
</script>

{#if ship}
  <div class="p-3 bg-gray-900 rounded text-sm text-gray-200">
    <h3 class="font-semibold text-white">{ship.name}</h3>
    <div class="mt-2 space-y-1">
      <div>Destination: {getStarById(ship.starId)?.name}</div>
      <div>Speed: {formatPercent(ship.speedFraction)}</div>
      {#if metrics}
        <div>Time elapsed (Earth): {formatYears(displayTimeTerra)} <span class="text-gray-400">({yearsToDays(displayTimeTerra)})</span></div>
        <div>Time elapsed (Ship): {formatYears(displayTimeShip)} <span class="text-gray-400">({yearsToDays(displayTimeShip)})</span></div>
        <div>Distance covered: {formatLy(metrics.distanceCoveredLy)}</div>
        <div>Distance remaining: {formatLy(metrics.distanceRemainingLy)}</div>
        <div>Lorentz γ: {formatGamma(metrics.lorentz)}</div>
        <div>Arrival progress (Earth): {formatYears(arrivalElapsedProgress)} / {formatYears(totalTravelTerra)}</div>
        <div>Confirmation progress: {formatYears(confirmElapsedTerra)} / {formatYears(totalConfirmTerra)}</div>
      {/if}
    </div>
  </div>
{/if}

<script lang="ts">
  import { selectedShipId, ships, simTime } from '$lib/stores';
  import { STARS, getStarById } from '$lib/stars';
  import { shipMetrics, properTimeFactor } from '$lib/relativity';

  // Use Svelte auto-subscription for stores
  $: ship = $selectedShipId ? $ships.find((s) => s.id === $selectedShipId) : null;
  $: metrics = ship ? shipMetrics(ship, getStarById(ship.starId)?.distanceLy ?? 0, $simTime) : null;
  // Clamp displayed elapsed times to arrival so they stop increasing after arrival
  $: tauFactor = ship ? properTimeFactor(ship.speedFraction) : 1;
  $: arrivalElapsedTerra = ship && metrics ? Math.max(0, (metrics.timeOfArrivalTerra - ship.startTime)) : 0;
  $: displayTimeTerra = ship && metrics ? Math.min(metrics.timeTerraYears, arrivalElapsedTerra) : 0;
  $: displayTimeShip = ship && metrics ? Math.min(metrics.timeShipYears, arrivalElapsedTerra * tauFactor) : 0;

  function formatPercent(frac: number) {
    // show percentage with 3 significant digits
    const pct = frac * 100;
    return `${Number(pct.toPrecision(3))}% c`;
  }

  function formatYears(y: number) {
    if (!isFinite(y)) return '—';
    if (y < 1000) return `${y.toFixed(3)} yr`;
    if (y < 1_000_000) return `${(y / 1000).toFixed(3)} kyr`;
    return `${(y / 1_000_000).toFixed(3)} Myr`;
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
        <div>Arrival (Earth time): {formatYears(metrics.timeOfArrivalTerra)}</div>
        <div>Confirmation time: {formatYears(metrics.timeOfConfirmationTerra)}</div>
      {/if}
    </div>
  </div>
{/if}

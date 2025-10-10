<script lang="ts">
  import { selectedShipId, ships } from '$lib/stores/ships';
  import { simTime } from '$lib/stores/simulation';
  import { getStarById } from '$lib/stars';
  import { shipMetrics, properTimeFactor } from '$lib/utils';
  import type { ShipParams } from '$lib/types';

  // Use Svelte 5 runes ($derived.by) with explicit types
  let ship: ShipParams | null = $derived.by<ShipParams | null>(() =>
    $selectedShipId ? ($ships.find((s) => s.id === $selectedShipId) ?? null) : null
  );

  let metrics: ReturnType<typeof shipMetrics> | null = $derived.by<ReturnType<
    typeof shipMetrics
  > | null>(() =>
    ship
      ? shipMetrics(
          ship,
          ship.starDistanceLy ?? getStarById(ship.starId)?.distanceLy ?? 0,
          $simTime
        )
      : null
  );

  // Clamp displayed elapsed times to arrival so they stop increasing after arrival
  let tauFactor: number = $derived.by<number>(() =>
    ship ? properTimeFactor(ship.speedFraction) : 1
  );

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
    ship
      ? ship.speedFraction > 0
        ? (ship.starDistanceLy ?? getStarById(ship.starId)?.distanceLy ?? 0) / ship.speedFraction
        : Infinity
      : 0
  );
  // Count-up style: arrival progress (elapsed toward arrival)
  let arrivalElapsedProgress: number = $derived.by<number>(() =>
    metrics ? Math.min(metrics.timeTerraYears, totalTravelTerra) : 0
  );
  // Count-up style: confirmation progress (elapsed toward confirmation)
  let totalConfirmTerra: number = $derived.by<number>(() =>
    ship ? totalTravelTerra + (ship.starDistanceLy ?? getStarById(ship.starId)?.distanceLy ?? 0) : 0
  );
  let confirmElapsedTerra: number = $derived.by<number>(() =>
    metrics ? Math.min(metrics.timeTerraYears, totalConfirmTerra) : 0
  );

  function formatPercent(frac: number) {
    // show percentage with 3 decimal places without leading zero
    const pct = frac * 100;
    return `${pct.toFixed(3)}% c`;
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
  <div class="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden">
    <!-- Header -->
    <div class="bg-gray-800 px-4 py-3 border-b border-gray-700">
      <h3 class="font-bold text-white text-lg">{ship.name}</h3>
    </div>

    <div class="p-4 space-y-4">
      <!-- Mission Info -->
      <div class="space-y-2">
        <h4 class="text-sm font-semibold text-blue-400 uppercase tracking-wide">Mission</h4>
        <div class="grid grid-cols-1 gap-2">
          <div class="flex justify-between items-center py-2 px-3 bg-gray-800 rounded-lg">
            <span class="text-gray-300">Destination</span>
            <span class="text-white font-medium">{getStarById(ship.starId)?.name}</span>
          </div>
          <div class="flex justify-between items-center py-2 px-3 bg-gray-800 rounded-lg">
            <span class="text-gray-300">Speed</span>
            <span class="text-green-400 font-mono font-medium">{formatPercent(ship.speedFraction)}</span>
          </div>
        </div>
      </div>

      {#if metrics}
        <!-- Progress Section -->
        <div class="space-y-2">
          <h4 class="text-sm font-semibold text-gray-300 uppercase tracking-wide">Progress</h4>
          <div class="space-y-3">
            <!-- Distance Progress Bar -->
            <div class="space-y-1">
              <div class="flex justify-between text-xs text-gray-400">
                <span>Distance</span>
                <span>{formatLy(metrics.distanceCoveredLy)} / {formatLy(ship.starDistanceLy)}</span>
              </div>
              <div class="w-full bg-gray-700 rounded-full h-2">
                <div 
                  class="bg-gray-400 h-2 rounded-full transition-all duration-300"
                  style="width: {(metrics.distanceCoveredLy / ship.starDistanceLy * 100).toFixed(1)}%"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Time Metrics -->
        <div class="space-y-2">
          <h4 class="text-sm font-semibold text-gray-300 uppercase tracking-wide">Time</h4>
          <div class="grid grid-cols-2 gap-2">
            <div class="bg-gray-800 rounded-lg p-3 text-center">
              <div class="text-xs text-gray-400 mb-1">Earth Time</div>
              <div class="text-white font-bold">{formatYears(displayTimeTerra)}</div>
              <div class="text-xs text-gray-500">{yearsToDays(displayTimeTerra)}</div>
            </div>
            <div class="bg-gray-800 rounded-lg p-3 text-center">
              <div class="text-xs text-gray-400 mb-1">Ship Time</div>
              <div class="text-gray-200 font-bold">{formatYears(displayTimeShip)}</div>
              <div class="text-xs text-gray-500">{yearsToDays(displayTimeShip)}</div>
            </div>
          </div>
        </div>

        <!-- Physics -->
        <div class="space-y-2">
          <h4 class="text-sm font-semibold text-gray-300 uppercase tracking-wide">Physics</h4>
          <div class="grid grid-cols-2 gap-2">
            <div class="bg-gray-800 rounded-lg p-3 text-center">
              <div class="text-xs text-gray-400 mb-1">Distance Remaining</div>
              <div class="text-white font-bold">{formatLy(metrics.distanceRemainingLy)}</div>
            </div>
            <div class="bg-gray-800 rounded-lg p-3 text-center">
              <div class="text-xs text-gray-400 mb-1">Lorentz Factor</div>
              <div class="text-gray-200 font-bold">{formatGamma(metrics.lorentz)}</div>
            </div>
          </div>
        </div>

        <!-- Confirmation -->
        <div class="space-y-2">
          <h4 class="text-sm font-semibold text-gray-300 uppercase tracking-wide">Confirmation</h4>
          <div class="bg-gray-800 rounded-lg p-3">
            <div class="flex justify-between text-sm">
              <span class="text-gray-300">Signal Progress</span>
              <span class="text-white">{formatYears(confirmElapsedTerra)} / {formatYears(totalConfirmTerra)}</span>
            </div>
            <div class="w-full bg-gray-700 rounded-full h-1.5 mt-2">
              <div 
                class="bg-gray-500 h-1.5 rounded-full transition-all duration-300"
                style="width: {(confirmElapsedTerra / totalConfirmTerra * 100).toFixed(1)}%"
              ></div>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

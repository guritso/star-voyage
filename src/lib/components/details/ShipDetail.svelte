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
                ? (ship.starDistanceLy ?? getStarById(ship.starId)?.distanceLy ?? 0) /
                  ship.speedFraction
                : Infinity
            : 0
    );
    // Count-up style: arrival progress (elapsed toward arrival)
    let arrivalElapsedProgress: number = $derived.by<number>(() =>
        metrics ? Math.min(metrics.timeTerraYears, totalTravelTerra) : 0
    );
    // Count-up style: confirmation progress (elapsed toward confirmation)
    let totalConfirmTerra: number = $derived.by<number>(() =>
        ship
            ? totalTravelTerra + (ship.starDistanceLy ?? getStarById(ship.starId)?.distanceLy ?? 0)
            : 0
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
    <div class="bg-gray-900/90 rounded p-3 max-w-sm">
        <h3 class="text-white text-sm mb-3">{ship.name}</h3>

        <div class="space-y-2 text-xs">
            <div class="flex justify-between">
                <span class="text-gray-400">Destination</span>
                <span class="text-white">{getStarById(ship.starId)?.name}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-400">Speed</span>
                <span class="text-white">{formatPercent(ship.speedFraction)}</span>
            </div>

            {#if metrics}
                <div class="pt-2 border-t border-gray-700">
                    <div class="flex justify-between mb-1">
                        <span class="text-gray-400 mr-2">Distance</span>
                        <span class="text-white">{formatLy(metrics.distanceCoveredLy)} / {formatLy(ship.starDistanceLy)}</span>
                    </div>
                    <div class="w-full bg-gray-700 rounded-full h-1">
                        <div
                            class="bg-gray-400 h-1 rounded-full"
                            style="width: {((metrics.distanceCoveredLy / ship.starDistanceLy) * 100).toFixed(1)}%"
                        ></div>
                    </div>
                </div>

                <div class="flex justify-between">
                    <span class="text-gray-400">Earth time</span>
                    <span class="text-white">{formatYears(displayTimeTerra)}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-400">Ship time</span>
                    <span class="text-white">{formatYears(displayTimeShip)}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-400">Remaining</span>
                    <span class="text-white">{formatLy(metrics.distanceRemainingLy)}</span>
                </div>
            {/if}
        </div>
    </div>
{/if}

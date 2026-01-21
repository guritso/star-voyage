<script lang="ts">
    import { starsList, getStarById } from '$lib/stars';
    import { ships, selectedShipId, targetStarId } from '$lib/stores/ships';
    import { simTime } from '$lib/stores/simulation';
    import { zoomToStarId } from '$lib/stores/stars';
    import { get } from 'svelte/store';
    import type { ShipParams, Star } from '$lib/types';

    let name = $state('');
    let searchQuery = $state('');
    // selected star id for new ships
    let starId = $state<string>('');
    // ensure starId is valid when starsList changes
    $effect(() => {
        const list = $starsList as Array<{ id: string }>;
        if (!list || list.length === 0) return;
        if (!starId || !list.some((s) => s.id === starId)) {
            if (starId && list.length > 0) {
                starId = list[0].id;
            } else {
                starId = '';
            }
        }
    });

    // keep local starId in sync with targetStarId ONLY when targetStarId changes
    let prevTargetId: string | null = $state(null);
    $effect(() => {
        const t = $targetStarId;
        if (t !== prevTargetId) {
            prevTargetId = t;
            if (t) {
                const list = $starsList as Array<{ id: string }>;
                if (list && list.some((s) => s.id === t)) {
                    starId = t;
                }
            }
        }
    });

    // when user changes the dropdown, propagate selection to targetStarId (without loops)
    $effect(() => {
        if (starId && $targetStarId !== starId) {
            targetStarId.set(starId);
        }
    });
    let speedPercent = $state(50); // percentage of c (0-99.999)

    function addShip() {
        if (!starId) return;
        const speedFraction = speedPercent / 100; // convert percentage to fraction
        if (speedFraction <= 0 || speedFraction >= 1) {
            alert('Speed must be between 0.01% and 99.999% of c');
            return;
        }
        const id = `ship-${Date.now()}`;
        const list = $starsList as Array<{ id: string; distanceLy: number }>;
        const dest = list.find((s) => s.id === starId);
        const ship: ShipParams = {
            id,
            name: name || `Ship ${get(ships).length + 1}`,
            starId,
            starDistanceLy: dest ? dest.distanceLy : 0,
            speedFraction: speedFraction,
            startTime: getTime(),
        };
        ships.update((s) => [...s, ship]);
        name = '';
    }

    function removeShip(id: string) {
        ships.update((s) => s.filter((x) => x.id !== id));
        selectedShipId.set(null);
    }

    let getTime = () => get(simTime);

    // Filter stars based on search query
    let filteredStars = $state<Star[]>([]);

    $effect(() => {
        filteredStars = $starsList.filter((star: Star) =>
            star.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    });

    // Function to focus on a star
    function focusOnStar(starId: string) {
        zoomToStarId.set(starId);
    }
</script>

<div class="space-y-4">
    <!-- Search Section -->
    <div class="bg-gray-900/90 rounded p-3">
        <h3 class="text-white text-sm mb-2">Search Stars</h3>
        <input
            placeholder="Type star name..."
            bind:value={searchQuery}
            class="w-full p-2 rounded bg-gray-800 text-white placeholder-gray-500 text-sm mb-2"
        />
        {#if searchQuery && filteredStars.length > 0}
            <div class="max-h-80 overflow-y-auto space-y-1">
                {#each filteredStars.slice(0, 4) as star}
                    <div class="flex items-center justify-between bg-gray-800 p-2 rounded">
                        <div class="text-sm">
                            <div class="text-white">{star.name}</div>
                            <div class="text-xs text-gray-500">{star.distanceLy} ly</div>
                        </div>
                        <button
                            class="text-xs px-2 py-1 bg-gray-700 rounded text-white"
                            onclick={() => focusOnStar(star.id)}
                        >
                            Focus
                        </button>
                    </div>
                {/each}
            </div>
        {:else if searchQuery && filteredStars.length === 0}
            <div class="text-xs text-gray-500 text-center py-2">
                No stars found
            </div>
        {/if}
    </div>

    <!-- Add Ship Section -->
    <div class="bg-gray-900/90 rounded p-3">
        <h3 class="text-white text-sm mb-2">Add Ship</h3>
        <div class="space-y-2">
            <input
                placeholder="Name (optional)"
                id="ship-name"
                bind:value={name}
                class="w-full p-2 rounded bg-gray-800 text-white placeholder-gray-500 text-sm"
            />

            <select
                bind:value={starId}
                id="ship-star"
                class="custom-scrollbar w-full p-2 rounded bg-gray-800 text-white text-sm"
            >
                {#each searchQuery ? filteredStars : $starsList as s}
                    <option value={s.id}>{s.name} — {s.distanceLy} ly</option>
                {/each}
            </select>

            <input
                id="ship-speed"
                type="number"
                min="0.001"
                max="99.999"
                step="1"
                bind:value={speedPercent}
                placeholder="Speed (% of c)"
                class="w-full p-2 rounded bg-gray-800 text-white placeholder-gray-500 text-sm"
            />

            <button
                class="w-full bg-gray-700 text-white p-2 rounded text-sm"
                onclick={addShip}
            >
                Add Ship
            </button>
        </div>
    </div>

    <!-- Active Ships Section -->
    <div class="bg-gray-900/90 rounded p-3">
        <h3 class="text-white text-sm mb-2">Active Ships</h3>
        {#if $ships.length > 0}
            <div class="space-y-1">
                {#each $ships as s}
                    <div class="flex items-center justify-between bg-gray-800 p-2 rounded">
                        <div class="text-xs">
                            <div class="text-white">
                                {s.name || `Ship ${$ships.indexOf(s) + 1}`}
                            </div>
                            <div class="text-gray-500">
                                to {getStarById(s.starId)?.name || s.starId} @ {s.speedFraction * 100}% c
                            </div>
                        </div>
                        <div class="flex gap-1">
                            <button
                                class="text-xs px-2 py-1 bg-gray-700 rounded text-white"
                                onclick={() => selectedShipId.set(s.id)}
                            >
                                Focus
                            </button>
                            <button
                                class="text-xs px-2 py-1 bg-red-700 rounded text-white"
                                onclick={() => removeShip(s.id)}
                            >
                                ×
                            </button>
                        </div>
                    </div>
                {/each}
            </div>
        {:else}
            <div class="text-xs text-gray-500 text-center py-2">
                No active ships
            </div>
        {/if}
    </div>
</div>

<style>
    .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
    }

    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #4b5563;
        border-radius: 3px;
    }

    button {
        cursor: pointer;
    }
</style>

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

<div class="space-y-3">
    <!-- Search Section -->
    <div
        class="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden"
    >
        <div class="bg-gray-800 px-3 py-2 border-b border-gray-700">
            <h3 class="font-semibold text-white text-sm">Search Stars</h3>
        </div>
        <div class="p-3 space-y-2">
            <input
                placeholder="Type star name..."
                bind:value={searchQuery}
                class="w-full p-2 rounded bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:border-gray-500 focus:outline-none text-sm"
            />
            {#if searchQuery && filteredStars.length > 0}
                <div class="max-h-80 overflow-y-auto space-y-1">
                    {#each filteredStars.slice(0, 4) as star}
                        <div
                            class="flex items-center justify-between bg-gray-800 p-2 rounded border border-gray-700"
                        >
                            <div class="text-gray-200 text-sm">
                                <div class="font-medium">{star.name}</div>
                                <div class="text-xs text-gray-400">{star.distanceLy} ly</div>
                            </div>
                            <button
                                class="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white cursor-pointer transition-colors"
                                onclick={() => focusOnStar(star.id)}
                            >
                                Focus
                            </button>
                        </div>
                    {/each}
                    {#if filteredStars.length > 5}
                        <div class="text-xs text-gray-400 text-center py-1">
                            Showing first 5 of {filteredStars.length} results
                        </div>
                    {/if}
                </div>
            {:else if searchQuery && filteredStars.length === 0}
                <div
                    class="text-xs text-gray-400 text-center py-2 bg-gray-800 rounded border border-gray-700"
                >
                    No stars found matching "{searchQuery}"
                </div>
            {/if}
        </div>
    </div>

    <!-- Add Ship Section -->
    <div
        class="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden"
    >
        <div class="bg-gray-800 px-3 py-2 border-b border-gray-700">
            <h3 class="font-semibold text-white text-sm">Add Ship</h3>
        </div>
        <div class="p-3 space-y-2">
            <div>
                <label
                    for="ship-name"
                    class="text-xs font-semibold text-gray-300 uppercase tracking-wide"
                    >Ship Name</label
                >
                <input
                    placeholder="Optional name"
                    id="ship-name"
                    bind:value={name}
                    class="w-full p-2 rounded bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:border-gray-500 focus:outline-none text-sm"
                />
            </div>

            <div>
                <label
                    for="ship-star"
                    class="text-xs font-semibold text-gray-300 uppercase tracking-wide"
                    >Destination</label
                >
                <select
                    bind:value={starId}
                    id="ship-star"
                    class="custom-scrollbar w-full p-2 rounded bg-gray-800 text-white cursor-pointer border border-gray-700 focus:border-gray-500 focus:outline-none text-sm"
                >
                    {#each searchQuery ? filteredStars : $starsList as s}
                        <option value={s.id}>{s.name} — {s.distanceLy} ly</option>
                    {/each}
                </select>
            </div>

            <div>
                <label
                    for="ship-speed"
                    class="text-xs font-semibold text-gray-300 uppercase tracking-wide"
                    >Speed (% of c)</label
                >
                <input
                    id="ship-speed"
                    type="number"
                    min="0.001"
                    max="99.999"
                    step="1"
                    bind:value={speedPercent}
                    class="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-gray-500 focus:outline-none text-sm"
                />
            </div>

            <button
                class="w-full bg-gray-700 hover:bg-gray-600 text-white p-2 rounded font-medium transition-colors text-sm"
                onclick={addShip}
            >
                Add Ship
            </button>
        </div>
    </div>

    <!-- Active Ships Section -->
    <div
        class="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden"
    >
        <div class="bg-gray-800 px-3 py-2 border-b border-gray-700">
            <h3 class="font-semibold text-white text-sm">Active Ships</h3>
        </div>
        <div class="p-3">
            {#if $ships.length > 0}
                <div class="space-y-1">
                    {#each $ships as s}
                        <div
                            class="flex items-center justify-between bg-gray-800 p-2 rounded border border-gray-700"
                        >
                            <div class="text-xs">
                                <div class="text-gray-200 font-medium">
                                    {s.name || `Ship ${$ships.indexOf(s) + 1}`}
                                </div>
                                <div class="text-xs text-gray-400">
                                    to {getStarById(s.starId)?.name || s.starId} @ {s.speedFraction *
                                        100}% c
                                </div>
                            </div>
                            <div class="flex gap-1">
                                <button
                                    class="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white cursor-pointer transition-colors"
                                    onclick={() => selectedShipId.set(s.id)}
                                >
                                    Focus
                                </button>
                                <button
                                    class="text-xs px-2 py-1 bg-red-700 hover:bg-red-600 rounded text-white cursor-pointer transition-colors"
                                    onclick={() => removeShip(s.id)}
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    {/each}
                </div>
            {:else}
                <div
                    class="text-xs text-gray-400 text-center py-2 bg-gray-800 rounded border border-gray-700"
                >
                    No active ships
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
    }

    .custom-scrollbar::-webkit-scrollbar-track {
        background: #1e293b;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #4b5563;
        border-radius: 4px;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #6b7280;
    }

    button {
        cursor: pointer;
    }

    button:hover {
        opacity: 0.9;
    }

    button:active {
        opacity: 0.8;
    }
</style>

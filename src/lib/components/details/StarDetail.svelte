<script lang="ts">
    import type { Star } from '$lib/types';
    import { selectedStarId } from '$lib/stores/stars';
    import { getStarById } from '$lib/stars';
    // runes-based derived with explicit typing
    let star: Star | null = $derived.by<Star | null>(() =>
        $selectedStarId ? (getStarById($selectedStarId) ?? null) : null
    );
</script>

{#if star}
    <div class="bg-gray-900/90 rounded p-3 max-w-sm">
        <h3 class="text-white text-sm mb-3">{star.name}</h3>

        <div class="space-y-3 text-xs">
            <div class="flex justify-between gap-2">
                <span class="text-gray-400">Distance</span>
                <span class="text-white">{star.distanceLy} ly</span>
            </div>

            {#if star.constellation}
                <div class="flex justify-between gap-2">
                    <span class="text-gray-400">Constellation</span>
                    <span class="text-white">{star.constellation}</span>
                </div>
            {/if}

            {#if star.magnitude}
                <div class="flex justify-between gap-2">
                    <span class="text-gray-400">Magnitude</span>
                    <span class="text-white">{star.magnitude}</span>
                </div>
            {/if}

            <div class="flex justify-between gap-2">
                <span class="text-gray-400">Light time</span>
                <span class="text-white">{star.distanceLy} years</span>
            </div>

            {#if star.description}
                <div class="pt-2 border-t border-gray-700">
                    <p class="text-gray-300 leading-relaxed">{star.description}</p>
                </div>
            {/if}
        </div>
    </div>
{/if}

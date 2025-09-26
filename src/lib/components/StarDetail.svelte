<script lang="ts">
  import type { Star } from '$lib/stars';
  import { selectedStarId } from '$lib/stores';
  import { STARS, getStarById } from '$lib/stars';
  // runes-based derived with explicit typing
  let star: Star | null = $derived.by<Star | null>(() => ($selectedStarId ? getStarById($selectedStarId) ?? null : null));
</script>

{#if star}
  <div class="p-3 bg-gray-900 rounded text-sm text-gray-200">
    <h3 class="font-semibold text-white">{star.name}</h3>
    <div class="mt-2 space-y-1">
      <div>Distance: {star.distanceLy} ly</div>
      {#if star.constellation}
        <div>Constellation: {star.constellation}</div>
      {/if}
      {#if star.description}
        <div class="text-xs text-gray-400">{star.description}</div>
      {/if}
    </div>
  </div>
{/if}

<script lang="ts">
  import type { Star } from '$lib/stars';
  import { selectedStarId } from '$lib/stores';
  import { STARS, getStarById } from '$lib/stars';
  // reactive derived
  $: star = $selectedStarId ? getStarById($selectedStarId) : null;
</script>

{#if star}
  <div class="p-3 bg-gray-900 rounded text-sm text-gray-200">
    <h3 class="font-semibold text-white">{star.name}</h3>
    <div class="mt-2 space-y-1">
      <div>Distance: {star.distanceLy} ly</div>
      {#if star.description}
        <div class="text-xs text-gray-400">{star.description}</div>
      {/if}
    </div>
  </div>
{/if}

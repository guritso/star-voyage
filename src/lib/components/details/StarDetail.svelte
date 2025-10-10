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
  <div class="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden">
    <!-- Header -->
    <div class="bg-gray-800 px-4 py-3 border-b border-gray-700">
      <h3 class="font-bold text-white text-lg">{star.name}</h3>
    </div>

    <div class="p-4 space-y-4">
      <!-- Basic Info -->
      <div class="space-y-2">
        <h4 class="text-sm font-semibold text-gray-300 uppercase tracking-wide">Basic Info</h4>
        <div class="grid grid-cols-1 gap-2">
          <div class="flex justify-between items-center py-2 px-3 bg-gray-800 rounded-lg">
            <span class="text-gray-300">Distance from Sun</span>
            <span class="text-white font-bold text-lg">{star.distanceLy} ly</span>
          </div>
          {#if star.constellation}
            <div class="flex justify-between items-center py-2 px-3 bg-gray-800 rounded-lg">
              <span class="text-gray-300">Constellation</span>
              <span class="text-white font-medium">{star.constellation}</span>
            </div>
          {/if}
          {#if star.magnitude}
            <div class="flex justify-between items-center py-2 px-3 bg-gray-800 rounded-lg">
              <span class="text-gray-300">Apparent Magnitude</span>
              <span class="text-gray-200 font-mono font-medium">{star.magnitude}</span>
            </div>
          {/if}
        </div>
      </div>

      <!-- Travel Info -->
      <div class="space-y-2">
        <h4 class="text-sm font-semibold text-gray-300 uppercase tracking-wide">Travel Information</h4>
        <div class="grid grid-cols-2 gap-2">
          <div class="bg-gray-800 rounded-lg p-3 text-center">
            <div class="text-xs text-gray-400 mb-1">Light Travel Time</div>
            <div class="text-white font-bold">{star.distanceLy} years</div>
            <div class="text-xs text-gray-500">One-way signal</div>
          </div>
          <div class="bg-gray-800 rounded-lg p-3 text-center">
            <div class="text-xs text-gray-400 mb-1">Round Trip</div>
            <div class="text-gray-200 font-bold">{star.distanceLy * 2} years</div>
            <div class="text-xs text-gray-500">Signal confirmation</div>
          </div>
        </div>
      </div>

      <!-- Description -->
      {#if star.description}
        <div class="space-y-2">
          <h4 class="text-sm font-semibold text-gray-300 uppercase tracking-wide">Description</h4>
          <div class="bg-gray-800 rounded-lg p-3">
            <p class="text-gray-300 text-sm leading-relaxed">{star.description}</p>
          </div>
        </div>
      {/if}

      <!-- Coordinates (if available) -->
      {#if star.raHours || star.decDeg}
        <div class="space-y-2">
          <h4 class="text-sm font-semibold text-gray-300 uppercase tracking-wide">Coordinates</h4>
          <div class="grid grid-cols-2 gap-2">
            {#if star.raHours}
              <div class="bg-gray-800 rounded-lg p-3 text-center">
                <div class="text-xs text-gray-400 mb-1">Right Ascension</div>
                <div class="text-white font-mono font-medium">{star.raHours.toFixed(2)}h</div>
              </div>
            {/if}
            {#if star.decDeg}
              <div class="bg-gray-800 rounded-lg p-3 text-center">
                <div class="text-xs text-gray-400 mb-1">Declination</div>
                <div class="text-gray-200 font-mono font-medium">{star.decDeg.toFixed(2)}°</div>
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

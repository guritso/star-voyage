<script lang="ts">
  import { STARS } from '$lib/stars';
  import { ships, selectedShipId, targetStarId } from '$lib/stores';
  import { get } from 'svelte/store';
  import type { ShipParams } from '$lib/relativity';

  let name = $state('');
  // initialize select to store-backed target so clicks on canvas can prefill
  let starId = $state(STARS[0].id);

  // keep local starId in sync with the global targetStarId
  $effect(() => {
    if ($targetStarId && $targetStarId !== starId) {
      starId = $targetStarId;
    }
  });
  let speed = $state(0.5); // fraction of c

  function addShip() {
    if (!starId) return;
    if (speed <= 0 || speed >= 1) {
      alert('Speed must be between 0 and 1 (fraction of c, <1)');
      return;
    }
    const id = `ship-${Date.now()}`;
    const ship: ShipParams = {
      id,
      name: name || `Ship ${get(ships).length + 1}`,
      starId,
      speedFraction: speed,
      startTime: getTime()
    };
    ships.update((s) => [...s, ship]);
    name = '';
  }

  function removeShip(id: string) {
    ships.update((s) => s.filter((x) => x.id !== id));
    selectedShipId.set(null);
  }
  import { simTime } from '$lib/stores';
  let getTime = () => get(simTime);
</script>

<div class="p-4 space-y-4">
      <div class="bg-gray-900 p-3 rounded">
        <h3 class="text-white font-semibold">Add Ship</h3>
        <div class="mt-2 flex gap-3">
          <!-- form on the left -->
          <div class="flex-1 flex flex-col gap-2">
            <input placeholder="Name (optional)" bind:value={name} class="p-2 rounded bg-gray-800 text-white" />
            <select bind:value={starId} class="p-2 rounded bg-gray-800 text-white">
              {#each STARS as s}
                <option value={s.id}>{s.name} — {s.distanceLy} ly</option>
              {/each}
            </select>
            <div>
              <label for="ship-speed" class="text-sm text-gray-300">Speed (fraction of c)</label>
              <input id="ship-speed" type="number" min="0.001" max="0.99999" step="0.001" bind:value={speed} class="w-full p-2 rounded bg-gray-800 text-white" />
            </div>
            <button class="mt-2 w-full bg-blue-600 text-white p-2 rounded" onclick={addShip}>Add Ship</button>

            <!-- star detail intentionally omitted here to avoid duplication; rendered in top-right area -->
          </div>
        </div>
      </div>

  <div class="bg-gray-900 p-3 rounded">
    <h3 class="text-white font-semibold">Active Ships</h3>
    <ul class="mt-2 space-y-2">
      {#each $ships as s}
        <li class="flex items-center justify-between bg-gray-800 p-2 rounded">
          <button type="button" class="text-left w-full cursor-pointer select-none hover:bg-gray-700/40 rounded px-1 py-0.5" onclick={() => selectedShipId.set(s.id)} title="Select and focus ship">
            <div class="text-white">{s.name}</div>
            <div class="text-xs text-gray-400">to {s.starId} @ {Math.round(s.speedFraction * 1000) / 10}% c</div>
          </button>
          <div class="flex gap-2">
            <button class="text-sm px-2 bg-blue-600 hover:bg-blue-500 rounded text-white" onclick={() => selectedShipId.set(s.id)}>Focus</button>
            <button class="text-sm px-2 bg-red-600 rounded text-white" onclick={() => removeShip(s.id)}>Remove</button>
          </div>
        </li>
      {/each}
    </ul>
  </div>
</div>

<script lang="ts">
  import { STARS } from '$lib/stars';
  import { ships, selectedShipId } from '$lib/stores';
  import { get } from 'svelte/store';
  import type { ShipParams } from '$lib/relativity';

  let name = '';
  let starId = STARS[0].id;
  let speed = 0.5; // fraction of c

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
    <div class="mt-2 flex flex-col gap-2">
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
      <button class="mt-2 w-full bg-blue-600 text-white p-2 rounded" on:click={addShip}>Add Ship</button>
    </div>
  </div>

  <div class="bg-gray-900 p-3 rounded">
    <h3 class="text-white font-semibold">Active Ships</h3>
    <ul class="mt-2 space-y-2">
      {#each $ships as s}
        <li class="flex items-center justify-between bg-gray-800 p-2 rounded">
          <div>
            <div class="text-white">{s.name}</div>
            <div class="text-xs text-gray-400">to {s.starId} @ {Math.round(s.speedFraction * 1000) / 10}% c</div>
          </div>
          <div class="flex gap-2">
            <button class="text-sm px-2 bg-red-600 rounded text-white" on:click={() => removeShip(s.id)}>Remove</button>
          </div>
        </li>
      {/each}
    </ul>
  </div>
</div>

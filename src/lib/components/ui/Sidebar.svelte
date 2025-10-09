<script lang="ts">
  import { starsList } from '$lib/stars';
  import { ships, selectedShipId, targetStarId } from '$lib/stores/ships';
  import { simTime } from '$lib/stores/simulation';
  import { get } from 'svelte/store';
  import type { ShipParams } from '$lib/types';

  let name = $state('');
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
</script>

<div class="space-y-4">
  <div class="bg-gray-900 p-3 rounded">
    <h3 class="text-white font-semibold">Add Ship</h3>
    <div class="mt-2 flex gap-3">
      <!-- form on the left -->
      <div class="flex-1 flex flex-col gap-2">
        <input
          placeholder="Name (optional)"
          id="ship-name"
          bind:value={name}
          class="p-2 rounded bg-gray-800 text-white"
        />
        <!-- source selector -->
        <!-- Local stars controls -->
        <div class="flex items-center gap-2 text-sm text-gray-300">
          <span>Stars:</span>
        </div>
        <div>
          <select
            bind:value={starId}
            id="ship-star"
            class="custom-scrollbar md:w-full p-2 rounded bg-gray-800 text-white cursor-pointer"
          >
            {#each $starsList as s}
              <option value={s.id}>{s.name} — {s.distanceLy} ly</option>
            {/each}
          </select>
        </div>
        <div>
          <label for="ship-speed" class="text-sm text-gray-300">Speed (% of c)</label>
          <input
            id="ship-speed"
            type="number"
            min="0.001"
            max="99.999"
            step="1"
            bind:value={speedPercent}
            class="w-full p-2 rounded bg-gray-800 text-white"
          />
        </div>
        <button class="mt-2 w-full bg-blue-600 text-white p-2 rounded" onclick={addShip}
          >Add Ship</button
        >

        <!-- star detail intentionally omitted here to avoid duplication; rendered in top-right area -->
      </div>
    </div>
  </div>

  <div class="bg-gray-900 p-3 rounded">
    <h3 class="text-white font-semibold">Active Ships</h3>
    <ul class="mt-2 space-y-2">
      {#each $ships as s}
        <li class="flex items-center justify-between bg-gray-800 p-2 rounded h-15">
          <div class="text-xs text-gray-400">
            to {s.starId} @ {s.speedFraction * 100}% c
          </div>
          <div class="flex gap-2">
            <button
              class="text-sm px-2 bg-blue-600 hover:bg-blue-500 rounded text-white cursor-pointer"
              onclick={() => selectedShipId.set(s.id)}>Focus</button
            >
            <button
              class="text-sm px-2 bg-red-600 rounded text-white cursor-pointer h-6"
              onclick={() => removeShip(s.id)}>Remove</button
            >
          </div>
        </li>
      {/each}
    </ul>
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

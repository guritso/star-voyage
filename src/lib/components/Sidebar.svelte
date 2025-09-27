<script lang="ts">
  import { starsList, resetApiStars, loadAllApiStars, apiLoading } from '$lib/stars';
  import { ships, selectedShipId, targetStarId } from '$lib/stores';
  import { get } from 'svelte/store';
  import type { ShipParams } from '$lib/relativity';

  let name = $state('');
  // selected star id for new ships
  let starId = $state<string>('');
  // ensure starId is valid when starsList changes
  $effect(() => {
    const list = $starsList as Array<{ id: string }>;
    if (!list || list.length === 0) return;
    if (!starId || !list.some((s) => s.id === starId)) {
      starId = list[0].id;
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
  let speed = $state(0.5); // fraction of c

  // UI helpers for API loading
  async function reloadApi() {
    await resetApiStars();
    await loadAllApiStars();
  }

  // Load local stars on component mount
  $effect(() => {
    loadAllApiStars();
  });

  function addShip() {
    if (!starId) return;
    if (speed <= 0 || speed >= 1) {
      alert('Speed must be between 0 and 1 (fraction of c, <1)');
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
            <!-- source selector -->
            <!-- Local stars controls -->
            <div class="flex items-center gap-2 text-sm text-gray-300">
              <span>Stars:</span>
              <button class="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-60" class:animate-pulse={$apiLoading} onclick={reloadApi} disabled={$apiLoading}>Reload</button>
            </div>
            <div>
            <select bind:value={starId} class="w-full p-2 rounded bg-gray-800 text-white">
              {#each $starsList as s}
                <option value={s.id}>{s.name} — {s.distanceLy} ly</option>
              {/each}
            </select>
            </div>
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

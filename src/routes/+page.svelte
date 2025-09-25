<script lang="ts">
  import SpaceCanvas from '$lib/components/SpaceCanvas.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Controls from '$lib/components/Controls.svelte';
  import ShipDetail from '$lib/components/ShipDetail.svelte';
  import { simTime } from '$lib/stores';
</script>

<div class="min-h-screen bg-gradient-to-b from-black to-gray-900 text-gray-100 p-4">
  <div class="max-w-7xl mx-auto grid grid-cols-4 gap-4">
    <div class="col-span-3">
      <div class="mb-4 flex items-center justify-between">
        <h1 class="text-2xl font-semibold">2D Relativistic Space Simulation</h1>
        <div class="text-sm">Sim time: {$simTime.toFixed(3)} yr</div>
      </div>
      <SpaceCanvas />
      <div class="mt-4">
        <Controls />
      </div>
    </div>

    <aside class="col-span-1">
      <Sidebar />
      <div class="mt-4">
        <ShipDetail />
      </div>
    </aside>
  </div>
</div>
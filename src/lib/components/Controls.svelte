<script lang="ts">
  import { simTime, simSpeed } from '$lib/stores';
  let playing = $state(false);
  let rafId: number | null = null;
  let last = 0;

  // local bound value for slider; keep store in sync
  let speedVal = $state(0.1);
  $effect(() => {
    simSpeed.set(speedVal);
  });

  function togglePlay() {
    playing = !playing;
  }

  function stepLoop(now: number) {
    if (!last) last = now;
    const dt = (now - last) / 1000;
    last = now;
    if (playing) {
      // advance sim time only while playing
      simTime.update((t) => t + dt * speedVal);
    }
    rafId = requestAnimationFrame(stepLoop);
  }

  // start/stop animation frame loop without lifecycle hooks
  $effect(() => {
    rafId = requestAnimationFrame(stepLoop);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      last = 0;
    };
  });


  function stepForward() {
    simTime.update((t) => t + 1);
  }

  function stepBackward() {
    simTime.update((t) => Math.max(0, t - 1));
  }

  function resetSim() {
    simTime.set(0);
  }
</script>

<div class="flex items-center gap-2">
  <div class="flex items-center gap-2">
    <!-- Compact control group: reset, decelerate, step back, play/pause, step forward, accelerate -->
    <button aria-label="Reset" title="Reset" class="w-10 h-10 flex items-center justify-center bg-gray-800 rounded" onclick={resetSim}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="text-white">
        <path d="M20 12a8 8 0 1 0-2.3 5.7" />
        <polyline points="20 12 20 6 14 6" />
      </svg>
    </button>
    <button aria-label="Decelerate" title="Decelerate" class="w-10 h-10 flex items-center justify-center bg-gray-800 rounded" onclick={() => { speedVal = Math.max(0.01, speedVal / 2); }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" class="text-white">
        <polygon points="15,6 7,12 15,18" />
        <polygon points="21,6 13,12 21,18" class="opacity-70" />
      </svg>
    </button>
    <button aria-label="Step Back" title="Step Back 1y" class="w-10 h-10 flex items-center justify-center bg-gray-800 rounded" onclick={stepBackward}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" class="text-white">
        <polygon points="16,6 8,12 16,18" />
        <rect x="18" y="6" width="2" height="12" />
      </svg>
    </button>
    <button aria-label="Play/Pause" title="Play/Pause" class="w-10 h-10 flex items-center justify-center bg-gray-800 rounded" onclick={togglePlay}>
      {#if playing}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" class="text-white">
          <rect x="6" y="5" width="3" height="14" />
          <rect x="15" y="5" width="3" height="14" />
        </svg>
      {:else}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" class="text-white">
          <polygon points="6,4 20,12 6,20" />
        </svg>
      {/if}
    </button>
    <button aria-label="Step Forward" title="Step Forward 1y" class="w-10 h-10 flex items-center justify-center bg-gray-800 rounded" onclick={stepForward}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" class="text-white">
        <polygon points="8,6 16,12 8,18" />
        <rect x="4" y="6" width="2" height="12" />
      </svg>
    </button>
    <button aria-label="Accelerate" title="Accelerate" class="w-10 h-10 flex items-center justify-center bg-gray-800 rounded" onclick={() => { speedVal = Math.min(1000, speedVal * 2); }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" class="text-white">
        <polygon points="9,6 17,12 9,18" />
        <polygon points="3,6 11,12 3,18" class="opacity-70" />
      </svg>
    </button>
  </div>
  <div class="ml-4 flex items-center gap-4">
    <div class="flex flex-col text-right">
      <div class="text-sm text-gray-300">Sim time</div>
      <div class="text-white text-sm">{$simTime.toFixed(3)} yr</div>
    </div>

    <div class="flex items-center gap-2">
      <label for="sim-speed" class="text-sm text-gray-300">Sim speed (years/sec)</label>
      <div class="flex items-center gap-2">
        <input id="sim-speed" type="range" min="0.01" max="1000" step="0.01" bind:value={speedVal} class="mx-2" />
      </div>
      <div class="text-sm text-gray-300">{speedVal.toFixed(2)} y/s</div>
    </div>
  </div>
</div>

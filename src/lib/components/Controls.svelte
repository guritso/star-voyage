<script lang="ts">
  import { simTime, simSpeed, tagShow } from '$lib/stores';
  import { RotateCcw, Play, Pause, SkipForward, SkipBack, FastForward, Rewind, Tag } from "lucide-svelte";

  let playing = $state(false);
  let tagStatus = $state(true);
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

  function toggleTag() {
    tagStatus = !tagStatus;
    tagShow.set(tagStatus);
  }
</script>

<!-- Mobile-first responsive controls -->
<div class="flex flex-col gap-3 md:flex-row md:items-center md:gap-2">
  <!-- Main controls - always visible -->
  <div class="flex items-center justify-center gap-2">
    <!-- Compact control group: reset, decelerate, step back, play/pause, step forward, accelerate -->
    <button aria-label="Reset" title="Reset" class="w-11 h-11 md:w-10 md:h-10 flex items-center justify-center bg-gray-800 rounded" onclick={resetSim}>
      <RotateCcw size="18" color="white"/>
    </button>
    <button aria-label="Decelerate" title="Decelerate" class="w-11 h-11 md:w-10 md:h-10 flex items-center justify-center bg-gray-800 rounded" onclick={() => { speedVal = Math.max(0.01, speedVal / 2); }}>
      <Rewind size="18" color="white"/>
    </button>
    <button aria-label="Step Back" title="Step Back 1y" class="w-11 h-11 md:w-10 md:h-10 flex items-center justify-center bg-gray-800 rounded" onclick={stepBackward}>
      <SkipBack size="18" color="white"/>
    </button>
    <button aria-label="Play/Pause" title="Play/Pause" class="w-11 h-11 md:w-10 md:h-10 flex items-center justify-center bg-gray-800 rounded" onclick={togglePlay}>
      {#if playing}
        <Pause size="20" color="white"/>
      {:else}
        <Play size="20" color="white"/>
      {/if}
    </button>
    <button aria-label="Step Forward" title="Step Forward 1y" class="w-11 h-11 md:w-10 md:h-10 flex items-center justify-center bg-gray-800 rounded" onclick={stepForward}>
      <SkipForward size="18" color="white"/>
    </button>
    <button aria-label="Accelerate" title="Accelerate" class="w-11 h-11 md:w-10 md:h-10 flex items-center justify-center bg-gray-800 rounded" onclick={() => { speedVal = Math.min(1000, speedVal * 2); }}>
      <FastForward size="18" color="white"/>
    </button>
  </div>

  <!-- Secondary controls - mobile responsive -->
  <div class="flex flex-col gap-2 md:flex-row md:items-center md:gap-4 md:ml-4">
    <!-- Sim time display - compact on mobile -->
    <div class="flex items-center justify-center gap-2 text-center bg-gray-800 p-2 rounded md:text-right">
      <div class="text-xs text-gray-300 md:text-sm">Time:</div>
      <div class="text-white text-xs md:text-sm">{$simTime.toFixed(1)}y</div>
      <div class="text-gray-400 text-xs md:block">({Math.round($simTime * 365.25)}days)</div>
    </div>

    <!-- Speed control - mobile friendly -->
    <div class="flex items-center gap-2 bg-gray-800 p-2 rounded">
      <label for="sim-speed" class="text-xs text-gray-300 md:text-sm">Speed:</label>
      <div class="flex items-center gap-2 min-w-0">
        <input id="sim-speed" type="range" min="0.01" max="1000" step="0.01" bind:value={speedVal} class="w-16 md:w-20 md:mx-2" />
        <div class="text-gray-400 text-xs whitespace-nowrap">{speedVal.toFixed(2)}y</div>
      </div>
    </div>

    <!-- Tag toggle -->
    <div class="flex justify-center">
      <button aria-label="tag-on/off" title="Tag on/off" class="w-11 h-11 md:w-10 md:h-10 flex items-center justify-center bg-gray-800 rounded" onclick={toggleTag}>
        {#if tagStatus}
          <Tag size="18" color="white"/>
        {:else}
          <Tag size="18" color="gray"/>
        {/if}
      </button>
    </div>
  </div>
</div>

<style>
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
  
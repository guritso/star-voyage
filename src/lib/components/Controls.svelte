<script lang="ts">
  import { simTime, simSpeed } from '$lib/stores';
  import { RotateCcw, Play, Pause, SkipForward, SkipBack, FastForward, Rewind} from "lucide-svelte";

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
      <RotateCcw size="18" color="white"/>
    </button>
    <button aria-label="Decelerate" title="Decelerate" class="w-10 h-10 flex items-center justify-center bg-gray-800 rounded" onclick={() => { speedVal = Math.max(0.01, speedVal / 2); }}>
      <Rewind size="18" color="white"/>
    </button>
    <button aria-label="Step Back" title="Step Back 1y" class="w-10 h-10 flex items-center justify-center bg-gray-800 rounded" onclick={stepBackward}>
      <SkipBack size="18" color="white"/>
    </button>
    <button aria-label="Play/Pause" title="Play/Pause" class="w-10 h-10 flex items-center justify-center bg-gray-800 rounded" onclick={togglePlay}>
      {#if playing}
        <Pause size="18" color="white"/>
      {:else}
        <Play size="18" color="white"/>
      {/if}
    </button>
    <button aria-label="Step Forward" title="Step Forward 1y" class="w-10 h-10 flex items-center justify-center bg-gray-800 rounded" onclick={stepForward}>
      <SkipForward size="18" color="white"/>
    </button>
    <button aria-label="Accelerate" title="Accelerate" class="w-10 h-10 flex items-center justify-center bg-gray-800 rounded" onclick={() => { speedVal = Math.min(1000, speedVal * 2); }}>
      <FastForward size="18" color="white"/>
    </button>
  </div>
  <div class="ml-4 flex items-center gap-4">
    <div class="flex items-center gap-2 text-right bg-gray-800 p-2 rounded">
      <div class="text-sm text-gray-300">Sim time:</div>
      <div class="text-white text-sm">{$simTime.toFixed(3)} yr</div>
    </div>

    <div class="flex items-center gap-2 bg-gray-800 p-2 rounded">
      <label for="sim-speed" class="text-sm text-gray-300">Sim speed (years/sec)</label>
      <div class="flex items-center gap-2">
        <input id="sim-speed" type="range" min="0.01" max="1000" step="0.01" bind:value={speedVal} class="mx-2" />
      </div>
      <div class="text-sm text-gray-300">{speedVal.toFixed(2)} y/s</div>
    </div>
  </div>
</div>

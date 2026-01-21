<script lang="ts">
    import { simTime, simSpeed } from '$lib/stores/simulation';
    import { tagShow } from '$lib/stores/ui';
    import {
        RotateCcw,
        Play,
        Pause,
        SkipForward,
        SkipBack,
        FastForward,
        Rewind,
        Tag,
    } from 'lucide-svelte';

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

<div class="flex flex-col gap-2 md:flex-row items-center md:gap-3">
    <div class="flex items-center gap-1">
        <button
            class="w-9 h-9 flex items-center justify-center bg-gray-800 rounded"
            onclick={resetSim}
        >
            <RotateCcw size="16" color="white" />
        </button>
        <button
            class="w-9 h-9 flex items-center justify-center bg-gray-800 rounded"
            onclick={() => {
                speedVal = Math.max(0.01, speedVal / 2);
            }}
        >
            <Rewind size="16" color="white" />
        </button>
        <button
            class="w-9 h-9 flex items-center justify-center bg-gray-800 rounded"
            onclick={stepBackward}
        >
            <SkipBack size="16" color="white" />
        </button>
        <button
            class="w-9 h-9 flex items-center justify-center bg-gray-800 rounded"
            onclick={togglePlay}
        >
            {#if playing}
                <Pause size="18" color="white" />
            {:else}
                <Play size="18" color="white" />
            {/if}
        </button>
        <button
            class="w-9 h-9 flex items-center justify-center bg-gray-800 rounded"
            onclick={stepForward}
        >
            <SkipForward size="16" color="white" />
        </button>
        <button
            class="w-9 h-9 flex items-center justify-center bg-gray-800 rounded"
            onclick={() => {
                speedVal = Math.min(1000, speedVal * 2);
            }}
        >
            <FastForward size="16" color="white" />
        </button>
    </div>

    <div class="flex items-center gap-3">
        <div class="h-9 flex items-center bg-gray-800 px-2 py-1 rounded text-xs text-white">
            Time: {$simTime.toFixed(1)}y
        </div>

        <div class="h-9 flex items-center gap-2 bg-gray-800 px-2 py-1 rounded">
            <span class="text-xs text-gray-400">Speed:</span>
            <input
                id="sim-speed"
                type="range"
                min="0.01"
                max="1000"
                step="0.01"
                bind:value={speedVal}
                class="w-16"
            />
            <span class="text-xs text-gray-400">{speedVal.toFixed(2)}y</span>
        </div>

        <button
            class="w-9 h-9 flex items-center justify-center bg-gray-800 rounded"
            onclick={toggleTag}
        >
            {#if tagStatus}
                <Tag size="16" color="white" />
            {:else}
                <Tag size="16" color="gray" />
            {/if}
        </button>
    </div>
</div>

<style>
    button {
        cursor: pointer;
    }
</style>

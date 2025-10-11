<script lang="ts">
    import SpaceCanvas from '$lib/components/canvas/SpaceCanvas.svelte';
    import { loadAllStars } from '$lib/stars';
    import { browser } from '$app/environment';

    // Load stars only in browser (client-side) to avoid SSR issues
    if (browser) {
        loadAllStars();
    }
</script>

<SpaceCanvas />

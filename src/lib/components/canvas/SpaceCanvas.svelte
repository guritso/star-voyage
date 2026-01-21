<script lang="ts">
    import { starsList } from '$lib/stars';
    import { ships, selectedShipId, targetStarId } from '$lib/stores/ships';
    import { simTime } from '$lib/stores/simulation';
    import { selectedStarId, zoomToStarId } from '$lib/stores/stars';
    import { tagShow } from '$lib/stores/ui';
    import { get } from 'svelte/store';
    import type { ShipParams } from '$lib/types';
    import { shipMetrics } from '$lib/utils';
    import Controls from '../ui/Controls.svelte';
    import Sidebar from '../ui/Sidebar.svelte';
    import ShipDetail from '../details/ShipDetail.svelte';
    import StarDetail from '../details/StarDetail.svelte';

    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;

    let w = 800;
    let h = 600;
    let dpr = 1;

    // visual scale: years -> pixels (1 ly = 60 px default)
    let scale = $state(1000);
    let maxZoomOut = 0.1;
    let maxZoomIn = 50000;
    let starsSize = $state(3);
    // panning offsets (in pixels)
    let panX = $state(0);
    let panY = $state(0);

    let cursorX = $state(0);
    let cursorY = $state(0);

    let centerX = $state(0);
    let centerY = $state(0);

    let isDragging = $state(false);
    let dragStartX = 0;
    let dragStartY = 0;
    let panStartX = 0;
    let panStartY = 0;
    let didDrag = false;

    // schedule redraw to avoid nested effect loops
    let drawScheduled = false;
    // transient guard to avoid auto-follow recentering during a manual zoom frame
    let suppressFollow = false;
    function scheduleDraw() {
        if (drawScheduled) return;
        drawScheduled = true;
        requestAnimationFrame(() => {
            drawScheduled = false;
            draw();
        });
    }

    // no manual subscriptions; use $effect
    let prevOverflow: string | null = null;
    let _resizeHandler: (() => void) | undefined;

    // bounding boxes for star click detection
    const starBounds = new Map<string, { x: number; y: number; r: number }>();

    // when true, canvas will automatically keep the selected ship centered
    let followShip = $state(false);
    let sidebarOpen = $state(false);

    function toCanvas(x: number, y: number) {
        return { x: w / 2 + x + panX, y: h / 2 + y + panY };
    }

    function hashToUnit(name: string): number {
        let h = 2166136261 >>> 0; // FNV-1a
        for (let i = 0; i < name.length; i++) {
            h ^= name.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return (h >>> 0) / 2 ** 32; // 0..1
    }

    function starPosition(
        star: { id: string; name: string; distanceLy: number; raHours?: number },
        index: number,
        total: number
    ) {
        // Option B: angle from RA if available; else stable hash or index/total
        let u = star.raHours != null && isFinite(star.raHours) ? (star.raHours % 24) / 24 : null;
        if (u == null) {
            // stable fallback using id/name
            u = hashToUnit(star.id || star.name);
        }
        // tiny jitter based on index to reduce perfect overlaps
        const jitter = (index % 7) * 0.0015; // ~0.1 degrees
        const angle = (u + jitter) * Math.PI * 2;
        // return in world units (light-years); scale applied later in draw
        const r = star.distanceLy;
        return { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
    }

    function draw() {
        if (!ctx) return;
        ctx.clearRect(0, 0, w, h);
        // background
        ctx.fillStyle = '#030314';
        ctx.fillRect(0, 0, w, h);
        // current stars from selected source
        const stars = get(starsList);
        // If we're following a ship, update pan so the ship remains centered
        if (followShip && !suppressFollow && $selectedShipId) {
            const shipList = get(ships);
            const ship = shipList.find((s: ShipParams) => s.id === $selectedShipId);
            if (ship) {
                const star = stars.find((s) => s.id === ship.starId);
                if (star) {
                    const starIdx = stars.findIndex((st) => st.id === star.id);
                    const spos = starPosition(star, Math.max(0, starIdx), stars.length);
                    const t = get(simTime);
                    const metrics = shipMetrics(ship, ship.starDistanceLy ?? star.distanceLy, t);
                    const fraction = Math.min(
                        1,
                        metrics.distanceCoveredLy / (ship.starDistanceLy ?? star.distanceLy)
                    );
                    const sx = 0 + (spos.x - 0) * fraction;
                    const sy = 0 + (spos.y - 0) * fraction;
                    // apply zoom same way draw does
                    const sxz = sx * (scale / 60);
                    const syz = sy * (scale / 60);
                    // center ship by setting pan so that toCanvas(sxz, syz) => center
                    const newPanX = -sxz;
                    const newPanY = -syz;
                    const EPS = 1e-3;
                    if (Math.abs(newPanX - panX) > EPS || Math.abs(newPanY - panY) > EPS) {
                        panX = newPanX;
                        panY = newPanY;
                    }
                } else {
                    // star gone, stop following
                    followShip = false;
                }
            } else {
                // ship not found, stop following
                followShip = false;
            }
        }

        // Sun at scene origin (apply pan/zoom via toCanvas)
        const sunPos = toCanvas(0, 0);
        ctx.fillStyle = '#FFD700'; // Golden yellow for the Sun
        ctx.beginPath();
        ctx.arc(sunPos.x, sunPos.y, starsSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgb(150, 150, 150)';
        ctx.font = `${starsSize + 8}px sans-serif`;
        if ($tagShow) {
            ctx.fillText('Sun', sunPos.x + 8, sunPos.y + 4);
        }

        // stars already fetched at the start of draw()
        stars.forEach((s, i) => {
            const pos = starPosition(s, i, stars.length);
            // apply zoom to positions
            const sposZoomed = { x: pos.x * (scale / 60), y: pos.y * (scale / 60) };
            const cpos = toCanvas(sposZoomed.x, sposZoomed.y);
            // default star style (star dot) - use color data if available
            ctx.fillStyle = s.color || 'rgb(255, 255, 255)';
            ctx.beginPath();
            ctx.arc(cpos.x, cpos.y, starsSize, 0, Math.PI * 2);
            ctx.fill();

            // if selected star, draw a subtle highlight behind the label so it doesn't overlap text
            if ($selectedStarId === s.id) {
                ctx.beginPath();
                // smaller radius so it doesn't reach the text
                const ringR = 5;
                ctx.arc(cpos.x, cpos.y, ringR, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(0, 195, 255, 0.65)';
                ctx.lineWidth = 2;
                // dashed ring for subtlety
                ctx.setLineDash([3, 2]);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            // label (draw after highlight so text stays on top)
            if ($tagShow) {
                ctx.fillStyle = 'rgb(150, 150, 150)';
                ctx.fillText(`${s.name} (${s.distanceLy} ly)`, cpos.x + 8, cpos.y + 4);
            }

            // record bounding circle for click detection (slightly larger than dot)
            starBounds.set(s.id, { x: cpos.x, y: cpos.y, r: 6 });
        });

        // draw ships
        const shipList = get(ships);
        const t = get(simTime);

        // First pass: collect ships that have arrived per star to determine stacking order
        const arrivedByStar = new Map<string, string[]>();
        shipList.forEach((ship: ShipParams) => {
            const star = get(starsList).find((s) => s.id === ship.starId);
            if (!star) return;
            const metrics = shipMetrics(ship, star.distanceLy, t);
            const arrived =
                metrics.distanceRemainingLy <= 1e-9 || metrics.distanceCoveredLy >= star.distanceLy;
            if (arrived) {
                const list = arrivedByStar.get(star.id) ?? [];
                list.push(ship.id);
                arrivedByStar.set(star.id, list);
            }
        });

        // Second pass: render ships (arrived get parked to the left of the star, smaller, stacked side-by-side)
        shipList.forEach((ship: ShipParams, idx) => {
            const star = stars.find((s) => s.id === ship.starId);
            if (!star) return;
            const sidx = stars.findIndex((st) => st.id === star.id);
            const spos = starPosition(star, Math.max(0, sidx), stars.length);
            const metrics = shipMetrics(ship, ship.starDistanceLy ?? star.distanceLy, t);
            const fraction = Math.min(
                1,
                metrics.distanceCoveredLy / (ship.starDistanceLy ?? star.distanceLy)
            );

            // ship color
            const hue = (idx * 73) % 360;
            const fill = `hsl(${hue} 70% 60%)`;
            const stroke = `hsl(${hue} 60% 40%)`;

            // Determine if the ship has arrived
            const arrived = fraction >= 1 - 1e-9 || metrics.distanceRemainingLy <= 1e-9;

            if (arrived) {
                // Park the ship to the left of the star, smaller, stacking horizontally
                const starXz = spos.x * (scale / 60);
                const starYz = spos.y * (scale / 60);
                const cstar = toCanvas(starXz, starYz);

                const arr = arrivedByStar.get(star.id) ?? [];
                const parkedIndex = Math.max(0, arr.indexOf(ship.id));
                const spacing = 12; // tighter horizontal spacing between parked ships
                const baseLeftOffset = 10; // start a bit closer to the star center
                const parkedX = cstar.x - (baseLeftOffset + parkedIndex * spacing);
                const parkedY = cstar.y; // keep aligned horizontally with the star label above/right

                // draw a smaller triangle pointing upwards (to occupy less horizontal space)
                ctx.save();
                ctx.translate(parkedX, parkedY);
                ctx.fillStyle = fill;
                ctx.beginPath();
                // Upward-pointing tiny triangle
                ctx.moveTo(0, -4); // tip up
                ctx.lineTo(-3, 3); // left base
                ctx.lineTo(3, 3); // right base
                ctx.closePath();
                ctx.fill();

                ctx.strokeStyle = stroke;
                ctx.lineWidth = 1;
                ctx.stroke();

                if ($selectedShipId === ship.id) {
                    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
                    ctx.lineWidth = 1.2;
                    ctx.stroke();
                }
                ctx.restore();

                // tighter bounding box for the smaller parked icon
                const boxW = 10,
                    boxH = 10;
                shipBounds.set(ship.id, {
                    x: parkedX - boxW / 2,
                    y: parkedY - boxH / 2,
                    w: boxW,
                    h: boxH,
                });
            } else {
                // En-route rendering along the trajectory towards the star
                const sx = 0 + (spos.x - 0) * fraction;
                const sy = 0 + (spos.y - 0) * fraction;
                // apply zoom
                const sxz = sx * (scale / 60);
                const syz = sy * (scale / 60);
                const cpos = toCanvas(sxz, syz);

                // compute angle towards star (in world/zoomed coords)
                const starXz = spos.x * (scale / 60);
                const starYz = spos.y * (scale / 60);
                const angle = Math.atan2(starYz - syz, starXz - sxz);

                ctx.save();
                ctx.translate(cpos.x, cpos.y);
                ctx.rotate(angle);

                // draw triangle pointing to the right (rotated by angle)
                ctx.fillStyle = fill;
                ctx.beginPath();
                ctx.moveTo(8, 0);
                ctx.lineTo(-6, -5);
                ctx.lineTo(-6, 5);
                ctx.closePath();
                ctx.fill();

                // stroke for clarity
                ctx.strokeStyle = stroke;
                ctx.lineWidth = 1;
                ctx.stroke();

                // if selected, draw a thin white outline
                if ($selectedShipId === ship.id) {
                    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
                    ctx.lineWidth = 1.2;
                    ctx.stroke();
                }

                ctx.restore();

                // store bounding box for click detection (make it a bit larger)
                const boxSize = 18;
                shipBounds.set(ship.id, {
                    x: cpos.x - boxSize / 2,
                    y: cpos.y - boxSize / 2,
                    w: boxSize,
                    h: boxSize,
                });
            }
        });
    }

    // --- Pan & zoom handlers ---
    function onPointerDown(e: PointerEvent) {
        if (e.button !== 0) return; // only left button
        // User is taking manual control; disable auto-follow
        followShip = false;
        isDragging = true;
        didDrag = false;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        panStartX = panX;
        panStartY = panY;
        (e.target as Element).setPointerCapture?.(e.pointerId);
    }

    function onPointerMove(e: PointerEvent) {
        const rect = canvas.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;

        // convert screen coords to world coords
        const worldX = (cx - w / 2 - panX) / (scale / 60);
        const worldY = (cy - h / 2 - panY) / (scale / 60);

        cursorX = worldX;
        cursorY = worldY;

        if (!isDragging) return;

        const dx = e.clientX - dragStartX;
        const dy = e.clientY - dragStartY;
        if (!didDrag && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) didDrag = true;
        panX = panStartX + dx;
        panY = panStartY + dy;
        scheduleDraw();
    }

    function onPointerUp(e: PointerEvent) {
        isDragging = false;
        (e.target as Element).releasePointerCapture?.(e.pointerId);
    }

    function onWheel(e: WheelEvent) {
        // zoom centered on cursor
        // Manual zoom should cancel auto-follow to honor cursor anchor
        const delta = -e.deltaY;
        const zoomFactor = delta > 0 ? 1.08 : 0.92;
        const rect = canvas.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;

        // convert screen coords to world coords
        const worldX = (cx - w / 2 - panX) / (scale / 60);
        const worldY = (cy - h / 2 - panY) / (scale / 60);

        scale = Math.min(maxZoomIn, Math.max(maxZoomOut, scale * zoomFactor));

        // after changing scale, keep world point under cursor by adjusting pan
        panX = cx - w / 2 - worldX * (scale / 60);
        panY = cy - h / 2 - worldY * (scale / 60);
        scheduleDraw();
        // release suppression next frame so subsequent renders may re-center if user re-enables follow
        requestAnimationFrame(() => {
            suppressFollow = false;
        });
        e.preventDefault();
    }

    function centerSun() {
        // reset pan so sun (scene origin) is centered in canvas
        animateToWorld(0, 0, 1000);
    }

    function stopFollow() {
        followShip = false;
    }

    function toggleSidebar() {
        sidebarOpen = !sidebarOpen;
    }

    const shipBounds = new Map<string, { x: number; y: number; w: number; h: number }>();

    function handleClick(e: MouseEvent) {
        // ignore clicks that are actually the end of a drag
        if (didDrag) {
            didDrag = false;
            return;
        }

        const rect = canvas.getBoundingClientRect();
        // Use CSS pixel coordinates to match how drawing positions (cpos) are calculated.
        // cpos and bounds are computed in CSS pixels (we use ctx.setTransform(dpr,...) for HiDPI rendering),
        // so convert client coordinates to CSS pixels by subtracting rect origin.
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // check stars first (circular hit test)
        for (const [id, b] of starBounds.entries()) {
            const dx = x - b.x;
            const dy = y - b.y;
            if (dx * dx + dy * dy <= b.r * b.r) {
                selectedStarId.set(id);
                targetStarId.set(id);
                // deselect ship selection
                selectedShipId.set(null);

                try {
                    if (typeof window !== 'undefined') {
                        sidebarOpen = true;
                    }
                } catch (err) {
                    // ignore
                }
                // immediately redraw so highlight appears on a simple click
                draw();
                return;
            }
        }

        // then ships (rect hit test)
        for (const [id, b] of shipBounds.entries()) {
            if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
                selectedShipId.set(id);
                draw();
                return;
            }
        }
        selectedShipId.set(null);
        selectedStarId.set(null);
        draw();
    }

    // Hide page scrollbar while fullscreen canvas is active
    $effect(() => {
        if (typeof document !== 'undefined') {
            prevOverflow =
                document.documentElement.style.overflow || document.body.style.overflow || null;
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
        }
        return () => {
            if (typeof document !== 'undefined') {
                if (prevOverflow !== null) {
                    document.documentElement.style.overflow = prevOverflow;
                    document.body.style.overflow = prevOverflow;
                } else {
                    document.documentElement.style.overflow = '';
                    document.body.style.overflow = '';
                }
            }
        };
    });

    // Setup canvas size for HiDPI and keep ctx in sync
    $effect(() => {
        if (!canvas) return;
        _resizeHandler = () => {
            // CSS size (logical pixels)
            const cssW = canvas!.clientWidth || w;
            const cssH = canvas!.clientHeight || h;
            w = cssW;
            h = cssH;
            dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

            // set actual pixel size
            canvas!.width = Math.max(1, Math.round(w * dpr));
            canvas!.height = Math.max(1, Math.round(h * dpr));
            // keep CSS size
            canvas!.style.width = `${w}px`;
            canvas!.style.height = `${h}px`;

            ctx = canvas!.getContext('2d') as CanvasRenderingContext2D;
            // reset any existing transform and scale drawing operations to DPP
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        _resizeHandler();
        window.addEventListener('resize', _resizeHandler);
        return () => {
            if (_resizeHandler) window.removeEventListener('resize', _resizeHandler);
        };
    });

    // Register event listeners for interactions
    $effect(() => {
        if (!canvas) return;
        const c = canvas;
        c.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        c.addEventListener('wheel', onWheel, { passive: false } as any);
        c.addEventListener('click', handleClick);
        scheduleDraw();
        return () => {
            c.removeEventListener('click', handleClick);
            c.removeEventListener('pointerdown', onPointerDown);
            c.removeEventListener('wheel', onWheel as any);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
        };
    });

    // Redraw on store changes (debounced via rAF)
    $effect(() => {
        // touching these stores makes the effect depend on them
        $ships;
        $simTime;
        $selectedStarId;
        $starsList;
        $tagShow;
        scheduleDraw();
    });

    // Smooth pan+zoom animation helper
    function animateToWorld(xLy: number, yLy: number, desiredScale: number, durationMs = 350) {
        followShip = false;
        suppressFollow = true;
        const startScale = scale;
        const startPanX = panX;
        const startPanY = panY;
        const targetScale = Math.min(10000, Math.max(10, desiredScale));
        const targetPx = xLy * (targetScale / 60);
        const targetPy = yLy * (targetScale / 60);
        const targetPanX = -targetPx;
        const targetPanY = -targetPy;
        const t0 = performance.now();
        const ease = (t: number) => 1 - Math.pow(1 - t, 3); // easeOutCubic

        function step(now: number) {
            const p = Math.min(1, (now - t0) / durationMs);
            const e = ease(p);
            scale = startScale + (targetScale - startScale) * e;
            panX = startPanX + (targetPanX - startPanX) * e;
            panY = startPanY + (targetPanY - startPanY) * e;
            scheduleDraw();

            if (p < 1) requestAnimationFrame(step);
            else
                requestAnimationFrame(() => {
                    suppressFollow = false;
                });
        }
        requestAnimationFrame(step);
    }

    // Auto-zoom when a zoom request is issued
    $effect(() => {
        const req = $zoomToStarId;
        if (!req) return;
        const stars = get(starsList);
        const s = stars.find((x) => x.id === req);
        if (s) {
            const idx = stars.findIndex((x) => x.id === s.id);
            const pos = starPosition(s, Math.max(0, idx), stars.length);
            const desired = Math.max(scale, 600);
            animateToWorld(pos.x, pos.y, desired);
        }
        zoomToStarId.set(null);
    });

    // Auto-zoom when the target star changes (e.g., user selects in Sidebar or clicks a star)
    let prevTargetForZoom: string | null = $state(null);
    $effect(() => {
        centerX = panX / (scale / 60);
        centerY = panY / (scale / 60);
        const tid = $targetStarId;
        if (!tid || tid === prevTargetForZoom) return;
        prevTargetForZoom = tid;
        const stars = get(starsList);
        const s = stars.find((x) => x.id === tid);
        if (!s) return;
        selectedStarId.set(s.id);
        const idx = stars.findIndex((x) => x.id === s.id);
        const pos = starPosition(s, Math.max(0, idx), stars.length);
        const desired = Math.max(scale, 600);
        animateToWorld(pos.x, pos.y, desired);
    });

    // Follow selected ship when selection changes to a new non-null id
    let prevSelectedId: string | null = $state(null);
    $effect(() => {
        const current = $selectedShipId as string | null;
        if (current !== prevSelectedId) {
            prevSelectedId = current;
            if (current) {
                // only auto-enable following when a new ship gets selected
                followShip = true;
            }
            scheduleDraw();
        }
    });

    // change star size based on zoom
    $effect(() => {
        if (scale > 80) starsSize = 3;
        else starsSize = Math.max(0.1, scale / 30); // Ensure minimum size of 0.1
    });
</script>

<div class="fixed inset-0 bg-black overflow-hidden">
    <canvas
        bind:this={canvas}
        class="absolute inset-0 w-full h-full block"
        class:cursor-grabbing={isDragging}
    ></canvas>

    <!-- Mobile-first responsive layout -->
    <!-- Top controls bar - mobile friendly -->
    <div
        class="absolute top-2 left-2 right-2 md:left-4 md:right-auto md:top-4 z-50 flex justify-between items-start"
    >
        <div class="flex items-center gap-2">
            <!-- sidebar toggle - mobile friendly -->
            <button
                class="w-10 h-10 rounded bg-gray-800 flex items-center justify-center cursor-pointer {sidebarOpen
                    ? 'bg-gray-700'
                    : ''}"
                onclick={toggleSidebar}
                aria-label="Toggle sidebar"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-5 h-5 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    ><path
                        d="M4 6h16M4 12h16M4 18h16"
                        stroke-width="1.6"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    /></svg
                >
            </button>

            <!-- Controls - hidden on mobile, shown on tablet+ -->
            <div class="hidden md:block rounded-lg p-2">
                <Controls />
            </div>
        </div>
    </div>

    <!-- Mobile controls overlay -->
    <div class="md:hidden absolute bottom-16 left-2 right-2 z-50">
        <div class="bg-gray-900/90 rounded p-3 max-h-64 overflow-y-auto">
            <Controls />
        </div>
    </div>

    <!-- unified detail panel - responsive positioning -->
    <div
        class="absolute top-2 right-2 md:right-4 md:top-20 z-50 w-auto max-w-[calc(100vw-1rem)] md:max-w-none"
    >
        {#if $selectedShipId}
            <div class="max-w-[280px] md:max-w-none">
                <ShipDetail />
            </div>
        {:else if $selectedStarId}
            <div class="max-w-[280px] md:max-w-none">
                <StarDetail />
            </div>
        {:else}
            <div
                class="p-3 bg-gray-900/90 rounded text-xs text-gray-400 max-w-[280px] md:max-w-none"
            >
                Click a ship or star
            </div>
        {/if}
    </div>

    <!-- sidebar - responsive design -->
    {#if sidebarOpen}
        <div
            class="absolute left-2 top-20 bottom-2 md:left-4 md:bottom-4 z-50 hide-scrollbar w-[calc(100vw-1rem)] md:w-80 bg-transparent rounded-lg md:rounded-none"
            style="overflow-y:auto; overflow-x:hidden; scrollbar-width:none; -ms-overflow-style:none;"
        >
            <div class="h-full">
                <Sidebar />
            </div>
        </div>
    {/if}

    <!-- floating controls bottom - responsive -->
    <div class="absolute bottom-2 right-2 md:right-4 md:bottom-4 z-50 max-w-[calc(100vw-1rem)]">
        <div class="flex flex-col gap-2 items-end">
            <!-- Debug info - hidden on mobile for space -->
            <div class="hidden md:flex flex-col gap-1 items-end text-xs text-gray-400 rounded p-2">
                <div>{scale.toFixed(1)}</div>
                <div>{cursorX.toFixed(0)}, {cursorY.toFixed(0)}</div>
                <div>{-centerX.toFixed(0)}, {-centerY.toFixed(0)}</div>
                <div>{-panX.toFixed(0)}, {-panY.toFixed(0)}</div>
            </div>

            <!-- Action buttons -->
            <div class="flex gap-2">
                <button
                    class="w-10 h-10 rounded bg-gray-800 flex items-center justify-center"
                    onclick={centerSun}
                    aria-label="Center on Sun"
                    title="Center on Sun"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="w-5 h-5 text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                    >
                        <path
                            d="M12 2C8.686 2 6 4.686 6 8c0 4.418 6 12 6 12s6-7.582 6-12c0-3.314-2.686-6-6-6z"
                            stroke-width="1.2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            fill="none"
                        ></path>
                        <circle cx="12" cy="8" r="2" fill="currentColor" />
                    </svg>
                </button>

                {#if followShip}
                    <button
                        class="w-10 h-10 rounded bg-red-700 flex items-center justify-center"
                        onclick={stopFollow}
                        aria-label="Stop following ship"
                        title="Stop following ship"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="w-4 h-4 text-white"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                        >
                            <path
                                d="M6 6l12 12M6 18L18 6"
                                stroke-width="1.8"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            ></path>
                        </svg>
                    </button>
                {/if}
            </div>
        </div>
    </div>
</div>

<style>
    /* visually hide scrollbar but keep scrolling functional */
    .hide-scrollbar::-webkit-scrollbar {
        display: none;
    }
    .hide-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }

    /* ensure canvas is always touch-action none for better performance */
    canvas {
        touch-action: none;
    }

    .cursor-grabbing {
        cursor: grabbing;
    }

</style>

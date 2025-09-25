<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { STARS } from '$lib/stars';
  import { ships, selectedShipId, simTime } from '$lib/stores';
  import { get } from 'svelte/store';
  import type { ShipParams } from '$lib/relativity';
  import { shipMetrics } from '$lib/relativity';

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  let w = 800;
  let h = 600;

  // visual scale: years -> pixels (1 ly = 60 px default)
  let scale = 60;
  // panning offsets (in pixels)
  let panX = 0;
  let panY = 0;

  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let panStartX = 0;
  let panStartY = 0;
  let didDrag = false;

  let unsubShips: any;
  let unsubTime: any;
  let unsubSelected: any;

  // when true, canvas will automatically keep the selected ship centered
  let followShip = false;

  function toCanvas(x: number, y: number) {
    return { x: w / 2 + x + panX, y: h / 2 + y + panY };
  }

  function starPosition(distanceLy: number, index: number) {
    // scatter stars around a circle for simplicity
    const angle = (index / STARS.length) * Math.PI * 2;
    const r = distanceLy * scale;
    return { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
  }

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    // background
    ctx.fillStyle = '#030314';
    ctx.fillRect(0, 0, w, h);
    // If we're following a ship, update pan so the ship remains centered
    if (followShip && $selectedShipId) {
      const shipList = get(ships);
      const ship = shipList.find((s: ShipParams) => s.id === $selectedShipId);
      if (ship) {
        const star = STARS.find((s) => s.id === ship.starId);
        if (star) {
          const spos = starPosition(star.distanceLy, STARS.indexOf(star));
          const t = get(simTime);
          const metrics = shipMetrics(ship, star.distanceLy, t);
          const fraction = Math.min(1, metrics.distanceCoveredLy / star.distanceLy);
          const sx = 0 + (spos.x - 0) * fraction;
          const sy = 0 + (spos.y - 0) * fraction;
          // apply zoom same way draw does
          const sxz = sx * (scale / 60);
          const syz = sy * (scale / 60);
          // center ship by setting pan so that toCanvas(sxz, syz) => center
          panX = -sxz;
          panY = -syz;
        } else {
          // star gone, stop following
          followShip = false;
        }
      } else {
        // ship not found, stop following
        followShip = false;
      }
    }

  // Earth at scene origin (apply pan/zoom via toCanvas)
  const earthPos = toCanvas(0, 0);
  ctx.fillStyle = '#4EA8DE';
  ctx.beginPath();
  ctx.arc(earthPos.x, earthPos.y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '12px sans-serif';
  ctx.fillText('Earth', earthPos.x + 8, earthPos.y + 4);

    // draw stars
    STARS.forEach((s, i) => {
      const pos = starPosition(s.distanceLy, i);
      // apply zoom to positions
      const sposZoomed = { x: pos.x * (scale / 60), y: pos.y * (scale / 60) };
      const cpos = toCanvas(sposZoomed.x, sposZoomed.y);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(cpos.x, cpos.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ddd';
      ctx.fillText(`${s.name} (${s.distanceLy} ly)`, cpos.x + 6, cpos.y + 4);
    });

    // draw ships
    const shipList = get(ships);
    const t = get(simTime);
    shipList.forEach((ship: ShipParams, idx) => {
      const star = STARS.find((s) => s.id === ship.starId);
      if (!star) return;
  const spos = starPosition(star.distanceLy, STARS.indexOf(star));

  const metrics = shipMetrics(ship, star.distanceLy, t);
  const fraction = Math.min(1, metrics.distanceCoveredLy / star.distanceLy);

  const sx = 0 + (spos.x - 0) * fraction;
  const sy = 0 + (spos.y - 0) * fraction;
  // apply zoom
  const sxz = sx * (scale / 60);
  const syz = sy * (scale / 60);
  const cpos = toCanvas(sxz, syz);

      // ship color
      const hue = (idx * 73) % 360;
      const fill = `hsl(${hue} 70% 60%)`;
      const stroke = `hsl(${hue} 60% 40%)`;

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
      shipBounds.set(ship.id, { x: cpos.x - boxSize / 2, y: cpos.y - boxSize / 2, w: boxSize, h: boxSize });
    });
  }

  // --- Pan & zoom handlers ---
  function onPointerDown(e: PointerEvent) {
    if (e.button !== 0) return; // only left button
    isDragging = true;
    didDrag = false;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    panStartX = panX;
    panStartY = panY;
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e: PointerEvent) {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    if (!didDrag && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) didDrag = true;
    panX = panStartX + dx;
    panY = panStartY + dy;
    draw();
  }

  function onPointerUp(e: PointerEvent) {
    isDragging = false;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  }

  function onWheel(e: WheelEvent) {
    // zoom centered on cursor
    const delta = -e.deltaY;
    const zoomFactor = delta > 0 ? 1.08 : 0.92;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    // convert screen coords to world coords
    const worldX = (cx - w / 2 - panX) / (scale / 60);
    const worldY = (cy - h / 2 - panY) / (scale / 60);

    scale = Math.min(800, Math.max(10, scale * zoomFactor));

    // after changing scale, keep world point under cursor by adjusting pan
    panX = cx - w / 2 - worldX * (scale / 60);
    panY = cy - h / 2 - worldY * (scale / 60);
    draw();
    e.preventDefault();
  }

  function centerEarth() {
    // reset pan so earth (scene origin) is centered in canvas
    panX = 0;
    panY = 0;
    draw();
  }

  function stopFollow() {
    followShip = false;
  }

  const shipBounds = new Map<string, { x: number; y: number; w: number; h: number }>();

  function handleClick(e: MouseEvent) {
    // ignore clicks that are actually the end of a drag
    if (didDrag) {
      didDrag = false;
      return;
    }

    const rect = canvas.getBoundingClientRect();
    // map client coordinates to canvas coordinate space (account for CSS scaling)
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    for (const [id, b] of shipBounds.entries()) {
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
        selectedShipId.set(id);
        return;
      }
    }
    selectedShipId.set(null);
  }

  onMount(() => {
    canvas.width = w;
    canvas.height = h;
    ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

    unsubShips = ships.subscribe(() => draw());
    unsubTime = simTime.subscribe(() => draw());
    unsubSelected = selectedShipId.subscribe((id) => {
      // when user selects a ship by clicking, start following it automatically
      if (id) {
        followShip = true;
      } else {
        // if deselected, stop following
        followShip = false;
      }
      draw();
    });

    // pointer events for pan
    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    // click detection
    canvas.addEventListener('click', handleClick);

    draw();
  });

  onDestroy(() => {
    // canvas may be undefined during SSR; guard DOM calls
    if (typeof window !== 'undefined') {
      if (canvas && typeof canvas.removeEventListener === 'function') {
        canvas.removeEventListener('click', handleClick);
        canvas.removeEventListener('pointerdown', onPointerDown);
        canvas.removeEventListener('wheel', onWheel);
      }
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    }
    if (unsubShips) unsubShips();
    if (unsubTime) unsubTime();
    if (unsubSelected) unsubSelected();
  });
</script>

<div class="border rounded bg-black p-2">
  <div class="relative">
    <canvas bind:this={canvas} class="w-full h-auto"></canvas>

    <!-- floating controls bottom-right -->
    <div class="absolute right-4 bottom-4 flex flex-col gap-2 items-end">
      <button
        class="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center shadow-lg"
        on:click={centerEarth}
        aria-label="Center on Earth"
        title="Center on Earth"
      >
        <!-- GPS / pin icon (map pin with center dot) -->
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <!-- pin outline -->
          <path d="M12 2C8.686 2 6 4.686 6 8c0 4.418 6 12 6 12s6-7.582 6-12c0-3.314-2.686-6-6-6z" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" fill="none"></path>
          <!-- center circle -->
          <circle cx="12" cy="8" r="2" fill="currentColor" />
        </svg>
      </button>

      {#if followShip}
        <button
          class="w-10 h-10 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center shadow-lg"
          on:click={stopFollow}
          aria-label="Stop following ship"
          title="Stop following ship"
        >
          <!-- Stop / X icon -->
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M6 6l12 12M6 18L18 6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
        </button>
      {/if}
    </div>
  </div>
</div>

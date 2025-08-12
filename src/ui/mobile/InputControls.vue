<template>
  <div class="mobile-controls" @contextmenu.prevent>
    <div class="cluster left">
      <!-- Joystick pad -->
      <div
        class="joystick"
        ref="stickArea"
        @pointerdown.prevent="onStickDown"
        @pointermove.prevent="onStickMove"
        @pointerup.prevent="onStickUp"
        @pointercancel.prevent="onStickUp"
        @pointerleave.prevent="onStickUp"
      >
        <div class="joystick-thumb" :style="thumbStyle"></div>
      </div>
    </div>

    <div class="cluster right">
      <button
        class="btn fire"
        @pointerdown="press('Space')"
        @pointerup="release('Space')"
        @pointercancel="release('Space')"
        @pointerleave="release('Space')"
      >●</button>
    </div>
  </div>
  
  <div class="ui-root-slot">
    <!-- Future: menus, shop, etc. -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { setKeyPressed } from '../../input/input';

// Virtual key mapping (uses existing ECS key codes)
const press = (code: string) => setKeyPressed(code, true);
const release = (code: string) => setKeyPressed(code, false);

// Joystick state
const stickArea = ref<HTMLDivElement | null>(null);
const isActive = ref(false);
const originX = ref(0);
const originY = ref(0);
const dx = ref(0);
const dy = ref(0);
const radius = 60; // pixels

const thumbStyle = computed(() => ({
  transform: `translate(${dx.value}px, ${dy.value}px)`,
}));

function setMovementFromVector(vx: number, vy: number) {
  const dead = 0.2;
  const mag = Math.hypot(vx, vy);
  const nx = mag > 0 ? vx / mag : 0;
  const ny = mag > 0 ? vy / mag : 0;

  const up = ny < -dead;
  const down = ny > dead;
  const left = nx < -dead;
  const right = nx > dead;

  setKeyPressed('KeyW', up);
  setKeyPressed('KeyS', down);
  setKeyPressed('KeyA', left);
  setKeyPressed('KeyD', right);
}

function onStickDown(e: PointerEvent) {
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  isActive.value = true;
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  originX.value = e.clientX - (rect.left + rect.width / 2);
  originY.value = e.clientY - (rect.top + rect.height / 2);
  onStickMove(e);
}

function onStickMove(e: PointerEvent) {
  if (!isActive.value) return;
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const localX = e.clientX - (rect.left + rect.width / 2);
  const localY = e.clientY - (rect.top + rect.height / 2);
  let vx = localX;
  let vy = localY;
  const mag = Math.hypot(vx, vy);
  if (mag > radius) {
    vx = (vx / mag) * radius;
    vy = (vy / mag) * radius;
  }
  dx.value = vx;
  dy.value = vy;
  setMovementFromVector(vx / radius, vy / radius);
}

function onStickUp(e: PointerEvent) {
  isActive.value = false;
  dx.value = 0;
  dy.value = 0;
  setMovementFromVector(0, 0);
}

function releaseAll() {
  ['KeyW', 'KeyS', 'KeyA', 'KeyD', 'Space'].forEach((c) => setKeyPressed(c, false));
}

const onVis = () => {
  if (document.visibilityState !== 'visible') releaseAll();
};

onMounted(() => {
  document.addEventListener('visibilitychange', onVis);
});

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', onVis);
  releaseAll();
});
</script>

<style scoped>
.mobile-controls {
  position: fixed;
  inset: 0;
  pointer-events: none; /* allow canvas input except on buttons */
  z-index: 1000;
  touch-action: none;
}

.cluster {
  position: absolute;
  bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cluster.left { left: 24px; }
.cluster.right { right: 24px; }

.joystick {
  pointer-events: auto;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  border: 2px solid #fff8;
  background: #0006;
  position: relative;
  backdrop-filter: blur(4px);
}

.joystick-thumb {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 56px;
  height: 56px;
  margin-left: -28px;
  margin-top: -28px;
  border-radius: 50%;
  background: #fff2;
  border: 2px solid #fff8;
}

.btn {
  pointer-events: auto;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  border: 2px solid #fff8;
  background: #0008;
  color: #fff;
  font-size: 28px;
  backdrop-filter: blur(4px);
  user-select: none;
}

.btn.fire { background: #b00c; border-color: #f008; }
.btn:active { background: #fff3; }

@media (min-width: 900px) {
  /* hide on desktop; show only on coarse pointers via CSS/JS gate later if desired */
  .mobile-controls { display: none; }
}

.ui-root-slot {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1001;
}
</style>



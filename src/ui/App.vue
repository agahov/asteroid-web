<template>
  <div class="ui-layer">
    <!-- Controls layer -->
    <InputControls />

    <!-- Future: Menu / Options / Shop will render here -->
    <div class="ui-screens"></div>
  </div>
  
</template>

<script setup lang="ts">
import InputControls from './mobile/InputControls.vue';
</script>

<style scoped>
.ui-layer {
  position: fixed;
  inset: 0;
  z-index: 1000;
}

.ui-screens {
  position: absolute;
  inset: 0;
}
</style>



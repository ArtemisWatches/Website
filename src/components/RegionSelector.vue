<script setup lang="ts">
import { useRegionStore } from '../stores/region'

const store = useRegionStore()
</script>

<template>
  <div class="region-display">
    <template v-if="store.selectedState">
      <span class="region-name">
        {{ store.selectedCounty?.name ?? store.selectedState.name }}
      </span>
      <span class="region-label">{{ store.selectionLabel }}</span>
      <button class="region-clear" title="Clear selection" @click="store.selectState(null)">
        ×
      </button>
    </template>
    <span v-else class="region-hint">double-click map to filter</span>
  </div>
</template>

<style scoped>
.region-display {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0 14px 0 12px;
  border-left: 1px solid rgba(80, 180, 255, 0.12);
  height: 100%;
}

.region-name {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.03em;
  color: rgba(140, 210, 255, 0.9);
}

.region-label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(80, 180, 255, 0.55);
  background: rgba(60, 160, 255, 0.08);
  border: 1px solid rgba(80, 180, 255, 0.18);
  border-radius: 3px;
  padding: 2px 5px;
}

.region-clear {
  font-size: 14px;
  line-height: 1;
  color: rgba(100, 180, 255, 0.35);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0 2px;
  transition: color 0.15s;
}

.region-clear:hover {
  color: rgba(140, 210, 255, 0.75);
}

.region-hint {
  font-size: 11px;
  color: rgba(100, 180, 255, 0.28);
  letter-spacing: 0.03em;
  font-style: italic;
}
</style>

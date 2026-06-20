<script setup lang="ts">
import LayerItem from './LayerItem.vue'
import { panelRegistry } from '../panels/registry'
import { useLayersStore } from '../stores/layers'

defineEmits<{ close: [] }>()

const store = useLayersStore()

const layers = Object.entries(panelRegistry).map(([id, def]) => ({
  id,
  label: def.title,
}))
</script>

<template>
  <div class="layers-dropdown">
    <div class="dropdown-header">
      <span class="dropdown-title">Panels</span>
      <div class="dropdown-actions">
        <button class="action-btn" @click="store.setAll(true)">All</button>
        <button class="action-btn" @click="store.setAll(false)">None</button>
      </div>
    </div>

    <ul class="layers-list">
      <li v-for="layer in layers" :key="layer.id">
        <LayerItem
          :id="layer.id"
          :label="layer.label"
          :checked="store.activeLayers.has(layer.id)"
          @update:checked="store.toggle(layer.id)"
        />
      </li>
    </ul>
  </div>
</template>

<style scoped>
.layers-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  width: 220px;
  background: rgba(8, 14, 24, 0.95);
  border: 1px solid rgba(80, 180, 255, 0.18);
  border-radius: 10px;
  backdrop-filter: blur(14px);
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(80, 180, 255, 0.06);
  overflow: hidden;
  z-index: 101;
}

.dropdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px 8px;
  border-bottom: 1px solid rgba(80, 180, 255, 0.1);
}

.dropdown-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(140, 210, 255, 0.5);
}

.dropdown-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  padding: 2px 8px;
  font-size: 10px;
  letter-spacing: 0.04em;
  color: rgba(100, 180, 255, 0.5);
  background: transparent;
  border: 1px solid rgba(80, 180, 255, 0.15);
  border-radius: 4px;
  cursor: pointer;
  transition:
    color 0.15s,
    border-color 0.15s,
    background 0.15s;
}

.action-btn:hover {
  color: rgba(140, 210, 255, 0.85);
  border-color: rgba(80, 180, 255, 0.35);
  background: rgba(60, 160, 255, 0.07);
}

.layers-list {
  list-style: none;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 1px;
  max-height: 340px;
  overflow-y: auto;
}

.layers-list::-webkit-scrollbar {
  width: 4px;
}

.layers-list::-webkit-scrollbar-track {
  background: transparent;
}

.layers-list::-webkit-scrollbar-thumb {
  background: rgba(80, 180, 255, 0.15);
  border-radius: 2px;
}
</style>

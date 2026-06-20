<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  title?: string
}>()

const emit = defineEmits<{
  toggle: [collapsed: boolean]
}>()

const collapsed = ref(false)
let downX = 0
let downY = 0

function onHeaderMouseDown(e: MouseEvent) {
  downX = e.clientX
  downY = e.clientY
}

function toggle(e: MouseEvent) {
  if (Math.abs(e.clientX - downX) > 5 || Math.abs(e.clientY - downY) > 5) return
  collapsed.value = !collapsed.value
  emit('toggle', collapsed.value)
}
</script>

<template>
  <div class="panel" :class="{ collapsed }">
    <div class="panel-header" @mousedown="onHeaderMouseDown" @click="toggle">
      <span class="panel-title">{{ title ?? 'Panel' }}</span>
      <span class="panel-toggle">{{ collapsed ? '▼' : '▲' }}</span>
    </div>
    <transition name="slide">
      <div v-show="!collapsed" class="panel-body">
        <slot />
      </div>
    </transition>
  </div>
</template>

<style scoped>
.panel {
  background: rgba(8, 14, 24, 0.88);
  border: 1px solid rgba(80, 180, 255, 0.18);
  border-radius: 8px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  backdrop-filter: blur(6px);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.45);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 9px 14px;
  cursor: grab;
  background: rgba(60, 160, 255, 0.07);
  /*border-bottom: 1px solid rgba(80, 180, 255, 0.14);*/
  user-select: none;
  flex-shrink: 0;
  transition: background 0.15s;
}

.panel-header:hover {
  background: rgba(60, 160, 255, 0.13);
}

.panel-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(140, 210, 255, 0.85);
}

.panel-toggle {
  font-size: 9px;
  color: rgba(100, 180, 255, 0.5);
}

.panel-body {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.slide-enter-active,
.slide-leave-active {
  transition: opacity 0.2s ease;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
}
</style>

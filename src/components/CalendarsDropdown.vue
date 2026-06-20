<script setup lang="ts">
import { CALENDAR_DEFS, useCalendarsStore } from '../stores/calendars'

defineEmits<{ close: [] }>()

const store = useCalendarsStore()

const items = Object.entries(CALENDAR_DEFS).map(([id, def]) => ({ id, ...def }))
</script>

<template>
  <div class="calendars-dropdown">
    <div class="dropdown-header">
      <span class="dropdown-title">Calendars</span>
      <div class="dropdown-actions">
        <button class="action-btn" @click="store.setAll(true)">All</button>
        <button class="action-btn" @click="store.setAll(false)">None</button>
      </div>
    </div>

    <ul class="calendars-list">
      <li v-for="item in items" :key="item.id">
        <label class="calendar-item">
          <span class="swatch" :style="{ background: item.color }" />
          <span class="item-label">{{ item.label }}</span>
          <input
            type="checkbox"
            :checked="store.activeCalendars.has(item.id)"
            @change="store.toggle(item.id)"
          />
        </label>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.calendars-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
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
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}

.action-btn:hover {
  color: rgba(140, 210, 255, 0.85);
  border-color: rgba(80, 180, 255, 0.35);
  background: rgba(60, 160, 255, 0.07);
}

.calendars-list {
  list-style: none;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.calendar-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 7px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.12s;
  user-select: none;
}

.calendar-item:hover {
  background: rgba(60, 160, 255, 0.07);
}

.swatch {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
}

.item-label {
  flex: 1;
  font-size: 12px;
  color: rgba(160, 210, 240, 0.8);
}

input[type='checkbox'] {
  width: 13px;
  height: 13px;
  accent-color: rgba(80, 180, 255, 0.8);
  cursor: pointer;
}
</style>

<script setup lang="ts">
import { ref } from 'vue'
import LayersDropdown from './components/LayersDropdown.vue'
import CalendarsDropdown from './components/CalendarsDropdown.vue'
import RegionSelector from './components/RegionSelector.vue'

const layersOpen = ref(false)
const calendarsOpen = ref(false)

function toggleLayers() {
  layersOpen.value = !layersOpen.value
  if (layersOpen.value) calendarsOpen.value = false
}

function toggleCalendars() {
  calendarsOpen.value = !calendarsOpen.value
  if (calendarsOpen.value) layersOpen.value = false
}
</script>

<template>
  <div class="app-root">
    <div v-if="layersOpen || calendarsOpen" class="layers-overlay" @click="layersOpen = false; calendarsOpen = false" />

    <header class="floating-nav">
      <div class="nav-brand">
        <span class="nav-dot" />
        <span class="nav-title">Artemis Watches</span>
      </div>

      <nav class="nav-links">
        <div class="nav-item-wrap">
          <button
            class="nav-link nav-btn"
            :class="{ active: layersOpen }"
            @click="toggleLayers"
          >
            Panels
          </button>
          <LayersDropdown v-if="layersOpen" @close="layersOpen = false" />
        </div>

        <div class="nav-item-wrap">
          <button
            class="nav-link nav-btn"
            :class="{ active: calendarsOpen }"
            @click="toggleCalendars"
          >
            Calendars
          </button>
          <CalendarsDropdown v-if="calendarsOpen" @close="calendarsOpen = false" />
        </div>
      </nav>

      <RegionSelector />
    </header>

    <main class="page-content">
      <RouterView />
    </main>
  </div>
</template>

<style>
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html,
body {
  height: 100%;
  background: #080e18;
  color: #c8dff0;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
}

#app {
  min-height: 100vh;
}
</style>

<style scoped>
.app-root {
  min-height: 100vh;
  position: relative;
}

/* Dismiss layer behind the open dropdown */
.layers-overlay {
  position: fixed;
  inset: 0;
  z-index: 99;
}

/* Horizontal floating nav */
.floating-nav {
  position: fixed;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  display: flex;
  align-items: center;
  background: rgba(8, 14, 24, 0.88);
  border: 1px solid rgba(80, 180, 255, 0.18);
  border-radius: 12px;
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  padding: 0 6px;
  height: 44px;
  white-space: nowrap;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px 0 10px;
  border-right: 1px solid rgba(80, 180, 255, 0.12);
  height: 100%;
}

.nav-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #3ad;
  box-shadow: 0 0 6px #3ad;
  flex-shrink: 0;
}

.nav-title {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: rgba(140, 210, 255, 0.9);
}

.nav-links {
  display: flex;
  align-items: center;
  padding: 0 8px;
  height: 100%;
  gap: 2px;
}

/* Anchor for the dropdown */
.nav-item-wrap {
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
}

.nav-link,
.nav-btn {
  display: flex;
  align-items: center;
  padding: 5px 12px;
  font-size: 12px;
  color: rgba(160, 210, 240, 0.55);
  text-decoration: none;
  letter-spacing: 0.03em;
  border-radius: 7px;
  transition:
    background 0.15s,
    color 0.15s;
}

.nav-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
}

.nav-link:hover,
.nav-btn:hover,
.nav-btn.active {
  background: rgba(60, 160, 255, 0.08);
  color: rgba(140, 210, 255, 0.9);
}

.nav-btn.active {
  background: rgba(60, 160, 255, 0.14);
  color: rgba(140, 210, 255, 0.95);
}

.nav-link.router-link-exact-active {
  background: rgba(60, 160, 255, 0.14);
  color: rgba(140, 210, 255, 0.95);
}

/* Page */
.page-content {
  padding-top: 68px;
}
</style>

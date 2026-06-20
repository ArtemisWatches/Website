<script setup lang="ts">
import { ref, watch } from 'vue'
import { GridLayout, GridItem } from 'vue-grid-layout-v3'
import CollapsiblePanel from '../components/CollapsiblePanel.vue'
import { panelRegistry, defaultLayout, type LayoutItem } from '../panels/registry'
import { useLayersStore } from '../stores/layers'

const layersStore = useLayersStore()

// Source of truth for all panel positions, including hidden ones
const masterLayout: LayoutItem[] = defaultLayout.map((item) => ({ ...item }))

function buildVisible(): LayoutItem[] {
  return masterLayout
    .filter((item) => layersStore.activeLayers.has(item.type))
    .map((item) => ({ ...item }))
}

const visibleLayout = ref<LayoutItem[]>(buildVisible())

// When the grid moves/resizes items, sync positions back to master
function onLayoutUpdate(updated: LayoutItem[]) {
  visibleLayout.value = updated
  for (const item of updated) {
    const master = masterLayout.find((m) => m.i === item.i)
    if (master) Object.assign(master, item)
  }
}

// When layers are toggled, rebuild visible from the up-to-date master
watch(
  () => layersStore.activeLayers,
  () => {
    visibleLayout.value = buildVisible()
  },
  { deep: true },
)

const savedHeights: Record<string, number> = {}

function onPanelToggle(i: string, isCollapsed: boolean) {
  const item = visibleLayout.value.find((l) => l.i === i)
  if (!item) return
  if (isCollapsed) {
    savedHeights[i] = item.h
    item.h = 1
  } else {
    item.h = savedHeights[i] ?? item.h
  }
}
</script>

<template>
  <div class="grid-wrapper">
    <GridLayout
      :layout="visibleLayout"
      :col-num="12"
      :row-height="36"
      :is-draggable="true"
      :is-resizable="true"
      :margin="[10, 10]"
      :use-css-transforms="true"
      @update:layout="onLayoutUpdate"
    >
      <GridItem
        v-for="item in visibleLayout"
        :key="item.i"
        :x="item.x"
        :y="item.y"
        :w="item.w"
        :h="item.h"
        :i="item.i"
      >
        <CollapsiblePanel
          :title="panelRegistry[item.type]!.title"
          @toggle="(c) => onPanelToggle(item.i, c)"
        >
          <component :is="panelRegistry[item.type]!.component" />
        </CollapsiblePanel>
      </GridItem>
    </GridLayout>
  </div>
</template>

<style scoped>
.grid-wrapper {
  padding: 16px;
}
</style>

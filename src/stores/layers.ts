import { defineStore } from 'pinia'
import { ref } from 'vue'
import { panelRegistry } from '../panels/registry'

export const useLayersStore = defineStore('layers', () => {
  const activeLayers = ref(new Set<string>(Object.keys(panelRegistry)))

  function toggle(id: string) {
    if (activeLayers.value.has(id)) {
      activeLayers.value.delete(id)
    } else {
      activeLayers.value.add(id)
    }
  }

  function setAll(active: boolean) {
    if (active) {
      for (const key of Object.keys(panelRegistry)) {
        activeLayers.value.add(key)
      }
    } else {
      activeLayers.value.clear()
    }
  }

  return { activeLayers, toggle, setAll }
})

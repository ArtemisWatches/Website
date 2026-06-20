import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useMarkerStore = defineStore('marker', () => {
  const coords = ref<{ lat: number; lon: number } | null>(null)

  function setMarker(lat: number, lon: number) {
    coords.value = { lat, lon }
  }

  function clearMarker() {
    coords.value = null
  }

  return { coords, setMarker, clearMarker }
})

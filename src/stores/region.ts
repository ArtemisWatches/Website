import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface StateOption {
  name: string  // "Colorado"
  abbr: string  // "CO"
}

export interface CountyOption {
  name: string       // "Boulder County"
  stateName: string  // "Colorado"
}

export const useRegionStore = defineStore('region', () => {
  const availableStates = ref<StateOption[]>([])
  const availableCounties = ref<CountyOption[]>([])

  const selectedState = ref<StateOption | null>(null)
  const selectedCounty = ref<CountyOption | null>(null)

  const countiesForSelectedState = computed(() =>
    availableCounties.value.filter((c) => c.stateName === selectedState.value?.name),
  )

  const selectionLabel = computed<'State' | 'County' | null>(() => {
    if (selectedCounty.value) return 'County'
    if (selectedState.value) return 'State'
    return null
  })

  function selectState(state: StateOption | null) {
    selectedState.value = state
    selectedCounty.value = null
  }

  function selectCounty(county: CountyOption | null) {
    selectedCounty.value = county
  }

  function setAvailable(states: StateOption[], counties: CountyOption[]) {
    availableStates.value = states
    availableCounties.value = counties
    // clear stale selections
    selectedState.value = null
    selectedCounty.value = null
  }

  return {
    availableStates,
    availableCounties,
    selectedState,
    selectedCounty,
    countiesForSelectedState,
    selectionLabel,
    selectState,
    selectCounty,
    setAvailable,
  }
})

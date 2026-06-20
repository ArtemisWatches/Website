import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface CalendarDef {
  label: string
  color: string
  file: string
}

export const CALENDAR_DEFS: Record<string, CalendarDef> = {
  'us-national': { label: 'US National',  color: '#3ab0dd', file: '/calendars/US_Holidays.ics' },
  jewish:        { label: 'Jewish',        color: '#a78bfa', file: '/calendars/Jewish_Holidays.ics' },
  islamic:       { label: 'Islamic',       color: '#34d399', file: '/calendars/Islam_Holidays.ics' },
  christian:     { label: 'Christian',     color: '#f472b6', file: '/calendars/Christian_Holidays.ics' },
  hindu:         { label: 'Hindu',         color: '#fbbf24', file: '/calendars/Hindu_Holidays.ics' },
  sikh:          { label: 'Sikh',          color: '#fb923c', file: '/calendars/Sikh_Holidays.ics' },
}

export const useCalendarsStore = defineStore('calendars', () => {
  const activeCalendars = ref(new Set<string>(Object.keys(CALENDAR_DEFS)))

  function toggle(id: string) {
    if (activeCalendars.value.has(id)) {
      activeCalendars.value.delete(id)
    } else {
      activeCalendars.value.add(id)
    }
  }

  function setAll(active: boolean) {
    if (active) {
      for (const key of Object.keys(CALENDAR_DEFS)) activeCalendars.value.add(key)
    } else {
      activeCalendars.value.clear()
    }
  }

  return { activeCalendars, toggle, setAll }
})

<script lang="ts" setup>
import { onMounted, watch, ref, computed } from 'vue'
import { ScheduleXCalendar } from '@schedule-x/vue'
import {
  createCalendar,
  createViewMonthGrid,
  createViewMonthAgenda,
  type CalendarType,
  type CalendarEventExternal,
} from '@schedule-x/calendar'
import { createEventsServicePlugin } from '@schedule-x/events-service'
import '@schedule-x/theme-default/dist/index.css'
import 'temporal-polyfill/global'
import { Temporal } from 'temporal-polyfill'
import ICAL from 'ical.js'
import { CALENDAR_DEFS, useCalendarsStore } from '../stores/calendars'

const store = useCalendarsStore()

// ── Schedule-X calendar definitions (one per source, for color coding) ──
const sxCalendars: Record<string, CalendarType> = {}
for (const [id, def] of Object.entries(CALENDAR_DEFS)) {
  sxCalendars[id] = {
    colorName: id,
    darkColors: {
      main: def.color,
      container: def.color + '33', // 20% alpha fill
      onContainer: def.color,
    },
  }
}

const eventsPlugin = createEventsServicePlugin()

// Track all loaded events reactively so we can filter for the list
const allEvents = ref<CalendarEventExternal[]>([])

// Track the visible date range so the list matches what the calendar shows
const _today = Temporal.Now.plainDateISO()
const viewRange = ref({
  start: _today.with({ day: 1 }).toString(),
  end: _today.with({ day: _today.daysInMonth }).toString(),
})

const calendarApp = createCalendar({
  isDark: true,
  selectedDate: _today,
  firstDayOfWeek: 7,
  views: [createViewMonthAgenda()],
  calendars: sxCalendars,
  plugins: [eventsPlugin],
  events: [],
  callbacks: {
    onRangeUpdate(range) {
      viewRange.value = { start: range.start, end: range.end }
    },
  },
})

function fmtEventDate(start: unknown): string {
  try {
    const d = Temporal.PlainDate.from(String(start))
    return d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  } catch {
    return String(start)
  }
}

const monthEvents = computed(() => {
  const { start, end } = viewRange.value
  if (!start || !end) return []
  return allEvents.value
    .filter((ev) => {
      const s = String(ev.start).slice(0, 10)
      return s >= start.slice(0, 10) && s <= end.slice(0, 10)
    })
    .sort((a, b) => String(a.start).localeCompare(String(b.start)))
})

// ── ICS parsing ────────────────────────────────────────────────
function parseICS(text: string, calendarId: string): CalendarEventExternal[] {
  const jcal = ICAL.parse(text)
  const comp = new ICAL.Component(jcal)
  const vevents = comp.getAllSubcomponents('vevent')
  const out: CalendarEventExternal[] = []

  for (const vevent of vevents) {
    try {
      const ev = new ICAL.Event(vevent)
      const title = ev.summary ?? ''
      const dtstart = ev.startDate
      const dtend = ev.endDate ?? dtstart
      if (!dtstart || !dtend) continue

      const start = Temporal.PlainDate.from({
        year: dtstart.year,
        month: dtstart.month,
        day: dtstart.day,
      })
      // ICS all-day DTEND is exclusive; ScheduleX end is inclusive — subtract one day
      const endExclusive = Temporal.PlainDate.from({
        year: dtend.year,
        month: dtend.month,
        day: dtend.day,
      })
      const end = endExclusive.subtract({ days: 1 })

      const id = `${calendarId}-${String(start)}-${out.length}`
      out.push({ id, title, start, end, calendarId })
    } catch {
      // skip malformed events
    }
  }

  return out
}

// ── Load active calendars and push to ScheduleX ───────────────
const cache: Record<string, string> = {} // calendarId → raw ICS text

async function fetchICS(id: string): Promise<string> {
  const cached = cache[id]
  if (cached) return cached
  const def = CALENDAR_DEFS[id]
  if (!def) throw new Error(`Unknown calendar id: ${id}`)
  const res = await fetch(def.file)
  if (!res.ok) throw new Error(`Failed to load ${def.file}`)
  cache[id] = await res.text()
  return cache[id] as string
}

async function syncEvents() {
  const active = [...store.activeCalendars]
  const all: CalendarEventExternal[] = []

  await Promise.all(
    active.map(async (id) => {
      try {
        const text = await fetchICS(id)
        all.push(...parseICS(text, id))
      } catch (e) {
        console.warn('[Calendar] failed to load', id, e)
      }
    }),
  )

  eventsPlugin.set(all)
  allEvents.value = all
}

onMounted(syncEvents)

watch(() => [...store.activeCalendars], syncEvents)
</script>

<template>
  <div class="panel-content">
    <ScheduleXCalendar :calendar-app="calendarApp" />

    <div class="cal-event-list">
      <div v-if="monthEvents.length === 0" class="cal-event-empty">No events this month</div>
      <div v-for="ev in monthEvents" :key="ev.id" class="cal-event-item">
        <span
          class="cal-event-dot"
          :style="{ background: CALENDAR_DEFS[ev.calendarId]?.color ?? '#888' }"
        />
        <span class="cal-event-date">{{ fmtEventDate(ev.start) }}</span>
        <span class="cal-event-title">{{ ev.title }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-content :deep(.sx__wrapper) {
  background: transparent;
  border: none;
  box-shadow: none;
  flex-shrink: 0;
}

.panel-content :deep(.sx__month-agenda-wrapper),
.panel-content :deep(.sx__view-container) {
  background: transparent;
}

.cal-event-list {
  flex: 1;
  overflow-y: auto;
  border-top: 1px solid rgba(80, 180, 255, 0.1);
  padding: 4px 0;
  min-height: 0;
}

.cal-event-empty {
  padding: 12px 12px;
  font-size: 11px;
  color: rgba(140, 210, 255, 0.25);
}

.cal-event-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px;
  font-size: 11px;
  border-radius: 4px;
  transition: background 0.12s;
}

.cal-event-item:hover {
  background: rgba(80, 180, 255, 0.05);
}

.cal-event-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.cal-event-date {
  color: rgba(140, 210, 255, 0.4);
  width: 90px;
  flex-shrink: 0;
}

.cal-event-title {
  color: rgba(190, 220, 250, 0.8);
  flex: 1;
}
</style>

import type { Component } from 'vue'

import CalendarPanel from './CalendarPanel.vue'
import WorldMapPanel from './WorldMapPanel.vue'
import MissingPersonsPanel from './MissingPersonsPanel.vue'

export interface PanelDef {
  type: string
  title: string
  component: Component
  defaultW: number
  defaultH: number
}

export const panelRegistry: Record<string, PanelDef> = {
  calendar: {
    type: 'calendar',
    title: 'Calendar',
    component: CalendarPanel,
    defaultW: 4,
    defaultH: 12,
  },
  'world-map': {
    type: 'world-map',
    title: 'World Map',
    component: WorldMapPanel,
    defaultW: 8,
    defaultH: 12,
  },
  'missing-persons': {
    type: 'missing-persons',
    title: 'Missing Persons',
    component: MissingPersonsPanel,
    defaultW: 12,
    defaultH: 14,
  },
}

export interface LayoutItem {
  i: string
  x: number
  y: number
  w: number
  h: number
  minH: number
  type: string
}

export const defaultLayout: LayoutItem[] = [
  { i: '0', x: 0, y: 0, w: 4, h: 14, minH: 1, type: 'calendar' },
  { i: '1', x: 4, y: 0, w: 8, h: 14, minH: 1, type: 'world-map' },
  { i: '2', x: 0, y: 14, w: 12, h: 14, minH: 1, type: 'missing-persons' },
]

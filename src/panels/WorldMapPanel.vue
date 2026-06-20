<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { Map, Layers, Sources } from 'vue3-openlayers'
import GeoJSON from 'ol/format/GeoJSON'
import Style from 'ol/style/Style'
import Fill from 'ol/style/Fill'
import Stroke from 'ol/style/Stroke'
import CircleStyle from 'ol/style/Circle'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import VectorSource from 'ol/source/Vector'
import VectorLayer from 'ol/layer/Vector'
import { DoubleClickZoom } from 'ol/interaction'
import type { FeatureLike } from 'ol/Feature'
import type OlMap from 'ol/Map'
import type MapBrowserEvent from 'ol/MapBrowserEvent'
import { useRegionStore } from '../stores/region'
import { useMarkerStore } from '../stores/marker'

const regionStore = useRegionStore()
const markerStore = useMarkerStore()
const mapRef = ref()

// ── Missing person marker ──────────────────────────────────────
const MARKER_STYLE = new Style({
  image: new CircleStyle({
    radius: 9,
    fill: new Fill({ color: 'rgba(255, 70, 70, 0.9)' }),
    stroke: new Stroke({ color: 'rgba(255, 255, 255, 0.9)', width: 2 }),
  }),
})

let _markerSource: VectorSource | null = null
let _markerLayer: VectorLayer<VectorSource> | null = null

function ensureMarkerLayer(map: OlMap) {
  if (_markerLayer) return
  _markerSource = new VectorSource()
  _markerLayer = new VectorLayer({ source: _markerSource, style: MARKER_STYLE, zIndex: 99 })
  map.addLayer(_markerLayer)
}

function updateMarker(map: OlMap) {
  ensureMarkerLayer(map)
  _markerSource!.clear()
  const c = markerStore.coords
  if (!c) return
  _markerSource!.addFeature(new Feature({ geometry: new Point([c.lon, c.lat]) }))
  map.getView().animate({ center: [c.lon, c.lat], zoom: Math.max(map.getView().getZoom() ?? 4, 7), duration: 600 })
}

watch(() => markerStore.coords, () => {
  const map: OlMap | undefined = mapRef.value?.map
  if (map) updateMarker(map)
})

const STATES_URL =
  'https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json'
const COUNTIES_URL =
  'https://raw.githubusercontent.com/plotly/datasets/master/geojson-counties-fips.json'

const SWITCH_ZOOM = 6

const geojsonFormat = new GeoJSON()

// FIPS → state info (for resolving county clicks)
const FIPS: Record<string, { name: string; abbr: string }> = {
  '01': { name: 'Alabama', abbr: 'AL' },
  '02': { name: 'Alaska', abbr: 'AK' },
  '04': { name: 'Arizona', abbr: 'AZ' },
  '05': { name: 'Arkansas', abbr: 'AR' },
  '06': { name: 'California', abbr: 'CA' },
  '08': { name: 'Colorado', abbr: 'CO' },
  '09': { name: 'Connecticut', abbr: 'CT' },
  '10': { name: 'Delaware', abbr: 'DE' },
  '11': { name: 'District of Columbia', abbr: 'DC' },
  '12': { name: 'Florida', abbr: 'FL' },
  '13': { name: 'Georgia', abbr: 'GA' },
  '15': { name: 'Hawaii', abbr: 'HI' },
  '16': { name: 'Idaho', abbr: 'ID' },
  '17': { name: 'Illinois', abbr: 'IL' },
  '18': { name: 'Indiana', abbr: 'IN' },
  '19': { name: 'Iowa', abbr: 'IA' },
  '20': { name: 'Kansas', abbr: 'KS' },
  '21': { name: 'Kentucky', abbr: 'KY' },
  '22': { name: 'Louisiana', abbr: 'LA' },
  '23': { name: 'Maine', abbr: 'ME' },
  '24': { name: 'Maryland', abbr: 'MD' },
  '25': { name: 'Massachusetts', abbr: 'MA' },
  '26': { name: 'Michigan', abbr: 'MI' },
  '27': { name: 'Minnesota', abbr: 'MN' },
  '28': { name: 'Mississippi', abbr: 'MS' },
  '29': { name: 'Missouri', abbr: 'MO' },
  '30': { name: 'Montana', abbr: 'MT' },
  '31': { name: 'Nebraska', abbr: 'NE' },
  '32': { name: 'Nevada', abbr: 'NV' },
  '33': { name: 'New Hampshire', abbr: 'NH' },
  '34': { name: 'New Jersey', abbr: 'NJ' },
  '35': { name: 'New Mexico', abbr: 'NM' },
  '36': { name: 'New York', abbr: 'NY' },
  '37': { name: 'North Carolina', abbr: 'NC' },
  '38': { name: 'North Dakota', abbr: 'ND' },
  '39': { name: 'Ohio', abbr: 'OH' },
  '40': { name: 'Oklahoma', abbr: 'OK' },
  '41': { name: 'Oregon', abbr: 'OR' },
  '42': { name: 'Pennsylvania', abbr: 'PA' },
  '44': { name: 'Rhode Island', abbr: 'RI' },
  '45': { name: 'South Carolina', abbr: 'SC' },
  '46': { name: 'South Dakota', abbr: 'SD' },
  '47': { name: 'Tennessee', abbr: 'TN' },
  '48': { name: 'Texas', abbr: 'TX' },
  '49': { name: 'Utah', abbr: 'UT' },
  '50': { name: 'Vermont', abbr: 'VT' },
  '51': { name: 'Virginia', abbr: 'VA' },
  '53': { name: 'Washington', abbr: 'WA' },
  '54': { name: 'West Virginia', abbr: 'WV' },
  '55': { name: 'Wisconsin', abbr: 'WI' },
  '56': { name: 'Wyoming', abbr: 'WY' },
  '72': { name: 'Puerto Rico', abbr: 'PR' },
}

// ── Highlight styles ───────────────────────────────────────────
const HIGHLIGHT_STATE = new Style({
  fill: new Fill({ color: 'rgba(255, 210, 60, 0.45)' }),
  stroke: new Stroke({ color: 'rgba(255, 220, 50, 1)', width: 3 }),
})

const HIGHLIGHT_COUNTY = new Style({
  fill: new Fill({ color: 'rgba(255, 210, 60, 0.35)' }),
  stroke: new Stroke({ color: 'rgba(255, 230, 80, 1)', width: 2.5 }),
})

// ── State border overlay (shown at county zoom, no fill) ──────
const STATE_BORDER_STYLE = new Style({
  stroke: new Stroke({ color: 'rgba(200, 220, 255, 0.55)', width: 1.5 }),
})

// ── Base styles (applied to all features via layer style function) ──
function hashHue(key: string): number {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (Math.imul(31, h) + key.charCodeAt(i)) | 0
  return (Math.abs(h) * 137) % 360
}

function stateStyle(feature: FeatureLike): Style {
  const name = String(feature.get('name') ?? feature.get('NAME') ?? '')
  const hue = hashHue(name)
  return new Style({
    fill: new Fill({ color: `hsla(${hue}, 48%, 32%, 0.5)` }),
    stroke: new Stroke({ color: 'rgba(190, 220, 255, 0.75)', width: 1.5 }),
  })
}

function countyStyle(feature: FeatureLike): Style {
  const key = String(feature.get('GEO_ID') ?? feature.get('NAME') ?? '')
  const hue = hashHue(key)
  return new Style({
    fill: new Fill({ color: `hsla(${hue}, 48%, 30%, 0.45)` }),
    stroke: new Stroke({ color: 'rgba(160, 195, 230, 0.45)', width: 0.5 }),
  })
}

// ── Per-feature highlight (bypasses layer style caching entirely) ──
// OL re-renders immediately when feature.setStyle() is called.
let _highlightedFeature: any = null

function applyHighlight(map: OlMap, stateName: string, countyGeoId: string) {
  if (_highlightedFeature) {
    _highlightedFeature.setStyle(undefined)
    _highlightedFeature = null
  }
  if (!stateName && !countyGeoId) return

  map.getAllLayers().forEach((l: any) => {
    if (_highlightedFeature) return // already found — skip remaining layers
    const source = l.getSource?.()
    if (!source?.getFeatures) return
    for (const f of source.getFeatures()) {
      if (countyGeoId) {
        // County GeoJSON uses GEO_ID — unambiguous
        if (String(f.get('GEO_ID') ?? '') === countyGeoId) {
          f.setStyle(HIGHLIGHT_COUNTY)
          _highlightedFeature = f
          break
        }
      } else {
        // State GeoJSON uses lowercase 'name'; county GeoJSON uses 'NAME'.
        // Matching only on lowercase 'name' avoids false hits on counties
        // like "Texas County, OK" when the user selected Texas state.
        if (f.get('name') === stateName) {
          f.setStyle(HIGHLIGHT_STATE)
          _highlightedFeature = f
          break
        }
      }
    }
  })
}

// ── Double-click handler ───────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleDblClick(evt: MapBrowserEvent<any>) {
  const map: OlMap = mapRef.value.map
  const zoom = map.getView().getZoom() ?? 0

  map.forEachFeatureAtPixel(evt.pixel, (feature) => {
    if (zoom < SWITCH_ZOOM) {
      const stateName = String(feature.get('name') ?? feature.get('NAME') ?? '')
      if (!stateName) return true
      regionStore.selectState({ name: stateName, abbr: '' })
      regionStore.selectCounty(null)
      applyHighlight(map, stateName, '')
    } else {
      const geoId = String(feature.get('GEO_ID') ?? '')
      if (!geoId) return false  // state border feature — skip, keep looking
      const countyShort = String(feature.get('NAME') ?? '')
      const lsad = String(feature.get('LSAD') ?? 'County')
      const countyName = `${countyShort} ${lsad}`
      const fips = String(feature.get('STATE') ?? '').padStart(2, '0')
      const stateInfo = FIPS[fips]
      if (!stateInfo) return false
      regionStore.selectState({ name: stateInfo.name, abbr: stateInfo.abbr })
      const county =
        regionStore.availableCounties.find(
          (c) => c.name === countyName && c.stateName === stateInfo.name,
        ) ?? { name: countyName, stateName: stateInfo.name }
      regionStore.selectCounty(county)
      applyHighlight(map, stateInfo.name, geoId)
    }
    return true
  })
}

// Clear highlight when the nav × button clears the region selection
watch(
  () => regionStore.selectedState,
  (state) => {
    if (!state) {
      const map: OlMap | undefined = mapRef.value?.map
      if (map) applyHighlight(map, '', '')
    }
  },
)

// ── Map lifecycle ──────────────────────────────────────────────
onMounted(async () => {
  await nextTick()
  const map: OlMap | undefined = mapRef.value?.map
  if (!map) return

  const dblZoom = map.getInteractions().getArray().find((i) => i instanceof DoubleClickZoom)
  if (dblZoom) map.removeInteraction(dblZoom)

  map.on('dblclick', handleDblClick)
})

onUnmounted(() => {
  mapRef.value?.map?.un('dblclick', handleDblClick)
  if (_markerLayer) {
    mapRef.value?.map?.removeLayer(_markerLayer)
    _markerLayer = null
    _markerSource = null
  }
})
</script>

<template>
  <div class="panel-content" @mousedown.stop @pointerdown.stop>
    <Map.OlMap ref="mapRef" style="height: 100%; width: 100%">
      <Map.OlView
        :center="[-98, 39]"
        :zoom="4"
        :min-zoom="3"
        :extent="[-180, 15, -65, 72]"
        projection="EPSG:4326"
      />

      <Layers.OlTileLayer>
        <Sources.OlSourceXYZ
          url="https://{a-d}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          :attributions="'&copy; <a href=\'https://www.openstreetmap.org/copyright\'>OpenStreetMap</a> contributors &copy; <a href=\'https://carto.com/attributions\'>CARTO</a>'"
          :max-zoom="19"
        />
      </Layers.OlTileLayer>

      <Layers.OlVectorLayer
        :max-zoom="SWITCH_ZOOM"
        :styles="stateStyle"
        :update-while-animating="true"
        :update-while-interacting="true"
      >
        <Sources.OlSourceVector :url="STATES_URL" :format="geojsonFormat" />
      </Layers.OlVectorLayer>

      <Layers.OlVectorLayer
        :min-zoom="SWITCH_ZOOM"
        :styles="countyStyle"
        :update-while-animating="true"
        :update-while-interacting="true"
      >
        <Sources.OlSourceVector :url="COUNTIES_URL" :format="geojsonFormat" />
      </Layers.OlVectorLayer>

      <!-- State borders rendered on top of counties when zoomed in -->
      <Layers.OlVectorLayer
        :min-zoom="SWITCH_ZOOM"
        :styles="STATE_BORDER_STYLE"
        :update-while-animating="true"
        :update-while-interacting="true"
      >
        <Sources.OlSourceVector :url="STATES_URL" :format="geojsonFormat" />
      </Layers.OlVectorLayer>
    </Map.OlMap>
  </div>
</template>

<style scoped>
.panel-content {
  width: 100%;
  height: 100%;
}
</style>

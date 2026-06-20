<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { AgGridVue } from 'ag-grid-vue3'
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  colorSchemeDark,
  type ColDef,
  type ValueGetterParams,
  type ValueFormatterParams,
  type CellClassParams,
} from 'ag-grid-community'
import { useRegionStore, type StateOption, type CountyOption } from '../stores/region'
import { useMarkerStore } from '../stores/marker'

ModuleRegistry.registerModules([AllCommunityModule])

// ── Types ──────────────────────────────────────────────────────
interface Address {
  city?: string
  state?: { id: number; name: string; displayName: string }
  county?: { id: number; name: string; displayName: string }
}

interface MissingCase {
  id: number
  idFormatted: string
  caseIsResolved: boolean
  createdDateTime: string
  modifiedDateTime: string
  hrefDefaultImageThumbnail?: string
  subjectIdentification: {
    firstName: string
    middleName?: string
    lastName: string
    nicknames?: string
    computedMissingMinAge: number
    computedMissingMaxAge: number
  }
  subjectDescription: {
    sex?: { name: string }
    ethnicities?: { name: string }[]
    heightFrom?: number
    weightFrom?: number
  }
  physicalDescription?: {
    hairColor?: { name: string }
    leftEyeColor?: { name: string }
    rightEyeColor?: { name: string }
    eyeDescription?: string
  }
  clothingAndAccessoriesArticles?: { article: { name: string }; description: string }[]
  sighting?: {
    date: string
    address?: Address
    publicGeolocation?: { coordinates?: { lat: number; lon: number } }
  }
  circumstances?: { circumstancesOfDisappearance: string }
  primaryInvestigatingAgency?: { name: string }
  investigatingAgencies?: { name: string; selection?: { agency?: { phone?: string } } }[]
}

// ── State ──────────────────────────────────────────────────────
const BASE_URL = 'https://raw.githubusercontent.com/ArtemisWatches/Namus/master/data/'

const DECADES = [
  'missing_2020s', 'missing_2010s', 'missing_2000s', 'missing_1990s',
  'missing_1980s', 'missing_1970s', 'missing_1960s', 'missing_1950s',
  'missing_1940s', 'missing_1930s',
]

const regionStore = useRegionStore()
const markerStore = useMarkerStore()
const cases = ref<MissingCase[]>([])
const totalCount = ref(0)
const loading = ref(false)
const error = ref<string | null>(null)
const selectedCase = ref<MissingCase | null>(null)

function fmtDate(dt?: string | null) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

const photoError = ref(false)
watch(selectedCase, (c) => {
  photoError.value = false
  const coords = c?.sighting?.publicGeolocation?.coordinates
  if (coords) markerStore.setMarker(coords.lat, coords.lon)
  else markerStore.clearMarker()
})

watch(() => [regionStore.selectedState, regionStore.selectedCounty], () => {
  selectedCase.value = null
})

function onRowClicked(event: any) {
  selectedCase.value = event.data ?? null
}

const NAMUS_BASE = 'https://www.namus.gov'

const detailImage = computed(() =>
  selectedCase.value?.hrefDefaultImageThumbnail
    ? NAMUS_BASE + selectedCase.value.hrefDefaultImageThumbnail
    : null
)

function fmtHeight(inches?: number): string {
  if (!inches) return '—'
  return `${Math.floor(inches / 12)}'${inches % 12}"`
}

function fmtWeight(lbs?: number): string {
  return lbs ? `${lbs} lbs` : '—'
}

function fmtPhone(phone?: string): string {
  if (!phone) return '—'
  return phone.length === 10
    ? `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`
    : phone
}

function fmtEyeColor(c: MissingCase): string {
  const l = c.physicalDescription?.leftEyeColor?.name
  const r = c.physicalDescription?.rightEyeColor?.name
  if (!l && !r) return '—'
  return l === r || !r ? (l ?? '—') : `${l} / ${r}`
}

// ── Data loading ───────────────────────────────────────────────
async function loadAll() {
  loading.value = true
  error.value = null
  cases.value = []

  try {
    const results = await Promise.all(
      DECADES.map((file) =>
        fetch(`${BASE_URL}${file}.json`)
          .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status} (${file})`); return r.json() })
      )
    )
    const all: MissingCase[] = results.flatMap((d) => d.cases ?? [])
    totalCount.value = all.length
    cases.value = all
    populateRegions(all)
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

function populateRegions(allCases: MissingCase[]) {
  const stateMap = new Map<string, StateOption>()
  const countyKey = new Set<string>()
  const counties: CountyOption[] = []

  for (const c of allCases) {
    const addr = c.sighting?.address
    if (!addr?.state) continue
    const { name, displayName } = addr.state
    if (!stateMap.has(name)) stateMap.set(name, { name, abbr: displayName })
    if (addr.county?.name) {
      const key = `${name}::${addr.county.name}`
      if (!countyKey.has(key)) {
        countyKey.add(key)
        counties.push({ name: addr.county.name, stateName: name })
      }
    }
  }

  regionStore.setAvailable(
    [...stateMap.values()].sort((a, b) => a.name.localeCompare(b.name)),
    counties.sort((a, b) => a.name.localeCompare(b.name)),
  )
}

// ── Filtered rows (drives AG Grid) ────────────────────────────
const filteredCases = computed(() => {
  const { selectedState, selectedCounty } = regionStore
  if (!selectedState) return cases.value
  return cases.value.filter((c) => {
    const addr = c.sighting?.address
    if (addr?.state?.name !== selectedState.name) return false
    if (selectedCounty && addr?.county?.name !== selectedCounty.name) return false
    return true
  })
})

// ── AG Grid theme ──────────────────────────────────────────────
const gridTheme = themeQuartz.withPart(colorSchemeDark).withParams({
  backgroundColor: 'transparent',
  foregroundColor: 'rgba(160, 210, 240, 0.75)',
  borderColor: 'rgba(80, 180, 255, 0.1)',
  accentColor: '#3ab0dd',
  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
  fontSize: 11,
  headerBackgroundColor: 'rgba(5, 10, 18, 0.95)',
  rowHoverColor: 'rgba(60, 160, 255, 0.06)',
  oddRowBackgroundColor: 'rgba(255, 255, 255, 0.01)',
  dataBackgroundColor: 'rgba(8, 14, 24, 0)',
  rowHeight: 30,
  headerFontSize: 10,
})

// ── Column definitions ─────────────────────────────────────────
const defaultColDef: ColDef = {
  sortable: true,
  filter: true,
  resizable: true,
}

const columnDefs: ColDef<MissingCase>[] = [
  {
    headerName: 'Case',
    field: 'idFormatted',
    width: 96,
    pinned: 'left',
    cellStyle: {
      fontFamily: "'SF Mono', 'Fira Code', monospace",
      fontSize: '10px',
      color: 'rgba(80, 180, 255, 0.6)',
    },
  },
  {
    headerName: 'Name',
    valueGetter: (p: ValueGetterParams<MissingCase>) => {
      const s = p.data?.subjectIdentification
      return s ? `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim() || '—' : '—'
    },
    flex: 1,
    minWidth: 120,
    cellStyle: { color: 'rgba(190, 220, 250, 0.9)', fontWeight: '500' },
  },
  {
    headerName: 'Age',
    valueGetter: (p: ValueGetterParams<MissingCase>) =>
      p.data?.subjectIdentification?.computedMissingMinAge ?? null,
    width: 66,
    type: 'numericColumn',
  },
  {
    headerName: 'Sex',
    valueGetter: (p: ValueGetterParams<MissingCase>) =>
      p.data?.subjectDescription?.sex?.name ?? '—',
    width: 72,
  },
  {
    headerName: 'Ethnicity',
    valueGetter: (p: ValueGetterParams<MissingCase>) =>
      p.data?.subjectDescription?.ethnicities?.[0]?.name ?? '—',
    flex: 1,
    minWidth: 110,
  },
  {
    headerName: 'Last Seen',
    valueGetter: (p: ValueGetterParams<MissingCase>) => p.data?.sighting?.date ?? null,
    valueFormatter: (p: ValueFormatterParams) =>
      p.value
        ? new Date(p.value).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : '—',
    width: 116,
  },
  {
    headerName: 'Entered',
    valueGetter: (p: ValueGetterParams<MissingCase>) => p.data?.createdDateTime ?? null,
    valueFormatter: (p: ValueFormatterParams) =>
      p.value
        ? new Date(p.value).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : '—',
    width: 116,
    sort: 'desc',
  },
  {
    headerName: 'Modified',
    valueGetter: (p: ValueGetterParams<MissingCase>) => p.data?.modifiedDateTime ?? null,
    valueFormatter: (p: ValueFormatterParams) =>
      p.value
        ? new Date(p.value).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : '—',
    width: 116,
  },
  {
    headerName: 'County',
    valueGetter: (p: ValueGetterParams<MissingCase>) =>
      p.data?.sighting?.address?.county?.name ?? '—',
    flex: 1,
    minWidth: 110,
  },
  {
    headerName: 'State',
    valueGetter: (p: ValueGetterParams<MissingCase>) =>
      p.data?.sighting?.address?.state?.displayName ?? '—',
    width: 66,
  },
  {
    headerName: 'Status',
    valueGetter: (p: ValueGetterParams<MissingCase>) =>
      p.data?.caseIsResolved ? 'Resolved' : 'Open',
    width: 90,
    cellStyle: (p: CellClassParams<MissingCase>) => ({
      color: p.data?.caseIsResolved
        ? 'rgba(80, 220, 140, 0.75)'
        : 'rgba(255, 180, 80, 0.8)',
      fontWeight: '600',
      fontSize: '10px',
      letterSpacing: '0.04em',
    }),
  },
]

onMounted(() => loadAll())
</script>

<template>
  <div class="mp-panel">
    <div class="mp-toolbar">
      <span v-if="!loading && !error" class="mp-count">
        <template v-if="regionStore.selectedState">
          {{ filteredCases.length.toLocaleString() }} of {{ totalCount.toLocaleString() }}
        </template>
        <template v-else>
          {{ totalCount.toLocaleString() }} cases
        </template>
      </span>
    </div>

    <div class="mp-content">
      <!-- Detail panel -->
      <div v-if="selectedCase" class="mp-detail">
        <div class="mp-detail-header">
          <span class="mp-detail-id">{{ selectedCase.idFormatted }}</span>
          <span class="mp-detail-status" :class="selectedCase.caseIsResolved ? 'is-resolved' : 'is-open'">
            {{ selectedCase.caseIsResolved ? 'Resolved' : 'Open' }}
          </span>
          <button class="mp-detail-close" @click="selectedCase = null">✕</button>
        </div>

        <div v-if="detailImage && !photoError" class="mp-detail-photo">
          <img :src="detailImage" :alt="`${selectedCase.subjectIdentification.firstName} ${selectedCase.subjectIdentification.lastName}`" @error="photoError = true" />
        </div>

        <div class="mp-detail-name">
          {{ selectedCase.subjectIdentification.firstName }}
          {{ selectedCase.subjectIdentification.middleName ? selectedCase.subjectIdentification.middleName + ' ' : '' }}{{ selectedCase.subjectIdentification.lastName }}
        </div>
        <div v-if="selectedCase.subjectIdentification.nicknames" class="mp-detail-nicknames">
          "{{ selectedCase.subjectIdentification.nicknames }}"
        </div>

        <div class="mp-detail-fields">

          <!-- Identity -->
          <div class="mp-detail-row">
            <span class="mp-detail-label">Age at disappearance</span>
            <span class="mp-detail-value">
              {{
                selectedCase.subjectIdentification.computedMissingMinAge === selectedCase.subjectIdentification.computedMissingMaxAge
                  ? selectedCase.subjectIdentification.computedMissingMinAge
                  : `${selectedCase.subjectIdentification.computedMissingMinAge}–${selectedCase.subjectIdentification.computedMissingMaxAge}`
              }}
            </span>
          </div>
          <div class="mp-detail-row">
            <span class="mp-detail-label">Sex</span>
            <span class="mp-detail-value">{{ selectedCase.subjectDescription.sex?.name ?? '—' }}</span>
          </div>
          <div class="mp-detail-row">
            <span class="mp-detail-label">Ethnicity</span>
            <span class="mp-detail-value">{{ selectedCase.subjectDescription.ethnicities?.[0]?.name ?? '—' }}</span>
          </div>

          <div class="mp-detail-divider" />

          <!-- Physical description -->
          <div class="mp-detail-row">
            <span class="mp-detail-label">Height</span>
            <span class="mp-detail-value">{{ fmtHeight(selectedCase.subjectDescription.heightFrom) }}</span>
          </div>
          <div class="mp-detail-row">
            <span class="mp-detail-label">Weight</span>
            <span class="mp-detail-value">{{ fmtWeight(selectedCase.subjectDescription.weightFrom) }}</span>
          </div>
          <div class="mp-detail-row">
            <span class="mp-detail-label">Hair</span>
            <span class="mp-detail-value">{{ selectedCase.physicalDescription?.hairColor?.name ?? '—' }}</span>
          </div>
          <div class="mp-detail-row">
            <span class="mp-detail-label">Eyes</span>
            <span class="mp-detail-value">{{ fmtEyeColor(selectedCase) }}</span>
          </div>
          <div v-if="selectedCase.physicalDescription?.eyeDescription" class="mp-detail-block">
            <p class="mp-detail-block-text">{{ selectedCase.physicalDescription.eyeDescription }}</p>
          </div>

          <div class="mp-detail-divider" />

          <!-- Last seen -->
          <div class="mp-detail-row">
            <span class="mp-detail-label">Last Seen</span>
            <span class="mp-detail-value">{{ fmtDate(selectedCase.sighting?.date) }}</span>
          </div>
          <div class="mp-detail-row">
            <span class="mp-detail-label">City</span>
            <span class="mp-detail-value">{{ selectedCase.sighting?.address?.city ?? '—' }}</span>
          </div>
          <div class="mp-detail-row">
            <span class="mp-detail-label">County</span>
            <span class="mp-detail-value">{{ selectedCase.sighting?.address?.county?.name ?? '—' }}</span>
          </div>
          <div class="mp-detail-row">
            <span class="mp-detail-label">State</span>
            <span class="mp-detail-value">{{ selectedCase.sighting?.address?.state?.displayName ?? '—' }}</span>
          </div>

          <!-- Clothing -->
          <template v-if="selectedCase.clothingAndAccessoriesArticles?.length">
            <div class="mp-detail-divider" />
            <div class="mp-detail-block">
              <span class="mp-detail-label">Clothing &amp; Items</span>
              <div
                v-for="item in selectedCase.clothingAndAccessoriesArticles"
                :key="item.article.name + item.description"
                class="mp-detail-clothing-item"
              >
                <span class="mp-detail-clothing-type">{{ item.article.name }}</span>
                <span class="mp-detail-block-text">{{ item.description }}</span>
              </div>
            </div>
          </template>

          <!-- Circumstances -->
          <template v-if="selectedCase.circumstances?.circumstancesOfDisappearance">
            <div class="mp-detail-divider" />
            <div class="mp-detail-block">
              <span class="mp-detail-label">Circumstances</span>
              <p class="mp-detail-block-text">{{ selectedCase.circumstances.circumstancesOfDisappearance }}</p>
            </div>
          </template>

          <div class="mp-detail-divider" />

          <!-- Investigating agency -->
          <div v-if="selectedCase.primaryInvestigatingAgency?.name" class="mp-detail-row">
            <span class="mp-detail-label">Agency</span>
            <span class="mp-detail-value">{{ selectedCase.primaryInvestigatingAgency.name }}</span>
          </div>
          <div v-if="selectedCase.investigatingAgencies?.[0]?.selection?.agency?.phone" class="mp-detail-row">
            <span class="mp-detail-label">Phone</span>
            <span class="mp-detail-value">{{ fmtPhone(selectedCase.investigatingAgencies[0].selection?.agency?.phone) }}</span>
          </div>

          <div class="mp-detail-divider" />

          <!-- Record dates -->
          <div class="mp-detail-row">
            <span class="mp-detail-label">Entered</span>
            <span class="mp-detail-value">{{ fmtDate(selectedCase.createdDateTime) }}</span>
          </div>
          <div class="mp-detail-row">
            <span class="mp-detail-label">Modified</span>
            <span class="mp-detail-value">{{ fmtDate(selectedCase.modifiedDateTime) }}</span>
          </div>

        </div>
      </div>

      <!-- Grid area -->
      <div class="mp-grid-wrap">
        <div v-if="loading" class="mp-state">
          <span class="mp-spinner" />
          Loading…
        </div>

        <div v-else-if="error" class="mp-state mp-error">
          Failed to load: {{ error }}
        </div>

        <AgGridVue
          v-else
          :theme="gridTheme"
          :columnDefs="columnDefs"
          :rowData="filteredCases"
          :defaultColDef="defaultColDef"
          :rowBuffer="20"
          class="mp-grid"
          @row-clicked="onRowClicked"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.mp-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.mp-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  border-bottom: 1px solid rgba(80, 180, 255, 0.1);
  flex-shrink: 0;
}

.mp-count {
  font-size: 10px;
  color: rgba(140, 210, 255, 0.35);
  letter-spacing: 0.03em;
}

.mp-content {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* ── Detail panel ── */
.mp-detail {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(80, 180, 255, 0.1);
  overflow-y: auto;
  background: rgba(5, 10, 18, 0.6);
}

.mp-detail-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px 6px;
  border-bottom: 1px solid rgba(80, 180, 255, 0.08);
  flex-shrink: 0;
}

.mp-detail-id {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 10px;
  color: rgba(80, 180, 255, 0.55);
  flex: 1;
}

.mp-detail-status {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 2px 5px;
  border-radius: 3px;
}

.mp-detail-status.is-open {
  color: rgba(255, 180, 80, 0.9);
  background: rgba(255, 180, 80, 0.08);
}

.mp-detail-status.is-resolved {
  color: rgba(80, 220, 140, 0.9);
  background: rgba(80, 220, 140, 0.08);
}

.mp-detail-close {
  background: none;
  border: none;
  color: rgba(140, 210, 255, 0.3);
  cursor: pointer;
  font-size: 12px;
  padding: 0 2px;
  line-height: 1;
  transition: color 0.15s;
}

.mp-detail-close:hover {
  color: rgba(140, 210, 255, 0.7);
}

.mp-detail-photo {
  width: 100%;
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  max-height: 200px;
}

.mp-detail-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
  display: block;
}

.mp-detail-name {
  padding: 10px 10px 6px;
  font-size: 14px;
  font-weight: 600;
  color: rgba(190, 220, 250, 0.95);
  line-height: 1.3;
  flex-shrink: 0;
}

.mp-detail-fields {
  padding: 4px 0 12px;
  display: flex;
  flex-direction: column;
}

.mp-detail-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  padding: 3px 10px;
}

.mp-detail-label {
  font-size: 10px;
  color: rgba(140, 210, 255, 0.35);
  letter-spacing: 0.04em;
  flex-shrink: 0;
}

.mp-detail-value {
  font-size: 11px;
  color: rgba(160, 210, 240, 0.8);
  text-align: right;
}

.mp-detail-nicknames {
  padding: 0 10px 8px;
  font-size: 11px;
  font-style: italic;
  color: rgba(140, 210, 255, 0.45);
}

.mp-detail-divider {
  height: 1px;
  background: rgba(80, 180, 255, 0.07);
  margin: 6px 10px;
}

.mp-detail-block {
  padding: 3px 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.mp-detail-block-text {
  font-size: 11px;
  color: rgba(160, 210, 240, 0.7);
  line-height: 1.55;
  margin: 0;
}

.mp-detail-clothing-item {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding-top: 4px;
}

.mp-detail-clothing-type {
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(140, 210, 255, 0.3);
}

/* ── Grid area ── */
.mp-grid-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.mp-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: 1;
  font-size: 12px;
  color: rgba(140, 210, 255, 0.35);
}

.mp-error {
  color: rgba(255, 100, 100, 0.6);
}

.mp-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(80, 180, 255, 0.15);
  border-top-color: rgba(80, 180, 255, 0.6);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.mp-grid {
  flex: 1;
  min-height: 0;
}
</style>

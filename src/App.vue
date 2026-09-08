<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { validateCatalog, validateDataset, type RaceDataset } from './data/raceDataset'
import BarRaceChart from './components/BarRaceChart.vue'

const datasets = ref<RaceDataset[]>([])
const charts = ref<InstanceType<typeof BarRaceChart>[]>([])

function controlSelectedCharts(action: 'play' | 'pause' | 'reset') {
  charts.value.forEach((chart) => chart[action]())
  closePicker()
}
const selectedChartIds = ref<string[]>([])
const visibleDatasets = computed(() =>
  datasets.value.filter((dataset) => selectedChartIds.value.includes(dataset.id)),
)
const selectionLabel = computed(() =>
  visibleDatasets.value.length === 1
    ? visibleDatasets.value[0]!.title
    : `${visibleDatasets.value.length} charts selected`,
)
const error = ref('')
const loading = ref(false)
const chartPicker = ref<HTMLDetailsElement>()
const draggedChartId = ref<string>()

function startDragging(chartId: string) {
  draggedChartId.value = chartId
}

function dropChart(targetChartId: string) {
  const sourceChartId = draggedChartId.value
  draggedChartId.value = undefined
  if (!sourceChartId || sourceChartId === targetChartId) return

  const sourceIndex = datasets.value.findIndex((dataset) => dataset.id === sourceChartId)
  const targetIndex = datasets.value.findIndex((dataset) => dataset.id === targetChartId)
  if (sourceIndex < 0 || targetIndex < 0) return

  const reordered = [...datasets.value]
  const [chart] = reordered.splice(sourceIndex, 1)
  if (!chart) return
  reordered.splice(targetIndex, 0, chart)
  datasets.value = reordered
}

function closePickerOutside(event: PointerEvent) {
  const picker = chartPicker.value
  if (picker?.open && !event.composedPath().includes(picker)) {
    picker.open = false
  }
}

function closePicker() {
  const picker = chartPicker.value
  if (picker?.open) {
    picker.open = false
    picker.querySelector('summary')?.focus()
  }
}

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const response = await fetch('/api/race-data')
    if (!response.ok) {
      const body = await response.json()
      throw new Error(body.error || 'Unable to load chart data.')
    }
    const catalog = validateCatalog(await response.json())
    datasets.value = await Promise.all(
      catalog.charts.map(async (entry) => {
        const result = await fetch(`/api/race-data?id=${encodeURIComponent(entry.id)}`)
        if (!result.ok)
          throw new Error(`Unable to load ${entry.title}. Run npm run blob:seed and retry.`)
        const data = validateDataset(await result.json())
        if (data.id !== entry.id) throw new Error('Chart ID mismatch.')
        return data
      }),
    )
    if (!selectedChartIds.value.length && datasets.value[0])
      selectedChartIds.value = [datasets.value[0].id]
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Unable to load chart data.'
  } finally {
    loading.value = false
  }
}
onMounted(() => {
  document.addEventListener('pointerdown', closePickerOutside, true)
  void loadData()
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', closePickerOutside, true)
})
</script>

<template>
  <header class="navbar">
    <nav aria-label="Main navigation">
      <div class="nav-start">
        <a class="brand" href="/" aria-label="Race Charts home">
          <span class="brand-mark" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="3" y="4" width="21" height="5" rx="2" fill="currentColor" />
              <rect x="3" y="12" width="15" height="5" rx="2" fill="currentColor" opacity="0.8" />
              <rect x="3" y="20" width="9" height="5" rx="2" fill="currentColor" opacity="0.6" />
            </svg>
          </span>
        </a>
        <a class="nav-link" href="/" aria-current="page">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" />
          </svg>
          Home
        </a>
      </div>
      <div class="brand-copy">
        <span class="brand-name">Race Charts</span>
        <span class="brand-tagline">Watch rankings change</span>
      </div>
    </nav>
  </header>
  <main class="dashboard" aria-label="Main content">
    <div v-if="datasets.length" class="chart-selector">
      <span id="chart-select-label">Race charts</span>
      <details ref="chartPicker" class="chart-picker" @keydown.esc="closePicker">
        <summary aria-labelledby="chart-select-label chart-selection">
          <span id="chart-selection">{{ selectionLabel }}</span>
        </summary>
        <div class="chart-options" role="group" aria-labelledby="chart-select-label">
          <div
            v-for="dataset in datasets"
            :key="dataset.id"
            class="chart-option"
            :class="{ 'is-dragging': draggedChartId === dataset.id }"
            draggable="true"
            @dragstart="startDragging(dataset.id)"
            @dragover.prevent
            @drop="dropChart(dataset.id)"
            @dragend="draggedChartId = undefined"
          >
            <button
              type="button"
              class="drag-handle"
              :aria-label="`Drag to reorder ${dataset.title}`"
              title="Drag to reorder"
              @mousedown="startDragging(dataset.id)"
            >
              <span aria-hidden="true">::</span>
            </button>
            <input v-model="selectedChartIds" type="checkbox" :value="dataset.id" />
            <span class="chart-option-title">{{ dataset.title }}</span>
          </div>
          <div
            v-if="visibleDatasets.length > 1"
            class="chart-batch-controls"
            aria-label="Control selected charts"
          >
            <button type="button" @click="controlSelectedCharts('play')">Play all</button>
            <button type="button" @click="controlSelectedCharts('pause')">Pause all</button>
            <button type="button" @click="controlSelectedCharts('reset')">Reset all</button>
          </div>
        </div>
      </details>
    </div>
    <p v-if="loading" role="status">Loading chart data…</p>
    <div v-else-if="error" role="alert">
      <p>{{ error }}</p>
      <button type="button" @click="loadData">Retry</button>
    </div>
    <p v-if="datasets.length && !visibleDatasets.length" role="status">
      Select one or more charts above.
    </p>
    <div v-if="visibleDatasets.length" class="chart-grid">
      <BarRaceChart
        v-for="(dataset, index) in visibleDatasets"
        :key="dataset.id"
        ref="charts"
        :chart-number="index + 1"
        :dataset="dataset"
      />
    </div>
  </main>
</template>

<style src="./styles/app.css"></style>

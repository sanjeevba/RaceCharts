<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { validateCatalog, validateDataset, type RaceDataset } from './data/raceDataset'
import BarRaceChart from './components/BarRaceChart.vue'

const datasets = ref<RaceDataset[]>([])
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
onMounted(loadData)
</script>

<template>
  <header class="navbar">
    <nav aria-label="Main navigation">
      <a class="brand" href="/">RaceCharts</a>
      <a class="nav-link" href="/" aria-current="page">Home</a>
    </nav>
  </header>
  <main class="dashboard" aria-label="Main content">
    <div v-if="datasets.length" class="chart-selector">
      <span id="chart-select-label">Race charts</span>
      <details class="chart-picker">
        <summary aria-labelledby="chart-select-label chart-selection">
          <span id="chart-selection">{{ selectionLabel }}</span>
        </summary>
        <div class="chart-options" role="group" aria-labelledby="chart-select-label">
          <label v-for="dataset in datasets" :key="dataset.id">
            <input v-model="selectedChartIds" type="checkbox" :value="dataset.id" />
            {{ dataset.title }}
          </label>
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
        :chart-number="index + 1"
        :dataset="dataset"
      />
    </div>
  </main>
</template>

<style src="./styles/app.css"></style>

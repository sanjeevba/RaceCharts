<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { validateCatalog, validateDataset, type RaceDataset } from './data/raceDataset'
import BarRaceChart from './components/BarRaceChart.vue'

const datasets = ref<RaceDataset[]>([])
const selectedChartId = ref('')
const visibleDatasets = computed(() =>
  selectedChartId.value === 'all'
    ? datasets.value
    : datasets.value.filter((dataset) => dataset.id === selectedChartId.value),
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
    if (!selectedChartId.value) selectedChartId.value = datasets.value[0]?.id ?? ''
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
      <label for="chart-select">Race chart</label>
      <select id="chart-select" v-model="selectedChartId">
        <option v-for="dataset in datasets" :key="dataset.id" :value="dataset.id">
          {{ dataset.title }}
        </option>
        <option value="all">All charts</option>
      </select>
    </div>
    <p v-if="loading" role="status">Loading chart data…</p>
    <div v-else-if="error" role="alert">
      <p>{{ error }}</p>
      <button type="button" @click="loadData">Retry</button>
    </div>
    <div v-if="datasets.length" class="chart-grid">
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

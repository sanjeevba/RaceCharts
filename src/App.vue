<script setup lang="ts">
import { ref } from 'vue'
import BarRaceChart from './components/BarRaceChart.vue'

const charts = ref<InstanceType<typeof BarRaceChart>[]>([])

function controlAll(action: 'play' | 'pause' | 'restart') {
  charts.value.forEach((chart) => chart[action]())
}
</script>

<template>
  <header class="navbar">
    <nav aria-label="Main navigation">
      <a class="brand" href="/">RaceCharts</a>
      <a class="nav-link" href="/" aria-current="page">Home</a>
    </nav>
  </header>
  <main class="dashboard" aria-label="Main content">
    <h1>Country race charts</h1>
    <p>Compare four charts running together, or control each chart individually.</p>
    <div class="dashboard-controls" aria-label="Control all charts">
      <button type="button" @click="controlAll('play')">Play all</button>
      <button type="button" @click="controlAll('pause')">Pause all</button>
      <button type="button" @click="controlAll('restart')">Restart all</button>
    </div>
    <div class="chart-grid">
      <BarRaceChart v-for="number in 1" :key="number" ref="charts" :chart-number="number" />
    </div>
  </main>
</template>

<style src="./styles/app.css"></style>

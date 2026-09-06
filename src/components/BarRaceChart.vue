<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { init, use, type EChartsType, type ComposeOption } from 'echarts/core'
import { BarChart, type BarSeriesOption } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  type GridComponentOption,
  type TooltipComponentOption,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

import type { RaceDataset } from '../data/raceDataset'

use([BarChart, GridComponent, TooltipComponent, CanvasRenderer])
type ChartOption = ComposeOption<BarSeriesOption | GridComponentOption | TooltipComponentOption>

const container = ref<HTMLDivElement>()
const { dataset } = defineProps<{ chartNumber: number; dataset: RaceDataset }>()
const raceFrames = dataset.frames
const countries = dataset.entities.map((entity) => ({
  ...entity,
  code: entity.id,
  flag: import.meta.env.BASE_URL + `flags/${entity.flagCode}.png`,
}))
const numberFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 })
const frameIndex = ref(0)
const playing = ref(false)
const frame = computed(() => raceFrames[frameIndex.value]!)
let chart: EChartsType | undefined
let timer: ReturnType<typeof setInterval> | undefined
let resizeObserver: ResizeObserver | undefined
const interval = 2000

function render(reset = false) {
  const option: ChartOption = {
    grid: { top: 20, right: 55, bottom: 45, left: 140 },
    tooltip: { trigger: 'item', valueFormatter: (value) => `${value} ${dataset.unit}` },
    xAxis: {
      max: 'dataMax',
      axisLabel: { formatter: (value: number) => numberFormat.format(value) },
    },
    yAxis: {
      type: 'category',
      data: countries.map((country) => country.name),
      inverse: true,
      axisLabel: {
        formatter: (name: string) => {
          const country = countries.find((entry) => entry.name === name)
          return country ? `{${country.code}|}  ${name}` : name
        },
        rich: Object.fromEntries(
          countries.map((country) => [
            country.code,
            {
              width: 24,
              height: 16,
              align: 'center',
              backgroundColor: { image: country.flag },
            },
          ]),
        ),
      },
      axisLine: { show: false },
      axisTick: { show: false },
      animationDuration: 300,
      animationDurationUpdate: 300,
    },
    series: [
      {
        id: dataset.id,
        name: dataset.title,
        type: 'bar',
        realtimeSort: true,
        barMaxWidth: 42,
        data: countries.map((country) => ({
          name: country.name,
          value: frame.value.values[country.id]!,
          itemStyle: { color: country.color, borderRadius: [0, 5, 5, 0] },
        })),
        label: {
          show: true,
          position: 'right',
          valueAnimation: true,
          formatter: (params) => numberFormat.format(Number(params.value)),
        },
      },
    ],
    animationDuration: 0,
    animationDurationUpdate: interval,
    animationEasing: 'linear',
    animationEasingUpdate: 'linear',
  }
  chart?.setOption(option, { notMerge: reset })
}

function pause() {
  clearInterval(timer)
  timer = undefined
  playing.value = false
}

function play() {
  if (playing.value) return
  if (frameIndex.value === raceFrames.length - 1) {
    frameIndex.value = 0
    render(true)
  }
  playing.value = true
  timer = setInterval(() => {
    if (frameIndex.value === raceFrames.length - 1) {
      pause()
      return
    }
    frameIndex.value += 1
    render()
  }, interval)
}

function restart() {
  pause()
  frameIndex.value = 0
  render(true)
  play()
}

onMounted(() => {
  if (!container.value) return
  chart = init(container.value)
  render()
  resizeObserver = new ResizeObserver(() => chart?.resize())
  resizeObserver.observe(container.value)
})

onBeforeUnmount(() => {
  pause()
  resizeObserver?.disconnect()
  chart?.dispose()
})
</script>

<template>
  <section class="race-demo" :aria-labelledby="`race-title-${chartNumber}`">
    <div class="race-heading">
      <div>
        <h2 :id="`race-title-${chartNumber}`">{{ dataset.title }}</h2>
        <p>{{ dataset.description }}</p>
      </div>
      <strong class="race-year">{{ frame.period }}</strong>
    </div>
    <div class="race-controls">
      <button type="button" @click="playing ? pause() : play()">
        {{ playing ? 'Pause' : frameIndex === raceFrames.length - 1 ? 'Replay' : 'Play' }}
      </button>
      <button type="button" class="secondary" @click="restart">Restart</button>
      <span>{{ dataset.unit }}</span>
    </div>
    <div
      ref="container"
      class="race-chart"
      role="img"
      :aria-label="`${dataset.title} for ${frame.period}. Exact values are available below.`"
    ></div>
    <p v-if="dataset.isSample" class="sample-note">
      Fictional data for demonstration only; these are not actual country statistics. Each step
      advances one year.
    </p>
    <p class="sample-note">Updated: {{ new Date(dataset.updatedAt).toLocaleDateString() }}</p>
    <ul v-if="dataset.sources.length">
      <li v-for="source in dataset.sources" :key="source.url">
        <a :href="source.url" target="_blank" rel="noopener noreferrer">{{ source.name }}</a>
      </li>
    </ul>
    <details>
      <summary>View data for {{ frame.period }}</summary>
      <table>
        <caption>
          {{
            dataset.title
          }}
          ({{
            dataset.unit
          }})
        </caption>
        <thead>
          <tr>
            <th scope="col">Country</th>
            <th scope="col">{{ dataset.unit }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="country in countries" :key="country.name">
            <th scope="row">
              <img class="country-flag" :src="country.flag" alt="" width="24" height="16" />
              {{ country.name }}
            </th>
            <td>{{ numberFormat.format(frame.values[country.id]!) }}</td>
          </tr>
        </tbody>
      </table>
    </details>
  </section>
</template>

<style scoped src="../styles/bar-race-chart.css"></style>

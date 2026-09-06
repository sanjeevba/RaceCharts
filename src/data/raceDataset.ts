export interface ChartCatalog {
  schemaVersion: 1
  charts: { id: string; title: string }[]
}
export interface RaceDataset {
  schemaVersion: 1
  id: string
  title: string
  description: string
  unit: string
  isSample: boolean
  updatedAt: string
  entityLabel?: string
  sources: { name: string; url?: string }[]
  entities: { id: string; name: string; flagCode?: string; color: string }[]
  frames: { period: string; values: Record<string, number> }[]
}
export const validChartId = (id: unknown): id is string =>
  typeof id === 'string' && /^[a-z][a-z0-9-]{0,79}$/.test(id) && id !== 'catalog'
const text = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

export function validateCatalog(value: unknown): ChartCatalog {
  const catalog = value as ChartCatalog
  if (
    !catalog ||
    catalog.schemaVersion !== 1 ||
    !Array.isArray(catalog.charts) ||
    !catalog.charts.length ||
    catalog.charts.some((chart) => !chart || !validChartId(chart.id) || !text(chart.title)) ||
    new Set(catalog.charts.map((chart) => chart.id)).size !== catalog.charts.length
  ) {
    throw new Error('Invalid chart catalog.')
  }
  return catalog
}
export function validateDataset(value: unknown): RaceDataset {
  const data = value as RaceDataset
  if (
    !data ||
    data.schemaVersion !== 1 ||
    !validChartId(data.id) ||
    !text(data.title) ||
    !text(data.description) ||
    !text(data.unit) ||
    typeof data.isSample !== 'boolean' ||
    !text(data.updatedAt) ||
    !Number.isFinite(Date.parse(data.updatedAt)) ||
    !Array.isArray(data.sources) ||
    data.sources.some(
      (source) =>
        !source ||
        !text(source.name) ||
        (source.url !== undefined && !/^https?:\/\//.test(source.url)),
    ) ||
    (!data.isSample && !data.sources.length) ||
    !Array.isArray(data.entities) ||
    !data.entities.length ||
    data.entities.some(
      (entity) =>
        !entity ||
        !validChartId(entity.id) ||
        !text(entity.name) ||
        (entity.flagCode !== undefined && !/^[a-z]{2}$/.test(entity.flagCode)) ||
        !/^#[0-9a-f]{6}$/i.test(entity.color),
    ) ||
    new Set(data.entities.map((entity) => entity.id)).size !== data.entities.length ||
    !Array.isArray(data.frames) ||
    data.frames.length < 2
  ) {
    throw new Error('Invalid chart metadata or entities.')
  }
  const ids = data.entities.map((entity) => entity.id)
  let previousPeriod = ''
  const periodLength = data.frames[0]?.period?.length
  for (const frame of data.frames) {
    if (
      !frame ||
      typeof frame.period !== 'string' ||
      !/^\d{4}(-(0[1-9]|1[0-2]))?$/.test(frame.period) ||
      frame.period.length !== periodLength ||
      frame.period <= previousPeriod ||
      !frame.values ||
      typeof frame.values !== 'object' ||
      Array.isArray(frame.values) ||
      Object.keys(frame.values).length !== ids.length ||
      !ids.every(
        (id) =>
          Object.hasOwn(frame.values, id) &&
          typeof frame.values[id] === 'number' &&
          Number.isFinite(frame.values[id]) &&
          frame.values[id]! >= 0,
      )
    ) {
      throw new Error(
        'Invalid chart frame: use increasing years or months and a non-negative value for each entity ID.',
      )
    }
    previousPeriod = frame.period
  }
  return data
}

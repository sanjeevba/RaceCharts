import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { validateCatalog, validateDataset } from '../src/data/raceDataset.ts'
import handler from '../api/race-data.ts'

const catalog = validateCatalog(
  JSON.parse(await readFile(new URL('../data/catalog.json', import.meta.url))),
)
for (const entry of catalog.charts) {
  const data = validateDataset(
    JSON.parse(await readFile(new URL('../data/' + entry.id + '.json', import.meta.url))),
  )
  assert.equal(data.id, entry.id)
  assert.equal(data.title, entry.title)
}
const sample = JSON.parse(await readFile(new URL('../data/country-sales.json', import.meta.url)))
assert.equal(validateDataset(sample).frames.length, 8)
assert.equal(sample.frames[0].values.ca, 120)
for (const mutate of [
  (data) => {
    data.unit = ''
  },
  (data) => {
    data.entities.push(data.entities[0])
  },
  (data) => {
    data.frames[1].period = data.frames[0].period
  },
  (data) => {
    delete data.frames[0].values.ca
  },
  (data) => {
    data.frames[0].values.ca = -1
  },
  (data) => {
    data.frames[0].values.ca = '120'
  },
  (data) => {
    data.frames[0].values.unknown = 123
  },
  (data) => {
    data.isSample = false
  },
]) {
  const invalid = structuredClone(sample)
  mutate(invalid)
  assert.throws(() => validateDataset(invalid))
}
assert.throws(() =>
  validateCatalog({ schemaVersion: 1, charts: [{ id: '../secret', title: 'Invalid' }] }),
)
assert.throws(() => validateCatalog({ ...catalog, charts: [catalog.charts[0], catalog.charts[0]] }))
delete process.env.BLOB_READ_WRITE_TOKEN
for (const [method, expectedStatus] of [
  ['GET', 503],
  ['POST', 405],
]) {
  await handler(
    { method },
    {
      setHeader() {},
      writeHead(status) {
        assert.equal(status, expectedStatus)
        return this
      },
      end(body) {
        assert.equal(typeof JSON.parse(body).error, 'string')
      },
    },
  )
}
// Malformed IDs must be rejected before accessing storage.
process.env.BLOB_READ_WRITE_TOKEN = 'test-placeholder'
await handler(
  { method: 'GET', url: '/api/race-data?id=..%2Fsecret' },
  {
    setHeader() {},
    writeHead(status) {
      assert.equal(status, 400)
      return this
    },
    end(body) {
      assert.match(JSON.parse(body).error, /Invalid chart ID/)
    },
  },
)
delete process.env.BLOB_READ_WRITE_TOKEN
console.log('Catalog, dataset, and API validation checks passed.')

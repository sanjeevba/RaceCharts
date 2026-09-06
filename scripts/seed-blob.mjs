import { readFile } from 'node:fs/promises'
import { put } from '@vercel/blob'
import { validateCatalog, validateDataset } from '../src/data/raceDataset.ts'

try {
  const catalog = validateCatalog(
    JSON.parse(await readFile(new URL('../data/catalog.json', import.meta.url), 'utf8')),
  )
  // Validate every file before making any writes.
  const datasets = await Promise.all(
    catalog.charts.map(async (entry) => {
      const data = validateDataset(
        JSON.parse(
          await readFile(new URL('../data/' + entry.id + '.json', import.meta.url), 'utf8'),
        ),
      )
      if (data.id !== entry.id || data.title !== entry.title)
        throw new Error('Catalog metadata mismatch')
      return data
    }),
  )
  if (process.argv.includes('--check')) {
    console.log('Validated catalog and ' + datasets.length + ' datasets. No uploads performed.')
  } else {
    if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error('Missing token')
    const options = {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
      cacheControlMaxAge: 60,
    }
    for (const data of datasets) {
      await put('charts/' + data.id + '.json', JSON.stringify(data), options)
      console.log('Uploaded charts/' + data.id + '.json')
    }
    // Publish the catalog only after all datasets are uploaded successfully.
    await put('charts/catalog.json', JSON.stringify(catalog), options)
    console.log('Uploaded charts/catalog.json')
  }
} catch {
  console.error(
    'Seed failed. Check dataset validation, catalog consistency, credentials, and network access. Some datasets may have uploaded; rerun to complete.',
  )
  process.exitCode = 1
}

import type { IncomingMessage, ServerResponse } from 'node:http'
import { get } from '@vercel/blob'
import { validateCatalog, validateDataset, validChartId } from '../src/data/raceDataset.ts'

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    res.writeHead(405).end(JSON.stringify({ error: 'Method not allowed.' }))
    return
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    res
      .writeHead(503)
      .end(JSON.stringify({ error: 'Blob credentials are not configured on the server.' }))
    return
  }
  try {
    const id = new URL(req.url || '/', 'http://localhost').searchParams.get('id')
    if (id !== null && !validChartId(id)) {
      res.writeHead(400).end(JSON.stringify({ error: 'Invalid chart ID.' }))
      return
    }
    const catalogBlob = await get('charts/catalog.json', { access: 'private' })
    if (!catalogBlob || catalogBlob.statusCode !== 200) {
      res
        .writeHead(404)
        .end(JSON.stringify({ error: 'Chart catalog not found. Run npm run blob:seed.' }))
      return
    }
    const catalog = validateCatalog(await new Response(catalogBlob.stream).json())
    if (id === null) {
      res.writeHead(200).end(JSON.stringify(catalog))
      return
    }
    if (!catalog.charts.some((entry) => entry.id === id)) {
      res.writeHead(404).end(JSON.stringify({ error: 'Chart is not in the catalog.' }))
      return
    }
    const result = await get('charts/' + id + '.json', { access: 'private' })
    if (!result || result.statusCode !== 200) {
      res.writeHead(404).end(
        JSON.stringify({
          error: 'Chart data not found. Run npm run blob:seed.',
        }),
      )
      return
    }
    const data = validateDataset(await new Response(result.stream).json())
    if (data.id !== id) throw new Error('Dataset ID mismatch')
    res.writeHead(200).end(JSON.stringify(data))
  } catch {
    // Never return SDK errors, which may contain private URLs or credentials.
    res.writeHead(502).end(
      JSON.stringify({
        error:
          'Unable to load valid chart data from Blob. Check server credentials and the dataset.',
      }),
    )
  }
}

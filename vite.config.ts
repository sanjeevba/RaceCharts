import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import raceDataHandler from './api/race-data.ts'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'BLOB_')
  for (const [key, value] of Object.entries(env)) process.env[key] = value
  return {
    plugins: [
      vue(),
      vueDevTools(),
      {
        name: 'private-blob-api',
        configureServer(server) {
          server.middlewares.use('/api/race-data', (req, res) => {
            void raceDataHandler(req, res)
          })
        },
      },
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})

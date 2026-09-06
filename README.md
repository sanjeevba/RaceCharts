# RaceCharts

## Private Vercel Blob data

1. Copy `.env.example` to `.env.local` if it does not exist.
2. Set `BLOB_READ_WRITE_TOKEN` in `.env.local` to a fresh token from the connected
   private store. Never use a `VITE_` prefix or commit credentials. Rotate any token
   shared in chat. `.env.local` is ignored by Git.
3. Run `npm run blob:seed` to validate and upload `data/catalog.json` and all
   datasets listed in it to `charts/` in Blob. This command now overwrites the
   matching files, including the old sales format. It uploads the catalog last.
   This is not an atomic multi-file update: a failed upload can leave some datasets
   updated. Fix the failure and rerun. Unlisted Blob files are not deleted.
4. Run `npm run dev`. Restart the dev server after changing environment variables.

Vite serves `/api/race-data` locally using the same server handler that Vercel
deploys as a Function. The browser requests the catalog at `/api/race-data`, then
each dataset at `/api/race-data?id=country-sales` (using its catalog ID).
There is no fallback to hardcoded sample values when Blob fails.
`npm run preview` previews static assets only; use `npm run dev` to test the API.

The endpoint deliberately makes catalog-listed chart datasets publicly readable;
the Blob store and token remain private. Do not put confidential data in that
dataset. Arbitrary Blob paths cannot be requested through the endpoint.

Each dataset includes `schemaVersion`, `id`, `title`, `description`, `unit`,
`isSample`, `updatedAt`, `sources`, `entities`, and `frames`. Frame values are keyed
by entity ID: `{ "period": "2019", "values": { "ca": 120, "us": 95 } }`.
Include at least two frames with increasing four-digit years or `YYYY-MM` months
(use one period format throughout a dataset) and a non-negative
number for every entity in every frame. This version requires complete frames;
do not replace missing observations with zero. Entity metadata specifies `id`,
`name`, optional `flagCode`, and a six-digit hex `color`. Flag images live in `public/flags/`.
Add a local flag image when introducing a new flag code.

The sales and rainfall files contain fictional sample data.
For real data, set `isSample` to false and supply sources as objects with `name`
and an optional HTTP(S) `url`. File-only sources can omit the URL.
Update `updatedAt` when changing the dataset. Optional `entityLabel` customizes
the table heading (for example, Chatbot instead of Country).

`data/ai-chatbots.json` reproduces all 13 months and 91 values from the supplied
`ai_chatbot-ww-monthly-202508-202608.csv`. It is attributed to that file; its publisher
and methodology were not provided. Values are displayed as percentage shares.

To add a chart, create `data/<id>.json` and add its matching ID and title to
`data/catalog.json`. The dropdown defaults to the first chart; check any combination
of charts to render them together with independent controls in the grid.
Data tables are hidden by default; pass `showData` to a chart component to restore them.
Run `node --experimental-strip-types scripts/seed-blob.mjs --check` to validate
all files without credentials or uploads. Run
`node --experimental-strip-types scripts/check-race-data.mjs` for validation tests.
Blob uploads use a 60-second cache lifetime; existing cached files may take
longer to refresh during the initial migration.

On Vercel, enable the connected store's `BLOB_READ_WRITE_TOKEN` for the deployment
environment. No credentials belong in the frontend or in `vercel.json`.

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

Run `npm run check:api` to additionally compile the Vercel API using the root
`tsconfig.json` and verify emitted JavaScript imports. Vercel reads this root
configuration independently of the Vue project references. Its ES2022 library
and import-extension rewrite settings are required by the shared API code.

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

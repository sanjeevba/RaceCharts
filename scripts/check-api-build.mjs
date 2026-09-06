import assert from 'node:assert/strict'
import ts from 'typescript'

// Vercel compiles API entry points using the root config, not its Vue references.
const config = ts.readConfigFile('tsconfig.json', ts.sys.readFile)
if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'))
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, process.cwd())
const program = ts.createProgram(['api/race-data.ts'], parsed.options)
const outputs = new Map()
const emitted = program.emit(undefined, (file, content) => outputs.set(file, content))
const diagnostics = [...ts.getPreEmitDiagnostics(program), ...emitted.diagnostics]
if (diagnostics.length) {
  console.error(
    ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: (file) => file,
      getCurrentDirectory: () => process.cwd(),
      getNewLine: () => '\n',
    }),
  )
  process.exitCode = 1
} else {
  const api = [...outputs.entries()].find(([file]) =>
    file.replaceAll('\\', '/').endsWith('api/race-data.js'),
  )?.[1]
  assert.ok(api, 'API JavaScript must be emitted')
  assert.ok(api.includes('../src/data/raceDataset.js'), 'Emitted imports must reference JavaScript')
  console.log('API compilation passed using root tsconfig; JavaScript imports verified.')
}

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

// Identificador único da versão baseado no timestamp ISO e timestamp numérico do build
const now = new Date()
const buildTime = now.getTime()
const buildIso = now.toISOString()
const versionId = `v-${buildTime}`

const versionData = {
  version: versionId,
  builtAt: buildIso,
  timestamp: buildTime,
}

// 1. Gravar em public/version.json para que o Vite copie para dist/ dev-dist/ no build
const publicDir = path.resolve(rootDir, 'public')
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true })
}
const publicVersionPath = path.resolve(publicDir, 'version.json')
fs.writeFileSync(publicVersionPath, JSON.stringify(versionData, null, 2) + '\n', 'utf-8')

// 2. Gravar em src/version-info.json para que o bundle do React importe diretamente
const srcDir = path.resolve(rootDir, 'src')
const srcVersionPath = path.resolve(srcDir, 'version-info.json')
fs.writeFileSync(srcVersionPath, JSON.stringify(versionData, null, 2) + '\n', 'utf-8')

console.log(`[generate-version] Gerado version.json com identificador: ${versionId} (${buildIso})`)

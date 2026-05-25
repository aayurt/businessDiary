import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')

const SIZES = [192, 384, 512]

function createSvgIcon(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="#0a0a0a"/>
  <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle"
        font-family="system-ui, sans-serif" font-weight="bold"
        font-size="${size * 0.4}" fill="#ffffff">M</text>
</svg>`
}

for (const size of SIZES) {
  writeFileSync(join(publicDir, `icons/icon-${size}x${size}.svg`), createSvgIcon(size))
  console.log(`Generated icon-${size}x${size}.svg`)
}

const manifestPath = join(publicDir, 'manifest.json')
const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
manifest.icons = SIZES.map((size) => ({
  src: `/icons/icon-${size}x${size}.svg`,
  sizes: `${size}x${size}`,
  type: 'image/svg+xml',
  purpose: 'any maskable',
}))
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
console.log('Updated manifest.json to reference SVG icons')

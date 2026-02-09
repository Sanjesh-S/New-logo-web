/**
 * Converts all PNG, JPG, and JPEG images in public/ and Icons/ to WebP.
 * Keeps originals; creates new .webp files alongside them.
 *
 * Usage: npm run convert:webp
 * Options: DELETE_ORIGINALS=1 npm run convert:webp  (removes .png/.jpg after conversion)
 */

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const DIRS = ['public', 'Icons']
const EXTENSIONS = ['.png', '.jpg', '.jpeg']
const WEBP_QUALITY = 85
const DELETE_ORIGINALS = process.env.DELETE_ORIGINALS === '1'

function getAllImageFiles(dir, base = dir) {
  const results = []
  const fullDir = path.isAbsolute(dir) ? dir : path.join(ROOT, dir)
  if (!fs.existsSync(fullDir)) return results
  const entries = fs.readdirSync(fullDir, { withFileTypes: true })
  for (const ent of entries) {
    const full = path.join(fullDir, ent.name)
    const rel = path.relative(ROOT, full)
    if (ent.isDirectory()) {
      results.push(...getAllImageFiles(full, base))
    } else if (ent.isFile()) {
      const ext = path.extname(ent.name).toLowerCase()
      if (EXTENSIONS.includes(ext)) results.push({ full, rel, ext })
    }
  }
  return results
}

async function main() {
  let sharp
  try {
    sharp = require('sharp')
  } catch (e) {
    console.error('Missing dependency. Run: npm install --save-dev sharp')
    process.exit(1)
  }

  const files = []
  for (const d of DIRS) {
    files.push(...getAllImageFiles(d))
  }

  if (files.length === 0) {
    console.log('No PNG/JPG/JPEG files found in public/ or Icons/.')
    return
  }

  console.log(`Converting ${files.length} image(s) to WebP (quality: ${WEBP_QUALITY})...`)
  let ok = 0
  let err = 0

  for (const { full, rel, ext } of files) {
    const outPath = full.slice(0, -path.extname(full).length) + '.webp'
    if (fs.existsSync(outPath)) {
      console.log(`  Skip (already exists): ${rel} -> ${path.relative(ROOT, outPath)}`)
      ok++
      continue
    }
    try {
      await sharp(full)
        .webp({ quality: WEBP_QUALITY })
        .toFile(outPath)
      console.log(`  OK: ${rel} -> ${path.relative(ROOT, outPath)}`)
      ok++
      if (DELETE_ORIGINALS) {
        fs.unlinkSync(full)
        console.log(`  Deleted original: ${rel}`)
      }
    } catch (e) {
      console.error(`  FAIL: ${rel} - ${e.message}`)
      err++
    }
  }

  console.log(`\nDone. Converted: ${ok}, Failed: ${err}`)
  if (!DELETE_ORIGINALS && ok > 0) {
    console.log('\nTip: Update your code to use .webp paths, then run: DELETE_ORIGINALS=1 npm run convert:webp')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

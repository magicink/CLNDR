import fs from 'node:fs/promises'
import path from 'node:path'
import url from 'node:url'
import puppeteer, { Browser } from 'puppeteer'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const outDir = path.join(repoRoot, 'roadmap', 'baseline')

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true })
}

type SnapshotResult = { htmlOut: string; pngOut: string }

async function snapshotPage(
  browser: Browser,
  relHtmlPath: string,
  outBaseName: string,
  waitSelector = '.clndr-controls'
): Promise<SnapshotResult> {
  const page = await browser.newPage()

  const filePath = path.join(repoRoot, relHtmlPath)
  const fileUrl = `file://${filePath}`

  await page.goto(fileUrl, { waitUntil: 'networkidle2', timeout: 60_000 })

  // Wait for CLNDR to initialize
  await page.waitForSelector(waitSelector, { timeout: 60_000 })

  // Small extra delay to allow any intervals/async event wiring to settle
  await new Promise(res => setTimeout(res, 250))

  // Extract the container markup for baseline parity
  const html = await page.$eval('.container', el => el.innerHTML)

  const htmlOut = path.join(outDir, `${outBaseName}.container.html`)
  const pngOut = path.join(outDir, `${outBaseName}.png`) as `${string}.png`

  await fs.writeFile(htmlOut, html, 'utf8')
  await page.screenshot({ path: pngOut, fullPage: true })

  await page.close()
  return { htmlOut, pngOut }
}

async function main(): Promise<void> {
  await ensureDir(outDir)

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1024, height: 800 }
  })

  try {
    const results: SnapshotResult[] = []

    results.push(
      await snapshotPage(browser, path.join('demo', 'index.html'), 'demo-index')
    )

    results.push(
      await snapshotPage(browser, path.join('tests', 'test.html'), 'tests-test')
    )

    const manifest = {
      generatedAt: new Date().toISOString(),
      pages: results
    }
    await fs.writeFile(
      path.join(outDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2),
      'utf8'
    )

    // eslint-disable-next-line no-console
    console.log('Baseline snapshots captured to', outDir)
  } finally {
    await browser.close()
  }
}

main().catch(err => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})

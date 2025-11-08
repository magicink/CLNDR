import path from 'node:path'
import url from 'node:url'
import puppeteer from 'puppeteer'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')

async function checkPage(page, relHtmlPath, waitSelector = '.clndr-controls') {
  const filePath = path.join(repoRoot, relHtmlPath)
  const fileUrl = `file://${filePath}`

  await page.goto(fileUrl, { waitUntil: 'networkidle2', timeout: 60000 })
  await page.waitForSelector(waitSelector, { timeout: 60000 })

  const counts = await page.evaluate(() => {
    const controls = document.querySelectorAll('.clndr-controls').length
    const headers = document.querySelectorAll('.header-day').length
    const dayContainers = document.querySelectorAll(
      '.clndr-table, .days'
    ).length
    return { controls, headers, dayContainers }
  })

  if (counts.controls <= 0) {
    throw new Error('Expected at least one .clndr-controls')
  }
  if (counts.headers < 7) {
    throw new Error('Expected at least seven .header-day elements')
  }
  if (counts.dayContainers <= 0) {
    throw new Error('Expected a day container (.clndr-table or .days)')
  }
}

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1024, height: 800 }
  })

  try {
    const page = await browser.newPage()
    await checkPage(page, path.join('demo', 'index.html'))
    await checkPage(page, path.join('tests', 'test.html'))
    console.log('Smoke tests passed: demo and test pages render.')
  } finally {
    await browser.close()
  }
}

main().catch(err => {
  console.error('[smoke] Failure:', err && err.stack ? err.stack : err)
  process.exit(1)
})

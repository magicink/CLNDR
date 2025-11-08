import fs from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const outDir = path.join(repoRoot, 'roadmap', 'baseline');

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function snapshotPage(browser, relHtmlPath, outBaseName, waitSelector = '.clndr-controls') {
  const page = await browser.newPage();

  const filePath = path.join(repoRoot, relHtmlPath);
  const fileUrl = `file://${filePath}`;

  await page.goto(fileUrl, { waitUntil: 'networkidle2', timeout: 60000 });

  // Wait for CLNDR to initialize
  await page.waitForSelector(waitSelector, { timeout: 60000 });

  // Small extra delay to allow any intervals/async event wiring to settle
  await new Promise((res) => setTimeout(res, 250));

  // Extract the container markup for baseline parity
  const html = await page.$eval('.container', (el) => el.innerHTML);

  const htmlOut = path.join(outDir, `${outBaseName}.container.html`);
  const pngOut = path.join(outDir, `${outBaseName}.png`);

  await fs.writeFile(htmlOut, html, 'utf8');
  await page.screenshot({ path: pngOut, fullPage: true });

  await page.close();
  return { htmlOut, pngOut };
}

async function main() {
  await ensureDir(outDir);

  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1024, height: 800 }
  });

  try {
    const results = [];

    results.push(
      await snapshotPage(browser, path.join('demo', 'index.html'), 'demo-index')
    );

    results.push(
      await snapshotPage(browser, path.join('tests', 'test.html'), 'tests-test')
    );

    const manifest = {
      generatedAt: new Date().toISOString(),
      pages: results
    };
    await fs.writeFile(
      path.join(outDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2),
      'utf8'
    );

    console.log('Baseline snapshots captured to', outDir);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

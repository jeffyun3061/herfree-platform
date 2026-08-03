import { chromium } from '@playwright/test';
import { mkdir, readdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const pkgDir = path.join(root, 'docs', 'legal-final-package');
const outDir = path.join(pkgDir, process.env.LEGAL_PDF_OUT ?? 'final');

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();

const htmlFiles = (await readdir(pkgDir))
  .filter((f) => /^\d{2}-.*\.html$/.test(f))
  .sort();

for (const file of htmlFiles) {
  const htmlPath = path.join(pkgDir, file);
  const pdfPath = path.join(outDir, file.replace(/\.html$/, '.pdf'));
  await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' });
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '14mm', bottom: '14mm', left: '14mm', right: '14mm' },
  });
  console.log('PDF:', pdfPath);
}

await browser.close();
console.log(`Done. ${htmlFiles.length} files in ${outDir}`);

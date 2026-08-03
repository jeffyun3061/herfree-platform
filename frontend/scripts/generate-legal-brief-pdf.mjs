import { chromium } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const htmlPath = path.join(root, 'docs', 'legal-consultation-brief.html');
const pdfPath = path.join(root, 'docs', 'legal-consultation-brief.pdf');

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' });
await page.pdf({
  path: pdfPath,
  format: 'A4',
  printBackground: true,
  margin: { top: '12mm', bottom: '12mm', left: '14mm', right: '14mm' },
});
await browser.close();
console.log('PDF created:', pdfPath);

import sharp from 'sharp';
import { Page, Locator, TestInfo } from '@playwright/test';

export async function attachAnnotatedScreenshot(page: Page, locator: Locator, label: string, testInfo: TestInfo) {
  const shot = await page.screenshot({ fullPage: true });
  const box = await locator.boundingBox().catch(() => null);
  if (!box) return testInfo.attach(`${label}.png`, { body: shot, contentType: 'image/png' });

  const svg = `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="none" stroke="red" stroke-width="4"/>
    <rect x="${box.x}" y="${Math.max(0, box.y - 28)}" width="${Math.max(220, box.width)}" height="28" fill="red"/>
    <text x="${box.x + 8}" y="${Math.max(18, box.y - 8)}" font-size="16" fill="white" font-family="Arial, sans-serif">${label}</text>
  </svg>`;

  const out = await sharp(shot).composite([{ input: Buffer.from(svg), top: 0, left: 0 }]).png().toBuffer();
  await testInfo.attach(`${label}.png`, { body: out, contentType: 'image/png' });
}

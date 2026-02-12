import { test, expect } from '@playwright/test';

test('catalog links load', async ({ page, baseURL }) => {
  await page.goto(new URL('/pages/html/kitchen-sink.html', baseURL!).toString());
  const hrefs = await page.locator('a[href]').evaluateAll(as => as.map(a => (a as HTMLAnchorElement).getAttribute('href')).filter(Boolean) as string[]);
  for (const href of hrefs) {
    if (/^(mailto:|tel:|data:|#)/.test(href)) continue;
    const url = new URL(href, baseURL!).toString();
    if (!/\/pages\/html\/[^/]+\.html$/i.test(url)) continue; // only pages that should have the contract
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('page-title'), `Missing page-title on ${url}`).toBeVisible();
    await expect(page.getByTestId('page-id'), `Missing page-id on ${url}`).toHaveAttribute('data-page-id', /.+/);
  }
});

import { test, expect } from '@playwright/test';

test('catalog links load', async ({ page, context }) => {
  await page.goto('/');
  const links = page.locator('a[href]');
  const count = await links.count();
  expect(count).toBeGreaterThan(5);

  for (let i = 0; i < count; i++) {
    const href = await links.nth(i).getAttribute('href');
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('data:') || href.startsWith('#')) continue;

    const p = await context.newPage();
    await p.goto(href);

    await expect(p.getByTestId('page-title')).toBeVisible();
    await expect(p.getByTestId('page-id')).toHaveAttribute('data-page-id', /.*/);

    await p.close();
  }
});

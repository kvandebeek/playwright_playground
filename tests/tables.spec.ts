// tests/tables.spec.ts
import { test, expect } from '@playwright/test';

test.describe('tables', () => {
  test('loads and shows key landmarks', async ({ page }) => {
    await page.goto('/pages/html/tables.html');
    await expect(page.getByTestId('page-title')).toHaveText('Tables');
    await expect(page.getByTestId('page-id')).toHaveAttribute('data-page-id', 'tables');
    await expect(page.getByTestId('main')).toBeVisible();
    await expect(page.getByTestId('table')).toBeVisible();
    await expect(page.getByTestId('caption')).toHaveText('Demo table');
    await expect(page.getByTestId('tfoot')).toHaveText('tfoot row');
  });

  test('default state: all rows visible', async ({ page }) => {
    await page.goto('/pages/html/tables.html');
    const tbody = page.getByTestId('tbody');
    await expect(tbody.getByRole('row')).toHaveCount(4);
    await expect(page.getByTestId('row-1')).toHaveAttribute('data-visible', 'true');
    await expect(page.getByTestId('row-2')).toHaveAttribute('data-visible', 'true');
    await expect(page.getByTestId('row-3')).toHaveAttribute('data-visible', 'true');
    await expect(page.getByTestId('row-4')).toHaveAttribute('data-visible', 'true');
  });

  test('filter: hides non-matching rows and updates data-visible + display', async ({ page }) => {
    await page.goto('/pages/html/tables.html');

    await page.getByTestId('table-filter').fill('brus');
    await expect(page.getByTestId('table')).toHaveAttribute('data-filter', 'brus');

    await expect(page.getByTestId('row-2')).toHaveAttribute('data-visible', 'true');
    await expect(page.getByTestId('row-2')).toBeVisible();

    for (const id of ['row-1', 'row-3', 'row-4']) {
      await expect(page.getByTestId(id)).toHaveAttribute('data-visible', 'false');
      await expect(page.getByTestId(id)).toBeHidden(); // display:none from script
    }

    await page.getByTestId('table-filter').fill('');
    await expect(page.getByTestId('table')).toHaveAttribute('data-filter', '');

    for (const id of ['row-1', 'row-2', 'row-3', 'row-4']) {
      await expect(page.getByTestId(id)).toHaveAttribute('data-visible', 'true');
      await expect(page.getByTestId(id)).toBeVisible();
    }
  });

  test('sort by name toggles asc/desc and updates table data attributes', async ({ page }) => {
    await page.goto('/pages/html/tables.html');

    const firstName = () => page.getByTestId('tbody').locator('tr').first().locator('td').first();
    await expect(page.getByTestId('table')).toHaveAttribute('data-sort', 'none');
    await expect(page.getByTestId('table')).toHaveAttribute('data-sort-dir', 'asc');

    await page.getByTestId('sort-name').click();
    await expect(page.getByTestId('table')).toHaveAttribute('data-sort', 'name');
    await expect(page.getByTestId('table')).toHaveAttribute('data-sort-dir', 'asc');
    await expect(firstName()).toHaveText('Alice');

    await page.getByTestId('sort-name').click();
    await expect(page.getByTestId('table')).toHaveAttribute('data-sort', 'name');
    await expect(page.getByTestId('table')).toHaveAttribute('data-sort-dir', 'desc');
    await expect(firstName()).toHaveText('Dana');
  });

  test('sort by age toggles asc/desc and sorts numerically', async ({ page }) => {
    await page.goto('/pages/html/tables.html');

    const firstAge = () => page.getByTestId('tbody').locator('tr').first().locator('td').nth(2);

    await page.getByTestId('sort-age').click();
    await expect(page.getByTestId('table')).toHaveAttribute('data-sort', 'age');
    await expect(page.getByTestId('table')).toHaveAttribute('data-sort-dir', 'asc');
    await expect(firstAge()).toHaveText('25'); // Dana

    await page.getByTestId('sort-age').click();
    await expect(page.getByTestId('table')).toHaveAttribute('data-sort', 'age');
    await expect(page.getByTestId('table')).toHaveAttribute('data-sort-dir', 'desc');
    await expect(firstAge()).toHaveText('41'); // Bob
  });

  test('filter + sort: filter persists, then sorting only reorders visible rows', async ({ page }) => {
    await page.goto('/pages/html/tables.html');
  
    await page.getByTestId('table-filter').fill('ant'); // matches Antwerp (Alice) only; excludes Bob
    await expect(page.getByTestId('row-2')).toHaveAttribute('data-visible', 'false');
  
    await page.getByTestId('sort-age').click(); // asc
    const visibleRows = page.getByTestId('tbody').locator('tr[data-visible="true"]');
    await expect(visibleRows).toHaveCount(1);
  
    const ages = await visibleRows.locator('td:nth-child(3)').allTextContents();
    expect(ages.map(a => Number(a.trim()))).toEqual([29]); // Alice
  });
  
});

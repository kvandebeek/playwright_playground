import { test, expect } from '@playwright/test';

test.describe('iframe-child.html', () => {
    const url: string = '/pages/html/iframe-child.html';

    test('loads and shows stable identifiers', async ({ page }) => {
        await page.goto(url);

        await expect(page.getByTestId('page-title')).toHaveText('Iframe Child');
        await expect(page.getByTestId('page-id')).toHaveAttribute('data-page-id', 'iframe-child');
        await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
        await expect(page.getByTestId('child-status')).toHaveAttribute('data-status', 'waiting');
    });

    test('ignores messages from a non-parent source and keeps waiting', async ({ page }) => {
        await page.goto(url);

        const status = page.getByTestId('child-status');
        await expect(status).toHaveText(/waiting/i);

        await page.evaluate(() => {
            window.postMessage({ type: 'ping', at: Date.now() }, window.location.origin);
        });

        await expect(status).toHaveAttribute('data-status', 'waiting');
        await expect(status).toHaveText(/waiting/i);
    });
});

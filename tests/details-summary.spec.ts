import { test, expect, type Locator, type Page } from '@playwright/test';

test.describe('details-summary.html', () => {
    const url: string = '/pages/html/details-summary.html';

    const getDetails = (page: Page, testId: 'details-1' | 'details-2'): Locator => page.getByTestId(testId);
    const getSummary = (page: Page, testId: 'summary-1' | 'summary-2'): Locator => page.getByTestId(testId);
    const getContent = (page: Page, testId: 'details-1-content' | 'details-2-content'): Locator => page.getByTestId(testId);

    test('loads and shows stable identifiers', async ({ page }) => {
        await page.goto(url);

        await expect(page.getByTestId('page-title')).toHaveText('Details & Summary');
        await expect(page.getByTestId('page-id')).toHaveAttribute('data-page-id', 'details-summary');
    });

    test('details initial state is reflected by [open] and data-open (both blocks)', async ({ page }) => {
        await page.goto(url);

        const d1: Locator = getDetails(page, 'details-1');
        const d2: Locator = getDetails(page, 'details-2');

        await expect(d1).not.toHaveAttribute('open', /.*/);
        await expect(d1).toHaveAttribute('data-open', 'false');

        await expect(d2).toHaveAttribute('open', /.*/);
        await expect(d2).toHaveAttribute('data-open', 'true');

        await expect(getContent(page, 'details-1-content')).toBeHidden();
        await expect(getContent(page, 'details-2-content')).toBeVisible();
    });

    test('clicking summary toggles details-1 and updates data-open', async ({ page }) => {
        await page.goto(url);

        const d1: Locator = getDetails(page, 'details-1');
        const summary1: Locator = getSummary(page, 'summary-1');
        const content1: Locator = getContent(page, 'details-1-content');

        await expect(d1).toHaveAttribute('data-open', 'false');
        await expect(content1).toBeHidden();

        await summary1.click();

        await expect(d1).toHaveAttribute('open', /.*/);
        await expect(d1).toHaveAttribute('data-open', 'true');
        await expect(content1).toBeVisible();

        await summary1.click();

        await expect(d1).not.toHaveAttribute('open', /.*/);
        await expect(d1).toHaveAttribute('data-open', 'false');
        await expect(content1).toBeHidden();
    });

    test('details-2 is open by default and toggling via summary updates data-open', async ({ page }) => {
        await page.goto(url);

        const d2: Locator = getDetails(page, 'details-2');
        const summary2: Locator = getSummary(page, 'summary-2');
        const content2: Locator = getContent(page, 'details-2-content');

        await expect(d2).toHaveAttribute('open', /.*/);
        await expect(d2).toHaveAttribute('data-open', 'true');
        await expect(content2).toBeVisible();

        await summary2.click();

        await expect(d2).not.toHaveAttribute('open', /.*/);
        await expect(d2).toHaveAttribute('data-open', 'false');
        await expect(content2).toBeHidden();

        await summary2.click();

        await expect(d2).toHaveAttribute('open', /.*/);
        await expect(d2).toHaveAttribute('data-open', 'true');
        await expect(content2).toBeVisible();
    });

    test('toggle button flips details-1 and keeps aria-pressed in sync', async ({ page }) => {
        await page.goto(url);

        const d1: Locator = getDetails(page, 'details-1');
        const btn: Locator = page.getByTestId('toggle-details-1');
        const content1: Locator = getContent(page, 'details-1-content');

        await expect(btn).toHaveAttribute('aria-controls', 'details1');
        await expect(btn).toHaveAttribute('aria-pressed', 'false');
        await expect(d1).toHaveAttribute('data-open', 'false');
        await expect(content1).toBeHidden();

        await btn.click();

        await expect(d1).toHaveAttribute('open', /.*/);
        await expect(d1).toHaveAttribute('data-open', 'true');
        await expect(btn).toHaveAttribute('aria-pressed', 'true');
        await expect(content1).toBeVisible();

        await btn.click();

        await expect(d1).not.toHaveAttribute('open', /.*/);
        await expect(d1).toHaveAttribute('data-open', 'false');
        await expect(btn).toHaveAttribute('aria-pressed', 'false');
        await expect(content1).toBeHidden();
    });

    test('keyboard: summary toggles details-1 with Enter and Space', async ({ page, browserName }) => {
        test.skip(browserName === 'webkit', 'WebKit can be inconsistent for Space toggling on <summary> across platforms.');

        await page.goto(url);

        const d1: Locator = getDetails(page, 'details-1');
        const summary1: Locator = getSummary(page, 'summary-1');

        await summary1.focus();
        await expect(summary1).toBeFocused();
        await expect(d1).toHaveAttribute('data-open', 'false');

        await page.keyboard.press('Enter');
        await expect(d1).toHaveAttribute('data-open', 'true');

        await page.keyboard.press('Space');
        await expect(d1).toHaveAttribute('data-open', 'false');
    });

    test('button has type=button (no accidental form submit semantics)', async ({ page }) => {
        await page.goto(url);
        await expect(page.getByTestId('toggle-details-1')).toHaveAttribute('type', 'button');
    });
});

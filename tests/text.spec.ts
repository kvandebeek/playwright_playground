// tests/text.spec.ts
import { test, expect } from '@playwright/test';

test.describe('text.html', () => {
    const url = '/pages/html/text.html';

    test.beforeEach(async ({ page }) => {
        await page.goto(url, { waitUntil: 'networkidle' });
        await page.addStyleTag({ content: '* { caret-color: transparent !important; }' });
    });

    test('loads and has correct identity', async ({ page }) => {
        await expect(page).toHaveTitle('Text');
        await expect(page.getByTestId('page-title')).toHaveText('Text');
        await expect(page.getByTestId('page-id')).toHaveAttribute('data-page-id', 'text');
        await expect(page.getByTestId('main')).toBeVisible();
    });

    test('skip link targets main and updates hash', async ({ page }) => {
        await page.goto('/pages/html/semantic.html');

        const skip = page.getByTestId('skip-link');
        await expect(skip).toHaveAttribute('href', '#main');

        await Promise.all([
            page.waitForURL(/#main$/),
            skip.click(),
        ]);
    });

    test('back link points to index and has an accessible name', async ({ page }) => {
        const back = page.getByTestId('back');
        await expect(back).toHaveAttribute('href', './../../index.html');
        await expect(back).toHaveAttribute('aria-label', /Back to index/i);
        await expect(back).toHaveAccessibleName(/Back to index/i);
    });

    test('p1 inline semantics exist and contain expected text', async ({ page }) => {
        const p1 = page.getByTestId('p1');
        await expect(p1).toContainText('This is a');
        await expect(p1.locator('strong')).toHaveText('strong');
        await expect(p1.locator('em')).toHaveText('emphasized');
        await expect(p1.locator('mark')).toHaveText('marked');
        await expect(p1.locator('span')).toHaveText('inline span');
        await expect(p1.locator('strong')).toHaveCount(1);
        await expect(p1.locator('em')).toHaveCount(1);
        await expect(p1.locator('mark')).toHaveCount(1);
        await expect(p1.locator('span')).toHaveCount(1);
    });

    test('p2 semantic structure is correct (sub/sup)', async ({ page }) => {
        const p2 = page.getByTestId('p2');
        await expect(p2.locator('sub')).toHaveText('2');
        await expect(p2.locator('sup')).toHaveText('2');
        await expect(p2.locator('sub')).toHaveCount(1);
        await expect(p2.locator('sup')).toHaveCount(1);
    });

    test('p2 visual rendering (sub/sup)', async ({ page }) => {
        await expect(page.getByTestId('p2')).toHaveScreenshot('text-p2.png', { animations: 'disabled' });
    });

    test('inline code exists and matches expected content', async ({ page }) => {
        const code = page.getByTestId('inline-code');
        await expect(code).toHaveText('const x = 1');
        await expect(code).toHaveClass(/inline-code/);
        await expect(page.getByTestId('p3')).toContainText('Inline code:');
    });

    test('blockquote has cite attribute and nested citation element', async ({ page }) => {
        const bq = page.getByTestId('blockquote');
        await expect(bq).toHaveAttribute('cite', 'https://example.com/source');
        await expect(bq).toContainText('Blockquote example');
        await expect(bq.locator('cite')).toHaveText('citation');
        await expect(bq.locator('cite')).toHaveCount(1);
    });

    test('pre preserves whitespace/newlines and contains tabs', async ({ page }) => {
        const preText = await page.getByTestId('pre').innerText();
        expect(preText).toContain('<pre> preserves whitespace');
        expect(preText).toContain('\n  and newlines.');
        expect(preText).toMatch(/Tabs:\s+one\s+two/);
    });

    test('hr and small text exist', async ({ page }) => {
        await expect(page.getByTestId('hr')).toBeVisible();
        await expect(page.getByTestId('small').locator('small')).toHaveText('Small text example.');
    });
});

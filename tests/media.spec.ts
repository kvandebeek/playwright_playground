import { test, expect } from '@playwright/test';

test.describe('media', () => {
    const url = '/pages/html/media.html';

    test.use({ viewport: { width: 900, height: 700 } });

    test('loads and shows stable identifiers', async ({ page }) => {
        await page.goto(url);
        await expect(page.getByTestId('page-title')).toHaveText('Media');
        await expect(page.getByTestId('page-id')).toHaveAttribute('data-page-id', 'media');
    });

    test('figure + image + caption semantics', async ({ page }) => {
        await page.goto(url);
        const figure = page.getByTestId('figure');
        const img = figure.locator('img');
        const caption = page.getByTestId('figcaption');
        await expect(figure).toBeVisible();
        await expect(img).toBeVisible();
        await expect(img).toHaveAttribute('width', '320');
        await expect(img).toHaveAttribute('height', '180');
        await expect(img).toHaveAttribute('alt', /.+/);
        await expect(caption).toBeVisible();
        await expect(caption).toContainText('Placeholder image');
        await expect(figure.locator('figcaption')).toBeVisible();
    });

    test('image is fully loaded (not broken)', async ({ page }) => {
        await page.goto(url);
        const img = page.getByTestId('figure').locator('img');
        const ok = await img.evaluate(i => { const el = i as HTMLImageElement; return el.complete && el.naturalWidth > 0 && el.naturalHeight > 0; });
        expect(ok).toBe(true);
    });

    test('image renders at expected size', async ({ page }) => {
        await page.goto(url);
        const img = page.getByTestId('figure').locator('img');
        const rect = await img.evaluate(el => { const r = (el as HTMLElement).getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; });
        expect(rect.w).toBe(320);
        expect(rect.h).toBe(180);
    });

    test('has inline SVG with expected sizing and content', async ({ page }) => {
        await page.goto(url);
        const svg = page.getByTestId('svg-inline');
        await expect(svg).toBeVisible();
        await expect(svg).toHaveAttribute('width', '220');
        await expect(svg).toHaveAttribute('height', '120');
        await expect(svg).toContainText('Inline SVG');
    });

    test('svg structure is non-empty (real vector content)', async ({ page }) => {
        await page.goto(url);
        const svg = page.getByTestId('svg-inline');
        const hasVectorChildren = await svg.evaluate(el => (el as SVGElement).querySelectorAll('path,rect,circle,ellipse,line,polyline,polygon,text').length > 0);
        expect(hasVectorChildren).toBe(true);
    });

    test('svg renders at expected size', async ({ page }) => {
        await page.goto(url);
        const svg = page.getByTestId('svg-inline');
        const rect = await svg.evaluate(el => { const r = (el as HTMLElement).getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; });
        expect(rect.w).toBe(220);
        expect(rect.h).toBe(120);
    });
});

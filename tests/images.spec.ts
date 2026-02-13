import { test, expect } from '@playwright/test';

test.describe('images.html', () => {
    const url: string = '/pages/html/images.html';

    test('loads and shows stable identifiers', async ({ page }) => {
        await page.goto(url);

        await expect(page.getByTestId('page-title')).toHaveText('Images');
        await expect(page.getByTestId('page-id')).toHaveAttribute('data-page-id', 'images');

        const skip = page.getByTestId('skip-link');
        await expect(skip).toHaveAttribute('href', '#main');
    });

    test('basic img has required attributes and is loaded', async ({ page }) => {
        await page.goto(url);

        const img = page.getByTestId('img-basic');

        await expect(img).toHaveAttribute('alt', 'Basic placeholder');
        await expect(img).toHaveAttribute('width', '600');
        await expect(img).toHaveAttribute('height', '300');
        await expect(img).toHaveAttribute('loading', 'lazy');
        await expect(img).toHaveAttribute('decoding', 'async');
        await expect(img).toHaveAttribute('src', /data:image\/svg\+xml,/);

        await expect(img).toHaveJSProperty('complete', true);
        await expect(img).toHaveAttribute('data-loaded', 'true');
    });

    test('picture element contains source + fallback img and fallback is loaded', async ({ page }) => {
        await page.goto(url);

        const picture = page.getByTestId('picture');
        const source = picture.locator('source');
        const fallback = page.getByTestId('img-picture-fallback');

        await expect(source).toHaveAttribute('type', 'image/svg+xml');
        await expect(source).toHaveAttribute('srcset', /data:image\/svg\+xml,/);

        await expect(fallback).toHaveAttribute('alt', 'Picture fallback');
        await expect(fallback).toHaveAttribute('width', '600');
        await expect(fallback).toHaveAttribute('height', '300');
        await expect(fallback).toHaveAttribute('decoding', 'async');
        await expect(fallback).toHaveAttribute('src', /data:image\/svg\+xml,/);

        await expect(fallback).toHaveJSProperty('complete', true);
        await expect(fallback).toHaveAttribute('data-loaded', 'true');
    });

    test('srcset + sizes img declares responsive attributes and is loaded', async ({ page }) => {
        await page.goto(url);

        const img = page.getByTestId('img-srcset');

        await expect(img).toHaveAttribute('alt', 'srcset placeholder');
        await expect(img).toHaveAttribute('width', '600');
        await expect(img).toHaveAttribute('height', '300');
        await expect(img).toHaveAttribute('sizes', '(max-width: 600px) 90vw, 600px');

        const srcset: string | null = await img.getAttribute('srcset');
        expect(srcset).not.toBeNull();
        expect(srcset).toContain('320w');
        expect(srcset).toContain('600w');

        await expect(img).toHaveAttribute('src', /data:image\/svg\+xml,/);

        await expect(img).toHaveJSProperty('complete', true);
        await expect(img).toHaveAttribute('data-loaded', 'true');
    });

    test('skip link updates URL hash to #main', async ({ page }) => {
        await page.goto(url);

        await page.getByTestId('skip-link').click();
        await expect(page).toHaveURL(/#main$/);
    });
});

import { test, expect } from '@playwright/test';

test.describe('semantic', () => {
    const url = '/pages/html/semantic.html';

    test('loads and shows stable identifiers', async ({ page }) => {
        await page.goto(url);
        await expect(page.getByTestId('page-title')).toHaveText('Semantic layout');
        await expect(page.getByTestId('page-id')).toHaveAttribute('data-page-id', 'semantic');
    });

    test('has semantic landmarks (header/nav/main/footer)', async ({ page }) => {
        await page.goto(url);

        await expect(page.getByRole('banner')).toBeVisible();
        await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
        await expect(page.getByRole('main')).toBeVisible();
        await expect(page.getByRole('contentinfo')).toBeVisible();
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

    test('primary nav links are visible and correct', async ({ page }) => {
        await page.goto(url);

        await expect(page.getByTestId('nav')).toBeVisible();
        await expect(page.getByTestId('nav-link-1')).toHaveAttribute('href', './text.html');
        await expect(page.getByTestId('nav-link-2')).toHaveAttribute('href', './tables.html');
        await expect(page.getByTestId('nav-link-3')).toHaveAttribute('href', './forms-inputs.html');

        await expect(page.getByTestId('nav-link-1')).toHaveText('Text');
        await expect(page.getByTestId('nav-link-2')).toHaveText('Tables');
        await expect(page.getByTestId('nav-link-3')).toHaveText('Forms');
    });

    test('article structure and labels are wired correctly', async ({ page }) => {
        await page.goto(url);

        await expect(page.getByTestId('article')).toHaveAttribute('aria-labelledby', 'article-title');
        await expect(page.getByTestId('article-title')).toHaveText('Article header');

        await expect(page.getByTestId('section-1')).toHaveAttribute('aria-labelledby', 's1-title');
        await expect(page.getByTestId('section-2')).toHaveAttribute('aria-labelledby', 's2-title');

        await expect(page.locator('#s1-title')).toHaveText('Section 1');
        await expect(page.locator('#s2-title')).toHaveText('Section 2');

        await expect(page.getByTestId('article-footer')).toContainText('Article footer');
    });

    test('aside is complementary and labelled', async ({ page }) => {
        await page.goto(url);

        await expect(page.getByTestId('aside')).toHaveAttribute('aria-labelledby', 'aside-title');
        await expect(page.locator('#aside-title')).toHaveText('Aside');
        await expect(page.getByRole('complementary')).toBeVisible();
    });

    test('back link points to index and is accessible', async ({ page }) => {
        await page.goto(url);

        const back = page.getByTestId('back');
        await expect(back).toHaveAttribute('href', './../../index.html');
        await expect(back).toHaveAttribute('aria-label', 'Back to index');
    });
});

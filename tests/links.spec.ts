import { test, expect } from '@playwright/test';

test.describe('links.html', () => {
  const url: string = '/pages/html/links.html';

  test('loads and shows stable identifiers', async ({ page }) => {
    await page.goto(url);
    await expect(page.getByTestId('page-title')).toHaveText('Links');
    await expect(page.getByTestId('page-id')).toHaveAttribute('data-page-id', 'links');
    await expect(page.getByTestId('main')).toBeVisible();
  });

  test('regular link navigates to text.html in same tab', async ({ page }) => {
    await page.goto(url);

    await page.getByTestId('link-to-text').click();
    await expect(page).toHaveURL(/\/pages\/html\/text\.html$/);
    await expect(page.getByTestId('page-id')).toHaveAttribute('data-page-id', 'text');
  });

  test('fragment link updates hash, scrolls to target, and syncs html[data-hash]', async ({ page }) => {
    await page.goto(url);

    await page.getByTestId('link-fragment').click();

    await expect(page).toHaveURL(/#target$/);
    await expect(page.getByTestId('fragment-target')).toBeInViewport();
    await expect(page.locator('html')).toHaveAttribute('data-hash', '#target');
  });

  test('new tab link opens lists.html with noopener/noreferrer', async ({ page }) => {
    await page.goto(url);

    const blankLink = page.getByTestId('link-blank');
    await expect(blankLink).toHaveAttribute('target', '_blank');
    await expect(blankLink).toHaveAttribute('rel', /noopener/);
    await expect(blankLink).toHaveAttribute('rel', /noreferrer/);

    const popup = page.waitForEvent('popup');
    await blankLink.click();
    const newPage = await popup;

    await expect(newPage).toHaveURL(/\/pages\/html\/lists\.html$/);
    await expect(newPage.getByTestId('page-id')).toHaveAttribute('data-page-id', 'lists');
    await newPage.close();
  });

  test('download link has download attribute and triggers a download with expected filename', async ({ page }) => {
    await page.goto(url);

    const downloadLink = page.getByTestId('link-download');
    await expect(downloadLink).toHaveAttribute('download', 'hello.txt');

    const downloadPromise = page.waitForEvent('download');
    await downloadLink.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('hello.txt');
  });

  test('mailto and tel links have expected hrefs', async ({ page }) => {
    await page.goto(url);

    await expect(page.getByTestId('link-mailto')).toHaveAttribute(
      'href',
      'mailto:test@example.com?subject=Hello&body=Body',
    );
    await expect(page.getByTestId('link-tel')).toHaveAttribute('href', 'tel:+32000000000');
  });

  test('clear hash link removes hash via history.replaceState, sets html[data-hash] to empty, and scrolls to top', async ({
    page,
  }) => {
    await page.goto(url);

    await page.getByTestId('link-fragment').click();
    await expect(page).toHaveURL(/#target$/);
    await expect(page.locator('html')).toHaveAttribute('data-hash', '#target');

    await page.getByTestId('clear-hash').click();

    await expect(page).toHaveURL((currentUrl: URL) => currentUrl.hash === '');
    await expect(page.locator('html')).toHaveAttribute('data-hash', '');
    await expect(page.getByTestId('skip-link')).toBeInViewport();
  });

  test('skip link points to #main and updates hash on click', async ({ page }) => {
    await page.goto(url);

    const skip = page.getByTestId('skip-link');
    await expect(skip).toHaveAttribute('href', '#main');

    await skip.click();
    await expect(page).toHaveURL(/#main$/);
  });
});

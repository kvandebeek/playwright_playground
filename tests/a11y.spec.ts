import { test, expect, type Page } from '@playwright/test';

const URL = '/pages/html/a11y.html';

const tab = async (page: Page): Promise<void> => {
  await page.keyboard.press('Tab');
};

test.describe('a11y.html', () => {
  test('loads and shows stable identifiers', async ({ page }) => {
    await page.goto(URL);

    await expect(page.getByTestId('page-title')).toHaveText('Accessibility (a11y)');
    await expect(page.getByTestId('page-id')).toHaveAttribute('data-page-id', 'a11y');
    await expect(page.getByTestId('nav')).toHaveAttribute('aria-label', 'Primary');
  });

  test('skip link targets main', async ({ page }) => {
    await page.goto(URL);

    const skip = page.getByTestId('skip-link');
    await expect(skip).toHaveAttribute('href', '#main');

    // First Tab should land on the skip link (first focusable element).
    await tab(page);
    await expect(skip).toBeFocused();

    await skip.press('Enter');
    await expect(page).toHaveURL(/#main$/);
  });

  test('ARIA toggle updates aria-expanded and panel visibility', async ({ page }) => {
    await page.goto(URL);

    const toggle = page.getByTestId('aria-toggle');
    const panel = page.getByTestId('aria-panel');

    await expect(toggle).toHaveAttribute('aria-controls', 'panel');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(panel).toBeHidden();

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toBeVisible();
    await expect(panel).toHaveText('Panel content');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(panel).toBeHidden();
  });

  test('live region updates text when button is pressed', async ({ page }) => {
    await page.goto(URL);

    const live = page.getByTestId('live');
    const btn = page.getByTestId('live-btn');

    await expect(live).toHaveAttribute('role', 'status');
    await expect(live).toHaveAttribute('aria-live', 'polite');
    await expect(live).toHaveAttribute('aria-atomic', 'true');
    await expect(live).toHaveText('Waiting…');

    await btn.click();

    // Avoid time flakiness: assert shape + that it changed away from "Waiting…".
    await expect(live).toHaveText(/^Updated at .+$/);
    await expect(live).not.toHaveText('Waiting…');
  });

  test('tab order is deterministic', async ({ page }) => {
    await page.goto(URL);

    const skip = page.getByTestId('skip-link');
    const back = page.getByTestId('back');
    const navHome = page.getByTestId('nav-home');
    const navForms = page.getByTestId('nav-forms');
    const navTables = page.getByTestId('nav-tables');
    const ariaToggle = page.getByTestId('aria-toggle');
    const liveBtn = page.getByTestId('live-btn');
    const tab1 = page.getByTestId('tab-1');
    const tab2 = page.getByTestId('tab-2');
    const tab3 = page.getByTestId('tab-3');
    const tab4 = page.getByTestId('tab-4');

    await tab(page);
    await expect(skip).toBeFocused();

    await tab(page);
    await expect(back).toBeFocused();

    await tab(page);
    await expect(navHome).toBeFocused();

    await tab(page);
    await expect(navForms).toBeFocused();

    await tab(page);
    await expect(navTables).toBeFocused();

    await tab(page);
    await expect(ariaToggle).toBeFocused();

    await tab(page);
    await expect(liveBtn).toBeFocused();

    await tab(page);
    await expect(tab1).toBeFocused();

    await tab(page);
    await expect(tab2).toBeFocused();

    await tab(page);
    await expect(tab3).toBeFocused();

    await tab(page);
    await expect(tab4).toBeFocused();
  });
});

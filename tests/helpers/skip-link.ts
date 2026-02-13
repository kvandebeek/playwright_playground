import { expect, type Page, type Locator } from '@playwright/test';

const activeElementId = async (page: Page): Promise<string | null> =>
  page.evaluate(() => (document.activeElement instanceof HTMLElement ? document.activeElement.id : null));

const activeElementIsWithin = async (page: Page, container: Locator): Promise<boolean> =>
  container.evaluate((el) => el.contains(document.activeElement));

export const expectSkipLinkToMoveFocusToMain = async (page: Page): Promise<void> => {
  const skip = page.getByTestId('skip-link');
  const main = page.getByTestId('main');

  await expect(skip).toHaveAttribute('href', '#main');
  await skip.click();

  // Prefer direct focus on main if your markup supports it
  const focusedId = await activeElementId(page);
  if (focusedId === 'main') return;

  // Fallback: some pages focus the first focusable element inside main
  await expect.poll(async () => activeElementIsWithin(page, main)).toBe(true);
};

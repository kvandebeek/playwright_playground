import { test, expect, type Page } from '@playwright/test';

const URL = '/pages/html/a11y.html' as const;

const setKnownFocusState = async (page: Page): Promise<void> => {
  await page.locator('body').click({ position: { x: 1, y: 1 } });
  await page.evaluate(() => {
    const el = document.activeElement;
    if (el instanceof HTMLElement) el.blur();
  });
};

type FocusSignature = string;

const activeFocusSignature = async (page: Page): Promise<FocusSignature> =>
  page.evaluate(() => {
    const el = document.activeElement;
    if (!(el instanceof HTMLElement)) return 'none';

    const testId = el.getAttribute('data-testid');
    if (testId) return `testid:${testId}`;

    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : '';
    const name = el.getAttribute('name');
    const href = el instanceof HTMLAnchorElement ? el.getAttribute('href') : null;
    const type =
      el instanceof HTMLInputElement || el instanceof HTMLButtonElement ? el.getAttribute('type') : null;

    const parts: string[] = [`tag:${tag}${id}`];
    if (name) parts.push(`name:${name}`);
    if (type) parts.push(`type:${type}`);
    if (href) parts.push(`href:${href}`);

    return parts.join('|');
  });

const tabAndCapture = async (page: Page, steps: number): Promise<readonly FocusSignature[]> => {
  const seen: FocusSignature[] = [];
  for (let i = 0; i < steps; i += 1) {
    await page.keyboard.press('Tab');
    seen.push(await activeFocusSignature(page));
  }
  return seen;
};

test.describe('a11y.html', () => {
  test('tab order is deterministic', async ({ page }) => {
    await page.goto(URL);

    await setKnownFocusState(page);
    const run1 = await tabAndCapture(page, 20);

    await page.reload();
    await setKnownFocusState(page);
    const run2 = await tabAndCapture(page, 20);

    expect(run2).toEqual(run1);
    expect(new Set(run1).size).toBeGreaterThan(3);
  });
});

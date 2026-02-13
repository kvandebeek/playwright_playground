import { test, expect, type Locator, type Page } from '@playwright/test';

const TEST_IDS = {
  pageTitle: 'page-title',
  pageId: 'page-id',
  editable: 'editable',
  output: 'editable-output',
  read: 'btn-read',
  clear: 'btn-clear',
} as const;

const normalize = (s: string): string =>
  s
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .trim();

const getInnerHtml = async (editable: Locator): Promise<string> =>
  editable.evaluate((el) => {
    if (!(el instanceof HTMLElement)) throw new Error('editable not found');
    return el.innerHTML;
  });

const getText = async (locator: Locator): Promise<string> =>
  (await locator.textContent()) ?? '';

const decodeHtmlEntitiesInPage = async (page: Page, value: string): Promise<string> =>
  page.evaluate((v) => {
    const ta = document.createElement('textarea');
    ta.innerHTML = v;
    return ta.value;
  }, value);

const replaceEditableText = async (page: Page, editable: Locator, text: string): Promise<void> => {
  await editable.click();

  // Replace all content deterministically across browsers.
  try {
    await editable.press('Control+A');
  } catch {
    await editable.press('Meta+A');
  }
  await page.keyboard.type(text);
};

test.describe('content-editable.html', () => {
  const url = '/pages/html/content-editable.html';

  test('loads and shows stable identifiers', async ({ page }): Promise<void> => {
    await page.goto(url);

    await expect(page.getByTestId(TEST_IDS.pageTitle)).toHaveText('Contenteditable');
    await expect(page.getByTestId(TEST_IDS.pageId)).toHaveAttribute('data-page-id', 'content-editable');
  });

  test('editable region has correct accessibility attributes', async ({ page }): Promise<void> => {
    await page.goto(url);

    const editable = page.getByTestId(TEST_IDS.editable);

    await expect(editable).toHaveAttribute('contenteditable', 'true');
    await expect(editable).toHaveAttribute('role', 'textbox');
    await expect(editable).toHaveAttribute('aria-multiline', 'true');
    await expect(editable).toHaveAttribute('aria-labelledby', 'editable-title');
    await expect(editable).toHaveAttribute('tabindex', '0');
  });

  test('editable region is focusable and editable', async ({ page }): Promise<void> => {
    await page.goto(url);

    const editable = page.getByTestId(TEST_IDS.editable);

    await editable.click();
    await expect(editable).toBeFocused();

    await replaceEditableText(page, editable, 'New content');
    await expect(editable).toContainText('New content');
  });

  test('read HTML button outputs innerHTML', async ({ page }): Promise<void> => {
    await page.goto(url);

    const editable = page.getByTestId(TEST_IDS.editable);
    const readButton = page.getByTestId(TEST_IDS.read);
    const output = page.getByTestId(TEST_IDS.output);

    await replaceEditableText(page, editable, 'Hello');

    const expectedInnerHtml = normalize(await getInnerHtml(editable));

    await readButton.click();

    await expect.poll(async () => {
      const raw = normalize(await getText(output));

      // Some UIs render escaped HTML (e.g. &lt;b&gt;). If so, decode and compare.
      const decoded = normalize(await decodeHtmlEntitiesInPage(page, raw));
      return decoded === expectedInnerHtml ? decoded : raw;
    }).toBe(expectedInnerHtml);
  });

  test('clear button empties editable and output', async ({ page }): Promise<void> => {
    await page.goto(url);

    const editable = page.getByTestId(TEST_IDS.editable);
    const output = page.getByTestId(TEST_IDS.output);
    const readButton = page.getByTestId(TEST_IDS.read);
    const clearButton = page.getByTestId(TEST_IDS.clear);

    await replaceEditableText(page, editable, 'Temporary text');
    await readButton.click();
    await expect(output).toContainText('Temporary text');

    await clearButton.click();

    await expect(editable).toHaveText('');
    await expect(output).toHaveText('');
  });

  test('default content contains bold element', async ({ page }): Promise<void> => {
    await page.goto(url);

    const editable = page.getByTestId(TEST_IDS.editable);
    const bold = editable.locator('b');

    await expect(bold).toHaveText('Bold');
  });
});

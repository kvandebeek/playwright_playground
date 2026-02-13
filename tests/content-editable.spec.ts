import { test, expect } from '@playwright/test';

test.describe('content-editable.html', () => {
  const url = '/pages/html/content-editable.html';

  test('loads and shows stable identifiers', async ({ page }): Promise<void> => {
    await page.goto(url);

    await expect(page.getByTestId('page-title')).toHaveText('Contenteditable');
    await expect(page.getByTestId('page-id'))
      .toHaveAttribute('data-page-id', 'content-editable');
  });

  test('editable region has correct accessibility attributes', async ({ page }): Promise<void> => {
    await page.goto(url);

    const editable = page.getByTestId('editable');

    await expect(editable).toHaveAttribute('contenteditable', 'true');
    await expect(editable).toHaveAttribute('role', 'textbox');
    await expect(editable).toHaveAttribute('aria-multiline', 'true');
    await expect(editable).toHaveAttribute('aria-labelledby', 'editable-title');
    await expect(editable).toHaveAttribute('tabindex', '0');
  });

  test('editable region is focusable and editable', async ({ page }): Promise<void> => {
    await page.goto(url);

    const editable = page.getByTestId('editable');

    await editable.click();
    await expect(editable).toBeFocused();

    await editable.fill('New content');
    await expect(editable).toContainText('New content');
  });

  test('read HTML button outputs innerHTML', async ({ page }): Promise<void> => {
    await page.goto(url);

    const editable = page.getByTestId('editable');
    const output = page.getByTestId('editable-output');
    const readButton = page.getByTestId('btn-read');

    await editable.fill('Hello <b>World</b>');
    await readButton.click();

    await expect(output).toContainText('Hello <b>World</b>');
  });

  test('clear button empties editable and output', async ({ page }): Promise<void> => {
    await page.goto(url);

    const editable = page.getByTestId('editable');
    const output = page.getByTestId('editable-output');
    const readButton = page.getByTestId('btn-read');
    const clearButton = page.getByTestId('btn-clear');

    await editable.fill('Temporary text');
    await readButton.click();

    await expect(output).toContainText('Temporary text');

    await clearButton.click();

    await expect(editable).toHaveText('');
    await expect(output).toHaveText('');
  });

  test('default content contains bold element', async ({ page }): Promise<void> => {
    await page.goto(url);

    const editable = page.getByTestId('editable');
    const bold = editable.locator('b');

    await expect(bold).toHaveText('Bold');
  });
});

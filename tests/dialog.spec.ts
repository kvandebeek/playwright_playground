import { test, expect, type Page, type Locator } from '@playwright/test';
import { expectSkipLinkToMoveFocusToMain } from './helpers/skip-link';

test.describe('dialog.html', () => {
  const url: string = '/pages/html/dialog.html';

  const get = (page: Page): {
    readonly skip: Locator;
    readonly title: Locator;
    readonly pageId: Locator;
    readonly main: Locator;

    readonly openModal: Locator;
    readonly openNonModal: Locator;

    readonly dialog: Locator;
    readonly form: Locator;
    readonly dlgTitle: Locator;
    readonly dlgText: Locator;
    readonly ok: Locator;
    readonly cancel: Locator;

    readonly result: Locator;
  } => ({
    skip: page.getByTestId('skip-link'),
    title: page.getByTestId('page-title'),
    pageId: page.getByTestId('page-id'),
    main: page.getByTestId('main'),

    openModal: page.getByTestId('open-modal'),
    openNonModal: page.getByTestId('open-nonmodal'),

    dialog: page.getByTestId('dialog'),
    form: page.getByTestId('dialog-form'),
    dlgTitle: page.getByTestId('dialog-title'),
    dlgText: page.getByTestId('dialog-text'),
    ok: page.getByTestId('btn-ok'),
    cancel: page.getByTestId('btn-cancel'),

    result: page.getByTestId('dialog-result'),
  });

  const expectDialogClosed = async (ui: ReturnType<typeof get>): Promise<void> => {
    await expect(ui.dialog).toHaveAttribute('data-open', 'false');
    await expect(ui.dialog).toHaveAttribute('data-mode', 'none');
  };

  const expectDialogOpen = async (
    ui: ReturnType<typeof get>,
    mode: 'modal' | 'nonmodal',
  ): Promise<void> => {
    await expect(ui.dialog).toHaveAttribute('data-open', 'true');
    await expect(ui.dialog).toHaveAttribute('data-mode', mode);

    await expect(ui.form).toBeVisible();
    await expect(ui.dlgTitle).toHaveText('Confirm action');
    await expect(ui.dlgText).toHaveText('Choose OK or Cancel.');

    // Focus can be async; this assertion is still fine once the dialog is rendered.
    await expect(ui.ok).toBeFocused();
  };

  test('loads and shows stable identifiers', async ({ page }) => {
    const ui = get(page);
    await page.goto(url);

    await expect(ui.title).toHaveText('Dialog');
    await expect(ui.pageId).toHaveAttribute('data-page-id', 'dialog');
    await expect(ui.result).toHaveText('result: (none)');
    await expectDialogClosed(ui);
  });

  test('skip link moves focus to main', async ({ page }) => {
    await page.goto(url);
    await expectSkipLinkToMoveFocusToMain(page);
  });

  test('opens modal dialog and closes with OK', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'WebKit has incomplete/unstable <dialog> behavior in Playwright.');

    const ui = get(page);
    await page.goto(url);

    await ui.openModal.click();
    await expectDialogOpen(ui, 'modal');

    await ui.ok.click();
    await expectDialogClosed(ui);
    await expect(ui.result).toHaveText('result: ok');
    await expect(ui.openModal).toBeFocused();
  });

  test('opens non-modal dialog and closes with Cancel', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'WebKit has incomplete/unstable <dialog> behavior in Playwright.');

    const ui = get(page);
    await page.goto(url);

    await ui.openNonModal.click();
    await expectDialogOpen(ui, 'nonmodal');

    await ui.cancel.click();
    await expectDialogClosed(ui);
    await expect(ui.result).toHaveText('result: cancel');
    await expect(ui.openNonModal).toBeFocused();
  });

  test('pressing Escape cancels a modal dialog (Chromium/Firefox)', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'WebKit has incomplete/unstable <dialog> behavior in Playwright.');

    const ui = get(page);
    await page.goto(url);

    await ui.openModal.click();
    await expectDialogOpen(ui, 'modal');

    await page.keyboard.press('Escape');
    await expectDialogClosed(ui);
    await expect(ui.result).toHaveText('result: cancel');
    await expect(ui.openModal).toBeFocused();
  });

  test('tabs between OK and Cancel while open', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'WebKit has incomplete/unstable <dialog> behavior in Playwright.');

    const ui = get(page);
    await page.goto(url);

    await ui.openModal.click();
    await expectDialogOpen(ui, 'modal');

    await page.keyboard.press('Tab');
    await expect(ui.cancel).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(ui.ok).toBeFocused();

    await ui.cancel.click();
    await expectDialogClosed(ui);
    await expect(ui.result).toHaveText('result: cancel');
  });
});

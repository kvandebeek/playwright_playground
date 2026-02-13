import { test, expect, type Page, type Locator } from '@playwright/test';

test.describe('forms-validation.html', () => {
    const url: string = '/pages/html/forms-validation.html';

    const ids = {
        pageTitle: 'page-title',
        pageId: 'page-id',
        main: 'main',
        form: 'form-validation',
        required: 'v-required',
        pattern: 'v-pattern',
        minmax: 'v-minmax',
        minlength: 'v-minlength',
        email: 'v-email',
        btnNative: 'btn-native',
        btnReport: 'btn-report',
        btnSetCustom: 'btn-setcustom',
        btnClearCustom: 'btn-clearcustom',
        summary: 'validation-summary',
    } as const;

    async function goto(page: Page): Promise<void> {
        await page.goto(url);
        await expect(page.getByTestId(ids.pageTitle)).toHaveText('Forms - Validation');
        await expect(page.getByTestId(ids.pageId)).toHaveAttribute('data-page-id', 'forms-validation');
        await expect(page.getByTestId(ids.main)).toBeVisible();
    }

    function summary(page: Page): Locator {
        return page.getByTestId(ids.summary);
    }

    test('loads and shows stable identifiers', async ({ page }) => {
        await goto(page);

        await expect(page.getByTestId(ids.form)).toHaveAttribute('novalidate', '');
        await expect(page.getByTestId(ids.form)).toHaveAttribute('data-valid', /^(true|false)$/);

        await expect(page.getByTestId(ids.required)).toBeVisible();
        await expect(page.getByTestId(ids.pattern)).toBeVisible();
        await expect(page.getByTestId(ids.minmax)).toBeVisible();
        await expect(page.getByTestId(ids.minlength)).toBeVisible();
        await expect(page.getByTestId(ids.email)).toBeVisible();

        await expect(page.getByTestId(ids.btnNative)).toBeVisible();
        await expect(page.getByTestId(ids.btnReport)).toBeVisible();
        await expect(page.getByTestId(ids.btnSetCustom)).toBeVisible();
        await expect(page.getByTestId(ids.btnClearCustom)).toBeVisible();
    });

    test('initial state: required is invalid and summary reflects errors', async ({ page }) => {
        await goto(page);

        await expect(summary(page)).toHaveAttribute('data-errors-count', '1');
        await expect(summary(page)).toContainText(/^(req|required):/);

        await expect(page.getByTestId(ids.form)).toHaveAttribute('data-valid', 'false');
    });

    test('submit (custom) runs JS validation and shows multiple errors when values are invalid', async ({ page }) => {
        await goto(page);

        await page.getByTestId(ids.required).fill('');
        await page.getByTestId(ids.pattern).fill('ABC-12');
        await page.getByTestId(ids.minmax).fill('6');
        await page.getByTestId(ids.minlength).fill('1234');
        await page.getByTestId(ids.email).fill('not-an-email');

        await page.getByTestId(ids.btnNative).click();

        await expect(summary(page)).toHaveAttribute('data-errors-count', '5');
        await expect(summary(page)).toContainText(/req:/);
        await expect(summary(page)).toContainText(/pat:/);
        await expect(summary(page)).toContainText(/minmax:/);
        await expect(summary(page)).toContainText(/len:/);
        await expect(summary(page)).toContainText(/mail:/);

        await expect(page.getByTestId(ids.form)).toHaveAttribute('data-valid', 'false');
    });

    function validate(page: Page): Promise<void> {
        return page.getByTestId(ids.btnNative).click();
    }

    test('becomes valid when all fields are valid (input-driven)', async ({ page }) => {
        await goto(page);

        await page.getByTestId(ids.required).fill('ok');
        await page.getByTestId(ids.pattern).fill('ABC-123');
        await page.getByTestId(ids.minmax).fill('3');
        await page.getByTestId(ids.minlength).fill('12345');
        await page.getByTestId(ids.email).fill('a@b.com');

        await validate(page);

        await expect(summary(page)).toHaveAttribute('data-errors-count', '0');
        await expect(summary(page)).toHaveText('No validation errors');
        await expect(page.getByTestId(ids.form)).toHaveAttribute('data-valid', 'true');
    });

    test('setCustomValidity on pattern creates a custom error message when pattern value is invalid', async ({ page }) => {
        await goto(page);

        await page.getByTestId(ids.required).fill('ok');
        await page.getByTestId(ids.minmax).fill('3');
        await page.getByTestId(ids.minlength).fill('12345');
        await page.getByTestId(ids.email).fill('a@b.com');

        await page.getByTestId(ids.pattern).fill('ABC-12');
        await page.getByTestId(ids.btnSetCustom).click();

        await expect(summary(page)).toHaveAttribute('data-errors-count', '1');
        await expect(summary(page)).toContainText('pat: Custom: must match ABC-123 exactly');
        await expect(page.getByTestId(ids.form)).toHaveAttribute('data-valid', 'false');
    });

    test('clear custom validity removes the custom message; valid when remaining fields are valid', async ({ page }) => {
        await goto(page);

        await page.getByTestId(ids.required).fill('ok');
        await page.getByTestId(ids.pattern).fill('ABC-12');
        await page.getByTestId(ids.minmax).fill('3');
        await page.getByTestId(ids.minlength).fill('12345');
        await page.getByTestId(ids.email).fill('a@b.com');

        await page.getByTestId(ids.btnSetCustom).click();
        await expect(summary(page)).toContainText('pat: Custom: must match ABC-123 exactly');

        await page.getByTestId(ids.btnClearCustom).click();
        await expect(summary(page)).toContainText(/pat:/);
        await expect(summary(page)).not.toContainText('Custom: must match ABC-123 exactly');
        await expect(page.getByTestId(ids.form)).toHaveAttribute('data-valid', 'false');

        await page.getByTestId(ids.pattern).fill('ABC-123');
        await validate(page);

        await expect(summary(page)).toHaveAttribute('data-errors-count', '0');
        await expect(page.getByTestId(ids.form)).toHaveAttribute('data-valid', 'true');
    });

    test('reportValidity() does not change custom summary by itself (JS summary updates on input/submit)', async ({ page }) => {
        await goto(page);

        await page.getByTestId(ids.required).fill('ok');
        await page.getByTestId(ids.pattern).fill('ABC-123');
        await page.getByTestId(ids.minmax).fill('3');
        await page.getByTestId(ids.minlength).fill('12345');
        await page.getByTestId(ids.email).fill('a@b.com');

        await validate(page);

        await expect(summary(page)).toHaveAttribute('data-errors-count', '0');
        await expect(summary(page)).toHaveText('No validation errors');

        await page.getByTestId(ids.required).fill('');
        await validate(page);

        await expect(summary(page)).toHaveAttribute('data-errors-count', '1');

        await page.getByTestId(ids.btnReport).click();
        await expect(summary(page)).toHaveAttribute('data-errors-count', '1');
    });
});

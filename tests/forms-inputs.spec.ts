import { test, expect, type Page, type Locator } from '@playwright/test';

test.describe('forms-inputs.html', () => {
    const url: string = '/pages/html/forms-inputs.html';

    const ids = {
        pageTitle: 'page-title',
        pageId: 'page-id',
        main: 'main',

        form: 'form-inputs',
        text: 'input-text',
        password: 'input-password',
        email: 'input-email',
        number: 'input-number',
        range: 'input-range',
        date: 'input-date',
        time: 'input-time',
        datetime: 'input-datetime',
        color: 'input-color',
        search: 'input-search',
        tel: 'input-tel',
        url: 'input-url',
        textarea: 'textarea',
        select: 'select',
        multiselect: 'multiselect',
        datalist: 'input-datalist',
        file: 'input-file',
        fieldset: 'fieldset',
        radioA: 'radio-a',
        radioB: 'radio-b',
        check1: 'check-1',
        check2: 'check-2',

        btnSubmit: 'btn-submit',
        btnReset: 'btn-reset',
        btnDisabled: 'btn-disabled',
        btnReadonly: 'btn-readonly',

        output: 'form-output',
    } as const;

    async function goto(page: Page): Promise<void> {
        await page.goto(url);
        await expect(page.getByTestId(ids.pageTitle)).toHaveText('Forms - Inputs');
        await expect(page.getByTestId(ids.pageId)).toHaveAttribute('data-page-id', 'forms-inputs');
        await expect(page.getByTestId(ids.main)).toBeVisible();
    }

    function output(page: Page): Locator {
        return page.getByTestId(ids.output);
    }

    test('loads and shows stable identifiers', async ({ page }) => {
        await goto(page);

        await expect(page.getByTestId(ids.form)).toHaveAttribute('novalidate', '');

        // … your other attribute checks …

        const out: Locator = output(page);

        // Initial state: exists, hidden, empty.
        await expect(out).toBeHidden();
        await expect(out).toHaveText('');
    });

    test('submit renders FormData into output (includes defaults)', async ({ page }) => {
        await goto(page);

        await page.getByTestId(ids.text).fill('hello world');
        await page.getByTestId(ids.email).fill('a@b.com');
        await page.getByTestId(ids.search).fill('query');
        await page.getByTestId(ids.tel).fill('+32470000000');
        await page.getByTestId(ids.url).fill('https://example.com');

        await page.getByTestId(ids.number).fill('7');
        await page.getByTestId(ids.range).fill('55');

        await page.getByTestId(ids.textarea).fill('Line X\nLine Y');

        await page.getByTestId(ids.select).selectOption({ value: 'b2' });

        await page.getByTestId(ids.radioB).check();
        await page.getByTestId(ids.check2).check();

        await page.getByTestId(ids.btnSubmit).click();

        await expect(output(page)).toContainText('t=hello world');
        await expect(output(page)).toContainText('p=secret');
        await expect(output(page)).toContainText('e=a@b.com');
        await expect(output(page)).toContainText('n=7');
        await expect(output(page)).toContainText('r=55');
        await expect(output(page)).toContainText('ta=Line X\nLine Y');
        await expect(output(page)).toContainText('sel=b2');
        await expect(output(page)).toContainText('radio=b');
        await expect(output(page)).toContainText('check1=on');
        await expect(output(page)).toContainText('check2=on');
    });

    test('multi-select: selecting multiple options is reflected in output (repeated keys)', async ({ page }) => {
        await goto(page);

        await page.getByTestId(ids.multiselect).selectOption([{ value: 'm2' }, { value: 'm4' }]);
        await page.getByTestId(ids.btnSubmit).click();

        const outText: string = await output(page).innerText();
        const occurrencesMsel: number = outText.split('msel=').length - 1;
        expect(occurrencesMsel).toBe(2);
        expect(outText).toContain('msel=m2');
        expect(outText).toContain('msel=m4');
    });

    test('datalist input submits as plain text value', async ({ page }) => {
        await goto(page);

        await page.getByTestId(ids.datalist).fill('Brussels');
        await page.getByTestId(ids.btnSubmit).click();

        await expect(output(page)).toContainText('dl=Brussels');
    });

    test('file input: selecting files appears in output as filename(s)', async ({ page }) => {
        await goto(page);

        await page.getByTestId(ids.file).setInputFiles([
            { name: 'a.txt', mimeType: 'text/plain', buffer: Buffer.from('a') },
            { name: 'b.txt', mimeType: 'text/plain', buffer: Buffer.from('b') },
        ]);

        await page.getByTestId(ids.btnSubmit).click();

        const outText: string = await output(page).innerText();
        const occurrencesFup: number = outText.split('fup=').length - 1;
        expect(occurrencesFup).toBe(2);
        expect(outText).toContain('fup=a.txt');
        expect(outText).toContain('fup=b.txt');
    });

    test('reset clears output', async ({ page }) => {
        await goto(page);

        await page.getByTestId(ids.text).fill('something');
        await page.getByTestId(ids.btnSubmit).click();
        await expect(output(page)).not.toHaveText('');

        await page.getByTestId(ids.btnReset).click();
        await expect(output(page)).toHaveText('');
    });

    test('toggle readonly toggles text input readOnly and aria-pressed', async ({ page }) => {
        await goto(page);

        const textInput: Locator = page.getByTestId(ids.text);
        const toggle: Locator = page.getByTestId(ids.btnReadonly);

        await expect(toggle).toHaveAttribute('aria-pressed', 'false');
        await expect(textInput).toHaveJSProperty('readOnly', false);

        await toggle.click();
        await expect(toggle).toHaveAttribute('aria-pressed', 'true');
        await expect(textInput).toHaveJSProperty('readOnly', true);

        await toggle.click();
        await expect(toggle).toHaveAttribute('aria-pressed', 'false');
        await expect(textInput).toHaveJSProperty('readOnly', false);
    });
});

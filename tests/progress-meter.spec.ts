import { test, expect } from '@playwright/test';

test.describe('progress-meter.html', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/pages/html/progress-meter.html'); });

  test('has header basics', async ({ page }) => {
    await expect(page.getByTestId('page-title')).toHaveText('Progress & Meter');
    await expect(page.getByTestId('page-id')).toHaveAttribute('data-page-id', 'progress-meter');
    await expect(page.getByTestId('back')).toHaveAttribute('href', './../../index.html');
  });

  test('skip link targets main and updates hash', async ({ page }) => {
    const skip = page.getByTestId('skip-link');
    await expect(skip).toHaveAttribute('href', '#main');
    await skip.click();
    await expect(page).toHaveURL(/#main$/);
  });

  test('initial values are in sync (progress/meter/text/dataset)', async ({ page }) => {
    const box = page.getByTestId('box'), prog = page.getByTestId('progress'), meter = page.getByTestId('meter'), pt = page.getByTestId('progress-text'), mt = page.getByTestId('meter-text');
    await expect(prog).toHaveAttribute('value', '30');
    await expect(prog).toHaveAttribute('max', '100');
    await expect(meter).toHaveAttribute('value', '55');
    await expect(meter).toHaveAttribute('min', '0');
    await expect(meter).toHaveAttribute('max', '100');
    await expect(meter).toHaveAttribute('low', '30');
    await expect(meter).toHaveAttribute('high', '70');
    await expect(meter).toHaveAttribute('optimum', '80');
    await expect(pt).toHaveText('30');
    await expect(mt).toHaveText('55');
    await expect(box).toHaveAttribute('data-progress', '30');
    await expect(box).toHaveAttribute('data-meter', '55');
  });

  test('aria wiring: labels + controls', async ({ page }) => {
    await expect(page.getByTestId('progress')).toHaveAttribute('aria-labelledby', 'progLabel');
    await expect(page.getByTestId('meter')).toHaveAttribute('aria-labelledby', 'meterLabel');
    await expect(page.getByTestId('btn-inc')).toHaveAttribute('aria-controls', 'prog met');
    await expect(page.getByTestId('btn-dec')).toHaveAttribute('aria-controls', 'prog met');
  });

  test('Increase updates values by +10 and keeps everything in sync', async ({ page }) => {
    const box = page.getByTestId('box'), prog = page.getByTestId('progress'), meter = page.getByTestId('meter'), pt = page.getByTestId('progress-text'), mt = page.getByTestId('meter-text');
    await page.getByTestId('btn-inc').click();
    await expect(prog).toHaveAttribute('value', '40');
    await expect(meter).toHaveAttribute('value', '65');
    await expect(pt).toHaveText('40');
    await expect(mt).toHaveText('65');
    await expect(box).toHaveAttribute('data-progress', '40');
    await expect(box).toHaveAttribute('data-meter', '65');
  });

  test('Decrease updates values by -10 and keeps everything in sync', async ({ page }) => {
    const box = page.getByTestId('box'), prog = page.getByTestId('progress'), meter = page.getByTestId('meter'), pt = page.getByTestId('progress-text'), mt = page.getByTestId('meter-text');
    await page.getByTestId('btn-dec').click();
    await expect(prog).toHaveAttribute('value', '20');
    await expect(meter).toHaveAttribute('value', '45');
    await expect(pt).toHaveText('20');
    await expect(mt).toHaveText('45');
    await expect(box).toHaveAttribute('data-progress', '20');
    await expect(box).toHaveAttribute('data-meter', '45');
  });

  test('clamps at 0..100', async ({ page }) => {
    const prog = page.getByTestId('progress'), meter = page.getByTestId('meter'), pt = page.getByTestId('progress-text'), mt = page.getByTestId('meter-text'), inc = page.getByTestId('btn-inc'), dec = page.getByTestId('btn-dec');

    for (let i = 0; i < 20; i++) await inc.click();
    await expect(prog).toHaveAttribute('value', '100');
    await expect(meter).toHaveAttribute('value', '100');
    await expect(pt).toHaveText('100');
    await expect(mt).toHaveText('100');

    for (let i = 0; i < 20; i++) await dec.click();
    await expect(prog).toHaveAttribute('value', '0');
    await expect(meter).toHaveAttribute('value', '0');
    await expect(pt).toHaveText('0');
    await expect(mt).toHaveText('0');
  });

  test('visual: box renders consistently', async ({ page }) => {
    await expect(page.getByTestId('box')).toHaveScreenshot('progress-meter-box.png', { animations: 'disabled' });
  });
});

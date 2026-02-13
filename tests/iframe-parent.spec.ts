import { test, expect, type Locator } from '@playwright/test';

test.describe('iframe-parent.html', () => {
  const url: string = '/pages/html/iframe-parent.html';

  test('child ignores ping if allowedOrigin does not match (forced invalid parentOrigin)', async ({ page }) => {
    await page.goto(url);

    const iframe: Locator = page.getByTestId('iframe');
    const recv: Locator = page.getByTestId('parent-received');
    const btn: Locator = page.getByTestId('btn-send');

    await iframe.evaluate((el) => {
      const frame = el as HTMLIFrameElement;
      const u = new URL(frame.src, window.location.href);
      u.searchParams.set('parentOrigin', 'https://example.invalid');
      frame.src = u.toString();
    });

    await expect.poll(async () => (await iframe.getAttribute('src')) ?? '').toContain(
      'parentOrigin=https%3A%2F%2Fexample.invalid',
    );
    await expect
      .poll(async () => await iframe.evaluate((el) => (el as HTMLIFrameElement).contentDocument?.readyState ?? ''))
      .toBe('complete');

    // Reset *after* reload to avoid auto-handshake overwriting your reset.
    await page.evaluate(() => {
      const recvEl = document.querySelector<HTMLElement>('[data-testid="parent-received"]');
      const iframeEl = document.querySelector<HTMLIFrameElement>('[data-testid="iframe"]');
      if (!recvEl || !iframeEl) throw new Error('elements not found');
      recvEl.dataset.status = 'none';
      recvEl.textContent = 'parent received: (none)';
      iframeEl.dataset.lastSent = '';
      iframeEl.dataset.lastReceived = '';
    });

    await btn.click();

    // Assert it remains none (i.e., no pong arrives).
    await expect.poll(async () => (await recv.getAttribute('data-status')) ?? '', { timeout: 1500 }).toBe('none');
    await expect(recv).toHaveText('parent received: (none)');
  });
});

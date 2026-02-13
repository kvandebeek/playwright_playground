import { test, expect } from '@playwright/test';

test.describe('iframe-parent.html', () => {
    const url: string = '/pages/html/iframe-parent.html';

    test('child ignores ping if allowedOrigin does not match (forced invalid parentOrigin)', async ({ page }) => {
        await page.goto(url);

        const iframe = page.getByTestId('iframe');
        const recv = page.getByTestId('parent-received');
        const btn = page.getByTestId('btn-send');

        // Force iframe to reload with an invalid parentOrigin so the child will ignore messages.
        await page.evaluate(() => {
            const el = document.querySelector<HTMLIFrameElement>('[data-testid="iframe"]');
            const recvEl = document.querySelector<HTMLElement>('[data-testid="parent-received"]');
            if (!el || !recvEl) throw new Error('elements not found');

            const u = new URL(el.src, window.location.href);
            u.searchParams.set('parentOrigin', 'https://example.invalid');
            el.src = u.toString();

            // Reset parent display state so test is independent of initial auto-pong.
            recvEl.dataset.status = 'none';
            recvEl.textContent = 'parent received: (none)';
            el.dataset.status = 'loaded';
            el.dataset.lastSent = '';
            el.dataset.lastReceived = '';
        });

        await expect(iframe).toHaveAttribute('data-status', /^(loaded|ping-sent|pong-received)$/);

        await btn.click();

        // Parent should remain in "none" state (no pong arrives).
        await expect(recv).toHaveText('parent received: (none)');
        await expect(recv).toHaveAttribute('data-status', 'none');

        await expect.poll(async () => (await iframe.getAttribute('data-status')) ?? '', { timeout: 1500 })
            .not.toBe('pong-received');
    });
});

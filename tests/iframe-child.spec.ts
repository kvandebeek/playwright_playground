import { test, expect, type Page, type Frame } from '@playwright/test';

const CHILD_FRAME_TEST_ID: string = 'child-frame';

const getFrameByTestId = async (page: Page, testId: string): Promise<Frame> => {
    const handle = await page.getByTestId(testId).elementHandle();
    if (!handle) throw new Error(`Frame element not found: data-testid="${testId}"`);
    const frame = await handle.contentFrame();
    if (!frame) throw new Error(`contentFrame() returned null for data-testid="${testId}"`);
    return frame;
};

test.describe('iframe-child.html', () => {
    test('loads and shows stable identifiers (standalone)', async ({ page }) => {
        await page.goto('/pages/html/iframe-child.html');

        await expect(page.getByTestId('page-title')).toHaveText('Iframe Child');
        await expect(page.getByTestId('page-id')).toHaveAttribute('data-page-id', 'iframe-child');
        await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
        await expect(page.getByTestId('child-status')).toHaveAttribute('data-status', 'waiting');
    });

    test('ignores ping when allowedOrigin does not match', async ({ page }) => {
        await page.goto('/pages/html/iframe-child.html');
        const origin: string = new URL(page.url()).origin;

        await page.setContent(`
      <!doctype html>
      <html>
        <body>
          <iframe
            data-testid="${CHILD_FRAME_TEST_ID}"
            src="/pages/html/iframe-child.html?parentOrigin=${encodeURIComponent('https://example.invalid')}">
          </iframe>
          <button data-testid="send" type="button">send</button>
          <script>
            document.querySelector('[data-testid="send"]').addEventListener('click', () => {
              const f = document.querySelector('iframe[data-testid="${CHILD_FRAME_TEST_ID}"]');
              f.contentWindow.postMessage({ type: 'ping', at: Date.now() }, ${JSON.stringify(origin)});
            });
          </script>
        </body>
      </html>
    `);

        const childFrame: Frame = await getFrameByTestId(page, CHILD_FRAME_TEST_ID);
        const status = childFrame.getByTestId('child-status');

        await expect(childFrame.locator('html')).toHaveAttribute('data-ready', 'true');
        await expect(status).toHaveAttribute('data-status', 'waiting');

        await page.getByTestId('send').click();

        await expect(status).toHaveAttribute('data-status', 'waiting');
        await expect(status).toContainText('waiting');
    });
});

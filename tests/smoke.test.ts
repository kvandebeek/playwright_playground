// tests/smoke-test.ts
import { test, expect } from '@playwright/test';

type SmokeRoute = { path: string; pageId?: string };

const routes: SmokeRoute[] = [
  { path: '/pages/html/kitchen-sink.html', pageId: 'catalog' },
  { path: '/pages/html/a11y.html', pageId: 'a11y' },
  { path: '/pages/html/audio-video.html', pageId: 'audio-video' },
  { path: '/pages/html/content-editable.html', pageId: 'content-editable' },
  { path: '/pages/html/details-summary.html', pageId: 'details-summary' },
  { path: '/pages/html/dialog.html', pageId: 'dialog' },
  { path: '/pages/html/forms-inputs.html', pageId: 'forms-inputs' },
  { path: '/pages/html/forms-validation.html', pageId: 'forms-validation' },
  { path: '/pages/html/iframe-child.html', pageId: 'iframe-child' },
  { path: '/pages/html/iframe-parent.html', pageId: 'iframe-parent' },
  { path: '/pages/html/images.html', pageId: 'images' },
  { path: '/pages/html/links.html', pageId: 'links' },
  { path: '/pages/html/lists.html', pageId: 'lists' },
  { path: '/pages/html/media.html', pageId: 'media' },
  { path: '/pages/html/progress-meter.html', pageId: 'progress-meter' },
  { path: '/pages/html/semantic.html', pageId: 'semantic' },
  { path: '/pages/html/tables.html', pageId: 'tables' },
  { path: '/pages/html/text.html', pageId: 'text' },
];

const ignoreFavicon = (url: string) => /favicon\.ico($|\?)/i.test(url);

test.describe('smoke', () => {
  for (const r of routes) {
    test(`loads ${r.path}`, async ({ page, baseURL }, testInfo) => {
      const issues = { pageErrors: [] as string[], consoleErrors: [] as string[], requestFailed: [] as string[], httpErrors: [] as string[] };
      page.on('pageerror', e => issues.pageErrors.push(e?.stack || e?.message || String(e)));
      page.on('console', m => m.type() === 'error' && issues.consoleErrors.push(m.text()));
      page.on('requestfailed', req => !ignoreFavicon(req.url()) && issues.requestFailed.push(`${req.resourceType()}: ${req.url()} -> ${req.failure()?.errorText || 'unknown'}`));
      page.on('response', res => res.status() >= 400 && !ignoreFavicon(res.url()) && issues.httpErrors.push(`${res.status()}: ${res.url()}`));

      const formatIssues = () => [
        issues.pageErrors.length ? `PAGE ERRORS:\n- ${issues.pageErrors.join('\n- ')}` : '',
        issues.consoleErrors.length ? `CONSOLE.ERROR:\n- ${issues.consoleErrors.join('\n- ')}` : '',
        issues.httpErrors.length ? `HTTP >= 400:\n- ${issues.httpErrors.join('\n- ')}` : '',
        issues.requestFailed.length ? `REQUEST FAILED:\n- ${issues.requestFailed.join('\n- ')}` : '',
      ].filter(Boolean).join('\n\n');

      await test.step('Navigate', async () => page.goto(new URL(r.path, baseURL).toString(), { waitUntil: 'domcontentloaded' }));

      await test.step('Contract', async () => {
        await expect(page.getByTestId('page-title')).toBeVisible();
        await expect(page.getByTestId('page-id')).toHaveAttribute('data-page-id', /.+/);
        if (r.pageId) await expect(page.getByTestId('page-id')).toHaveAttribute('data-page-id', r.pageId);
      });

      await test.step('Errors', async () => {
        const total = issues.pageErrors.length + issues.consoleErrors.length + issues.httpErrors.length + issues.requestFailed.length;
        const summary = `Issues found on ${r.path}\n\n${formatIssues() || '(none)'}`;
        if (total) testInfo.attach('smoke-issues.txt', { body: summary, contentType: 'text/plain' });
        expect(total, summary).toBe(0);
      });
    });
  }
});

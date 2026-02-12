// tests/smoke-test.ts
import { test, expect } from '@playwright/test';

type Allow = { pageErrors?: RegExp[]; consoleErrors?: RegExp[]; httpErrors?: RegExp[]; requestFailed?: RegExp[] };
type SmokeRoute = { path: string; pageId?: string; allow?: Allow };

const allowGoogleFonts: Allow = { consoleErrors: [/downloadable font: download failed/i, /fonts\.gstatic\.com/i], requestFailed: [/fonts\.(gstatic|googleapis)\.com/i], httpErrors: [/fonts\.(gstatic|googleapis)\.com/i] };

const routes: SmokeRoute[] = [
  { path: '/pages/html/kitchen-sink.html', pageId: 'catalog' },
  { path: '/pages/html/a11y.html', pageId: 'a11y' },
  { path: '/pages/html/audio-video.html', pageId: 'audio-video' },
  { path: '/pages/html/content-editable.html', pageId: 'content-editable' },
  { path: '/pages/html/details-summary.html', pageId: 'details-summary' },
  { path: '/pages/html/dialog.html', pageId: 'dialog' },
  { path: '/pages/html/forms-inputs.html', pageId: 'forms-inputs' },
  { path: '/pages/html/forms-validation.html', pageId: 'forms-validation' },
  { path: '/pages/html/iframe-child.html', pageId: 'iframe-child', allow: allowGoogleFonts },
  { path: '/pages/html/iframe-parent.html', pageId: 'iframe-parent', allow: allowGoogleFonts },
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
const matchesAny = (s: string, pats?: RegExp[]) => !!pats?.some(p => p.test(s));
const allowFor = (r: SmokeRoute, kind: keyof Allow, msg: string) => matchesAny(msg, r.allow?.[kind]);
const fmt = (title: string, xs: string[]) => xs.length ? `${title}:\n- ${xs.join('\n- ')}` : '';
const fmtAll = (issues: Record<string, string[]>) => [fmt('PAGE ERRORS', issues.pageErrors), fmt('CONSOLE.ERROR', issues.consoleErrors), fmt('HTTP >= 400', issues.httpErrors), fmt('REQUEST FAILED', issues.requestFailed)].filter(Boolean).join('\n\n');

test.describe('smoke', () => {
  for (const r of routes) {
    test(`loads ${r.path}`, async ({ page, baseURL }, testInfo) => {
      const issues = { pageErrors: [] as string[], consoleErrors: [] as string[], requestFailed: [] as string[], httpErrors: [] as string[] };

      page.on('pageerror', e => issues.pageErrors.push(e?.stack || e?.message || String(e)));
      page.on('console', m => {
        if (m.type() !== 'error') return;
        const t = m.text();
        if (/Failed to load resource: the server responded with a status of 404/i.test(t)) return; // noisy; real URL is in httpErrors
        issues.consoleErrors.push(t);
      });
      
      page.on('requestfailed', req => !ignoreFavicon(req.url()) && issues.requestFailed.push(`${req.resourceType()}: ${req.url()} -> ${req.failure()?.errorText || 'unknown'}`));
      page.on('response', res => res.status() >= 400 && !ignoreFavicon(res.url()) && issues.httpErrors.push(`${res.status()}: ${res.url()}`));

      await test.step('Navigate', async () => page.goto(new URL(r.path, baseURL).toString(), { waitUntil: 'domcontentloaded' }));

      await test.step('Contract', async () => {
        await expect(page.getByTestId('page-title')).toHaveCount(1);
        await expect(page.getByTestId('page-title')).toBeVisible();
        await expect(page.getByTestId('page-id')).toHaveCount(1);
        await expect(page.getByTestId('page-id')).toHaveAttribute('data-page-id', /.+/);
        if (r.pageId) await expect(page.getByTestId('page-id')).toHaveAttribute('data-page-id', r.pageId);
      });

      await test.step('Errors', async () => {
        const unexpected = {
          pageErrors: issues.pageErrors.filter(x => !allowFor(r, 'pageErrors', x)),
          consoleErrors: issues.consoleErrors.filter(x => !allowFor(r, 'consoleErrors', x)),
          httpErrors: issues.httpErrors.filter(x => !allowFor(r, 'httpErrors', x)),
          requestFailed: issues.requestFailed.filter(x => !allowFor(r, 'requestFailed', x)),
        };
        const totalUnexpected = unexpected.pageErrors.length + unexpected.consoleErrors.length + unexpected.httpErrors.length + unexpected.requestFailed.length;
        const allSummary = `ALL issues for ${r.path}\n\n${fmtAll(issues) || '(none)'}`;
        const unexpectedSummary = `UNEXPECTED issues for ${r.path}\n\n${fmtAll(unexpected) || '(none)'}`;

        if (issues.pageErrors.length + issues.consoleErrors.length + issues.httpErrors.length + issues.requestFailed.length) testInfo.attach('smoke-issues-all.txt', { body: allSummary, contentType: 'text/plain' });
        if (totalUnexpected) testInfo.attach('smoke-issues-unexpected.txt', { body: unexpectedSummary, contentType: 'text/plain' });

        expect(totalUnexpected, unexpectedSummary).toBe(0);
      });
    });
  }
});

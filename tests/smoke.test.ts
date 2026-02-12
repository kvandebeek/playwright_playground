// tests/smoke-test.ts
import { test, expect } from '@playwright/test';
import { attachAnnotatedScreenshot } from './helpers/annotate-screenshot.js';

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
      const origin = new URL(baseURL!).origin;
      const isSameOrigin = (url: string) => url.startsWith(origin);

      page.on('pageerror', e => issues.pageErrors.push(e?.stack || e?.message || String(e)));
      page.on('console', m => { if (m.type() !== 'error') return; const t = m.text(); if (/Failed to load resource: the server responded with a status of 404/i.test(t)) return; issues.consoleErrors.push(t); });
      page.on('requestfailed', req => { const url = req.url(); if (!isSameOrigin(url) || ignoreFavicon(url)) return; issues.requestFailed.push(`${req.resourceType()}: ${url} -> ${req.failure()?.errorText || 'unknown'}`); });
      page.on('response', res => { const url = res.url(); if (!isSameOrigin(url) || ignoreFavicon(url) || res.status() < 400) return; issues.httpErrors.push(`${res.status()}: ${url}`); });

      await test.step('Navigate', async () => page.goto(new URL(r.path, baseURL).toString(), { waitUntil: 'domcontentloaded' }));

      await test.step('Contract', async () => {
        try {
          await expect(page.getByTestId('page-title')).toHaveCount(1);
          await expect(page.getByTestId('page-title')).toBeVisible();
          await expect(page.getByTestId('page-id')).toHaveCount(1);
          await expect(page.locator('main')).toHaveCount(1);
          await expect(page.locator('h1')).toHaveCount(1);
        } catch (e) {
          await attachAnnotatedScreenshot(page, page.getByTestId('page-title'), 'contract: page-title', testInfo);
          await attachAnnotatedScreenshot(page, page.getByTestId('page-id'), 'contract: page-id', testInfo);
          await testInfo.attach('contract-error.txt', { body: String(e), contentType: 'text/plain' });
          throw e;
        }
      });
      

      await test.step('Errors', async () => {
        const unexpected = { pageErrors: issues.pageErrors.filter(x => !allowFor(r, 'pageErrors', x)), consoleErrors: issues.consoleErrors.filter(x => !allowFor(r, 'consoleErrors', x)), httpErrors: issues.httpErrors.filter(x => !allowFor(r, 'httpErrors', x)), requestFailed: issues.requestFailed.filter(x => !allowFor(r, 'requestFailed', x)) };
        const totalAll = issues.pageErrors.length + issues.consoleErrors.length + issues.httpErrors.length + issues.requestFailed.length;
        const totalUnexpected = unexpected.pageErrors.length + unexpected.consoleErrors.length + unexpected.httpErrors.length + unexpected.requestFailed.length;
        const allSummary = `ALL issues for ${r.path}\n\n${fmtAll(issues) || '(none)'}`;
        const unexpectedSummary = `UNEXPECTED issues for ${r.path}\n\n${fmtAll(unexpected) || '(none)'}`;
        if (totalAll) testInfo.attach('smoke-issues-all.txt', { body: allSummary, contentType: 'text/plain' });
        if (totalUnexpected) testInfo.attach('smoke-issues-unexpected.txt', { body: unexpectedSummary, contentType: 'text/plain' });
        expect(totalUnexpected, unexpectedSummary).toBe(0);
      });
    });
  }
});

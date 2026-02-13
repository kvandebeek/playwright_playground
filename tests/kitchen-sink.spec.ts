import { test, expect, type Locator, type Page } from '@playwright/test';

type MetricKey = 'orders' | 'tickets' | 'incidents';

const URL = '/pages/html/kitchen-sink.html?mode=static' as const;

const METRICS: Readonly<
  Record<
    MetricKey,
    {
      readonly title: string;
      readonly subtitle: string;
      readonly buttons: readonly [string, string];
      readonly requiredBadgeText?: string; // e.g. "+12%"
    }
  >
> = {
  orders: { title: 'Orders', subtitle: 'Last 24 hours', buttons: ['View', 'Export'], requiredBadgeText: '+12%' },
  tickets: { title: 'Tickets', subtitle: 'Open, unassigned', buttons: ['Assign', 'Snooze'] },
  incidents: { title: 'Incidents', subtitle: 'Active right now', buttons: ['Acknowledge', 'Details'] },
};

function metricCard(page: Page, key: MetricKey): Locator {
  const testId: string =
    key === 'orders'
      ? 'metric-orders'
      : key === 'tickets'
        ? 'metric-tickets'
        : 'metric-incidents';
  return page.getByTestId(testId);
}

function metricHeader(card: Locator): Locator {
  return card.locator('.card__hd');
}

function metricValue(card: Locator): Locator {
  return card.getByTestId('metric-value');
}

function metricSubtitle(card: Locator): Locator {
  return card.getByTestId('metric-subtitle');
}

function metricButtons(card: Locator): Locator {
  return card.getByTestId('btn'); // duplicates exist globally; ALWAYS scope to card
}

async function expectMetricCard(page: Page, key: MetricKey): Promise<void> {
  const card = metricCard(page, key);
  const expected = METRICS[key];

  await expect(card, `${key}: card visible`).toBeVisible();

  // Header: title + (optional) badge text.
  const header = metricHeader(card);
  await expect(header, `${key}: header contains title`).toContainText(expected.title);
  if (expected.requiredBadgeText !== undefined) {
    await expect(header, `${key}: header contains badge text`).toContainText(expected.requiredBadgeText);
  }

  // Subtitle is stable.
  await expect(metricSubtitle(card), `${key}: subtitle`).toHaveText(expected.subtitle);

  // Value is dynamic -> validate shape + reasonable bounds.
  // (Bounds are a pragmatic guard against empty/NaN/negative/unreasonably large values.)
  const valueLocator = metricValue(card);
  await expect(valueLocator, `${key}: value visible`).toBeVisible();
  await expect(valueLocator, `${key}: value is an integer`).toHaveText(/^\d+$/);

  const raw = (await valueLocator.textContent())?.trim() ?? '';
  const value = Number.parseInt(raw, 10);
  expect(Number.isNaN(value), `${key}: parsed value should be a number (got "${raw}")`).toBeFalsy();
  expect(value, `${key}: value should be >= 0`).toBeGreaterThanOrEqual(0);
  expect(value, `${key}: value should be <= 100000`).toBeLessThanOrEqual(100000);

  // Buttons: labels must be stable; some demo states may be disabled.
  const buttons = metricButtons(card);
  await expect(buttons, `${key}: has exactly 2 buttons`).toHaveCount(2);

  await expect(buttons.nth(0), `${key}: first button label`).toHaveText(expected.buttons[0]);
  await expect(buttons.nth(0), `${key}: first button type`).toHaveAttribute('type', 'button');

  await expect(buttons.nth(1), `${key}: second button label`).toHaveText(expected.buttons[1]);
  await expect(buttons.nth(1), `${key}: second button type`).toHaveAttribute('type', 'button');

  // From your snapshot, Orders Export is disabled and Incidents Acknowledge is disabled.
  // Guard those demo states (they’re meaningful regressions if they change).
  if (key === 'orders') {
    await expect(buttons.nth(1), 'orders: Export is disabled in demo').toBeDisabled();
  }
  if (key === 'incidents') {
    await expect(buttons.nth(0), 'incidents: Acknowledge is disabled in demo').toBeDisabled();
  }
}

test.describe('kitchen-sink.html (hardened)', () => {
    test('overview section contains expected metric cards (stable text + constrained dynamic values)', async ({ page }) => {
        await page.goto(URL);
      
        const overview = page.getByTestId('overview-card');
        await expect(overview).toBeVisible();
      
        const orders = page.getByTestId('metric-orders');
        await expect(orders.getByTestId('metric-value')).toHaveText('248');
        await expect(orders.getByTestId('metric-subtitle')).toHaveText('Last 24 hours');
      
        const tickets = page.getByTestId('metric-tickets');
        await expect(tickets.getByTestId('metric-value')).toHaveText('37');
        await expect(tickets.getByTestId('metric-subtitle')).toHaveText('Open, unassigned');
      
        const incidents = page.getByTestId('metric-incidents');
        await expect(incidents.getByTestId('metric-value')).toHaveText('3');
        await expect(incidents.getByTestId('metric-subtitle')).toHaveText('Active right now');
      });

  test('overview card does not leak duplicate test ids when scoped', async ({ page }) => {
    await page.goto(URL);

    const overview = page.getByTestId('overview-card');
    const scopedButtons = overview.getByTestId('btn');
    // There are 3 metrics * 2 buttons each = 6 buttons in the overview section.
    await expect(scopedButtons).toHaveCount(6);
  });

  test('validation demo: email is marked invalid and disabled action is disabled', async ({ page }) => {
    await page.goto(URL);

    const validation = page.getByTestId('validation-card');
    await expect(validation).toBeVisible();

    await expect(validation.getByTestId('email-input')).toHaveAttribute('aria-invalid', 'true');

    const buttons = validation.getByTestId('btn');
    await expect(buttons).toHaveCount(3);
    await expect(buttons.nth(1)).toHaveText('Disabled');
    await expect(buttons.nth(1)).toBeDisabled();
  });
});

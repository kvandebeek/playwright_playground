import { test, expect } from '@playwright/test';

test.describe('lists.html', () => {
  const url: string = '/pages/html/lists.html';

  test('loads and shows stable identifiers', async ({ page }) => {
    await page.goto(url);

    await expect(page.getByTestId('page-title')).toHaveText('Lists');
    await expect(page.getByTestId('page-id')).toHaveAttribute('data-page-id', 'lists');

    const back = page.getByTestId('back');
    await expect(back).toHaveAttribute('href', './../../index.html');
    await expect(back).toHaveAttribute('aria-label', 'Back to index');
  });

  test('skip link targets main and updates hash', async ({ page }) => {
    await page.goto(url);

    const skip = page.getByTestId('skip-link');
    await expect(skip).toHaveAttribute('href', '#main');

    await skip.click();
    await expect(page).toHaveURL(/#main$/);
    await expect(page.getByTestId('main')).toBeVisible();
  });

  test('unordered list has 3 items and correct text', async ({ page }) => {
    await page.goto(url);

    const ul = page.getByTestId('ul');
    await expect(ul).toBeVisible();
    await expect(ul).toHaveAttribute('data-count', '3');

    const items = ul.locator(':scope > li');
    await expect(items).toHaveCount(3);

    await expect(page.getByTestId('ul-1')).toHaveText('Alpha');
    await expect(page.getByTestId('ul-2')).toHaveText('Beta');
    await expect(page.getByTestId('ul-3')).toHaveText('Gamma');
  });

  test('ordered list starts at 3 and has 2 items', async ({ page }) => {
    await page.goto(url);

    const ol = page.getByTestId('ol');
    await expect(ol).toBeVisible();
    await expect(ol).toHaveAttribute('start', '3');
    await expect(ol).toHaveAttribute('data-count', '2');

    const items = ol.locator(':scope > li');
    await expect(items).toHaveCount(2);

    await expect(page.getByTestId('ol-1')).toHaveText('Third');
    await expect(page.getByTestId('ol-2')).toHaveText('Fourth');
  });

  test('description list has 2 terms and correct term/definition pairs', async ({ page }) => {
    await page.goto(url);

    const dl = page.getByTestId('dl');
    await expect(dl).toBeVisible();
    await expect(dl).toHaveAttribute('data-terms', '2');

    const terms = dl.locator(':scope > dt');
    const defs = dl.locator(':scope > dd');
    await expect(terms).toHaveCount(2);
    await expect(defs).toHaveCount(2);

    await expect(page.getByTestId('dt-1')).toHaveText('Term A');
    await expect(page.getByTestId('dd-1')).toHaveText('Definition A');
    await expect(page.getByTestId('dt-2')).toHaveText('Term B');
    await expect(page.getByTestId('dd-2')).toHaveText('Definition B');
  });

  test('nested list has 1 parent and 2 direct children', async ({ page }) => {
    await page.goto(url);

    const nestedRoot = page.getByTestId('nested-ul');
    await expect(nestedRoot).toBeVisible();

    const parent = page.getByTestId('nested-parent');
    await expect(parent).toContainText('Parent');

    const childrenList = page.getByTestId('nested-ul-children');
    await expect(childrenList).toHaveAttribute('data-count', '2');

    const children = childrenList.locator(':scope > li');
    await expect(children).toHaveCount(2);

    await expect(page.getByTestId('nested-child-1')).toHaveText('Child 1');
    await expect(page.getByTestId('nested-child-2')).toHaveText('Child 2');
  });

  test('all list counts are computed correctly by script', async ({ page }) => {
    await page.goto(url);

    const getAttr = async (testId: string, attr: string): Promise<string> => {
      const loc = page.getByTestId(testId);
      const val = await loc.getAttribute(attr);
      if (val === null) throw new Error(`Missing attribute "${attr}" on [data-testid="${testId}"]`);
      return val;
    };

    await expect(page.getByTestId('ul').locator(':scope > li')).toHaveCount(Number(await getAttr('ul', 'data-count')));
    await expect(page.getByTestId('ol').locator(':scope > li')).toHaveCount(Number(await getAttr('ol', 'data-count')));
    await expect(page.getByTestId('nested-ul').locator(':scope > li')).toHaveCount(1);
    await expect(page.getByTestId('nested-ul-children').locator(':scope > li')).toHaveCount(
      Number(await getAttr('nested-ul-children', 'data-count')),
    );

    const dl = page.getByTestId('dl');
    const dlTerms = Number((await dl.getAttribute('data-terms')) ?? 'NaN');
    expect(Number.isFinite(dlTerms)).toBeTruthy();
    await expect(dl.locator(':scope > dt')).toHaveCount(dlTerms);
  });
});

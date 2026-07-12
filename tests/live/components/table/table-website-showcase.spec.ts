import { expect, test } from '@playwright/test';

const websiteUrl = process.env.TABLE_WEBSITE_URL
  || 'http://127.0.0.1:5566/components.html#comp-table';

test('public website table card opens the complete working showcase', async ({ page }) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto(websiteUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const section = document.querySelector('#comp-table');
    const table = section?.querySelector('#demo-table') as any;
    return table?.shadowRoot?.querySelectorAll('tbody tr[data-index]').length === 8;
  });

  const compact = await page.evaluate(() => {
    const section = document.querySelector('#comp-table')!;
    const table = section.querySelector('#demo-table') as any;
    const revenue = table.shadowRoot.querySelector(
      'tbody tr[data-index] td[data-key="revenue"] snice-cell-currency'
    ) as any;
    return {
      tables: section.querySelectorAll('snice-table').length,
      groupingCopy: section.textContent?.includes('Grouping + aggregation'),
      groupedId: !!section.querySelector('#demo-table-grouped'),
      moreLink: !!section.querySelector('.more-link[data-slug="table"]'),
      formatCountCopy: section.textContent?.includes('24 built-in cell formats'),
      firstRevenue: revenue?.shadowRoot?.querySelector('.cell-content')?.textContent?.trim(),
    };
  });
  expect(compact).toEqual({
    tables: 1,
    groupingCopy: false,
    groupedId: false,
    moreLink: true,
    formatCountCopy: true,
    firstRevenue: '$284,500',
  });

  await page.locator('#comp-table .more-link[data-slug="table"]').click();
  await expect(page.locator('#help-drawer')).toHaveClass(/open/);
  await page.locator('.help-drawer-tab[data-tab="showcase"]').click();

  const frame = page.frameLocator('#help-drawer-iframe');
  await expect(frame.locator('h1')).toHaveText('Snice Table');
  await expect(frame.locator('#pro-table')).toBeAttached();
  await expect(frame.locator('#editing-demo')).toBeAttached();
  await expect(frame.locator('#virtual-demo')).toBeAttached();
  await expect(frame.locator('#remote-demo')).toBeAttached();
  await expect(frame.locator('#grouping-demo')).toBeAttached();

  await page.waitForFunction(() => {
    const iframe = document.querySelector('#help-drawer-iframe') as HTMLIFrameElement;
    const remote = iframe.contentDocument?.querySelector('#remote-demo') as any;
    return remote?.data?.length === 5 && remote.totalItems === 42;
  });

  const expectedShowcasePath = process.env.TABLE_WEBSITE_URL
    ? 'showcase/table.html'
    : '/components/table/full-showcase.html';
  expect(await page.locator('#help-drawer-iframe').getAttribute('src'))
    .toContain(expectedShowcasePath);

  await page.locator('.theme-btn').evaluate((button: HTMLButtonElement) => button.click());
  await expect(frame.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(errors).toEqual([]);
});

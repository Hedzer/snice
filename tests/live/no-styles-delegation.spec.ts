import { expect, test } from '@playwright/test';

const builds = [
  {
    name: 'source',
    fixtureUrl: '/tests/live/fixtures/framework/no-styles-delegation.ts',
    tag: 'no-styles-delegation-source'
  },
  {
    name: 'distribution',
    fixtureUrl: '/tests/live/fixtures/framework/no-styles-delegation-distribution.ts',
    tag: 'no-styles-delegation-distribution'
  }
] as const;

for (const build of builds) {
  test(`${build.name}: delegated @on works without a styles declaration`, async ({ page }) => {
    await page.goto('/guide.html');
    const result = await page.evaluate(async ({ fixtureUrl, tag }) => {
      await import(fixtureUrl);
      const host = document.createElement(tag) as any;
      document.body.append(host);
      await host.ready;
      host.shadowRoot.querySelector('#target').click();
      return {
        delegated: host.delegatedClicks,
        direct: host.directClicks
      };
    }, build);

    expect(result).toEqual({ delegated: 1, direct: 1 });
  });
}

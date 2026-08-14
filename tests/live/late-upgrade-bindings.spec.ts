import { expect, test, type Page } from '@playwright/test';

async function exerciseLateUpgrade(page: Page, fixtureUrl: string, hostTag: string, childTag: string) {
  await page.goto('/guide.html');

  return page.evaluate(async ({ fixtureUrl, hostTag, childTag }) => {
    const fixture = await import(fixtureUrl);
    const host = document.createElement(hostTag) as any;
    document.body.append(host);
    await host.ready;

    const children = Object.fromEntries(
      Array.from(host.shadowRoot.querySelectorAll(childTag)).map((child: any) => [
        child.id,
        { ownBefore: Object.hasOwn(child, 'value') }
      ])
    );

    fixture.defineLateUpgradeBindingChild();
    await customElements.whenDefined(childTag);
    const upgraded = Object.fromEntries(
      await Promise.all(Array.from(host.shadowRoot.querySelectorAll(childTag)).map(async (child: any) => {
        await child.ready;
        return [child.id, {
          ownBefore: children[child.id].ownBefore,
          ownAfter: Object.hasOwn(child, 'value'),
          value: child.value,
          rendered: child.shadowRoot.textContent.trim()
        }];
      }))
    );

    const direct = host.shadowRoot.querySelector('#direct') as any;
    const replacement = { source: 'updated' };
    direct.value = replacement;
    await direct.rendered;

    return {
      upgraded,
      identities: {
        direct: direct.value === replacement,
        spread: host.shadowRoot.querySelector('#spread').value === fixture.spreadValue
      },
      reactiveRender: direct.shadowRoot.textContent.trim()
    };
  }, { fixtureUrl, hostTag, childTag });
}

for (const build of [
  {
    name: 'source',
    fixtureUrl: '/tests/live/fixtures/framework/late-upgrade-bindings.ts',
    hostTag: 'late-upgrade-binding-host',
    childTag: 'late-upgrade-binding-child'
  },
  {
    name: 'distribution',
    fixtureUrl: '/tests/live/fixtures/framework/late-upgrade-bindings-distribution.ts',
    hostTag: 'dist-late-upgrade-binding-host',
    childTag: 'dist-late-upgrade-binding-child'
  }
] as const) {
  test(`${build.name}: late-upgraded children preserve direct and spread property bindings`, async ({ page }) => {
    const result = await exerciseLateUpgrade(page, build.fixtureUrl, build.hostTag, build.childTag);

    expect(result.upgraded).toEqual({
      direct: { ownBefore: true, ownAfter: false, value: { source: 'direct' }, rendered: '[object Object]' },
      spread: { ownBefore: true, ownAfter: false, value: { source: 'spread' }, rendered: '[object Object]' },
      false: { ownBefore: true, ownAfter: false, value: false, rendered: 'false' },
      zero: { ownBefore: true, ownAfter: false, value: 0, rendered: '0' },
      empty: { ownBefore: true, ownAfter: false, value: '', rendered: '' },
      undefined: { ownBefore: true, ownAfter: false, value: undefined, rendered: 'undefined' },
      attribute: { ownBefore: true, ownAfter: false, value: 'authored', rendered: 'authored' }
    });
    expect(result.identities).toEqual({ direct: true, spread: true });
    expect(result.reactiveRender).toBe('[object Object]');
  });
}

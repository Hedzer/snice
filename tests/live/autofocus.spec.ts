import { expect, test, type Page } from '@playwright/test';

const builds = [
  {
    name: 'source',
    fixtureUrl: '/tests/live/fixtures/framework/autofocus.ts',
    hostTag: 'autofocus-source-host',
    closedTag: 'autofocus-source-closed-host'
  },
  {
    name: 'distribution',
    fixtureUrl: '/tests/live/fixtures/framework/autofocus-distribution.ts',
    hostTag: 'autofocus-distribution-host',
    closedTag: 'autofocus-distribution-closed-host'
  }
] as const;

async function mountBeforeUpgrade(
  page: Page,
  build: typeof builds[number],
  kind: string,
  hostAutofocus = false,
  closed = false
) {
  await page.goto('/guide.html');
  return page.evaluate(async ({ fixtureUrl, hostTag, closedTag, kind, hostAutofocus, closed }) => {
    const tag = closed ? closedTag : hostTag;
    const host = document.createElement(tag) as any;
    host.setAttribute('kind', kind);
    if (hostAutofocus) host.autofocus = true;
    document.body.append(host);

    await import(fixtureUrl);
    await customElements.whenDefined(tag);
    await host.ready;
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

    return {
      hostActive: document.activeElement === host,
      focusedKind: host.focusedKind
    };
  }, { ...build, kind, hostAutofocus, closed });
}

for (const build of builds) {
  test(`${build.name}: autofocus on a late-upgraded Snice host reaches its native control`, async ({ page }) => {
    await expect(mountBeforeUpgrade(page, build, 'host', true)).resolves.toEqual({
      hostActive: true,
      focusedKind: 'fallback'
    });
  });

  for (const kind of ['input', 'textarea', 'button', 'select', 'tabindex']) {
    test(`${build.name}: native ${kind}[autofocus] works inside the Snice shadow root`, async ({ page }) => {
      await expect(mountBeforeUpgrade(page, build, kind)).resolves.toEqual({
        hostActive: true,
        focusedKind: kind
      });
    });
  }

  test(`${build.name}: native autofocus works in a closed Snice shadow root`, async ({ page }) => {
    await expect(mountBeforeUpgrade(page, build, 'closed-input', false, true)).resolves.toEqual({
      hostActive: true,
      focusedKind: 'closed-input'
    });
  });

  test(`${build.name}: the first autofocus host wins`, async ({ page }) => {
    await page.goto('/guide.html');
    const result = await page.evaluate(async ({ fixtureUrl, hostTag }) => {
      const first = document.createElement(hostTag) as any;
      const second = document.createElement(hostTag) as any;
      first.autofocus = true;
      second.autofocus = true;
      document.body.append(first, second);

      await import(fixtureUrl);
      await customElements.whenDefined(hostTag);
      await Promise.all([first.ready, second.ready]);
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

      return {
        first: document.activeElement === first && first.focusedKind === 'fallback',
        second: document.activeElement === second || second.focusedKind !== null
      };
    }, build);

    expect(result).toEqual({ first: true, second: false });
  });

  test(`${build.name}: autofocus does not replace focus established during initialization`, async ({ page }) => {
    await page.goto('/guide.html');
    const result = await page.evaluate(async ({ fixtureUrl, hostTag }) => {
      const existing = document.createElement('button');
      const host = document.createElement(hostTag) as any;
      host.autofocus = true;
      document.body.append(existing, host);
      existing.focus();

      await import(fixtureUrl);
      await customElements.whenDefined(hostTag);
      await host.ready;
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

      return {
        existing: document.activeElement === existing,
        host: document.activeElement === host
      };
    }, build);

    expect(result).toEqual({ existing: true, host: false });
  });

  test(`${build.name}: assigning the native autofocus property after ready works`, async ({ page }) => {
    await page.goto('/guide.html');
    const result = await page.evaluate(async ({ fixtureUrl, hostTag }) => {
      await import(fixtureUrl);
      const host = document.createElement(hostTag) as any;
      document.body.append(host);
      await host.ready;
      host.autofocus = true;
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

      return {
        reflected: host.hasAttribute('autofocus'),
        hostActive: document.activeElement === host,
        focusedKind: host.focusedKind
      };
    }, build);

    expect(result).toEqual({ reflected: true, hostActive: true, focusedKind: 'fallback' });
  });
}

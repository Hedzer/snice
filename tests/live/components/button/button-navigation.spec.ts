import { expect, test, type Page } from '@playwright/test';
import { allowedNavigationUrls, unsafeNavigationUrls } from '../../../navigation-url-cases';

type BuildTarget = 'source' | 'distribution' | 'cdn';

const navigationCases = {
  unsafe: unsafeNavigationUrls.map(([href, description]) => ({ href, description })),
  allowed: allowedNavigationUrls.map(([href, description, target]) => ({
    href,
    description,
    target
  }))
};

async function loadButton(page: Page, build: BuildTarget) {
  await page.goto('/guide.html', { waitUntil: 'domcontentloaded' });

  if (build === 'source') {
    await page.evaluate(async () => {
      await import('/packages/components/src/button/snice-button.ts');
    });
  } else if (build === 'distribution') {
    await page.evaluate(async () => {
      await import('/dist/components/button/snice-button.js');
    });
  } else {
    await page.addScriptTag({ url: '/components/snice-button.min.js' });
  }

  await page.waitForFunction(() => Boolean(customElements.get('snice-button')));
}

async function exerciseNavigationPolicy(page: Page, build: BuildTarget) {
  await loadButton(page, build);

  return page.evaluate(async ({ unsafe, allowed }) => {
    type ButtonElement = HTMLElement & {
      href: unknown;
      target: string;
      download: string;
      ready: Promise<void>;
      rendered: Promise<void>;
      click(): void;
    };

    const originalOpen = window.open;
    const opens: Array<[string, string | undefined, string | undefined]> = [];
    let buttonEvents = 0;
    let errors = 0;
    let activeOrder: string[] | null = null;
    (globalThis as any).__sniceNavigationInjected = 0;
    window.open = ((url?: string | URL, target?: string, features?: string) => {
      activeOrder?.push('open');
      opens.push([String(url), target, features]);
      return null;
    }) as typeof window.open;

    const waitForButton = async (button: ButtonElement) => {
      await button.ready;
      await button.rendered;
      if (!(button.shadowRoot?.querySelector('button') instanceof HTMLButtonElement)) {
        throw new Error('snice-button did not render its internal button');
      }
      return button;
    };

    const connectWithAttribute = async (href: string, label: string, target = '_blank') => {
      const button = document.createElement('snice-button') as ButtonElement;
      button.setAttribute('href', href);
      button.setAttribute('target', target);
      button.textContent = label;
      button.addEventListener('button-click', () => {
        buttonEvents++;
        activeOrder?.push('button-click');
      });
      document.body.appendChild(button);
      return waitForButton(button);
    };

    const connectWithProperty = async (href: unknown, label: string, target = '_blank') => {
      const button = document.createElement('snice-button') as ButtonElement;
      button.textContent = label;
      button.addEventListener('button-click', () => {
        buttonEvents++;
        activeOrder?.push('button-click');
      });
      document.body.appendChild(button);
      await button.ready;
      button.target = target;
      button.href = href;
      return waitForButton(button);
    };

    const activate = (button: ButtonElement) => {
      const openStart = opens.length;
      const eventStart = buttonEvents;
      button.click();
      return {
        calls: opens.slice(openStart),
        events: buttonEvents - eventStart,
        authoredHref: button.getAttribute('href'),
        target: button.target,
        label: button.textContent?.trim()
      };
    };

    const blockedAttributes = [];
    const blockedProperties = [];
    const allowedAttributes = [];
    const allowedProperties = [];

    try {
      for (const { href, description } of unsafe) {
        blockedAttributes.push(activate(
          await connectWithAttribute(href, `Attribute: ${description}`)
        ));
        blockedProperties.push(activate(
          await connectWithProperty(href, `Property: ${description}`)
        ));
      }

      for (const { href, description, target } of allowed) {
        allowedAttributes.push(activate(
          await connectWithAttribute(`  ${href}  `, `Attribute: ${description}`, target)
        ));
        allowedProperties.push(activate(
          await connectWithProperty(`  ${href}  `, `Property: ${description}`, target)
        ));
      }

      const authored = document.createElement('div');
      authored.innerHTML = `
        <snice-button href="jav&#x61;script:globalThis.__sniceNavigationInjected += 2" target="_blank">Encoded letter</snice-button>
        <snice-button href="javascript&#58;globalThis.__sniceNavigationInjected += 4" target="_blank">Encoded colon</snice-button>
        <snice-button href="java&#x0a;script:globalThis.__sniceNavigationInjected += 8" target="_blank">Encoded newline</snice-button>
      `;
      document.body.appendChild(authored);
      const encoded = [];
      for (const button of Array.from(authored.querySelectorAll('snice-button')) as ButtonElement[]) {
        button.addEventListener('button-click', () => buttonEvents++);
        encoded.push(activate(await waitForButton(button)));
      }

      const nonStringValues = [
        null,
        undefined,
        false,
        0,
        Number.NaN,
        1,
        [],
        { toString: () => 'https://example.test/coerced' },
        { toString: () => { throw new Error('must not convert'); } }
      ];
      const nonStrings = [];
      for (const value of nonStringValues) {
        try {
          nonStrings.push(activate(
            await connectWithProperty(value, `Non-string ${nonStrings.length}`)
          ));
        } catch {
          errors++;
        }
      }

      const exactTargets = [];
      for (const target of ['_BLANK', '_SeLf', '_PaReNt', '_ToP', 'named-report-window']) {
        exactTargets.push(activate(
          await connectWithProperty('/guide.html#exact-target', `Exact ${target}`, target)
        ));
      }

      const dynamic = await connectWithProperty('/guide.html#safe-before', 'Dynamic target', '_blank');
      const safeBefore = activate(dynamic);
      dynamic.target = 'changed-report-window';
      dynamic.href = '/guide.html#safe-after';
      const safeAfter = activate(dynamic);
      dynamic.href = 'javascript:globalThis.__sniceNavigationInjected += 16';
      const blockedAfterChange = activate(dynamic);

      const ordered = await connectWithProperty('/guide.html#ordered', 'Ordered activation', '_blank');
      const order: string[] = [];
      activeOrder = order;
      activate(ordered);
      activeOrder = null;

      const download = await connectWithProperty('/images/snice-logo.png', 'Captured download', '_blank');
      download.download = 'captured-logo.png';
      await download.rendered;
      const originalCreateElement = document.createElement.bind(document);
      const downloadActivations: Array<{ href: string | null; download: string; target: string | null }> = [];
      document.createElement = ((tagName: string, options?: ElementCreationOptions) => {
        const element = originalCreateElement(tagName, options);
        if (tagName.toLowerCase() === 'a') {
          const anchor = element as HTMLAnchorElement;
          anchor.click = () => {
            downloadActivations.push({
              href: anchor.getAttribute('href'),
              download: anchor.download,
              target: anchor.getAttribute('target')
            });
          };
        }
        return element;
      }) as typeof document.createElement;
      const downloadResult = activate(download);
      document.createElement = originalCreateElement;

      return {
        blockedAttributes,
        blockedProperties,
        allowedAttributes,
        allowedProperties,
        encoded,
        nonStrings,
        exactTargets,
        dynamic: { safeBefore, safeAfter, blockedAfterChange },
        order,
        downloadResult,
        downloadActivations,
        executed: (globalThis as any).__sniceNavigationInjected,
        errors
      };
    } finally {
      window.open = originalOpen;
      delete (globalThis as any).__sniceNavigationInjected;
    }
  }, navigationCases);
}

function assertPolicyResult(result: Awaited<ReturnType<typeof exerciseNavigationPolicy>>) {
  expect(result.blockedAttributes).toHaveLength(navigationCases.unsafe.length);
  expect(result.blockedProperties).toHaveLength(navigationCases.unsafe.length);
  for (const entry of [...result.blockedAttributes, ...result.blockedProperties]) {
    expect(entry.calls).toEqual([]);
    expect(entry.events).toBe(0);
    expect(entry.label).toBeTruthy();
  }

  expect(result.allowedAttributes).toHaveLength(navigationCases.allowed.length);
  expect(result.allowedProperties).toHaveLength(navigationCases.allowed.length);
  for (const [index, expected] of navigationCases.allowed.entries()) {
    for (const entries of [result.allowedAttributes, result.allowedProperties]) {
      expect(entries[index].calls).toEqual([[expected.href, expected.target, 'noopener']]);
      expect(entries[index].events).toBe(1);
      expect(entries[index].target).toBe(expected.target);
      expect(entries[index].label).toBeTruthy();
    }
  }

  expect(result.encoded).toHaveLength(3);
  expect(result.encoded.every(entry => entry.calls.length === 0 && entry.events === 0)).toBe(true);
  expect(result.nonStrings).toHaveLength(9);
  expect(result.nonStrings.every(entry => entry.calls.length === 0 && entry.events === 0)).toBe(true);

  const exactTargets = ['_BLANK', '_SeLf', '_PaReNt', '_ToP', 'named-report-window'];
  expect(result.exactTargets).toHaveLength(exactTargets.length);
  result.exactTargets.forEach((entry, index) => {
    expect(entry.calls).toEqual([['/guide.html#exact-target', exactTargets[index], 'noopener']]);
    expect(entry.events).toBe(1);
  });

  expect(result.dynamic.safeBefore.calls).toEqual([
    ['/guide.html#safe-before', '_blank', 'noopener']
  ]);
  expect(result.dynamic.safeAfter.calls).toEqual([
    ['/guide.html#safe-after', 'changed-report-window', 'noopener']
  ]);
  expect(result.dynamic.blockedAfterChange.calls).toEqual([]);
  expect(result.dynamic.blockedAfterChange.events).toBe(0);
  expect(result.order).toEqual(['open', 'button-click']);
  expect(result.downloadResult.calls).toEqual([]);
  expect(result.downloadResult.events).toBe(1);
  expect(result.downloadActivations).toEqual([{
    href: '/images/snice-logo.png',
    download: 'captured-logo.png',
    target: null
  }]);
  expect(result.executed).toBe(0);
  expect(result.errors).toBe(0);
}

async function addButton(
  page: Page,
  { id, label, href, target, download }: {
    id: string;
    label: string;
    href: string;
    target?: string;
    download?: string;
  }
) {
  await page.evaluate(async ({ id, label, href, target, download }) => {
    type ButtonElement = HTMLElement & { ready: Promise<void>; rendered: Promise<void> };
    const button = document.createElement('snice-button') as ButtonElement;
    button.id = id;
    button.textContent = label;
    button.setAttribute('href', href);
    if (target !== undefined) button.setAttribute('target', target);
    if (download !== undefined) button.setAttribute('download', download);
    button.style.cssText = 'position:relative;z-index:10000;margin:.25rem;';
    document.body.prepend(button);
    await button.ready;
    await button.rendered;
  }, { id, label, href, target, download });
}

async function expectRealBrowsingContextBehavior(page: Page) {
  const context = page.context();
  const originalPageCount = context.pages().length;

  await addButton(page, {
    id: 'button-real-blank',
    label: 'Open isolated blank target',
    href: '/guide.html#button-real-blank',
    target: '_blank'
  });
  const blankPromise = context.waitForEvent('page');
  await page.getByRole('button', { name: 'Open isolated blank target' }).click();
  const blank = await blankPromise;
  await blank.waitForLoadState('domcontentloaded');
  expect(await blank.evaluate(() => window.opener === null)).toBe(true);
  expect(new URL(blank.url()).hash).toBe('#button-real-blank');

  await addButton(page, {
    id: 'button-real-named-first',
    label: 'Open first isolated named target',
    href: '/guide.html#button-real-named-first',
    target: 'snice-button-report-window'
  });
  const firstNamedPromise = context.waitForEvent('page');
  await page.getByRole('button', { name: 'Open first isolated named target' }).click();
  const firstNamed = await firstNamedPromise;
  await firstNamed.waitForLoadState('domcontentloaded');
  expect(await firstNamed.evaluate(() => window.opener === null)).toBe(true);
  expect(new URL(firstNamed.url()).hash).toBe('#button-real-named-first');

  await addButton(page, {
    id: 'button-real-named-second',
    label: 'Open second isolated named target',
    href: '/guide.html#button-real-named-second',
    target: 'snice-button-report-window'
  });
  const secondNamedPromise = context.waitForEvent('page');
  await page.getByRole('button', { name: 'Open second isolated named target' }).click();
  const secondNamed = await secondNamedPromise;
  await secondNamed.waitForLoadState('domcontentloaded');
  expect(secondNamed).not.toBe(firstNamed);
  expect(await secondNamed.evaluate(() => window.opener === null)).toBe(true);
  expect(new URL(secondNamed.url()).hash).toBe('#button-real-named-second');
  expect(new URL(firstNamed.url()).hash).toBe('#button-real-named-first');

  await blank.close();
  await firstNamed.close();
  await secondNamed.close();
  expect(context.pages()).toHaveLength(originalPageCount);

  for (const [target, hash] of [
    ['', '#button-real-default'],
    ['_SeLf', '#button-real-self'],
    ['_PaReNt', '#button-real-parent'],
    ['_ToP', '#button-real-top']
  ] as const) {
    const label = `Navigate same context ${target || 'without target'}`;
    await addButton(page, {
      id: `button-real-${target || 'default'}`,
      label,
      href: `/guide.html${hash}`,
      target: target || undefined
    });
    await page.getByRole('button', { name: label }).click();
    await expect.poll(() => new URL(page.url()).hash).toBe(hash);
    expect(context.pages()).toHaveLength(originalPageCount);
  }

  await addButton(page, {
    id: 'button-real-download',
    label: 'Download without a popup',
    href: '/images/snice-logo.png',
    target: '_blank',
    download: 'button-logo.png'
  });
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download without a popup' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('button-logo.png');
  expect(context.pages()).toHaveLength(originalPageCount);
}

for (const build of ['source', 'distribution', 'cdn'] as const) {
  test(`isolates targeted button navigation through ${build}`, async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    assertPolicyResult(await exerciseNavigationPolicy(page, build));
    await expectRealBrowsingContextBehavior(page);

    expect(pageErrors).toEqual([]);
  });
}

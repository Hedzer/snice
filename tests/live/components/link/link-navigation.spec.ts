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

async function loadLink(page: Page, build: BuildTarget) {
  await page.goto('/guide.html', { waitUntil: 'domcontentloaded' });

  if (build === 'source') {
    await page.evaluate(async () => {
      await import('/packages/components/src/link/snice-link.ts');
    });
  } else if (build === 'distribution') {
    await page.evaluate(async () => {
      await import('/dist/components/link/snice-link.js');
    });
  } else {
    await page.addScriptTag({ url: '/components/snice-link.min.js' });
  }

  await page.waitForFunction(() => Boolean(customElements.get('snice-link')));
}

async function exerciseNavigationPolicy(page: Page, build: BuildTarget) {
  await loadLink(page, build);

  return page.evaluate(async ({ unsafe, allowed }) => {
    type LinkElement = HTMLElement & {
      href: unknown;
      target: string;
      external: boolean;
      hash: boolean;
      ready: Promise<void>;
      rendered: Promise<void>;
    };

    (globalThis as any).__sniceNavigationInjected = 0;
    let navigateEvents = 0;
    let errors = 0;
    const initialHref = location.href;
    const initialHistoryLength = history.length;

    const waitForLink = async (link: LinkElement) => {
      await link.ready;
      await link.rendered;
      const anchor = link.shadowRoot?.querySelector('a');
      if (!(anchor instanceof HTMLAnchorElement)) throw new Error('snice-link did not render an anchor');
      return anchor;
    };

    const activationWasPreventedByComponent = (anchor: HTMLAnchorElement) => {
      let prevented: boolean | null = null;
      const intercept = (event: MouseEvent) => {
        prevented = event.defaultPrevented;
        event.preventDefault();
      };
      anchor.addEventListener('click', intercept, { once: true });
      anchor.click();
      return prevented;
    };

    const connectWithAttribute = async (href: string, label: string, target = '_self') => {
      const link = document.createElement('snice-link') as LinkElement;
      link.setAttribute('href', href);
      link.setAttribute('target', target);
      link.textContent = label;
      link.addEventListener('navigate', () => navigateEvents++);
      document.body.appendChild(link);
      return { link, anchor: await waitForLink(link) };
    };

    const connectWithProperty = async (href: unknown, label: string, target = '_self') => {
      const link = document.createElement('snice-link') as LinkElement;
      link.textContent = label;
      link.addEventListener('navigate', () => navigateEvents++);
      document.body.appendChild(link);
      await link.ready;
      link.target = target;
      link.href = href;
      return { link, anchor: await waitForLink(link) };
    };

    const inspectBlocked = (link: LinkElement, anchor: HTMLAnchorElement) => ({
      authoredHref: link.getAttribute('href'),
      hasHref: anchor.hasAttribute('href'),
      prevented: activationWasPreventedByComponent(anchor),
      cursor: getComputedStyle(anchor).cursor,
      label: link.textContent
    });

    const inspectAllowed = (link: LinkElement, anchor: HTMLAnchorElement) => ({
      authoredHref: link.getAttribute('href'),
      href: anchor.getAttribute('href'),
      target: anchor.target,
      prevented: activationWasPreventedByComponent(anchor),
      cursor: getComputedStyle(anchor).cursor,
      label: link.textContent
    });

    const blockedAttributes = [];
    const blockedProperties = [];
    const allowedAttributes = [];
    const allowedProperties = [];

    try {
      for (const { href, description } of unsafe) {
        const attributeLink = await connectWithAttribute(href, `Attribute: ${description}`);
        blockedAttributes.push(inspectBlocked(attributeLink.link, attributeLink.anchor));

        const propertyLink = await connectWithProperty(href, `Property: ${description}`);
        blockedProperties.push(inspectBlocked(propertyLink.link, propertyLink.anchor));
      }

      for (const { href, description, target } of allowed) {
        const attributeLink = await connectWithAttribute(`  ${href}  `, `Attribute: ${description}`, target);
        allowedAttributes.push(inspectAllowed(attributeLink.link, attributeLink.anchor));

        const propertyLink = await connectWithProperty(`  ${href}  `, `Property: ${description}`, target);
        allowedProperties.push(inspectAllowed(propertyLink.link, propertyLink.anchor));
      }

      const authored = document.createElement('div');
      authored.innerHTML = `
        <snice-link href="jav&#x61;script:globalThis.__sniceNavigationInjected += 2">Encoded letter</snice-link>
        <snice-link href="javascript&#58;globalThis.__sniceNavigationInjected += 4">Encoded colon</snice-link>
        <snice-link href="java&#x0a;script:globalThis.__sniceNavigationInjected += 8">Encoded newline</snice-link>
      `;
      document.body.appendChild(authored);
      const encoded = [];
      for (const link of Array.from(authored.querySelectorAll('snice-link')) as LinkElement[]) {
        const anchor = await waitForLink(link);
        encoded.push(inspectBlocked(link, anchor));
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
          const propertyLink = await connectWithProperty(value, `Non-string ${nonStrings.length}`);
          nonStrings.push(inspectBlocked(propertyLink.link, propertyLink.anchor));
        } catch {
          errors++;
        }
      }

      const dynamic = await connectWithProperty('/safe-before', 'Dynamic policy');
      const safeBefore = dynamic.anchor.getAttribute('href');
      dynamic.link.href = 'javascript:globalThis.__sniceNavigationInjected += 16';
      const staleActivationPrevented = activationWasPreventedByComponent(dynamic.anchor);
      await dynamic.link.rendered;
      const unsafeRemoved = !dynamic.anchor.hasAttribute('href');
      dynamic.link.href = '/safe-after';
      await dynamic.link.rendered;
      const safeAfter = dynamic.anchor.getAttribute('href');

      const hashUnsafe = await connectWithProperty(
        'javascript:globalThis.__sniceNavigationInjected += 32',
        'Unsafe hash route'
      );
      hashUnsafe.link.hash = true;
      await hashUnsafe.link.rendered;
      const hashUnsafeResult = inspectBlocked(hashUnsafe.link, hashUnsafe.anchor);

      const empty = await connectWithAttribute('', 'Empty href');
      const whitespace = await connectWithAttribute('   ', 'Whitespace href');

      const keyboard = await connectWithAttribute('#snice-link-keyboard', 'Keyboard destination');
      keyboard.link.id = 'snice-link-keyboard-test';
      keyboard.link.style.cssText = 'position:fixed;top:5.5rem;right:1rem;z-index:10000;background:Canvas;padding:.5rem;';

      const external = await connectWithProperty('/guide.html#snice-link-popup', 'External destination');
      external.link.id = 'snice-link-external-test';
      external.link.style.cssText = 'position:fixed;top:8.5rem;right:1rem;z-index:10000;background:Canvas;padding:.5rem;';
      external.link.external = true;
      await external.link.rendered;

      return {
        blockedAttributes,
        blockedProperties,
        allowedAttributes,
        allowedProperties,
        encoded,
        nonStrings,
        dynamic: { safeBefore, staleActivationPrevented, unsafeRemoved, safeAfter },
        hashUnsafeResult,
        emptyHref: empty.anchor.getAttribute('href'),
        whitespaceHasHref: whitespace.anchor.hasAttribute('href'),
        external: {
          href: external.anchor.getAttribute('href'),
          target: external.anchor.target,
          rel: external.anchor.rel,
          label: external.link.textContent
        },
        executed: (globalThis as any).__sniceNavigationInjected,
        navigateEvents,
        errors,
        locationUnchanged: location.href === initialHref,
        historyUnchanged: history.length === initialHistoryLength
      };
    } finally {
      delete (globalThis as any).__sniceNavigationInjected;
    }
  }, navigationCases);
}

async function expectNativeAnchorBehavior(page: Page) {
  const keyboardLink = page.locator('#snice-link-keyboard-test').getByRole('link', {
    name: 'Keyboard destination'
  });
  await expect(keyboardLink).toBeVisible();
  await keyboardLink.focus();
  await expect(keyboardLink).toBeFocused();
  await page.keyboard.press('Enter');
  await expect.poll(() => new URL(page.url()).hash).toBe('#snice-link-keyboard');

  const externalAnchor = page.locator('#snice-link-external-test').getByRole('link');
  const absoluteHref = await externalAnchor.evaluate(anchor => (anchor as HTMLAnchorElement).href);
  expect(absoluteHref).toBe('http://localhost:5566/guide.html#snice-link-popup');

  const popupPromise = page.context().waitForEvent('page');
  await externalAnchor.click();
  const popup = await popupPromise;
  await popup.waitForLoadState('domcontentloaded');
  expect(await popup.evaluate(() => window.opener === null)).toBe(true);
  expect(new URL(popup.url()).hash).toBe('#snice-link-popup');
  await popup.close();

  const beforeContextMenu = page.url();
  await externalAnchor.click({ button: 'right' });
  expect(page.url()).toBe(beforeContextMenu);
}

function assertPolicyResult(result: Awaited<ReturnType<typeof exerciseNavigationPolicy>>) {
  expect(result.blockedAttributes).toHaveLength(navigationCases.unsafe.length);
  expect(result.blockedProperties).toHaveLength(navigationCases.unsafe.length);
  for (const entry of [...result.blockedAttributes, ...result.blockedProperties]) {
    expect(entry.hasHref).toBe(false);
    expect(entry.prevented).toBe(true);
    expect(entry.cursor).toBe('default');
    expect(entry.label).toBeTruthy();
  }

  expect(result.allowedAttributes).toHaveLength(navigationCases.allowed.length);
  expect(result.allowedProperties).toHaveLength(navigationCases.allowed.length);
  for (const [index, expected] of navigationCases.allowed.entries()) {
    for (const entries of [result.allowedAttributes, result.allowedProperties]) {
      expect(entries[index].href).toBe(expected.href);
      expect(entries[index].target).toBe(expected.target);
      expect(entries[index].prevented).toBe(false);
      expect(entries[index].cursor).toBe('pointer');
      expect(entries[index].label).toBeTruthy();
    }
  }

  expect(result.encoded).toHaveLength(3);
  expect(result.encoded.every(entry => !entry.hasHref && entry.prevented)).toBe(true);
  expect(result.nonStrings).toHaveLength(9);
  expect(result.nonStrings.every(entry => !entry.hasHref && entry.prevented)).toBe(true);
  expect(result.dynamic).toEqual({
    safeBefore: '/safe-before',
    staleActivationPrevented: true,
    unsafeRemoved: true,
    safeAfter: '/safe-after'
  });
  expect(result.hashUnsafeResult.hasHref).toBe(false);
  expect(result.hashUnsafeResult.prevented).toBe(true);
  expect(result.emptyHref).toBe('#');
  expect(result.whitespaceHasHref).toBe(false);
  expect(result.external).toEqual({
    href: '/guide.html#snice-link-popup',
    target: '_blank',
    rel: 'noopener noreferrer',
    label: 'External destination'
  });
  expect(result.executed).toBe(0);
  expect(result.navigateEvents).toBe(0);
  expect(result.errors).toBe(0);
  expect(result.locationUnchanged).toBe(true);
  expect(result.historyUnchanged).toBe(true);
}

for (const build of ['source', 'distribution', 'cdn'] as const) {
  test(`enforces safe link navigation through ${build}`, async ({ page }) => {
    assertPolicyResult(await exerciseNavigationPolicy(page, build));
    await expectNativeAnchorBehavior(page);
  });
}

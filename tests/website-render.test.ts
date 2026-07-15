import { test, expect } from '@playwright/test';

const websiteBase = process.env.WEBSITE_BASE_URL || 'http://127.0.0.1:52891';

test.describe('Website Component Rendering', () => {
  test('components render in browser', async ({ page }) => {
    await page.goto(`${websiteBase}/components.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!customElements.get('snice-input'));

    for (const tag of ['snice-button', 'snice-badge', 'snice-alert', 'snice-spinner', 'snice-input']) {
      const component = page.locator(tag).first();
      await expect(component).toBeAttached();
      const shadowContent = await component.evaluate((el) => el.shadowRoot?.innerHTML || '');
      expect(shadowContent, `${tag} should render its shadow tree`).not.toBe('');
    }

    const buttonShadow = await page.locator('snice-button').first()
      .evaluate((el) => el.shadowRoot?.innerHTML || '');
    expect(buttonShadow).toContain('button');
  });

  test('theme toggle works', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('snice-theme', 'light'));
    await page.goto(websiteBase, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await page.click('.theme-btn');

    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(theme).toBe('dark');

    await page.click('.theme-btn');
    const themeLight = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(themeLight).toBe('light');
  });

  test('modal opens', async ({ page }) => {
    await page.goto(`${websiteBase}/components.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!customElements.get('snice-modal'));

    const openModalBtn = page.locator('snice-button', { hasText: 'Open Modal' }).first();
    await openModalBtn.click();

    const modal = page.locator('snice-modal#demo-modal');
    const isOpen = await modal.evaluate((el: any) => el.open);
    expect(isOpen).toBe(true);
  });

  test('generated rendering guide and reference contain every major feature', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await page.goto(`${websiteBase}/guide.html`, { waitUntil: 'domcontentloaded' });
    for (const id of [
      'state', 'deep-state', 'roots',
      'bindings', 'forms', 'spreads',
      'conditionals', 'lists', 'async',
      'ready', 'dispose'
    ]) {
      await expect(page.locator(`#${id}`)).toBeVisible();
    }
    await expect(page.locator('a[href="docs.html#rendering"]')).toBeVisible();
    const bindingReference = page.locator('a[href="docs.html#bindings"]');
    await expect(bindingReference).toBeVisible();
    await expect(page.locator('#ssr')).toHaveCount(0);
    await expect(page.getByText('SSR & hydration', { exact: false })).toHaveCount(0);

    await bindingReference.click();
    await expect(page).toHaveURL(/\/docs\.html#bindings$/);
    await expect(page.locator('#bindings')).toBeVisible();
    await expect(page.locator('.docs-sidebar a[href="#bindings"]')).toBeVisible();
    for (const id of [
      'bindings-channel-chooser',
      'bindings-properties',
      'bindings-events',
      'bindings-named-spreads',
      'bindings-sentinel-matrix',
      'bindings-form-data-flow'
    ]) {
      await expect(page.locator(`#${id}`)).toBeAttached();
    }
    await expect(page.getByText('Binding Channels', { exact: true }).first()).toBeVisible();

    await page.goto(`${websiteBase}/docs.html#rendering`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#rendering')).toBeVisible();
    for (const id of [
      'rendering-bindings',
      'rendering-form-controls',
      'rendering-control-flow',
      'rendering-async-content',
      'rendering-reactive-authoring',
      'rendering-render-roots'
    ]) {
      await expect(page.locator(`#${id}`)).toBeAttached();
    }
    await expect(page.locator('#rendering-server-rendering-and-hydration')).toHaveCount(0);
    await expect(page.getByText('HydrationError', { exact: false })).toHaveCount(0);
    await expect(page.locator('#rendering-custom-directives')).toHaveCount(0);
    expect(pageErrors).toEqual([]);
  });

  test('guide hashes keep the sidebar and content synchronized', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 600 });
    await page.goto(`${websiteBase}/guide.html#conditionals`);
    await page.waitForFunction(() => {
      const section = document.querySelector('#conditionals');
      const active = document.querySelector('.guide-sidebar a.active');
      return active?.getAttribute('href') === '#conditionals' &&
        !!section && section.getBoundingClientRect().top < 130;
    });

    const state = await page.evaluate(() => {
      const sidebar = document.querySelector('.guide-sidebar')!;
      const link = sidebar.querySelector('a[href="#conditionals"]')!;
      const section = document.querySelector('#conditionals')!;
      const sidebarRect = sidebar.getBoundingClientRect();
      const linkRect = link.getBoundingClientRect();
      const navOrder = [...sidebar.querySelectorAll('a[href^="#"]')]
        .map(item => item.getAttribute('href')!.slice(1));
      const contentOrder = [...document.querySelectorAll('.dec-section[id]')]
        .map(item => item.id);
      return {
        active: sidebar.querySelector('a.active')?.getAttribute('href'),
        linkVisible: linkRect.top >= sidebarRect.top && linkRect.bottom <= sidebarRect.bottom,
        sectionTop: section.getBoundingClientRect().top,
        orderMatches: JSON.stringify(navOrder) === JSON.stringify(contentOrder)
      };
    });

    expect(state.active).toBe('#conditionals');
    expect(state.linkVisible).toBe(true);
    expect(state.sectionTop).toBeGreaterThanOrEqual(75);
    expect(state.sectionTop).toBeLessThanOrEqual(105);
    expect(state.orderMatches).toBe(true);
  });

  test('deployed Link docs and full showcase enforce the shared URL policy', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await page.goto(`${websiteBase}/components.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => Boolean(customElements.get('snice-link')));
    await page.locator('.more-link[data-slug="link"]').click();

    const docs = page.locator('#help-drawer-body');
    await expect(docs.getByRole('heading', { name: 'URL Safety', exact: true })).toBeVisible();
    await expect(docs).toContainText('shared isSafeUrl() policy');

    await page.locator('.help-drawer-tab[data-tab="showcase"]').click();
    const showcase = page.frameLocator('#help-drawer-iframe');
    const safety = showcase.locator('#link-safe-destination');
    await expect(safety).toBeVisible();
    await expect(safety).toContainText('Malformed URLs and unsafe or obfuscated schemes');

    const blocked = safety.locator('snice-link[href^="javascript:"]');
    const blockedAnchor = blocked.locator('a');
    await expect(blockedAnchor).not.toHaveAttribute('href', /.+/);
    await expect(blockedAnchor).toHaveCSS('cursor', 'default');
    await blockedAnchor.click();
    expect(await blocked.evaluate(() => (globalThis as any).__sniceUnsafeLinkShowcase ?? 0)).toBe(0);

    const rendered = await showcase.locator('snice-link').evaluateAll(links => ({
      total: links.length,
      anchors: links.filter(link => link.shadowRoot?.querySelector('a')).length,
      viewport: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth
    }));
    expect(rendered.total).toBeGreaterThan(30);
    expect(rendered.anchors).toBe(rendered.total);
    expect(rendered.scroll).toBeLessThanOrEqual(rendered.viewport);

    await safety.getByRole('link', { name: 'Relative / hash' }).click();
    await expect.poll(() => page.frames()
      .find(frame => frame.url().includes('/showcase/link.html'))?.url()
    ).toContain('#link-safe-destination');
    expect(pageErrors).toEqual([]);
  });
});

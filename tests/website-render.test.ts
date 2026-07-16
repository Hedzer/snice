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

  test('deployed Button docs and full showcase preserve navigation and disabled-fieldset behavior', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await page.goto(`${websiteBase}/components.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => Boolean(customElements.get('snice-button')));
    await page.locator('.more-link[data-slug="button"]').click();

    const docs = page.locator('#help-drawer-body');
    await expect(docs.getByRole('heading', { name: 'URL Safety', exact: true })).toBeVisible();
    await expect(docs.getByRole('heading', { name: 'Target Isolation', exact: true })).toBeVisible();
    await expect(docs.getByRole('heading', { name: 'Disabled Fieldsets', exact: true })).toBeVisible();
    await expect(docs).toContainText('window.opener === null');
    await expect(docs).toContainText('separate isolated contexts');
    await expect(docs).toContainText('download behavior takes precedence over target');
    await expect(docs).toContainText('first-legend exception');
    await expect(docs).toContainText('never changes or reflects the public button.disabled property');

    await page.locator('.help-drawer-tab[data-tab="showcase"]').click();
    const showcase = page.frameLocator('#help-drawer-iframe');
    const navigation = showcase.locator('#button-safe-destination');
    await expect(showcase.getByRole('heading', {
      name: 'Safe and isolated link buttons (href)',
      exact: true
    })).toBeVisible();
    await expect(navigation).toContainText('without access to window.opener');

    const rendered = await showcase.locator('snice-button').evaluateAll(buttons => ({
      total: buttons.length,
      rendered: buttons.filter(button => button.shadowRoot?.querySelector('button')).length,
      viewport: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth
    }));
    expect(rendered.total).toBe(103);
    expect(rendered.rendered).toBe(103);
    expect(rendered.scroll).toBeLessThanOrEqual(rendered.viewport);

    await showcase.locator('body').evaluate(() => {
      (globalThis as any).__sniceUnsafeShowcase = 0;
      (globalThis as any).__sniceUnsafeShowcaseEvent = 0;
      document.querySelector('#button-showcase-blocked')?.addEventListener('button-click', () => {
        (globalThis as any).__sniceUnsafeShowcaseEvent++;
      });
    });
    await showcase.locator('#button-showcase-blocked').getByRole('button').click();
    expect(await showcase.locator('body').evaluate(() => ({
      executed: (globalThis as any).__sniceUnsafeShowcase,
      events: (globalThis as any).__sniceUnsafeShowcaseEvent
    }))).toEqual({ executed: 0, events: 0 });
    await expect(showcase.locator('#button-navigation-status')).toHaveText(
      'Activate a button to inspect button-click.'
    );

    await showcase.locator('#button-showcase-same').getByRole('button').click();
    await expect.poll(() => page.frames()
      .find(frame => frame.url().includes('/showcase/button.html'))?.url()
    ).toContain('#button-safe-destination');
    await expect(showcase.locator('#button-navigation-status')).toHaveText('button-click: Same context');

    const blankPromise = page.context().waitForEvent('page');
    await showcase.locator('#button-showcase-blank').getByRole('button').click();
    const blank = await blankPromise;
    await blank.waitForLoadState('domcontentloaded');
    expect(await blank.evaluate(() => window.opener === null)).toBe(true);
    expect(new URL(blank.url()).hash).toBe('#button-blank-target');
    await blank.close();

    const namedPromise = page.context().waitForEvent('page');
    await showcase.locator('#button-showcase-named').getByRole('button').click();
    const named = await namedPromise;
    await named.waitForLoadState('domcontentloaded');
    expect(await named.evaluate(() => window.opener === null)).toBe(true);
    await named.close();

    const pageCount = page.context().pages().length;
    const downloadPromise = page.waitForEvent('download');
    await showcase.locator('#button-showcase-download').getByRole('button').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('snice-logo.png');
    expect(page.context().pages()).toHaveLength(pageCount);

    const fieldset = showcase.locator('#button-lifecycle-fieldset');
    const ordinaryHost = showcase.locator('#button-lifecycle-ordinary');
    const ordinaryButton = ordinaryHost.getByRole('button');
    await expect(showcase.getByRole('heading', {
      name: 'Disabled fieldset lifecycle',
      exact: true
    })).toBeVisible();
    await expect(fieldset).toHaveAttribute('disabled');
    await expect(showcase.locator('#button-lifecycle-legend').getByRole('button')).toBeEnabled();
    await expect(ordinaryHost).not.toHaveAttribute('disabled');
    await expect(ordinaryButton).toBeDisabled();
    await ordinaryButton.click({ force: true });
    await expect(showcase.locator('#button-lifecycle-status')).toHaveText(
      'Disabled fieldset blocks every body action.'
    );

    await showcase.locator('#button-lifecycle-toggle').getByRole('button').click();
    await expect(fieldset).not.toHaveAttribute('disabled');
    await expect(ordinaryButton).toBeEnabled();
    await ordinaryButton.click();
    await expect(showcase.locator('#button-lifecycle-status')).toHaveText('Ordinary action accepted.');

    await showcase.locator('#button-lifecycle-toggle').getByRole('button').click();
    await expect(fieldset).toHaveAttribute('disabled');
    await expect(ordinaryHost).not.toHaveAttribute('disabled');
    await expect(ordinaryButton).toBeDisabled();

    await page.locator('.theme-btn').evaluate((button: HTMLButtonElement) => button.click());
    await expect(showcase.locator('html')).toHaveAttribute('data-theme', 'light');
    expect(pageErrors).toEqual([]);
  });

  test('deployed Location docs and full showcase enforce safe external navigation', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    // The showcase must author the real Google Maps URL, but this gate tests
    // Snice rather than third-party response scripts. Keep WebKit deterministic
    // under the full concurrent suite by serving inert content for that frame.
    await page.route('https://www.google.com/**', route => route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<!doctype html><title>Map test fixture</title>'
    }));

    await page.goto(`${websiteBase}/components.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => Boolean(customElements.get('snice-location')));
    await page.locator('.more-link[data-slug="location"]').click();

    const docs = page.locator('#help-drawer-body');
    await expect(docs.getByRole('heading', { name: 'URL Safety', exact: true })).toBeVisible();
    await expect(docs.getByRole('heading', { name: 'Interaction and Keyboard', exact: true })).toBeVisible();
    await expect(docs.getByRole('heading', { name: 'Accessibility', exact: true })).toBeVisible();
    await expect(docs).toContainText("shared isSafeUrl() policy");
    await expect(docs).toContainText('window.opener');

    await page.locator('.help-drawer-tab[data-tab="showcase"]').click();
    const showcase = page.frameLocator('#help-drawer-iframe');
    await expect(showcase.getByRole('heading', { name: 'Safe external navigation', exact: true })).toBeVisible();
    await expect(showcase.locator('#location-safe-map')).toBeVisible();
    await expect(showcase.locator('#location-blocked-map')).toBeVisible();

    const rendered = await showcase.locator('snice-location').evaluateAll(locations => ({
      total: locations.length,
      rendered: locations.filter(location => location.shadowRoot?.querySelector('.location')).length,
      links: locations.filter(location => !location.hasAttribute('clickable')
        || location.shadowRoot?.querySelector('[role="link"][tabindex="0"]')).length,
      unsafeIframes: locations.filter(location => {
        const src = location.shadowRoot?.querySelector('iframe')?.getAttribute('src') ?? '';
        return /^javascript:/i.test(src);
      }).length,
      viewport: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth
    }));
    expect(rendered.total).toBe(32);
    expect(rendered.rendered).toBe(32);
    expect(rendered.links).toBe(32);
    expect(rendered.unsafeIframes).toBe(0);
    expect(rendered.scroll).toBeLessThanOrEqual(rendered.viewport);

    await showcase.locator('body').evaluate(() => {
      const calls: Array<[string, string | undefined, string | undefined]> = [];
      (globalThis as any).__sniceLocationShowcaseOriginalOpen = window.open;
      (globalThis as any).__sniceLocationShowcaseCalls = calls;
      (globalThis as any).__sniceUnsafeLocationShowcase = 0;
      window.open = ((url?: string | URL, target?: string, features?: string) => {
        calls.push([String(url), target, features]);
        return null;
      }) as typeof window.open;
    });

    await showcase.locator('#location-safe-map').getByRole('link').click();
    await expect(showcase.locator('#location-navigation-status')).toHaveText(
      'location-click: Safe relative destination'
    );
    await showcase.locator('#location-blocked-map').getByRole('link').click();
    await expect(showcase.locator('#location-navigation-status')).toHaveText(
      'location-click: Blocked unsafe destination'
    );
    expect(await showcase.locator('body').evaluate(() => ({
      calls: (globalThis as any).__sniceLocationShowcaseCalls,
      executed: (globalThis as any).__sniceUnsafeLocationShowcase
    }))).toEqual({
      calls: [['#location-safe-navigation', '_blank', 'noopener']],
      executed: 0
    });

    await page.locator('.theme-btn').evaluate((button: HTMLButtonElement) => button.click());
    await expect(showcase.locator('html')).toHaveAttribute('data-theme', 'light');

    await showcase.locator('body').evaluate(() => {
      window.open = (globalThis as any).__sniceLocationShowcaseOriginalOpen;
      delete (globalThis as any).__sniceLocationShowcaseOriginalOpen;
      delete (globalThis as any).__sniceLocationShowcaseCalls;
      delete (globalThis as any).__sniceUnsafeLocationShowcase;
    });
    expect(pageErrors).toEqual([]);
  });

  test('deployed Checkbox docs and full showcase preserve the native form contract', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await page.goto(`${websiteBase}/components.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => Boolean(customElements.get('snice-checkbox')));
    await page.locator('.more-link[data-slug="checkbox"]').click();

    const docs = page.locator('#help-drawer-body');
    await expect(docs.getByRole('heading', {
      name: 'Checked State and Reset Defaults',
      exact: true
    })).toBeVisible();
    await expect(docs.getByRole('heading', { name: 'Form Integration', exact: true })).toBeVisible();
    await expect(docs.getByRole('heading', { name: 'Validation', exact: true })).toBeVisible();
    await expect(docs).toContainText('checked content attribute are the reset default');
    await expect(docs).toContainText('input');
    await expect(docs).toContainText('checkbox-change');
    await expect(docs).toContainText('first <legend>');

    await page.locator('.help-drawer-tab[data-tab="showcase"]').click();
    const showcase = page.frameLocator('#help-drawer-iframe');
    await expect(showcase.getByRole('heading', {
      name: 'Native form integration, validation, reset, and fieldset rules',
      exact: true
    })).toBeVisible();
    await expect(showcase.getByRole('heading', { name: 'Activation event order', exact: true })).toBeVisible();

    const rendered = await showcase.locator('snice-checkbox').evaluateAll(checkboxes => ({
      total: checkboxes.length,
      rendered: checkboxes.filter(checkbox => checkbox.shadowRoot?.querySelector('input[type="checkbox"]')).length,
      viewport: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth
    }));
    expect(rendered).toEqual(expect.objectContaining({ total: 35, rendered: 35 }));
    expect(rendered.scroll).toBeLessThanOrEqual(rendered.viewport);

    const form = showcase.locator('#checkbox-showcase-form');
    const terms = showcase.locator('#checkbox-showcase-terms');
    const digest = showcase.locator('#checkbox-showcase-digest');
    const status = showcase.locator('#checkbox-form-status');
    expect(await form.evaluate((element: HTMLFormElement) => ({
      valid: element.checkValidity(),
      entries: Array.from(new FormData(element).entries()).map(([name, value]) => [name, String(value)])
    }))).toEqual({
      valid: false,
      entries: [['digest', 'weekly'], ['legend-choice', 'kept']]
    });

    await terms.getByRole('checkbox').click();
    await form.getByRole('button', { name: 'Submit form' }).click();
    await expect(status).toHaveText(
      'Submitted: terms=accepted, digest=weekly, legend-choice=kept'
    );
    await digest.getByRole('checkbox').click();
    await form.getByRole('button', { name: 'Reset defaults' }).click();
    await expect(status).toHaveText('Reset: digest=weekly, legend-choice=kept');

    const eventCheckbox = showcase.locator('#checkbox-showcase-events');
    await eventCheckbox.getByRole('checkbox').click();
    await expect(showcase.locator('#checkbox-event-status')).toHaveText(
      'input → change → checkbox-change; checked=true'
    );

    await page.locator('.theme-btn').evaluate((button: HTMLButtonElement) => button.click());
    await expect(showcase.locator('html')).toHaveAttribute('data-theme', 'light');
    expect(pageErrors).toEqual([]);
  });

  test('deployed Radio docs and full showcase preserve the native group and form contract', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await page.goto(`${websiteBase}/components.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => Boolean(customElements.get('snice-radio')));
    await page.locator('.more-link[data-slug="radio"]').click();

    const docs = page.locator('#help-drawer-body');
    await expect(docs.getByRole('heading', {
      name: 'Checked State and Reset Defaults',
      exact: true
    })).toBeVisible();
    await expect(docs.getByRole('heading', { name: 'Radio Groups', exact: true })).toBeVisible();
    await expect(docs.getByRole('heading', { name: 'Form Integration', exact: true })).toBeVisible();
    await expect(docs.getByRole('heading', { name: 'Validation', exact: true })).toBeVisible();
    await expect(docs).toContainText('form owner');
    await expect(docs).toContainText('shadow root');
    await expect(docs).toContainText('input');
    await expect(docs).toContainText('radio-change');
    await expect(docs).toContainText('first <legend>');

    await page.locator('.help-drawer-tab[data-tab="showcase"]').click();
    const showcase = page.frameLocator('#help-drawer-iframe');
    await expect(showcase.getByRole('heading', {
      name: 'Native form integration, group validation, reset, and fieldset rules',
      exact: true
    })).toBeVisible();
    await expect(showcase.getByRole('heading', {
      name: 'Activation event order and arrow navigation',
      exact: true
    })).toBeVisible();

    const rendered = await showcase.locator('snice-radio').evaluateAll(radios => ({
      total: radios.length,
      rendered: radios.filter(radio => radio.shadowRoot?.querySelector('input[type="radio"]')).length,
      viewport: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth
    }));
    expect(rendered).toEqual(expect.objectContaining({ total: 51, rendered: 51 }));
    expect(rendered.scroll).toBeLessThanOrEqual(rendered.viewport);

    const form = showcase.locator('#radio-showcase-form');
    const pro = showcase.locator('#radio-showcase-pro');
    const status = showcase.locator('#radio-form-status');
    expect(await form.evaluate((element: HTMLFormElement) => ({
      valid: element.checkValidity(),
      entries: Array.from(new FormData(element).entries()).map(([name, value]) => [name, String(value)])
    }))).toEqual({
      valid: false,
      entries: [['legend-plan', 'kept']]
    });

    await pro.locator('.radio-label').click();
    await form.getByRole('button', { name: 'Submit form' }).click();
    await expect(status).toHaveText('Submitted: plan=pro, legend-plan=kept');
    await form.getByRole('button', { name: 'Reset defaults' }).click();
    await expect(status).toHaveText('Reset: legend-plan=kept');

    await showcase.locator('#radio-showcase-event-b').locator('.radio-label').click();
    await expect(showcase.locator('#radio-event-status')).toHaveText(
      'input → change → radio-change; value=b'
    );

    await page.locator('.theme-btn').evaluate((button: HTMLButtonElement) => button.click());
    await expect(showcase.locator('html')).toHaveAttribute('data-theme', 'light');
    expect(pageErrors).toEqual([]);
  });

  test('deployed Date Picker card, docs, and full showcase preserve canonical native form behavior', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await page.goto(`${websiteBase}/components.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => Boolean(customElements.get('snice-date-picker')));

    const cardForm = page.locator('#date-card-form');
    const cardPicker = page.locator('#date-card-delivery');
    expect(await cardForm.evaluate((element: HTMLFormElement) =>
      Array.from(new FormData(element).entries()).map(([name, value]) => [name, String(value)])))
      .toEqual([['delivery-date', '2026-03-15']]);
    await cardPicker.locator('.input').fill('18/03/2026');
    await cardPicker.locator('.input').press('Tab');
    await cardForm.getByRole('button', { name: 'Submit' }).click();
    await expect(page.locator('#date-card-status')).toHaveText('Submitted: delivery-date=2026-03-18');
    await cardForm.getByRole('button', { name: 'Reset' }).click();
    await expect(page.locator('#date-card-status')).toHaveText('Reset: delivery-date=2026-03-15');

    await page.locator('.more-link[data-slug="date-picker"]').click();
    const docs = page.locator('#help-drawer-body');
    await expect(docs.getByRole('heading', {
      name: 'Value, Display, and Reset Defaults',
      exact: true
    })).toBeVisible();
    await expect(docs.getByRole('heading', { name: 'Form Integration', exact: true })).toBeVisible();
    await expect(docs.getByRole('heading', { name: 'Validation', exact: true })).toBeVisible();
    await expect(docs).toContainText('canonical');
    await expect(docs).toContainText('defaultValue');
    await expect(docs).toContainText('badInput');
    await expect(docs).toContainText('first <legend>');
    await expect(docs).toContainText('loading');

    await page.locator('.help-drawer-tab[data-tab="showcase"]').click();
    const showcase = page.frameLocator('#help-drawer-iframe');
    await expect(showcase.getByRole('heading', {
      name: 'Native form integration, canonical values, validation, reset, and fieldset rules',
      exact: true
    })).toBeVisible();

    const rendered = await showcase.locator('snice-date-picker').evaluateAll(pickers => ({
      total: pickers.length,
      rendered: pickers.filter(picker => picker.shadowRoot?.querySelector('.input')).length,
      viewport: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth
    }));
    expect(rendered).toEqual(expect.objectContaining({ total: 33, rendered: 33 }));
    expect(rendered.scroll).toBeLessThanOrEqual(rendered.viewport);

    const form = showcase.locator('#date-picker-showcase-form');
    const delivery = showcase.locator('#date-picker-showcase-delivery');
    const legend = showcase.locator('#date-picker-showcase-legend');
    const fieldset = showcase.locator('#date-picker-showcase-fieldset');
    const status = showcase.locator('#date-picker-form-status');
    expect(await form.evaluate((element: HTMLFormElement) => ({
      valid: element.checkValidity(),
      entries: Array.from(new FormData(element).entries()).map(([name, value]) => [name, String(value)])
    }))).toEqual({
      valid: true,
      entries: [
        ['delivery-date', '2026-03-15'],
        ['confirmed-date', '2026-03-16'],
        ['legend-date', '2026-03-12']
      ]
    });
    expect(await fieldset.evaluate((picker: any) => ({
      authoredDisabled: picker.disabled,
      effectiveDisabled: picker.matches(':disabled'),
      inputDisabled: picker.shadowRoot.querySelector('.input').disabled,
      willValidate: picker.willValidate
    }))).toEqual({
      authoredDisabled: false,
      effectiveDisabled: true,
      inputDisabled: true,
      willValidate: false
    });
    expect(await legend.evaluate((picker: any) => picker.matches(':disabled'))).toBe(false);

    await delivery.locator('.input').fill('18/03/2026');
    await delivery.locator('.input').press('Tab');
    await form.getByRole('button', { name: 'Submit form' }).click();
    await expect(status).toHaveText(
      'Submitted: delivery-date=2026-03-18, confirmed-date=2026-03-16, legend-date=2026-03-12'
    );
    await delivery.locator('.calendar-toggle').click();
    await expect(delivery.locator('[data-date="2026-03-09"]')).toBeDisabled();
    await delivery.locator('[data-date="2026-03-20"]').click();
    expect(await delivery.evaluate((picker: any) => ({
      value: picker.value,
      display: picker.shadowRoot.querySelector('.input').value,
      valid: picker.checkValidity(),
      open: picker.open
    }))).toEqual({ value: '2026-03-20', display: '20/03/2026', valid: true, open: false });

    await form.getByRole('button', { name: 'Reset defaults' }).click();
    await expect(status).toHaveText(
      'Reset: delivery-date=2026-03-15, confirmed-date=2026-03-16, legend-date=2026-03-12'
    );
    await delivery.locator('.clear-button').click();
    await form.getByRole('button', { name: 'Submit form' }).click();
    await expect(status).toHaveText(
      'Reset: delivery-date=2026-03-15, confirmed-date=2026-03-16, legend-date=2026-03-12'
    );
    expect(await form.evaluate((element: HTMLFormElement) => element.checkValidity())).toBe(false);

    await page.locator('.theme-btn').evaluate((button: HTMLButtonElement) => button.click());
    await expect(showcase.locator('html')).toHaveAttribute('data-theme', 'light');
    expect(pageErrors).toEqual([]);
  });

  test('deployed Date Range Picker card, docs, and full showcase preserve the complete form contract', async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await page.goto(`${websiteBase}/components.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => Boolean(customElements.get('snice-date-range-picker')));

    const cardForm = page.locator('#showcase-range-form');
    const cardPicker = page.locator('#showcase-range-form-picker');
    expect(await cardForm.evaluate((element: HTMLFormElement) =>
      Array.from(new FormData(element).entries()).map(([name, value]) => [name, String(value)])))
      .toEqual([['booking-start', '2026-03-10'], ['booking-end', '2026-03-20']]);
    await cardPicker.locator('.clear-button').click();
    expect(await cardForm.evaluate((element: HTMLFormElement) => element.checkValidity())).toBe(false);
    await cardForm.getByRole('button', { name: 'Reset' }).click();
    await expect(cardForm.locator('output')).toHaveText(
      'Reset: booking-start=2026-03-10, booking-end=2026-03-20'
    );

    await page.locator('.more-link[data-slug="date-range-picker"]').click();
    const docs = page.locator('#help-drawer-body');
    await expect(docs.getByRole('heading', { name: 'Live Values and Reset Defaults', exact: true })).toBeVisible();
    await expect(docs.getByRole('heading', { name: 'Canonical Form Submission', exact: true })).toBeVisible();
    await expect(docs.getByRole('heading', { name: 'Validation', exact: true })).toBeVisible();
    await expect(docs).toContainText('booking-start');
    await expect(docs).toContainText('booking-end');
    await expect(docs).toContainText('YYYY-MM-DD');
    await expect(docs).toContainText('defaultStart');
    await expect(docs).toContainText('defaultEnd');
    await expect(docs).toContainText('disabled fieldset');

    await page.locator('.help-drawer-tab[data-tab="showcase"]').click();
    const showcase = page.frameLocator('#help-drawer-iframe');
    await expect(showcase.getByRole('heading', { name: 'Native form lifecycle', exact: true })).toBeVisible();
    const rendered = await showcase.locator('snice-date-range-picker').evaluateAll(pickers => ({
      total: pickers.length,
      rendered: pickers.filter(picker => picker.shadowRoot?.querySelector('.input')).length,
      viewport: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth
    }));
    expect(rendered).toEqual(expect.objectContaining({ total: 29, rendered: 29 }));
    expect(rendered.scroll).toBeLessThanOrEqual(rendered.viewport);

    const form = showcase.locator('#drp-form');
    const booking = showcase.locator('#drp-form-picker');
    const output = showcase.locator('#drp-form-output');
    expect(await form.evaluate((element: HTMLFormElement) => ({
      valid: element.checkValidity(),
      entries: Array.from(new FormData(element).entries()).map(([name, value]) => [name, String(value)])
    }))).toEqual({
      valid: true,
      entries: [['booking-start', '2026-03-10'], ['booking-end', '2026-03-20']]
    });

    await booking.locator('.clear-button').click();
    await form.getByRole('button', { name: 'Submit canonical range' }).click();
    expect(await form.evaluate((element: HTMLFormElement) => element.checkValidity())).toBe(false);
    await form.getByRole('button', { name: 'Reset defaults' }).click();
    await expect(output).toHaveText('Reset: booking-start=2026-03-10, booking-end=2026-03-20');

    await booking.locator('.calendar-toggle').click();
    await booking.locator('[data-date="2026-03-12"]').click();
    await booking.locator('[data-date="2026-03-22"]').click();
    await form.getByRole('button', { name: 'Submit canonical range' }).click();
    await expect(output).toHaveText('Submitted: booking-start=2026-03-12, booking-end=2026-03-22');

    await page.locator('.theme-btn').evaluate((button: HTMLButtonElement) => button.click());
    await expect(showcase.locator('html')).toHaveAttribute('data-theme', 'light');
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test('deployed Date Time Picker card, docs, and full showcase preserve the complete local form contract', async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await page.goto(`${websiteBase}/components.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => Boolean(customElements.get('snice-date-time-picker')));

    const cardForm = page.locator('#showcase-date-time-form');
    const cardPicker = page.locator('#showcase-date-time-form-picker');
    expect(await cardForm.evaluate((element: HTMLFormElement) =>
      Array.from(new FormData(element).entries()).map(([name, value]) => [name, String(value)])))
      .toEqual([['appointment', '2026-03-10T14:05:00']]);
    await cardPicker.locator('.clear-button').click();
    expect(await cardForm.evaluate((element: HTMLFormElement) => element.checkValidity())).toBe(false);
    await cardForm.getByRole('button', { name: 'Reset' }).click();
    await expect(cardForm.locator('output')).toHaveText('Reset: appointment=2026-03-10T14:05:00');

    await page.locator('.more-link[data-slug="date-time-picker"]').click();
    const docs = page.locator('#help-drawer-body');
    await expect(docs.getByRole('heading', { name: 'Local datetime contract', exact: true })).toBeVisible();
    await expect(docs.getByRole('heading', { name: 'Live value and reset default', exact: true })).toBeVisible();
    await expect(docs.getByRole('heading', { name: 'Validation', exact: true })).toBeVisible();
    await expect(docs).toContainText('YYYY-MM-DDTHH:mm:ss');
    await expect(docs).toContainText('defaultValue');
    await expect(docs).toContainText('badInput');
    await expect(docs).toContainText('disabled ancestor fieldsets');
    await expect(docs).toContainText('no time zone');

    await page.locator('.help-drawer-tab[data-tab="showcase"]').click();
    const showcase = page.frameLocator('#help-drawer-iframe');
    await expect(showcase.getByRole('heading', { name: 'Native form lifecycle', exact: true })).toBeVisible();
    const rendered = await showcase.locator('snice-date-time-picker').evaluateAll(pickers => ({
      total: pickers.length,
      rendered: pickers.filter(picker => picker.shadowRoot?.querySelector('.panel')).length,
      viewport: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth
    }));
    expect(rendered).toEqual(expect.objectContaining({ total: 32, rendered: 32 }));
    expect(rendered.scroll).toBeLessThanOrEqual(rendered.viewport);

    const form = showcase.locator('#date-time-picker-showcase-form');
    const appointment = showcase.locator('#date-time-picker-showcase-appointment');
    const legend = showcase.locator('#date-time-picker-showcase-legend');
    const fieldset = showcase.locator('#date-time-picker-showcase-fieldset');
    const output = showcase.locator('#date-time-picker-form-output');
    expect(await form.evaluate((element: HTMLFormElement) => ({
      valid: element.checkValidity(),
      entries: Array.from(new FormData(element).entries()).map(([name, value]) => [name, String(value)])
    }))).toEqual({
      valid: true,
      entries: [
        ['appointment', '2026-03-10T14:05:00'],
        ['confirmed', '2026-03-12T16:30'],
        ['legend-time', '2026-03-04T11:00']
      ]
    });
    expect(await fieldset.evaluate((picker: any) => ({
      authoredDisabled: picker.disabled,
      effectiveDisabled: picker.matches(':disabled'),
      inputDisabled: picker.shadowRoot.querySelector('.input').disabled,
      willValidate: picker.willValidate
    }))).toEqual({
      authoredDisabled: false,
      effectiveDisabled: true,
      inputDisabled: true,
      willValidate: false
    });
    expect(await legend.evaluate((picker: any) => picker.matches(':disabled'))).toBe(false);

    const input = appointment.locator('.input');
    await input.fill('12/03/2026 09:30:15');
    await input.blur();
    await form.getByRole('button', { name: 'Submit canonical datetime' }).click();
    await expect(output).toHaveText(
      'Submitted: appointment=2026-03-12T09:30:15, confirmed=2026-03-12T16:30, legend-time=2026-03-04T11:00'
    );

    await appointment.locator('.toggle-button').click();
    const popupBounds = await appointment.locator('.panel').evaluate(element => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: innerWidth, height: innerHeight };
    });
    expect(popupBounds.left).toBeGreaterThanOrEqual(0);
    expect(popupBounds.top).toBeGreaterThanOrEqual(0);
    expect(popupBounds.right).toBeLessThanOrEqual(popupBounds.width);
    expect(popupBounds.bottom).toBeLessThanOrEqual(popupBounds.height);
    await appointment.locator('[data-date="2026-03-15"]').click();
    await appointment.locator('[data-hour="16"]').click();
    await appointment.locator('[data-minute="30"]').click();
    await appointment.locator('[data-second="45"]').click();
    await appointment.evaluate((picker: any) => picker.close());
    await form.getByRole('button', { name: 'Submit canonical datetime' }).click();
    await expect(output).toHaveText(
      'Submitted: appointment=2026-03-15T16:30:45, confirmed=2026-03-12T16:30, legend-time=2026-03-04T11:00'
    );

    await form.getByRole('button', { name: 'Reset defaults' }).click();
    await expect(output).toHaveText(
      'Reset: appointment=2026-03-10T14:05:00, confirmed=2026-03-12T16:30, legend-time=2026-03-04T11:00'
    );
    await appointment.locator('.clear-button').click();
    await form.getByRole('button', { name: 'Submit canonical datetime' }).click();
    expect(await form.evaluate((element: HTMLFormElement) => element.checkValidity())).toBe(false);
    await expect(output).toHaveText(
      'Reset: appointment=2026-03-10T14:05:00, confirmed=2026-03-12T16:30, legend-time=2026-03-04T11:00'
    );

    await page.locator('.theme-btn').evaluate((button: HTMLButtonElement) => button.click());
    await expect(showcase.locator('html')).toHaveAttribute('data-theme', 'light');
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test('deployed Time Picker card, docs, and full showcase preserve the complete native form contract', async ({ page }) => {
    test.setTimeout(120_000);
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await page.goto(`${websiteBase}/components.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => Boolean(customElements.get('snice-time-picker')));

    const cardForm = page.locator('#showcase-time-form');
    const cardPicker = page.locator('#showcase-time-form-picker');
    expect(await cardForm.evaluate((element: HTMLFormElement) =>
      Array.from(new FormData(element).entries()).map(([name, value]) => [name, String(value)])))
      .toEqual([['appointment', '14:05:10']]);
    await cardPicker.locator('.clear-button').click();
    expect(await cardForm.evaluate((element: HTMLFormElement) => element.checkValidity())).toBe(false);
    await cardForm.getByRole('button', { name: 'Reset' }).click();
    await expect(cardForm.locator('output')).toHaveText('Reset: appointment=14:05:10');

    await page.locator('.more-link[data-slug="time-picker"]').click();
    const docs = page.locator('#help-drawer-body');
    await expect(docs.getByRole('heading', { name: 'Time and form-value contract', exact: true })).toBeVisible();
    await expect(docs.getByRole('heading', { name: 'Live value and reset default', exact: true })).toBeVisible();
    await expect(docs.getByRole('heading', { name: 'Validation', exact: true })).toBeVisible();
    await expect(docs).toContainText('HH:mm:ss');
    await expect(docs).toContainText('defaultValue');
    await expect(docs).toContainText('badInput');
    await expect(docs).toContainText('stepMismatch');
    await expect(docs).toContainText('disabled ancestor');
    await expect(docs).toContainText('No date, time zone, UTC conversion');

    await page.locator('.help-drawer-tab[data-tab="showcase"]').click();
    await expect(page.locator('#help-drawer-iframe')).toHaveAttribute('src', /time-picker/, { timeout: 20_000 });
    const showcase = page.frameLocator('#help-drawer-iframe');
    await expect(showcase.getByRole('heading', { name: 'Native form lifecycle', exact: true }))
      .toBeVisible({ timeout: 20_000 });
    const rendered = await showcase.locator('snice-time-picker').evaluateAll(pickers => ({
      total: pickers.length,
      rendered: pickers.filter(picker => picker.shadowRoot?.querySelector('.dropdown')).length,
      viewport: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth
    }));
    expect(rendered).toEqual(expect.objectContaining({ total: 51, rendered: 51 }));
    expect(rendered.scroll).toBeLessThanOrEqual(rendered.viewport);

    const form = showcase.locator('#time-picker-showcase-form');
    const appointment = showcase.locator('#time-picker-showcase-appointment');
    const legend = showcase.locator('#time-picker-showcase-legend');
    const fieldset = showcase.locator('#time-picker-showcase-fieldset');
    const output = showcase.locator('#time-picker-form-output');
    expect(await form.evaluate((element: HTMLFormElement) => ({
      valid: element.checkValidity(),
      entries: Array.from(new FormData(element).entries()).map(([name, value]) => [name, String(value)])
    }))).toEqual({
      valid: true,
      entries: [
        ['appointment', '14:05:10'],
        ['confirmed', '16:30'],
        ['legend-time', '11:00']
      ]
    });
    expect(await fieldset.evaluate((picker: any) => ({
      authoredDisabled: picker.disabled,
      effectiveDisabled: picker.matches(':disabled'),
      inputDisabled: picker.shadowRoot.querySelector('.input').disabled,
      willValidate: picker.willValidate
    }))).toEqual({
      authoredDisabled: false,
      effectiveDisabled: true,
      inputDisabled: true,
      willValidate: false
    });
    expect(await legend.evaluate((picker: any) => picker.matches(':disabled'))).toBe(false);

    const input = appointment.locator('.input');
    await input.fill('3:30:15 PM');
    await input.blur();
    await form.getByRole('button', { name: 'Submit canonical time' }).click();
    await expect(output).toHaveText(
      'Submitted: appointment=15:30:15, confirmed=16:30, legend-time=11:00'
    );

    await appointment.locator('.clock-toggle').click();
    const popupBounds = await appointment.locator('.dropdown').evaluate(element => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: innerWidth, height: innerHeight };
    });
    expect(popupBounds.left).toBeGreaterThanOrEqual(0);
    expect(popupBounds.top).toBeGreaterThanOrEqual(0);
    expect(popupBounds.right).toBeLessThanOrEqual(popupBounds.width);
    expect(popupBounds.bottom).toBeLessThanOrEqual(popupBounds.height);
    await appointment.locator('[data-hour="4"]').click();
    await appointment.locator('[data-minute="30"]').click();
    await appointment.locator('[data-second="45"]').click();
    await appointment.locator('.selector-column--period .selector-item', { hasText: 'PM' }).click();
    await appointment.evaluate((picker: any) => picker.close());
    await form.getByRole('button', { name: 'Submit canonical time' }).click();
    await expect(output).toHaveText(
      'Submitted: appointment=16:30:45, confirmed=16:30, legend-time=11:00'
    );

    const inline = showcase.locator('snice-time-picker[variant="inline"]').first();
    await expect(inline.locator('[data-hour="11"]')).toBeVisible();
    await inline.locator('[data-hour="11"]').click();
    expect(await inline.evaluate((picker: any) => ({
      hasPopover: picker.shadowRoot.querySelector('.dropdown').hasAttribute('popover'),
      value: picker.value
    }))).toEqual({ hasPopover: false, value: '11:00' });

    await form.getByRole('button', { name: 'Reset defaults' }).click();
    await expect(output).toHaveText(
      'Reset: appointment=14:05:10, confirmed=16:30, legend-time=11:00'
    );
    await appointment.locator('.clear-button').click();
    await form.getByRole('button', { name: 'Submit canonical time' }).click();
    expect(await form.evaluate((element: HTMLFormElement) => element.checkValidity())).toBe(false);

    await page.locator('.theme-btn').evaluate((button: HTMLButtonElement) => button.click());
    await expect(showcase.locator('html')).toHaveAttribute('data-theme', 'light');
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
});

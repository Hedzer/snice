import { expect, test } from '@playwright/test';

const demoPath = 'http://localhost:5566/components/button/demo.html';

test.describe('Snice Button full showcase', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => {
      const buttons = Array.from(document.querySelectorAll('snice-button'));
      return buttons.length === 97
        && buttons.every(button => button.shadowRoot?.querySelector('button'));
    });
  });

  test('renders the complete catalog with working variants, states, icons, and types', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    const result = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('snice-button'));
      const headings = Array.from(document.querySelectorAll('h2'))
        .map(heading => heading.textContent?.trim());
      const section = (heading: string) => Array.from(document.querySelectorAll('section'))
        .find(candidate => candidate.querySelector('h2')?.textContent?.trim() === heading)!;
      const internal = (button: Element) => button.shadowRoot!.querySelector('button')!;
      const matchesBooleanState = (attribute: string, className: string) => buttons
        .filter(button => button.hasAttribute(attribute))
        .every(button => internal(button).classList.contains(className));

      return {
        total: buttons.length,
        rendered: buttons.filter(button => internal(button)).length,
        headings,
        variants: ['default', 'primary', 'success', 'warning', 'danger', 'text'].map(variant => ({
          variant,
          authored: buttons.filter(button => (button.getAttribute('variant') || 'default') === variant).length,
          rendered: buttons.filter(button => internal(button).classList.contains(`button--${variant}`)).length
        })),
        sizes: ['small', 'medium', 'large'].map(size => ({
          size,
          authored: buttons.filter(button => (button.getAttribute('size') || 'medium') === size).length,
          rendered: buttons.filter(button => internal(button).classList.contains(`button--${size}`)).length
        })),
        states: {
          outline: matchesBooleanState('outline', 'button--outline'),
          pill: matchesBooleanState('pill', 'button--pill'),
          circle: matchesBooleanState('circle', 'button--circle'),
          loading: matchesBooleanState('loading', 'button--loading'),
          disabled: matchesBooleanState('disabled', 'button--disabled'),
          disabledNative: buttons.filter(button => button.hasAttribute('disabled'))
            .every(button => (internal(button) as HTMLButtonElement).disabled)
        },
        types: Array.from(section('All button types').querySelectorAll('snice-button')).map(button => ({
          authored: button.getAttribute('type'),
          rendered: (internal(button) as HTMLButtonElement).type
        })),
        propertyIcons: buttons.filter(button => button.hasAttribute('icon')).map(button => ({
          value: button.getAttribute('icon'),
          rendered: Boolean(button.shadowRoot?.querySelector('.icon'))
        })),
        slottedIcons: buttons.filter(button => button.querySelector('[slot="icon"]')).map(button => ({
          assigned: (button.shadowRoot?.querySelector('slot[name="icon"]') as HTMLSlotElement)
            ?.assignedElements().length ?? 0,
          rendered: Boolean(button.shadowRoot?.querySelector('.icon-slot'))
        })),
        emptyLabel: section('Edge case: empty button').querySelector('snice-button')
          ?.shadowRoot?.querySelector('.label')?.textContent,
        longLabel: section('Edge case: very long text').querySelector('snice-button')
          ?.textContent?.trim(),
        partsComplete: buttons.every(button => ['base', 'spinner', 'label'].every(part =>
          button.shadowRoot?.querySelector(`[part~="${part}"]`)
        )),
        positiveWidths: buttons.every(button => button.getBoundingClientRect().width > 0),
        viewport: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth
      };
    });

    expect(result.total).toBe(97);
    expect(result.rendered).toBe(result.total);
    expect(result.headings).toEqual([
      'All variants',
      'All sizes',
      'Variant x Size matrix',
      'Outline variants',
      'Variant x Outline matrix',
      'Pill shape',
      'Circle shape',
      'Disabled',
      'Loading',
      'Icon property (emoji)',
      'Icon property (Material Symbols ligature)',
      'Icon slot (Material Symbols)',
      'icon-placement: start (default) vs end',
      'All button types',
      'Safe and isolated link buttons (href)',
      'Edge case: empty button',
      'Edge case: very long text',
      'Edge case: single character',
      'All boolean states combined'
    ]);
    expect(result.variants.every(entry => entry.authored > 0 && entry.rendered === entry.authored)).toBe(true);
    expect(result.sizes.every(entry => entry.authored > 0 && entry.rendered === entry.authored)).toBe(true);
    expect(Object.values(result.states).every(Boolean)).toBe(true);
    expect(result.types).toEqual([
      { authored: 'button', rendered: 'button' },
      { authored: 'submit', rendered: 'submit' },
      { authored: 'reset', rendered: 'reset' }
    ]);
    expect(result.propertyIcons.length).toBeGreaterThan(0);
    expect(result.propertyIcons.every(icon => icon.value && icon.rendered)).toBe(true);
    expect(result.slottedIcons).toHaveLength(7);
    expect(result.slottedIcons.every(icon => icon.assigned === 1 && icon.rendered)).toBe(true);
    expect(result.emptyLabel?.trim()).toBe('');
    expect(result.longLabel).toContain('very long button label');
    expect(result.partsComplete).toBe(true);
    expect(result.positiveWidths).toBe(true);
    expect(result.scroll).toBeLessThanOrEqual(result.viewport);
    expect(pageErrors).toEqual([]);
  });

  test('demonstrates safe, blocked, isolated, and download navigation as authored', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    const section = page.locator('#button-safe-destination');
    await expect(section).toContainText('Same-context navigation stays in place');
    await expect(section).toContainText('without access to window.opener');
    await expect(section).toContainText('Downloads remain downloads even when a target is present');

    await page.evaluate(() => {
      (globalThis as any).__sniceUnsafeShowcase = 0;
      (globalThis as any).__sniceUnsafeShowcaseEvent = 0;
      document.querySelector('#button-showcase-blocked')?.addEventListener('button-click', () => {
        (globalThis as any).__sniceUnsafeShowcaseEvent++;
      });
    });
    const beforeBlocked = page.url();
    await page.locator('#button-showcase-blocked').getByRole('button').click();
    expect(await page.evaluate(() => ({
      executed: (globalThis as any).__sniceUnsafeShowcase,
      events: (globalThis as any).__sniceUnsafeShowcaseEvent
    }))).toEqual({ executed: 0, events: 0 });
    expect(page.url()).toBe(beforeBlocked);
    await expect(page.locator('#button-navigation-status')).toHaveText(
      'Activate a button to inspect button-click.'
    );

    await page.locator('#button-showcase-same').getByRole('button').click();
    await expect.poll(() => new URL(page.url()).hash).toBe('#button-safe-destination');
    await expect(page.locator('#button-navigation-status')).toHaveText('button-click: Same context');

    const blankPromise = page.context().waitForEvent('page');
    await page.locator('#button-showcase-blank').getByRole('button').click();
    const blank = await blankPromise;
    await blank.waitForLoadState('domcontentloaded');
    expect(await blank.evaluate(() => window.opener === null)).toBe(true);
    expect(new URL(blank.url()).hash).toBe('#button-blank-target');
    await expect(page.locator('#button-navigation-status')).toHaveText(
      'button-click: Isolated blank target'
    );
    await blank.close();

    const namedPromise = page.context().waitForEvent('page');
    await page.locator('#button-showcase-named').getByRole('button').click();
    const named = await namedPromise;
    await named.waitForLoadState('domcontentloaded');
    expect(await named.evaluate(() => window.opener === null)).toBe(true);
    expect(new URL(named.url()).hash).toBe('#button-named-target');
    await named.close();

    const pagesBeforeDownload = page.context().pages().length;
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#button-showcase-download').getByRole('button').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('snice-logo.png');
    expect(page.context().pages()).toHaveLength(pagesBeforeDownload);
    await expect(page.locator('#button-navigation-status')).toHaveText(
      'button-click: Download without popup'
    );
    expect(pageErrors).toEqual([]);
  });

  test('keeps disabled/loading behavior, keyboard focus, themes, and responsive layout intact', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    const interaction = await page.evaluate(() => {
      const disabled = document.querySelector('section:nth-of-type(8) snice-button') as HTMLElement;
      const loading = document.querySelector('section:nth-of-type(9) snice-button') as HTMLElement;
      const ordinary = document.querySelector('section:first-of-type snice-button') as HTMLElement;
      const events = { disabled: 0, loading: 0, ordinary: 0 };
      disabled.addEventListener('button-click', () => events.disabled++);
      loading.addEventListener('button-click', () => events.loading++);
      ordinary.addEventListener('button-click', () => events.ordinary++);
      disabled.click();
      loading.click();
      ordinary.click();
      return events;
    });
    expect(interaction).toEqual({ disabled: 0, loading: 0, ordinary: 1 });

    const keyboardButton = page.locator('section').first().locator('snice-button').first().getByRole('button');
    await page.evaluate(() => {
      document.body.tabIndex = -1;
      document.body.focus();
    });
    await page.keyboard.press('Tab');
    await expect(keyboardButton).toBeFocused();
    const focus = await keyboardButton.evaluate(element => {
      const style = getComputedStyle(element);
      return {
        focusVisible: element.matches(':focus-visible'),
        boxShadow: style.boxShadow
      };
    });
    expect(focus.focusVisible).toBe(true);
    expect(focus.boxShadow).not.toBe('none');
    await page.keyboard.press('Enter');

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.evaluate(() => window.postMessage({ type: 'snice-theme', theme: 'light' }, '*'));
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(keyboardButton).toBeVisible();
    await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
    await expect(page.locator('html')).not.toHaveAttribute('data-theme');
    await expect(keyboardButton).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    const mobile = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
      maxButtonWidth: Math.max(...Array.from(document.querySelectorAll('snice-button'))
        .map(button => button.getBoundingClientRect().width))
    }));
    expect(mobile.scroll).toBeLessThanOrEqual(mobile.viewport);
    expect(mobile.maxButtonWidth).toBeLessThanOrEqual(mobile.viewport - 48);
    expect(pageErrors).toEqual([]);
  });
});

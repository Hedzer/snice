import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5566';

// Helper to set up a test page with Material Symbols font
async function setupTestPage(page: Page, html: string) {
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
      <style>
        body { font-family: system-ui, sans-serif; padding: 2rem; }
        .material-symbols-outlined {
          font-family: 'Material Symbols Outlined';
          font-weight: normal;
          font-style: normal;
          font-size: 1.5rem;
          line-height: 1;
          letter-spacing: normal;
          text-transform: none;
          display: inline-block;
          white-space: nowrap;
          word-wrap: normal;
          direction: ltr;
        }
      </style>
      <script type="module" src="${BASE_URL}/dist/index.esm.js"></script>
    </head>
    <body>
      ${html}
    </body>
    </html>
  `);
  await page.waitForLoadState('networkidle');
  // Wait for custom elements to be defined
  await page.waitForFunction(() => {
    return customElements.get('snice-button') !== undefined;
  });
}

// Helper to measure vertical alignment between icon and text
async function measureVerticalAlignment(page: Page, iconSelector: string, textSelector: string) {
  return page.evaluate(({ iconSel, textSel }) => {
    const icon = document.querySelector(iconSel);
    const text = document.querySelector(textSel);
    if (!icon || !text) return null;

    const iconRect = icon.getBoundingClientRect();
    const textRect = text.getBoundingClientRect();

    return {
      iconCenter: iconRect.top + iconRect.height / 2,
      textCenter: textRect.top + textRect.height / 2,
      iconHeight: iconRect.height,
      textHeight: textRect.height,
    };
  }, { iconSel: iconSelector, textSel: textSelector });
}

// Helper to measure shadow DOM element alignment
async function measureShadowAlignment(page: Page, hostSelector: string, iconSelector: string, textSelector: string) {
  return page.evaluate(({ host, icon, text }) => {
    const el = document.querySelector(host);
    if (!el?.shadowRoot) return null;

    const iconEl = el.shadowRoot.querySelector(icon);
    const textEl = el.shadowRoot.querySelector(text);
    if (!iconEl || !textEl) return null;

    const iconRect = iconEl.getBoundingClientRect();
    const textRect = textEl.getBoundingClientRect();

    return {
      iconCenter: iconRect.top + iconRect.height / 2,
      textCenter: textRect.top + textRect.height / 2,
      iconHeight: iconRect.height,
      textHeight: textRect.height,
    };
  }, { host: hostSelector, icon: iconSelector, text: textSelector });
}

test.describe('Icon Slot Alignment Tests', () => {
  test.describe('snice-button', () => {
    test('icon slot aligns vertically with text', async ({ page }) => {
      await setupTestPage(page, `
        <snice-button data-testid="btn-slot">
          <span slot="icon" class="material-symbols-outlined">save</span>
          Save
        </snice-button>
      `);

      const measurements = await measureShadowAlignment(
        page,
        'snice-button[data-testid="btn-slot"]',
        '.icon-slot',
        '.label'
      );

      expect(measurements).not.toBeNull();
      expect(Math.abs(measurements!.iconCenter - measurements!.textCenter)).toBeLessThan(3);
    });

    test('slotted icon takes precedence over icon property', async ({ page }) => {
      await setupTestPage(page, `
        <snice-button icon="star" data-testid="btn-override">
          <span slot="icon" class="material-symbols-outlined">home</span>
          Home
        </snice-button>
      `);

      const slotContent = await page.evaluate(() => {
        const el = document.querySelector('snice-button[data-testid="btn-override"]');
        const slot = el?.shadowRoot?.querySelector('slot[name="icon"]') as HTMLSlotElement;
        const assigned = slot?.assignedElements();
        return assigned?.[0]?.textContent?.trim();
      });

      expect(slotContent).toBe('home');
    });

    test('icon placement end positions slot correctly', async ({ page }) => {
      await setupTestPage(page, `
        <snice-button icon-placement="end" data-testid="btn-end">
          <span slot="icon" class="material-symbols-outlined">arrow_forward</span>
          Next
        </snice-button>
      `);

      const positions = await page.evaluate(() => {
        const el = document.querySelector('snice-button[data-testid="btn-end"]');
        const shadow = el?.shadowRoot;
        const iconSlot = shadow?.querySelector('.icon-slot');
        const label = shadow?.querySelector('.label');

        const iconRect = iconSlot?.getBoundingClientRect();
        const labelRect = label?.getBoundingClientRect();

        return {
          iconLeft: iconRect?.left ?? 0,
          labelRight: (labelRect?.left ?? 0) + (labelRect?.width ?? 0),
        };
      });

      // Icon should be to the right of label
      expect(positions.iconLeft).toBeGreaterThan(positions.labelRight - 10);
    });

    test('SVG icon renders in slot', async ({ page }) => {
      await setupTestPage(page, `
        <snice-button data-testid="btn-svg">
          <svg slot="icon" viewBox="0 0 24 24" width="24" height="24">
            <circle cx="12" cy="12" r="10" fill="currentColor"/>
          </svg>
          Circle
        </snice-button>
      `);

      const hasSvg = await page.evaluate(() => {
        const el = document.querySelector('snice-button[data-testid="btn-svg"]');
        const slot = el?.shadowRoot?.querySelector('slot[name="icon"]') as HTMLSlotElement;
        const assigned = slot?.assignedElements();
        return assigned?.[0]?.tagName === 'SVG';
      });

      expect(hasSvg).toBe(true);
    });
  });

  test.describe('snice-input', () => {
    test('prefix-icon slot aligns with input text', async ({ page }) => {
      await setupTestPage(page, `
        <snice-input placeholder="Search..." data-testid="input-prefix">
          <span slot="prefix-icon" class="material-symbols-outlined">search</span>
        </snice-input>
      `);

      const measurements = await measureShadowAlignment(
        page,
        'snice-input[data-testid="input-prefix"]',
        '.icon-slot--prefix',
        '.input'
      );

      expect(measurements).not.toBeNull();
      // Icon should be vertically centered relative to input
      expect(Math.abs(measurements!.iconCenter - measurements!.textCenter)).toBeLessThan(5);
    });

    test('suffix-icon slot positions correctly', async ({ page }) => {
      await setupTestPage(page, `
        <snice-input placeholder="Email" data-testid="input-suffix">
          <span slot="suffix-icon" class="material-symbols-outlined">mail</span>
        </snice-input>
      `);

      const positions = await page.evaluate(() => {
        const el = document.querySelector('snice-input[data-testid="input-suffix"]');
        const shadow = el?.shadowRoot;
        const suffixSlot = shadow?.querySelector('.icon-slot--suffix');
        const container = shadow?.querySelector('.input-container');

        const suffixRect = suffixSlot?.getBoundingClientRect();
        const containerRect = container?.getBoundingClientRect();

        return {
          suffixRight: (suffixRect?.left ?? 0) + (suffixRect?.width ?? 0),
          containerRight: (containerRect?.left ?? 0) + (containerRect?.width ?? 0),
        };
      });

      // Suffix should be near right edge of container
      expect(positions.containerRight - positions.suffixRight).toBeLessThan(20);
    });

    test('both prefix and suffix slots work together', async ({ page }) => {
      await setupTestPage(page, `
        <snice-input placeholder="Search" data-testid="input-both">
          <span slot="prefix-icon" class="material-symbols-outlined">search</span>
          <span slot="suffix-icon" class="material-symbols-outlined">clear</span>
        </snice-input>
      `);

      const hasSlots = await page.evaluate(() => {
        const el = document.querySelector('snice-input[data-testid="input-both"]');
        const shadow = el?.shadowRoot;
        const prefixSlot = shadow?.querySelector('slot[name="prefix-icon"]') as HTMLSlotElement;
        const suffixSlot = shadow?.querySelector('slot[name="suffix-icon"]') as HTMLSlotElement;

        return {
          hasPrefix: (prefixSlot?.assignedElements()?.length ?? 0) > 0,
          hasSuffix: (suffixSlot?.assignedElements()?.length ?? 0) > 0,
        };
      });

      expect(hasSlots.hasPrefix).toBe(true);
      expect(hasSlots.hasSuffix).toBe(true);
    });
  });

  test.describe('snice-alert', () => {
    test('icon slot aligns with alert content', async ({ page }) => {
      await setupTestPage(page, `
        <snice-alert variant="info" title="Information" data-testid="alert-slot">
          <span slot="icon" class="material-symbols-outlined">info</span>
          This is an alert message.
        </snice-alert>
      `);

      const measurements = await page.evaluate(() => {
        const el = document.querySelector('snice-alert[data-testid="alert-slot"]');
        const shadow = el?.shadowRoot;
        const icon = shadow?.querySelector('.alert-icon');
        const content = shadow?.querySelector('.alert-content');

        const iconRect = icon?.getBoundingClientRect();
        const contentRect = content?.getBoundingClientRect();

        return {
          iconTop: iconRect?.top ?? 0,
          contentTop: contentRect?.top ?? 0,
        };
      });

      expect(measurements).not.toBeNull();
      // Icon should be near top of content (flex-start alignment)
      expect(Math.abs(measurements!.iconTop - measurements!.contentTop)).toBeLessThan(10);
    });

    test('slotted icon overrides default icon', async ({ page }) => {
      await setupTestPage(page, `
        <snice-alert variant="error" data-testid="alert-override">
          <span slot="icon" class="material-symbols-outlined">warning</span>
          Custom icon alert
        </snice-alert>
      `);

      const slotContent = await page.evaluate(() => {
        const el = document.querySelector('snice-alert[data-testid="alert-override"]');
        const slot = el?.shadowRoot?.querySelector('slot[name="icon"]') as HTMLSlotElement;
        const assigned = slot?.assignedElements();
        return assigned?.[0]?.textContent?.trim();
      });

      expect(slotContent).toBe('warning');
    });
  });

  test.describe('snice-chip', () => {
    test('icon slot aligns with chip label', async ({ page }) => {
      await setupTestPage(page, `
        <snice-chip label="Tag" data-testid="chip-slot">
          <span slot="icon" class="material-symbols-outlined">label</span>
        </snice-chip>
      `);

      const measurements = await measureShadowAlignment(
        page,
        'snice-chip[data-testid="chip-slot"]',
        '.chip-icon-slot',
        '.chip-label'
      );

      expect(measurements).not.toBeNull();
      expect(Math.abs(measurements!.iconCenter - measurements!.textCenter)).toBeLessThan(3);
    });

    test('avatar takes precedence over icon slot', async ({ page }) => {
      await setupTestPage(page, `
        <snice-chip label="User" avatar="https://via.placeholder.com/32" data-testid="chip-avatar">
          <span slot="icon" class="material-symbols-outlined">person</span>
        </snice-chip>
      `);

      const hasAvatar = await page.evaluate(() => {
        const el = document.querySelector('snice-chip[data-testid="chip-avatar"]');
        const shadow = el?.shadowRoot;
        const avatar = shadow?.querySelector('.chip-avatar');
        return avatar !== null;
      });

      expect(hasAvatar).toBe(true);
    });
  });

  test.describe('snice-banner', () => {
    test('icon slot aligns with banner message', async ({ page }) => {
      await setupTestPage(page, `
        <snice-banner message="Welcome!" open data-testid="banner-slot">
          <span slot="icon" class="material-symbols-outlined">celebration</span>
        </snice-banner>
      `);

      const measurements = await measureShadowAlignment(
        page,
        'snice-banner[data-testid="banner-slot"]',
        '.banner__icon-slot',
        '.banner__message'
      );

      expect(measurements).not.toBeNull();
      expect(Math.abs(measurements!.iconCenter - measurements!.textCenter)).toBeLessThan(5);
    });
  });

  test.describe('snice-empty-state', () => {
    test('icon slot displays custom icon', async ({ page }) => {
      await setupTestPage(page, `
        <snice-empty-state title="No Results" data-testid="empty-slot">
          <span slot="icon" class="material-symbols-outlined" style="font-size: 4rem;">inbox</span>
        </snice-empty-state>
      `);

      const slotContent = await page.evaluate(() => {
        const el = document.querySelector('snice-empty-state[data-testid="empty-slot"]');
        const slot = el?.shadowRoot?.querySelector('slot[name="icon"]') as HTMLSlotElement;
        const assigned = slot?.assignedElements();
        return assigned?.[0]?.textContent?.trim();
      });

      expect(slotContent).toBe('inbox');
    });
  });

  test.describe('snice-location', () => {
    test('icon slot displays custom icon', async ({ page }) => {
      await setupTestPage(page, `
        <snice-location name="Office" address="123 Main St" data-testid="location-slot">
          <span slot="icon" class="material-symbols-outlined">business</span>
        </snice-location>
      `);

      const slotContent = await page.evaluate(() => {
        const el = document.querySelector('snice-location[data-testid="location-slot"]');
        const slot = el?.shadowRoot?.querySelector('slot[name="icon"]') as HTMLSlotElement;
        const assigned = slot?.assignedElements();
        return assigned?.[0]?.textContent?.trim();
      });

      expect(slotContent).toBe('business');
    });
  });

  test.describe('snice-breadcrumbs', () => {
    test('crumb icon slot displays custom icon', async ({ page }) => {
      await setupTestPage(page, `
        <snice-breadcrumbs data-testid="breadcrumbs-slot">
          <snice-crumb label="Home" href="/">
            <span slot="icon" class="material-symbols-outlined">home</span>
          </snice-crumb>
          <snice-crumb label="Products" href="/products"></snice-crumb>
          <snice-crumb label="Details" active></snice-crumb>
        </snice-breadcrumbs>
      `);

      // Wait for slotchange to process
      await page.waitForTimeout(100);

      const hasIcon = await page.evaluate(() => {
        const el = document.querySelector('snice-breadcrumbs[data-testid="breadcrumbs-slot"]');
        const shadow = el?.shadowRoot;
        const icons = shadow?.querySelectorAll('.breadcrumb-icon');
        return (icons?.length ?? 0) > 0;
      });

      expect(hasIcon).toBe(true);
    });
  });
});

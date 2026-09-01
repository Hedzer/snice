import { test, expect } from '@playwright/test';

/**
 * `::part()` reachability for the login form's submit control, proved in a
 * real engine.
 *
 * The submit control is a `<snice-button>` living inside the login's shadow
 * root, so a consumer stylesheet can only reach it through the parts the
 * component chooses to expose: `part="submit-button"` for the host, and
 * `exportparts` for the button's own internals. Whether part forwarding
 * actually crosses two shadow boundaries is an engine behaviour — happy-dom
 * cannot answer it — so it is asserted here, in Chromium, Firefox and WebKit.
 *
 * The focus ring is the case that motivated the forwarding: it paints on the
 * inner `<button>`, not on the `<snice-button>` host, so `submit-button` alone
 * would leave a consumer unable to restyle it.
 */
const fixture = 'http://localhost:5566/tests/live/fixtures/login/visual.html';

const CONSUMER_STYLES = `
  snice-login::part(submit-button) {
    width: 321px;
  }
  snice-login::part(submit-button-base) {
    outline: 4px solid rgb(255, 0, 0);
    outline-offset: 2px;
  }
  snice-login::part(submit-button-label) {
    letter-spacing: 3px;
  }
`;

/** Computed styles of the submit control's host and its inner button. */
async function submitStyles(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const login = document.querySelector('snice-login');
    const host = login?.shadowRoot?.querySelector('snice-button') as HTMLElement | null;
    const inner = host?.shadowRoot?.querySelector('button') as HTMLElement | null;
    const label = host?.shadowRoot?.querySelector('.label') as HTMLElement | null;
    if (!host || !inner || !label) return null;

    const hostStyle = getComputedStyle(host);
    const innerStyle = getComputedStyle(inner);
    return {
      hostPart: host.getAttribute('part'),
      hostWidth: hostStyle.width,
      outlineWidth: innerStyle.outlineWidth,
      outlineColor: innerStyle.outlineColor,
      outlineOffset: innerStyle.outlineOffset,
      labelSpacing: getComputedStyle(label).letterSpacing,
    };
  });
}

test.describe('snice-login submit button parts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(fixture, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!customElements.get('snice-login'));
    await page.waitForFunction(() => {
      const login = document.querySelector('snice-login');
      const host = login?.shadowRoot?.querySelector('snice-button');
      return !!host?.shadowRoot?.querySelector('button');
    });
  });

  test('exposes the submit control as part="submit-button"', async ({ page }) => {
    const before = await submitStyles(page);
    expect(before).not.toBeNull();
    expect(before!.hostPart?.split(/\s+/)).toContain('submit-button');
  });

  test('a consumer stylesheet reaches the submit control and its inner button', async ({ page }) => {
    // Control: nothing styles the button until the consumer sheet lands.
    const before = await submitStyles(page);
    expect(before!.hostWidth).not.toBe('321px');
    expect(before!.outlineWidth).not.toBe('4px');
    expect(before!.labelSpacing).not.toBe('3px');

    await page.addStyleTag({ content: CONSUMER_STYLES });

    const after = await submitStyles(page);
    // ::part(submit-button) reaches the <snice-button> host.
    expect(after!.hostWidth).toBe('321px');
    // exportparts carries the button's own parts across the second shadow
    // boundary, so the focus ring is finally a consumer's to set.
    expect(after!.outlineWidth).toBe('4px');
    expect(after!.outlineColor).toBe('rgb(255, 0, 0)');
    expect(after!.outlineOffset).toBe('2px');
    expect(after!.labelSpacing).toBe('3px');
  });

  test('the forwarded focus ring survives the button taking focus', async ({ page }) => {
    await page.addStyleTag({ content: CONSUMER_STYLES });

    await page.evaluate(() => {
      const login = document.querySelector('snice-login');
      const host = login?.shadowRoot?.querySelector('snice-button') as HTMLElement | null;
      host?.shadowRoot?.querySelector('button')?.focus();
    });

    const focused = await page.evaluate(() => {
      const login = document.querySelector('snice-login');
      const host = login?.shadowRoot?.querySelector('snice-button') as HTMLElement | null;
      const inner = host?.shadowRoot?.querySelector('button') as HTMLElement | null;
      if (!inner) return null;
      return {
        isActive: host?.shadowRoot?.activeElement === inner,
        outlineWidth: getComputedStyle(inner).outlineWidth,
        outlineOffset: getComputedStyle(inner).outlineOffset,
      };
    });

    expect(focused!.isActive).toBe(true);
    expect(focused!.outlineWidth).toBe('4px');
    expect(focused!.outlineOffset).toBe('2px');
  });
});

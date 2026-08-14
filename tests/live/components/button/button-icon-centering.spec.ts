import { test, expect } from '@playwright/test';

// Regression guards for circle-button icon geometry:
// 1. f3c0a794 fixed viewBox-only SVGs collapsing to 0x0 by giving
//    `::slotted(*)` explicit 1.25em dimensions — but that boxed text icons
//    (Material Symbols spans) into a 30px box whose 24px line sits at the
//    top, pushing every glyph ~3px above center. Document-level icon-font
//    CSS outranks shadow ::slotted rules, so the component cannot force
//    line-height; the icon's rendered line box must simply be centered.
// 2. The SVG case must stay non-zero so the original fix never regresses.

const fixture = '/tests/live/fixtures/button-icon-centering.html';

test.describe('circle button icon centering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(fixture, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!customElements.get('snice-button'));
    await page.waitForFunction(() => {
      const btn = document.querySelector('#text-icon');
      return !!btn?.shadowRoot?.querySelector('button');
    });
  });

  test('text icon glyph line box is centered in the circle', async ({ page }) => {
    const delta = await page.evaluate(() => {
      const host = document.querySelector('#text-icon')!;
      const button = host.shadowRoot!.querySelector('button')!;
      const span = host.querySelector('.material-symbols-outlined')!;

      // Measure the rendered text line box, not the span's CSS box — the
      // bug was precisely that those two differ and the line box rides high.
      const range = document.createRange();
      range.selectNodeContents(span);
      const glyph = range.getBoundingClientRect();
      const circle = button.getBoundingClientRect();

      return {
        dx: (glyph.left + glyph.width / 2) - (circle.left + circle.width / 2),
        dy: (glyph.top + glyph.height / 2) - (circle.top + circle.height / 2)
      };
    });

    expect(Math.abs(delta.dx)).toBeLessThanOrEqual(1.5);
    expect(Math.abs(delta.dy)).toBeLessThanOrEqual(1.5);
  });

  test('registry icon on a circle button stays inside the circle', async ({ page }) => {
    // `.button--circle .icon { width: auto }` (added so text glyphs center)
    // must not leave a registry SVG unconstrained: auto parent + svg
    // width:100% is circular, and the SVG falls back to its 300px replaced
    // default — a giant icon escaping the button.
    const box = await page.evaluate(() => {
      const host = document.querySelector('#registry-icon')!;
      const button = host.shadowRoot!.querySelector('button')!;
      const svg = host.shadowRoot!.querySelector('.icon svg')!;
      const circle = button.getBoundingClientRect();
      const icon = svg.getBoundingClientRect();
      return { circle, icon };
    });

    expect(box.icon.width).toBeGreaterThan(10);
    expect(box.icon.height).toBeGreaterThan(10);
    expect(box.icon.width).toBeLessThanOrEqual(box.circle.width);
    expect(box.icon.height).toBeLessThanOrEqual(box.circle.height);
  });

  test('viewBox-only SVG icon still renders at a visible size', async ({ page }) => {
    const box = await page.evaluate(() => {
      const svg = document.querySelector('#svg-icon svg')!;
      const rect = svg.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });

    expect(box.width).toBeGreaterThan(10);
    expect(box.height).toBeGreaterThan(10);
  });
});

import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/message-strip/visual.html';

test.describe('Snice Message Strip visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-message-strip'));
    await page.waitForFunction(() =>
      !!document.querySelector('snice-message-strip')?.shadowRoot?.querySelector('.message-strip-content'));
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('icon, message and dismiss button tile left-to-right inside the strip', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const strips = [...document.querySelectorAll('snice-message-strip')] as HTMLElement[];
      if (strips.length === 0) problems.push('no snice-message-strip on the page');

      strips.forEach((strip, i) => {
        const root = strip.shadowRoot!;
        const bar = root.querySelector('.message-strip') as HTMLElement;
        const content = root.querySelector('.message-strip-content') as HTMLElement;
        const id = `strip[${i}](${strip.getAttribute('variant')})`;
        if (!bar || !content) { problems.push(`${id}: missing parts`); return; }

        const br = bar.getBoundingClientRect();
        const cr = content.getBoundingClientRect();
        if (br.width < 100 || br.height < 20) {
          problems.push(`${id}: strip ${Math.round(br.width)}x${Math.round(br.height)}`);
          return;
        }
        if (cr.left < br.left - 1 || cr.right > br.right + 1
            || cr.top < br.top - 1 || cr.bottom > br.bottom + 1) {
          problems.push(`${id}: content escapes the strip`);
        }

        const icon = root.querySelector('.message-strip-icon') as HTMLElement | null;
        if (strip.getAttribute('icon') === 'none') {
          if (icon) problems.push(`${id}: icon="none" still renders an icon box`);
        } else if (!icon) {
          problems.push(`${id}: no icon box`);
        } else {
          const ir = icon.getBoundingClientRect();
          // Sane icon: square-ish, never bigger than two text lines.
          if (ir.width < 12 || ir.width > 40) {
            problems.push(`${id}: icon ${Math.round(ir.width)}px wide`);
          }
          if (ir.height > 44) {
            problems.push(`${id}: icon ${Math.round(ir.height)}px tall`);
          }
          if (ir.left < br.left - 1 || ir.top < br.top - 1 || ir.bottom > br.bottom + 1) {
            problems.push(`${id}: icon escapes the strip`);
          }
          // Icon precedes the message without overlapping it.
          if (cr.left < ir.right - 1) problems.push(`${id}: content overlaps the icon`);
          // Icon must ride with the FIRST text line, not the block centre —
          // it should not drift below the top third of a wrapped message.
          if (ir.top > cr.top + Math.min(cr.height, 40)) {
            problems.push(`${id}: icon sits ${Math.round(ir.top - cr.top)}px below the first text line`);
          }
        }

        const dismiss = root.querySelector('.message-strip-dismiss') as HTMLElement | null;
        if (strip.hasAttribute('dismissible')) {
          if (!dismiss) { problems.push(`${id}: dismissible but no close button`); return; }
          const dr = dismiss.getBoundingClientRect();
          if (dr.width < 12 || dr.width > 44 || Math.abs(dr.width - dr.height) > 4) {
            problems.push(`${id}: dismiss ${Math.round(dr.width)}x${Math.round(dr.height)}`);
          }
          if (dr.left < cr.right - 1) problems.push(`${id}: dismiss overlaps the message`);
          if (dr.right > br.right + 1 || dr.top < br.top - 1 || dr.bottom > br.bottom + 1) {
            problems.push(`${id}: dismiss escapes the strip`);
          }
          // Its glyph must be centred in the button.
          const glyph = dismiss.querySelector('svg') as SVGElement | null;
          if (glyph) {
            const gr = glyph.getBoundingClientRect();
            const dx = (gr.left + gr.width / 2) - (dr.left + dr.width / 2);
            const dy = (gr.top + gr.height / 2) - (dr.top + dr.height / 2);
            if (gr.width < 6) problems.push(`${id}: dismiss glyph ${Math.round(gr.width)}px`);
            if (Math.abs(dx) > 1.5 || Math.abs(dy) > 1.5) {
              problems.push(`${id}: dismiss glyph off centre (${dx.toFixed(1)}, ${dy.toFixed(1)})`);
            }
          }
        } else if (dismiss) {
          problems.push(`${id}: not dismissible but renders a close button`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('a long message wraps to several lines and grows the strip instead of overflowing', async ({ page }) => {
    const geo = await page.evaluate(() => {
      const strips = [...document.querySelectorAll('snice-message-strip')] as HTMLElement[];
      const long = strips.find(s => (s.textContent ?? '').length > 150)!;
      const short = strips.find(s => (s.textContent ?? '').trim() === 'Done.')!;
      const root = long.shadowRoot!;
      const bar = root.querySelector('.message-strip')!.getBoundingClientRect();
      const content = root.querySelector('.message-strip-content') as HTMLElement;
      const cr = content.getBoundingClientRect();
      const lineHeight = parseFloat(getComputedStyle(content).lineHeight);
      const shortBar = short.shadowRoot!.querySelector('.message-strip')!.getBoundingClientRect();
      return {
        lines: Math.round(cr.height / lineHeight),
        barHeight: bar.height,
        shortHeight: shortBar.height,
        contentInside: cr.bottom <= bar.bottom + 1 && cr.right <= bar.right + 1,
        hostWidth: long.getBoundingClientRect().width,
        barWidth: bar.width
      };
    });

    expect(geo.lines).toBeGreaterThanOrEqual(2);
    expect(geo.barHeight).toBeGreaterThan(geo.shortHeight);
    expect(geo.contentInside).toBe(true);
    expect(geo.barWidth).toBeLessThanOrEqual(geo.hostWidth + 1);
  });

  test('clicking dismiss removes the strip from the layout', async ({ page }) => {
    const strip = page.locator('#ms-toggle');
    await expect(strip).toHaveCount(1);
    expect(await strip.evaluate(el => el.getBoundingClientRect().height)).toBeGreaterThan(20);

    await strip.locator('.message-strip-dismiss').click();
    await page.waitForFunction(() => {
      const el = document.getElementById('ms-toggle')!;
      return getComputedStyle(el).display === 'none'
        || el.getBoundingClientRect().height === 0
        || !el.isConnected;
    });

    const gone = await page.evaluate(() => {
      const el = document.getElementById('ms-toggle');
      if (!el) return true;
      return getComputedStyle(el).display === 'none' || el.getBoundingClientRect().height === 0;
    });
    expect(gone).toBe(true);
  });
});

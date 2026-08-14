import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

// Note: qr-code ships its own demo.html (the served page), not the generated
// full.html showcase — every code on it is a 200px canvas in a 3-up grid plus
// one 250px interactive generator.
const demoPath = 'http://localhost:5566/components/qr-code/demo.html';

test.describe('Snice QR Code visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-qr-code'));
    await page.waitForFunction(() => {
      const codes = [...document.querySelectorAll('snice-qr-code')];
      return codes.length > 0 && codes.every(c =>
        !!(c as any).shadowRoot?.querySelector('.qr-container canvas, .qr-container svg'));
    });
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  // The `size` attribute is the rendered edge length: the painted surface must
  // be square at exactly that many CSS pixels and stay inside the host.
  test('each code renders square at its declared size inside the host', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-qr-code').forEach((host, i) => {
        const size = Number(host.getAttribute('size'));
        const root = (host as any).shadowRoot as ShadowRoot;
        const surface = root.querySelector('canvas, svg') as HTMLElement | null;
        if (!surface) { problems.push(`qr[${i}]: nothing painted`); return; }
        const r = surface.getBoundingClientRect();
        const hr = host.getBoundingClientRect();
        if (Math.abs(r.width - size) > 1 || Math.abs(r.height - size) > 1) {
          problems.push(`qr[${i}]: ${Math.round(r.width)}x${Math.round(r.height)} for size=${size}`);
        }
        if (r.left < hr.left - 1 || r.right > hr.right + 1
            || r.top < hr.top - 1 || r.bottom > hr.bottom + 1) {
          problems.push(`qr[${i}]: surface escapes the host`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  // Each grid cell is a code stacked above its caption: codes in a row share a
  // baseline and size, and no code overlaps its own or a neighbour's label.
  test('grid cells tile with aligned, equally sized codes above their labels', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('.qr-grid').forEach((grid, g) => {
        const items = [...grid.querySelectorAll('.qr-item')];
        const rects = items.map(item => {
          const host = item.querySelector('snice-qr-code') as any;
          return {
            code: host.shadowRoot.querySelector('canvas, svg').getBoundingClientRect(),
            label: item.querySelector('label')!.getBoundingClientRect(),
            tile: item.getBoundingClientRect()
          };
        });
        const widths = rects.map(r => Math.round(r.code.width));
        if (new Set(widths).size > 1) {
          problems.push(`grid[${g}]: code widths differ (${widths.join(',')})`);
        }
        const tops = rects.map(r => Math.round(r.code.top));
        if (Math.max(...tops) - Math.min(...tops) > 1) {
          problems.push(`grid[${g}]: codes not on one baseline (${tops.join(',')})`);
        }
        rects.forEach((r, i) => {
          if (r.code.bottom > r.label.top + 1) {
            problems.push(`grid[${g}] cell ${i}: code overlaps its label`);
          }
          if (r.code.left < r.tile.left - 1 || r.code.right > r.tile.right + 1) {
            problems.push(`grid[${g}] cell ${i}: code overflows its tile`);
          }
          if (i > 0 && r.tile.left < rects[i - 1].tile.right - 1) {
            problems.push(`grid[${g}] cell ${i}: tile overlaps cell ${i - 1}`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  // The interactive generator must repaint at the requested size when Update
  // is pressed — the code stays square and grows to the new edge length.
  test('interactive generator repaints at the requested size', async ({ page }) => {
    const before = await page.evaluate(() =>
      (document.querySelector('#custom-qr') as any).shadowRoot
        .querySelector('canvas, svg').getBoundingClientRect().width);
    expect(Math.round(before)).toBe(250);

    await page.fill('#size-input', '400');
    await page.click('#update-btn');
    await page.waitForFunction(() =>
      Math.round((document.querySelector('#custom-qr') as any).shadowRoot
        .querySelector('canvas, svg').getBoundingClientRect().width) === 400);

    const after = await page.evaluate(() => {
      const host = document.querySelector('#custom-qr') as any;
      const r = host.shadowRoot.querySelector('canvas, svg').getBoundingClientRect();
      const hr = host.getBoundingClientRect();
      return { w: r.width, h: r.height, insideHost: r.right <= hr.right + 1 && r.bottom <= hr.bottom + 1 };
    });
    expect(Math.round(after.w)).toBe(400);
    expect(Math.round(after.h)).toBe(400);
    expect(after.insideHost).toBe(true);
  });
});

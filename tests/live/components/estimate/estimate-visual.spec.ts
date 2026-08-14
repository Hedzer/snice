import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/estimate/demo.html';

test.describe('Snice Estimate visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-estimate'));
    await page.waitForTimeout(400);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('line-item cells line up under their table headers', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-estimate').forEach((est, i) => {
        const num = est.getAttribute('estimate-number') || `estimate[${i}]`;
        const root = (est as HTMLElement).shadowRoot;
        if (!root) { problems.push(`${num}: no shadow root`); return; }
        const table = root.querySelector('.est__table') as HTMLElement | null;
        if (!table) return; // comparison variant / no-items edge cases
        const headers = [...table.querySelectorAll('.est__table-header')] as HTMLElement[];
        const rows = [...table.querySelectorAll('tbody tr')] as HTMLElement[];
        if (headers.length === 0 || rows.length === 0) return;

        const headRects = headers.map(h => h.getBoundingClientRect());
        const estRect = (root.querySelector('.est') as HTMLElement).getBoundingClientRect();

        rows.forEach((row, r) => {
          const cells = [...row.querySelectorAll('.est__table-cell')] as HTMLElement[];
          if (cells.length !== headers.length) {
            problems.push(`${num} row ${r}: ${cells.length} cells vs ${headers.length} headers`);
            return;
          }
          const rects = cells.map(c => c.getBoundingClientRect());
          rects.forEach((cr, c) => {
            if (Math.abs(cr.left - headRects[c].left) > 1) {
              problems.push(
                `${num} row ${r} col ${c}: left ${Math.round(cr.left)} != header ${Math.round(headRects[c].left)}`);
            }
            if (Math.abs(cr.width - headRects[c].width) > 1) {
              problems.push(`${num} row ${r} col ${c}: width differs from its header column`);
            }
            // Cells of one row share top and bottom edges.
            if (Math.abs(cr.top - rects[0].top) > 1 || Math.abs(cr.bottom - rects[0].bottom) > 1) {
              problems.push(`${num} row ${r} col ${c}: not row-aligned`);
            }
            if (cr.right > estRect.right + 1 || cr.left < estRect.left - 1) {
              problems.push(`${num} row ${r} col ${c}: overhangs the estimate box`);
            }
          });
          // Rows abut vertically.
          if (r > 0) {
            const prev = rows[r - 1].getBoundingClientRect();
            if (Math.abs(rects[0].top - prev.bottom) > 1.5) {
              problems.push(`${num}: row seam ${Math.round(prev.bottom)} -> ${Math.round(rects[0].top)}`);
            }
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('document sections stack in order without overlapping', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const order = ['.est__header', '.est__parties', '.est__table-section', '.est__summary', '.est__footer'];
      document.querySelectorAll('snice-estimate').forEach((est, i) => {
        const num = est.getAttribute('estimate-number') || `estimate[${i}]`;
        const root = (est as HTMLElement).shadowRoot;
        if (!root) return;
        const sections = order
          .map(sel => ({ sel, el: root.querySelector(sel) as HTMLElement | null }))
          .filter(s => s.el && s.el.getBoundingClientRect().height > 0)
          .map(s => ({ sel: s.sel, rect: s.el!.getBoundingClientRect() }));
        for (let s = 1; s < sections.length; s++) {
          if (sections[s].rect.top < sections[s - 1].rect.bottom - 1) {
            problems.push(`${num}: ${sections[s].sel} overlaps ${sections[s - 1].sel}`);
          }
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('slotted QR badge renders at its configured corner inside the document', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-estimate[show-qr]').forEach((est, i) => {
        const num = est.getAttribute('estimate-number') || `estimate[${i}]`;
        const pos = est.getAttribute('qr-position') || 'top-right';
        const root = (est as HTMLElement).shadowRoot;
        const container = root?.querySelector(`.est__qr--${pos}`) as HTMLElement | null;
        const slotted = est.querySelector('[slot="qr"]') as HTMLElement | null;
        if (!container) { problems.push(`${num}: no .est__qr--${pos}`); return; }
        if (!slotted) { problems.push(`${num}: no slotted QR`); return; }

        const qr = slotted.getBoundingClientRect();
        const estRect = (root!.querySelector('.est') as HTMLElement).getBoundingClientRect();
        if (qr.width < 40 || qr.height < 40) {
          problems.push(`${num}: QR too small (${Math.round(qr.width)}x${Math.round(qr.height)})`);
        }
        if (Math.abs(qr.width - qr.height) > 1) {
          problems.push(`${num}: QR not square (${Math.round(qr.width)}x${Math.round(qr.height)})`);
        }
        if (qr.left < estRect.left - 1 || qr.right > estRect.right + 1
          || qr.top < estRect.top - 1 || qr.bottom > estRect.bottom + 1) {
          problems.push(`${num}: QR escapes the estimate box`);
        }
        if (pos.endsWith('right') && qr.left < estRect.left + estRect.width / 2) {
          problems.push(`${num}: qr-position="${pos}" but QR sits in the left half`);
        }
        if (pos === 'bottom-right' || pos === 'footer') {
          const table = root!.querySelector('.est__table-section') as HTMLElement | null;
          if (table && qr.top < table.getBoundingClientRect().top) {
            problems.push(`${num}: qr-position="${pos}" renders above the line items`);
          }
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});

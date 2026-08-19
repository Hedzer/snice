import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/split-pane/visual.html';

test.describe('Snice Split Pane visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('primary, divider and secondary tile the host with no gap, overlap or leftover', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const panes = [...document.querySelectorAll('snice-split-pane')] as HTMLElement[];
      if (panes.length === 0) problems.push('no snice-split-pane on page');

      panes.forEach((pane, i) => {
        const vertical = pane.getAttribute('direction') === 'vertical';
        const label = `pane[${i}] ${vertical ? 'vertical' : 'horizontal'}`;
        const root = pane.shadowRoot!;
        const primary = root.querySelector('.primary');
        const divider = root.querySelector('.divider');
        const secondary = root.querySelector('.secondary');
        if (!primary || !divider || !secondary) { problems.push(`${label}: missing parts`); return; }

        const p = primary.getBoundingClientRect();
        const d = divider.getBoundingClientRect();
        const s = secondary.getBoundingClientRect();
        const cs = getComputedStyle(pane);
        const host = pane.getBoundingClientRect();
        const inset = {
          left: host.left + parseFloat(cs.borderLeftWidth),
          right: host.right - parseFloat(cs.borderRightWidth),
          top: host.top + parseFloat(cs.borderTopWidth),
          bottom: host.bottom - parseFloat(cs.borderBottomWidth),
        };

        // Along the split axis the three parts must abut and fill the host.
        const startA = vertical ? p.top : p.left;
        const endA = vertical ? s.bottom : s.right;
        const hostStart = vertical ? inset.top : inset.left;
        const hostEnd = vertical ? inset.bottom : inset.right;
        const seam1 = vertical ? d.top - p.bottom : d.left - p.right;
        const seam2 = vertical ? s.top - d.bottom : s.left - d.right;

        if (Math.abs(seam1) > 0.5) problems.push(`${label}: gap/overlap ${seam1.toFixed(1)} between primary and divider`);
        if (Math.abs(seam2) > 0.5) problems.push(`${label}: gap/overlap ${seam2.toFixed(1)} between divider and secondary`);
        if (Math.abs(startA - hostStart) > 0.5) problems.push(`${label}: primary does not start at the host edge`);
        if (Math.abs(endA - hostEnd) > 0.5) problems.push(`${label}: secondary does not reach the host edge`);

        // Across the split axis both panes and the divider span the full host.
        const cross = (r: DOMRect) => vertical
          ? [r.left, r.right, inset.left, inset.right]
          : [r.top, r.bottom, inset.top, inset.bottom];
        ([['primary', p], ['divider', d], ['secondary', s]] as const).forEach(([name, r]) => {
          const [a, b, ha, hb] = cross(r);
          if (Math.abs(a - ha) > 0.5 || Math.abs(b - hb) > 0.5) {
            problems.push(`${label}: ${name} does not span the cross axis`);
          }
        });

        // The drag handle sits centred on the divider.
        const handle = divider.querySelector('.divider__handle');
        if (handle) {
          const h = handle.getBoundingClientRect();
          const dx = (h.left + h.width / 2) - (d.left + d.width / 2);
          const dy = (h.top + h.height / 2) - (d.top + d.height / 2);
          if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
            problems.push(`${label}: divider handle off-centre by ${dx.toFixed(1)},${dy.toFixed(1)}`);
          }
        }

        // Slotted content is laid out at the pane origin and never wider than
        // the pane. Vertical overflow is legitimate here: the panes are
        // `overflow: auto` scrollers by design.
        ([['primary', primary, p], ['secondary', secondary, s]] as const).forEach(([name, el, r]) => {
          const slot = el.querySelector('slot') as HTMLSlotElement | null;
          (slot?.assignedElements() ?? []).forEach(node => {
            const n = node.getBoundingClientRect();
            if (n.width === 0) return;
            if (n.left < r.left - 1 || n.top < r.top - 1) {
              problems.push(`${label}: ${name} slotted content starts outside the pane`);
            }
            if (n.width > r.width + 1) {
              problems.push(`${label}: ${name} slotted content is ${Math.round(n.width)}px wide `
                + `in a ${Math.round(r.width)}px pane`);
            }
          });
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('primary-size is honoured as a percentage of the split axis', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      ([...document.querySelectorAll('snice-split-pane')] as HTMLElement[]).forEach((pane, i) => {
        const expected = Number(pane.getAttribute('primary-size') ?? 50);
        const vertical = pane.getAttribute('direction') === 'vertical';
        const root = pane.shadowRoot!;
        const p = root.querySelector('.primary')!.getBoundingClientRect();
        const d = root.querySelector('.divider')!.getBoundingClientRect();
        const s = root.querySelector('.secondary')!.getBoundingClientRect();

        const span = (r: DOMRect) => (vertical ? r.height : r.width);
        const total = span(p) + span(d) + span(s);
        if (total === 0) { problems.push(`pane[${i}]: zero-size split`); return; }
        const actual = (span(p) / total) * 100;
        if (Math.abs(actual - expected) > 1) {
          problems.push(`pane[${i}]: primary is ${actual.toFixed(1)}% of the split, expected ${expected}%`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});

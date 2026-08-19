import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/form-layout/visual.html';

test.describe('Snice Form Layout visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-form-layout'));
    await page.waitForFunction(() =>
      !!document.querySelector('snice-form-layout')?.shadowRoot?.querySelector('.form-layout'));
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('grid layouts place fields in equal-width columns that align row to row', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const layouts = [...document.querySelectorAll('snice-form-layout')] as HTMLElement[];
      if (layouts.length === 0) problems.push('no snice-form-layout on the page');

      layouts.forEach((layout, li) => {
        const inner = layout.shadowRoot!.querySelector('.form-layout') as HTMLElement;
        // The inline variant is flex-wrap, not a fixed grid — covered separately.
        if (inner.classList.contains('form-layout--inline')) return;

        const expected = Number(layout.getAttribute('columns') ?? 1);
        const id = `layout[${li}](columns=${expected})`;
        const hostRect = layout.getBoundingClientRect();

        const tracks = getComputedStyle(inner).gridTemplateColumns.split(' ').map(parseFloat);
        if (tracks.length !== expected) {
          problems.push(`${id}: ${tracks.length} grid tracks`);
          return;
        }
        if (Math.max(...tracks) - Math.min(...tracks) > 1) {
          problems.push(`${id}: uneven tracks ${tracks.map(Math.round).join(',')}`);
        }

        const fields = [...layout.querySelectorAll(':scope > .field')] as HTMLElement[];
        if (fields.length === 0) { problems.push(`${id}: no slotted fields`); return; }

        fields.forEach((f, fi) => {
          const r = f.getBoundingClientRect();
          if (r.width < 20 || r.height < 20) {
            problems.push(`${id} field ${fi}: ${Math.round(r.width)}x${Math.round(r.height)}`);
          }
          if (r.left < hostRect.left - 1 || r.right > hostRect.right + 1) {
            problems.push(`${id} field ${fi}: escapes the layout horizontally`);
          }
          // The field's own label and control must stay inside the field.
          [...f.children].forEach(child => {
            const cr = child.getBoundingClientRect();
            if (cr.width === 0) return;
            if (cr.left < r.left - 1 || cr.right > r.right + 1) {
              problems.push(`${id} field ${fi}: <${child.tagName.toLowerCase()}> overflows its field`);
            }
          });
        });

        // Fields fill columns left-to-right; column N of every row shares the
        // same left edge and width.
        fields.forEach((f, fi) => {
          const col = fi % expected;
          const first = fields[col];
          if (!first) return;
          const r = f.getBoundingClientRect();
          const fr = first.getBoundingClientRect();
          if (Math.abs(r.left - fr.left) > 1) {
            problems.push(`${id} field ${fi}: column ${col} left ${Math.round(r.left)} != ${Math.round(fr.left)}`);
          }
          if (Math.abs(r.width - fr.width) > 1) {
            problems.push(`${id} field ${fi}: column ${col} width mismatch`);
          }
        });

        // Fields sharing a row share a top edge.
        for (let start = 0; start < fields.length; start += expected) {
          const row = fields.slice(start, start + expected);
          const tops = row.map(f => Math.round(f.getBoundingClientRect().top));
          if (Math.max(...tops) - Math.min(...tops) > 1) {
            problems.push(`${id} row ${start / expected}: uneven tops ${tops.join(',')}`);
          }
          // ...and never overlap horizontally.
          const rects = row.map(f => f.getBoundingClientRect());
          for (let i = 1; i < rects.length; i++) {
            if (rects[i].left < rects[i - 1].right - 1) {
              problems.push(`${id} row ${start / expected}: field ${i} overlaps field ${i - 1}`);
            }
          }
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('gap variants widen the gutter monotonically', async ({ page }) => {
    const gaps = await page.evaluate(() => {
      const measure = (gap: string) => {
        const layout = document.querySelector(
          `snice-form-layout[gap="${gap}"][columns="2"]`) as HTMLElement;
        const fields = [...layout.querySelectorAll(':scope > .field')] as HTMLElement[];
        const a = fields[0].getBoundingClientRect();
        const b = fields[1].getBoundingClientRect();
        return b.left - a.right;
      };
      return { small: measure('small'), medium: measure('medium'), large: measure('large') };
    });

    expect(gaps.small).toBeGreaterThan(0);
    expect(gaps.medium).toBeGreaterThan(gaps.small);
    expect(gaps.large).toBeGreaterThan(gaps.medium);
  });

  test('inline variant flows fields onto one baseline-aligned row', async ({ page }) => {
    const result = await page.evaluate(() => {
      const problems: string[] = [];
      const layout = document.querySelector(
        'snice-form-layout[variant="inline"][columns="3"]') as HTMLElement;
      if (!layout) { problems.push('no inline layout on the page'); return problems; }

      const inner = layout.shadowRoot!.querySelector('.form-layout') as HTMLElement;
      const cs = getComputedStyle(inner);
      if (cs.display !== 'flex') problems.push(`inline variant display is ${cs.display}`);
      if (cs.alignItems !== 'flex-end') problems.push(`inline variant align-items is ${cs.alignItems}`);

      const fields = [...layout.querySelectorAll(':scope > .field')] as HTMLElement[];
      const rects = fields.map(f => f.getBoundingClientRect());
      // All three fit on one row at desktop width: shared bottom, advancing lefts.
      const bottoms = rects.map(r => Math.round(r.bottom));
      if (Math.max(...bottoms) - Math.min(...bottoms) > 1) {
        problems.push(`inline fields not bottom-aligned: ${bottoms.join(',')}`);
      }
      for (let i = 1; i < rects.length; i++) {
        if (rects[i].left < rects[i - 1].right - 1) {
          problems.push(`inline field ${i} overlaps field ${i - 1}`);
        }
      }
      const host = layout.getBoundingClientRect();
      rects.forEach((r, i) => {
        if (r.right > host.right + 1) problems.push(`inline field ${i} overflows the layout`);
      });
      return problems;
    });
    expect(result).toEqual([]);
  });

  test('label-position publishes the field-direction custom properties to slotted fields', async ({ page }) => {
    const directions = await page.evaluate(() => {
      const read = (pos: string) => {
        const layout = document.querySelector(`snice-form-layout[label-position="${pos}"]`)!;
        const field = layout.querySelector(':scope > .field')!;
        const cs = getComputedStyle(field);
        return {
          direction: cs.getPropertyValue('--snice-form-field-direction').trim(),
          labelWidth: cs.getPropertyValue('--snice-form-label-width').trim()
        };
      };
      return { top: read('top'), left: read('left'), right: read('right') };
    });

    expect(directions.top.direction).toBe('column');
    expect(directions.left.direction).toBe('row');
    expect(directions.right.direction).toBe('row-reverse');
    expect(directions.left.labelWidth).not.toBe('auto');
    expect(directions.top.labelWidth).toBe('auto');
  });
});

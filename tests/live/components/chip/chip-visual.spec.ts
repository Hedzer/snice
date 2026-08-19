import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/chip/visual.html';

test.describe('Snice Chip visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('label, icon and avatar sit in order inside the chip pill', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const chips = [...document.querySelectorAll('snice-chip')] as any[];
      if (chips.length === 0) problems.push('no chips on page');

      chips.forEach((chip, c) => {
        const id = `chip[${c}] "${chip.getAttribute('label')}"`;
        const pill = chip.shadowRoot?.querySelector('.chip') as HTMLElement | null;
        if (!pill) { problems.push(`${id}: no .chip`); return; }
        const pr = pill.getBoundingClientRect();
        if (pr.width === 0 || pr.height === 0) { problems.push(`${id}: pill is ${pr.width}x${pr.height}`); return; }

        const label = pill.querySelector('.chip-label') as HTMLElement | null;
        if (!label) { problems.push(`${id}: no .chip-label`); return; }
        const lr = label.getBoundingClientRect();

        // The label never spills out of the pill.
        if (lr.left < pr.left - 1 || lr.right > pr.right + 1
            || lr.top < pr.top - 1 || lr.bottom > pr.bottom + 1) {
          problems.push(`${id}: label escapes the pill`);
        }
        // ...and is vertically centred in it.
        const dy = (lr.top + lr.height / 2) - (pr.top + pr.height / 2);
        if (Math.abs(dy) > 1.5) {
          problems.push(`${id}: label off-centre by ${dy.toFixed(1)}px`);
        }

        // A leading icon or avatar is square, text-scaled, and precedes the label.
        const lead = pill.querySelector('.chip-avatar, .chip-icon') as HTMLElement | null;
        if (lead) {
          const gr = lead.getBoundingClientRect();
          if (Math.abs(gr.width - gr.height) > 1) {
            problems.push(`${id}: leading glyph not square (${Math.round(gr.width)}x${Math.round(gr.height)})`);
          }
          if (gr.height < 10 || gr.height > pr.height) {
            problems.push(`${id}: leading glyph ${Math.round(gr.height)}px against a ${Math.round(pr.height)}px pill`);
          }
          if (gr.right > lr.left + 1) {
            problems.push(`${id}: leading glyph overlaps the label`);
          }
          if (gr.left < pr.left - 1 || gr.top < pr.top - 1 || gr.bottom > pr.bottom + 1) {
            problems.push(`${id}: leading glyph escapes the pill`);
          }
        }
      });
      return problems;
    });

    expect(failures).toEqual([]);
  });

  // BUG: on every `removable` chip the remove button computes to width 0px
  // (`.chip-remove` is 0x18) while its 14x14 SVG path still paints - the button
  // has `overflow:hidden`, so the dismiss affordance is invisible and has no
  // hit area, and the glyph draws ~4px past the pill's right edge.
  test.fixme('the remove button is a visible, hittable target inside the pill', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const chips = [...document.querySelectorAll('snice-chip[removable]')] as any[];
      if (chips.length === 0) problems.push('no removable chips on page');

      chips.forEach((chip, c) => {
        const pill = chip.shadowRoot?.querySelector('.chip') as HTMLElement;
        const btn = chip.shadowRoot?.querySelector('.chip-remove') as HTMLElement | null;
        if (!btn) { problems.push(`removable[${c}]: no .chip-remove`); return; }
        const br = btn.getBoundingClientRect();
        const pr = pill.getBoundingClientRect();

        if (br.width < 10 || br.height < 10) {
          problems.push(`removable[${c}]: remove button is ${Math.round(br.width)}x${Math.round(br.height)}`);
        }
        if (br.right > pr.right + 1 || br.left < pr.left - 1) {
          problems.push(`removable[${c}]: remove button escapes the pill`);
        }
        const glyph = btn.querySelector('svg');
        if (glyph) {
          const gr = glyph.getBoundingClientRect();
          if (gr.width < 8 || gr.right > pr.right + 1) {
            problems.push(`removable[${c}]: remove glyph ${Math.round(gr.width)}px wide, `
              + `right edge ${Math.round(gr.right)} vs pill ${Math.round(pr.right)}`);
          }
        }
      });
      return problems;
    });

    expect(failures).toEqual([]);
  });

  test('size variants scale the pill monotonically', async ({ page }) => {
    const heights = await page.evaluate(() =>
      ['small', 'medium', 'large'].map(size => {
        const chip = document.querySelector(`snice-chip[size="${size}"]`) as any;
        const pill = chip?.shadowRoot?.querySelector('.chip');
        return pill ? Math.round(pill.getBoundingClientRect().height) : -1;
      }));

    expect(heights.every(h => h > 0)).toBe(true);
    expect(heights[0]).toBeLessThan(heights[1]);
    expect(heights[1]).toBeLessThan(heights[2]);
  });
});

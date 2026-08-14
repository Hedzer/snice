import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/button/demo.html';

test.describe('Snice Button visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    // The showcase pulls the Material Symbols webfont; let icon metrics settle.
    await page.evaluate(() => (document as any).fonts?.ready).catch(() => {});
    await page.waitForTimeout(400);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('circle buttons render as circles with their glyph on the center point', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const circles = [...document.querySelectorAll('snice-button[circle]')];
      if (circles.length === 0) problems.push('no circle buttons in showcase');
      circles.forEach((host, i) => {
        const btn = (host as any).shadowRoot?.querySelector('button');
        if (!btn) { problems.push(`circle[${i}]: no inner button`); return; }
        const br = btn.getBoundingClientRect();
        if (Math.abs(br.width - br.height) > 1) {
          problems.push(`circle[${i}]: not round (${Math.round(br.width)}x${Math.round(br.height)})`);
        }
        const radius = parseFloat(getComputedStyle(btn).borderTopLeftRadius);
        if (radius < br.width / 2 - 1) {
          problems.push(`circle[${i}]: radius ${radius.toFixed(1)} < half of ${Math.round(br.width)}`);
        }
        const label = btn.querySelector('.label');
        if (!label) return;
        const lr = label.getBoundingClientRect();
        if (lr.width === 0) return; // loading circle hides its label
        const dx = (lr.left + lr.width / 2) - (br.left + br.width / 2);
        const dy = (lr.top + lr.height / 2) - (br.top + br.height / 2);
        if (Math.abs(dx) > 1.5 || Math.abs(dy) > 1.5) {
          problems.push(`circle[${i}]: glyph off center by ${dx.toFixed(1)},${dy.toFixed(1)}`);
        }
        if (lr.width > br.width + 1 || lr.height > br.height + 1) {
          problems.push(`circle[${i}]: glyph larger than the circle`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('text buttons pad their label symmetrically and keep it inside the box', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const plain = [...document.querySelectorAll('snice-button')].filter(b =>
        !b.hasAttribute('circle') && !b.hasAttribute('icon') && !b.hasAttribute('loading')
        && !b.querySelector('[slot="icon"]') && !b.classList.contains('long-label'));
      if (plain.length === 0) problems.push('no plain buttons in showcase');
      plain.forEach((host, i) => {
        const btn = (host as any).shadowRoot?.querySelector('button');
        const label = btn?.querySelector('.label');
        if (!btn || !label) return;
        const br = btn.getBoundingClientRect();
        const lr = label.getBoundingClientRect();
        if (lr.width === 0) return; // the empty-button edge case
        if (lr.left < br.left - 0.5 || lr.right > br.right + 0.5
            || lr.top < br.top - 0.5 || lr.bottom > br.bottom + 0.5) {
          problems.push(`button[${i}]: label escapes the box`);
        }
        const padLeft = lr.left - br.left;
        const padRight = br.right - lr.right;
        if (Math.abs(padLeft - padRight) > 1) {
          problems.push(`button[${i}]: asymmetric padding ${padLeft.toFixed(1)} / ${padRight.toFixed(1)}`);
        }
        const dy = (lr.top + lr.height / 2) - (br.top + br.height / 2);
        if (Math.abs(dy) > 1.5) {
          problems.push(`button[${i}]: label off vertical center by ${dy.toFixed(1)}px`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('loading buttons center a visible spinner over the button', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const loaders = [...document.querySelectorAll('snice-button[loading]')];
      if (loaders.length === 0) problems.push('no loading buttons in showcase');
      loaders.forEach((host, i) => {
        const btn = (host as any).shadowRoot?.querySelector('button');
        const spinner = btn?.querySelector('.spinner');
        if (!spinner) { problems.push(`loading[${i}]: no spinner`); return; }
        const br = btn.getBoundingClientRect();
        const sr = spinner.getBoundingClientRect();
        if (sr.width < 8 || sr.width > 32) {
          problems.push(`loading[${i}]: spinner ${Math.round(sr.width)}px out of range`);
        }
        if (Math.abs(sr.width - sr.height) > 1) {
          problems.push(`loading[${i}]: spinner not round (${Math.round(sr.width)}x${Math.round(sr.height)})`);
        }
        const dx = (sr.left + sr.width / 2) - (br.left + br.width / 2);
        const dy = (sr.top + sr.height / 2) - (br.top + br.height / 2);
        if (Math.abs(dx) > 1.5 || Math.abs(dy) > 1.5) {
          problems.push(`loading[${i}]: spinner off center by ${dx.toFixed(1)},${dy.toFixed(1)}`);
        }
        if (sr.left < br.left - 0.5 || sr.right > br.right + 0.5) {
          problems.push(`loading[${i}]: spinner escapes the button`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('slotted icons render at a sane size and clear the label', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const iconed = [...document.querySelectorAll('snice-button')]
        .filter(b => b.querySelector('[slot="icon"]'));
      if (iconed.length === 0) problems.push('no slotted-icon buttons in showcase');
      iconed.forEach((host, i) => {
        const btn = (host as any).shadowRoot?.querySelector('button');
        const slotBox = btn?.querySelector('.icon-slot');
        const label = btn?.querySelector('.label');
        const glyph = host.querySelector('[slot="icon"]');
        if (!btn || !slotBox || !glyph) { problems.push(`slotted[${i}]: missing icon parts`); return; }
        const br = btn.getBoundingClientRect();
        const sr = slotBox.getBoundingClientRect();
        const gr = glyph.getBoundingClientRect();

        if (gr.width < 8 || gr.height < 8) {
          problems.push(`slotted[${i}]: glyph collapsed to ${Math.round(gr.width)}x${Math.round(gr.height)}`);
        }
        if (gr.left < br.left - 0.5 || gr.right > br.right + 0.5
            || gr.top < br.top - 0.5 || gr.bottom > br.bottom + 0.5) {
          problems.push(`slotted[${i}]: glyph escapes the button`);
        }
        // The slot box is the reserved gutter; the glyph must sit in it.
        const dx = (gr.left + gr.width / 2) - (sr.left + sr.width / 2);
        if (Math.abs(dx) > 1.5) {
          problems.push(`slotted[${i}]: glyph off its gutter by ${dx.toFixed(1)}px`);
        }
        if (label) {
          const lr = label.getBoundingClientRect();
          if (lr.width > 0 && lr.left < sr.right - 0.5) {
            problems.push(`slotted[${i}]: label overlaps the icon gutter`);
          }
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  // BUG: `.button--icon-start .icon-slot, .button--icon-start .icon` applies
  // `margin-right: 0.5em` to BOTH the gutter and the fallback icon nested
  // inside it. `.icon-slot` is a 1.25em-wide centering flex box, so the
  // fallback's own 0.5em margin makes it 1.75em of flex content in a 1.25em
  // box and it overhangs 0.25em (4px at medium) on each side. The rendered
  // glyph therefore sits ~4px left of its reserved gutter: the button's left
  // padding reads 13px instead of 17px and the icon-to-label gap becomes 12px
  // instead of the intended 8px. Only the `icon` attribute is affected --
  // slotted icons have no inner `.icon` and land correctly.
  test.fixme('the icon-attribute glyph is centered in its reserved gutter', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-button[icon]').forEach((host, i) => {
        const root = (host as any).shadowRoot;
        const slotBox = root?.querySelector('.icon-slot');
        const icon = root?.querySelector('.icon-slot .icon');
        if (!slotBox || !icon) return;
        const sr = slotBox.getBoundingClientRect();
        const ir = icon.getBoundingClientRect();
        const dx = (ir.left + ir.width / 2) - (sr.left + sr.width / 2);
        if (Math.abs(dx) > 1) {
          problems.push(`icon[${i}] "${host.getAttribute('icon')}": glyph off its gutter by ${dx.toFixed(1)}px`);
        }
        if (ir.left < sr.left - 1 || ir.right > sr.right + 1) {
          problems.push(`icon[${i}] "${host.getAttribute('icon')}": glyph overhangs its gutter`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});

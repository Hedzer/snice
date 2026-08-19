import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/layout/visual.html';

const SHELLS = [
  'snice-layout-sidebar',
  'snice-layout-dashboard',
  'snice-layout-centered',
  'snice-layout-blog',
  'snice-layout-master-detail',
  'snice-layout-docs',
  'snice-layout-auth-split',
];

test.describe('Snice Layout visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('snice-layout stacks header, main and footer full-width with no seams', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const layouts = [...document.querySelectorAll('snice-layout')] as any[];
      if (layouts.length === 0) problems.push('no snice-layout on page');

      layouts.forEach((host, i) => {
        const shell = host.shadowRoot?.querySelector('.layout') as HTMLElement | null;
        if (!shell) { problems.push(`layout[${i}]: no .layout`); return; }
        const sr = shell.getBoundingClientRect();

        const regions = ['.header', '.main', '.footer']
          .map(sel => shell.querySelector(sel) as HTMLElement | null)
          .filter((el): el is HTMLElement => !!el && el.getBoundingClientRect().height > 0);
        if (regions.length < 2) { problems.push(`layout[${i}]: only ${regions.length} visible regions`); return; }

        let prevBottom: number | null = null;
        regions.forEach(region => {
          const r = region.getBoundingClientRect();
          const name = region.className.split(' ')[0];

          // Regions span the full shell width.
          if (Math.abs(r.left - sr.left) > 1 || Math.abs(r.right - sr.right) > 1) {
            problems.push(`layout[${i}] .${name}: ${Math.round(r.left)}..${Math.round(r.right)} `
              + `does not span the shell ${Math.round(sr.left)}..${Math.round(sr.right)}`);
          }
          // ...and stack with no gap and no overlap.
          if (prevBottom !== null && Math.abs(r.top - prevBottom) > 1) {
            problems.push(`layout[${i}] .${name}: seam ${Math.round(prevBottom)} -> ${Math.round(r.top)}`);
          }
          prevBottom = r.bottom;
        });

        // The stack fits the shell it was measured against.
        if (prevBottom! > sr.bottom + 1) {
          problems.push(`layout[${i}]: regions run ${Math.round(prevBottom! - sr.bottom)}px past the shell`);
        }
      });
      return problems;
    });

    expect(failures).toEqual([]);
  });

  // BUG: <snice-layout-blog> does not constrain itself to its container. In the
  // showcase every shell sits in a fixed 340px overflow:hidden box; the blog
  // shell's inner .layout measures 352px, so its footer is clipped by 11px.
  // Every other shell fits its box exactly.
  test.fixme('every app shell fits inside its fixed-height container', async ({ page }) => {
    const failures = await page.evaluate((tags: string[]) => {
      const problems: string[] = [];
      tags.forEach(tag => {
        const host = document.querySelector(tag) as any;
        if (!host) { problems.push(`${tag}: missing`); return; }
        const hr = host.getBoundingClientRect();
        const shell = host.shadowRoot?.querySelector('.layout') as HTMLElement | null;
        if (!shell) { problems.push(`${tag}: no .layout`); return; }
        const sr = shell.getBoundingClientRect();
        if (sr.bottom > hr.bottom + 1 || sr.top < hr.top - 1
            || sr.left < hr.left - 1 || sr.right > hr.right + 1) {
          problems.push(`${tag}: shell ${Math.round(sr.height)}px overflows its `
            + `${Math.round(hr.height)}px container by ${Math.round(sr.bottom - hr.bottom)}px`);
        }
      });
      return problems;
    }, SHELLS);

    expect(failures).toEqual([]);
  });

  test('app shell regions tile their body area without overlapping', async ({ page }) => {
    const failures = await page.evaluate((tags: string[]) => {
      const problems: string[] = [];
      tags.forEach(tag => {
        const host = document.querySelector(tag) as any;
        const shell = host?.shadowRoot?.querySelector('.layout') as HTMLElement | null;
        if (!shell) return;
        const body = shell.querySelector('.body-area') as HTMLElement | null;
        if (!body) return; // centered/blog/auth-split shells have no body-area
        const br = body.getBoundingClientRect();

        const cols = ([...body.children] as HTMLElement[])
          .map(c => ({ el: c, r: c.getBoundingClientRect() }))
          .filter(c => c.r.width > 0 && c.r.height > 0)
          .sort((a, b) => a.r.left - b.r.left);
        if (cols.length < 2) return;

        cols.forEach(({ el, r }, i) => {
          const name = (el.className || el.tagName).toString().split(' ')[0];
          if (r.left < br.left - 1 || r.right > br.right + 1
              || r.top < br.top - 1 || r.bottom > br.bottom + 1) {
            problems.push(`${tag} .${name}: escapes the body area`);
          }
          if (i > 0 && r.left < cols[i - 1].r.right - 1) {
            problems.push(`${tag} .${name}: overlaps the column to its left`);
          }
        });

        // The columns cover the body area edge to edge.
        if (Math.abs(cols[0].r.left - br.left) > 1
            || Math.abs(cols[cols.length - 1].r.right - br.right) > 1) {
          problems.push(`${tag}: columns leave the body area uncovered `
            + `(${Math.round(cols[0].r.left)}..${Math.round(cols[cols.length - 1].r.right)} `
            + `vs ${Math.round(br.left)}..${Math.round(br.right)})`);
        }
      });
      return problems;
    }, SHELLS);

    expect(failures).toEqual([]);
  });

  test('auth-split renders two equal halves that abut exactly', async ({ page }) => {
    const halves = await page.evaluate(() => {
      const host = document.querySelector('snice-layout-auth-split') as any;
      const shell = host?.shadowRoot?.querySelector('.layout');
      const form = shell?.querySelector('.form-side');
      const panel = shell?.querySelector('.panel');
      if (!form || !panel) return null;
      const f = form.getBoundingClientRect();
      const p = panel.getBoundingClientRect();
      return {
        formW: f.width, panelW: p.width,
        seam: p.left - f.right,
        topDelta: Math.abs(p.top - f.top),
        heightDelta: Math.abs(p.height - f.height),
      };
    });

    expect(halves).not.toBeNull();
    expect(Math.abs(halves!.formW - halves!.panelW)).toBeLessThanOrEqual(2);
    expect(Math.abs(halves!.seam)).toBeLessThanOrEqual(1);
    expect(halves!.topDelta).toBeLessThanOrEqual(1);
    expect(halves!.heightDelta).toBeLessThanOrEqual(1);
  });
});

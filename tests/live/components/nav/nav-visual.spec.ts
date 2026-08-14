import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/nav/demo.html';

test.describe('Snice Nav visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('horizontal navs lay items out in a single non-overlapping row', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-nav[orientation="horizontal"]').forEach(host => {
        const id = host.id || '(anon)';
        const root = (host as HTMLElement).shadowRoot;
        const nav = root?.querySelector('nav') as HTMLElement | null;
        // The "empty (no placards)" showcase renders no <nav> at all.
        if (!nav) return;
        const nr = nav.getBoundingClientRect();
        const items = [...nav.querySelectorAll(':scope > .nav__item, :scope > .nav__group')] as HTMLElement[];
        if (items.length === 0) return; // the empty-nav case

        const rects = items.map(i => i.getBoundingClientRect()).sort((a, b) => a.left - b.left);
        const tops = rects.map(r => Math.round(r.top));
        if (Math.max(...tops) - Math.min(...tops) > 1) {
          problems.push(`${id}: items on uneven baselines ${tops.join(',')}`);
        }
        for (let i = 1; i < rects.length; i++) {
          if (rects[i].left < rects[i - 1].right - 1) {
            problems.push(`${id}: item ${i} overlaps its neighbour`
              + ` (${Math.round(rects[i].left)} < ${Math.round(rects[i - 1].right)})`);
          }
        }
        rects.forEach((r, i) => {
          if (r.left < nr.left - 1 || r.right > nr.right + 1
              || r.top < nr.top - 1 || r.bottom > nr.bottom + 1) {
            problems.push(`${id}: item ${i} escapes the nav box`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('vertical navs stack items in one left-aligned column with no overlap', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-nav[orientation="vertical"]').forEach(host => {
        const id = host.id || '(anon)';
        const root = (host as HTMLElement).shadowRoot;
        const nav = root?.querySelector('nav') as HTMLElement | null;
        // The "empty (no placards)" showcase renders no <nav> at all.
        if (!nav) return;
        const nr = nav.getBoundingClientRect();
        const items = [...nav.querySelectorAll(':scope > .nav__item, :scope > .nav__group')] as HTMLElement[];
        if (items.length === 0) return;

        const rects = items.map(i => i.getBoundingClientRect()).sort((a, b) => a.top - b.top);
        const lefts = rects.map(r => Math.round(r.left));
        if (Math.max(...lefts) - Math.min(...lefts) > 1) {
          problems.push(`${id}: items not left-aligned ${lefts.join(',')}`);
        }
        for (let i = 1; i < rects.length; i++) {
          if (rects[i].top < rects[i - 1].bottom - 1) {
            problems.push(`${id}: item ${i} overlaps the one above it`);
          }
        }
        rects.forEach((r, i) => {
          if (r.right > nr.right + 1 || r.left < nr.left - 1) {
            problems.push(`${id}: item ${i} escapes the nav box horizontally`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('hierarchical submenu items are indented under their group link', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const host = document.querySelector('#nav-hier-children') as HTMLElement | null;
      if (!host) { problems.push('showcase has no #nav-hier-children'); return problems; }
      const groups = [...host.shadowRoot!.querySelectorAll('.nav__group')] as HTMLElement[];
      if (groups.length === 0) { problems.push('no hierarchical groups rendered'); return problems; }

      groups.forEach((group, g) => {
        const gr = group.getBoundingClientRect();
        const parentLink = group.querySelector(':scope > .nav__link') as HTMLElement | null;
        const submenu = group.querySelector(':scope > .nav__submenu') as HTMLElement | null;
        if (!parentLink || !submenu) { problems.push(`group[${g}]: missing link or submenu`); return; }
        const pr = parentLink.getBoundingClientRect();
        const children = [...submenu.querySelectorAll(':scope > .nav__item')] as HTMLElement[];
        if (children.length === 0) { problems.push(`group[${g}]: empty submenu`); return; }

        if (submenu.getBoundingClientRect().top < pr.bottom - 1) {
          problems.push(`group[${g}]: submenu overlaps its parent link`);
        }
        children.forEach((child, c) => {
          const cr = child.getBoundingClientRect();
          const label = child.querySelector('.nav__label') as HTMLElement | null;
          const lr = label?.getBoundingClientRect();
          if (lr && lr.left <= pr.left + 1) {
            problems.push(`group[${g}] child[${c}]: not indented`
              + ` (child label ${Math.round(lr.left)} vs parent ${Math.round(pr.left)})`);
          }
          if (cr.right > gr.right + 1) {
            problems.push(`group[${g}] child[${c}]: overhangs the group box`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});

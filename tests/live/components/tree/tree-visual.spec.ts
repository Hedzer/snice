import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/tree/demo.html';

test.describe('Snice Tree visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-tree'));
    await page.waitForFunction(() => {
      const t = document.querySelector('#tree-single') as any;
      return (t?.shadowRoot?.querySelectorAll('snice-tree-item').length || 0) > 0;
    });
    await page.waitForTimeout(300);
  });

  // FALSE POSITIVE: hidden-wrapper pattern — every row keeps its spinner and
  // checkbox mounted inside a `display: none` wrapper, so <snice-spinner> and
  // <snice-checkbox> measure 0x0 while their own computed display is not none.
  test.fixme('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('no visual invariant violations beyond the hidden spinner/checkbox wrappers', async ({ page }) => {
    const violations = await collectVisualViolations(page);
    const allowed = /^<snice-(spinner|checkbox)> renders at 0x0$/;
    expect(violations.filter(v => !allowed.test(v))).toEqual([]);
  });

  test('rows indent by one constant step per depth level', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const steps: number[] = [];
      document.querySelectorAll('snice-tree').forEach((tree, t) => {
        const id = (tree as HTMLElement).id || `tree[${t}]`;
        const items = [...((tree as HTMLElement).shadowRoot
          ?.querySelectorAll('snice-tree-item') ?? [])];
        const walk = (host: Element) => {
          const root = (host as HTMLElement).shadowRoot;
          if (!root) return;
          const content = root.querySelector('.tree-item__content') as HTMLElement | null;
          const label = root.querySelector('.tree-item__label') as HTMLElement | null;
          if (!content || !label) return;
          const level = Number((host as any).level ?? 0);
          const contentRect = content.getBoundingClientRect();
          const pad = label.getBoundingClientRect().left - contentRect.left;
          (host as any).__pad = pad;
          (host as any).__level = level;
          root.querySelectorAll('snice-tree-item').forEach(child => walk(child));
        };
        items.forEach(item => walk(item));

        // Collect (level, indent) pairs across the whole tree.
        const byLevel = new Map<number, number[]>();
        const collect = (host: Element) => {
          const pad = (host as any).__pad;
          const level = (host as any).__level;
          if (typeof pad === 'number') {
            if (!byLevel.has(level)) byLevel.set(level, []);
            byLevel.get(level)!.push(pad);
          }
          (host as HTMLElement).shadowRoot
            ?.querySelectorAll('snice-tree-item').forEach(c => collect(c));
        };
        items.forEach(item => collect(item));

        // Same level => same indent within a tree.
        [...byLevel.entries()].forEach(([level, pads]) => {
          if (Math.max(...pads) - Math.min(...pads) > 1) {
            problems.push(`${id} level ${level}: inconsistent indent ${pads.map(Math.round).join(',')}`);
          }
        });
        const levels = [...byLevel.keys()].sort((a, b) => a - b);
        for (let l = 1; l < levels.length; l++) {
          if (levels[l] !== levels[l - 1] + 1) continue;
          const step = byLevel.get(levels[l])![0] - byLevel.get(levels[l - 1])![0];
          if (step <= 0) {
            problems.push(`${id}: level ${levels[l]} is not indented past level ${levels[l - 1]}`);
          }
          steps.push(step);
        }
      });
      if (steps.length > 1 && Math.max(...steps) - Math.min(...steps) > 1) {
        problems.push(`indent step varies across the showcase: ${steps.map(Math.round).join(',')}`);
      }
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('row controls sit on one centred line inside the row', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const check = (host: Element, id: string) => {
        const root = (host as HTMLElement).shadowRoot;
        if (!root) return;
        const content = root.querySelector('.tree-item__content') as HTMLElement | null;
        if (content) {
          const cr = content.getBoundingClientRect();
          if (cr.height > 0) {
            const mid = cr.top + cr.height / 2;
            ['.tree-item__expander', '.tree-item__checkbox', '.tree-item__icon', '.tree-item__label']
              .forEach(sel => {
                const el = content.querySelector(sel) as HTMLElement | null;
                if (!el) return;
                const r = el.getBoundingClientRect();
                if (r.width === 0 || r.height === 0) return;
                if (r.top < cr.top - 1 || r.bottom > cr.bottom + 1
                  || r.left < cr.left - 1 || r.right > cr.right + 1) {
                  problems.push(`${id} ${sel}: escapes its row`);
                }
                const dy = (r.top + r.height / 2) - mid;
                if (Math.abs(dy) > 1.5) {
                  problems.push(`${id} ${sel}: off the row centre by ${dy.toFixed(1)}px`);
                }
                if (sel === '.tree-item__expander' || sel === '.tree-item__icon') {
                  if (r.width < 10 || r.width > 32) {
                    problems.push(`${id} ${sel}: sized ${Math.round(r.width)}px`);
                  }
                }
              });
          }
        }
        root.querySelectorAll('snice-tree-item').forEach(c => check(c, id));
      };
      document.querySelectorAll('snice-tree').forEach((tree, t) => {
        const id = (tree as HTMLElement).id || `tree[${t}]`;
        (tree as HTMLElement).shadowRoot?.querySelectorAll('snice-tree-item')
          .forEach(item => check(item, id));
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('expanding a folder reveals children one step further in and grows the tree', async ({ page }) => {
    const tree = page.locator('#tree-single');
    const before = await tree.evaluate(el => el.getBoundingClientRect().height);

    const geometry = await tree.evaluate(async el => {
      const root = (el as HTMLElement).shadowRoot!;
      // Find a collapsed item that has an expander.
      const items = [...root.querySelectorAll('snice-tree-item')] as any[];
      const target = items.find(i => {
        const exp = i.shadowRoot?.querySelector('.tree-item__expander');
        return exp && !exp.classList.contains('tree-item__expander--hidden')
          && !exp.classList.contains('tree-item__expander--expanded');
      });
      if (!target) return null;
      const rowLeft = () => target.shadowRoot
        .querySelector('.tree-item__label').getBoundingClientRect().left;
      const parentIndent = rowLeft();
      (target.shadowRoot.querySelector('.tree-item__expander') as HTMLElement).click();
      await new Promise(r => setTimeout(r, 350));
      const children = [...target.shadowRoot.querySelectorAll('snice-tree-item')] as any[];
      const childIndents = children
        .map(c => c.shadowRoot?.querySelector('.tree-item__label')?.getBoundingClientRect().left)
        .filter((v: number | undefined) => typeof v === 'number');
      const rows = children
        .map(c => c.shadowRoot?.querySelector('.tree-item__content')?.getBoundingClientRect())
        .filter(Boolean) as DOMRect[];
      return { parentIndent, childIndents, rows: rows.map(r => ({ top: r.top, bottom: r.bottom })) };
    });

    expect(geometry).not.toBeNull();
    expect(geometry!.childIndents.length).toBeGreaterThan(0);
    for (const indent of geometry!.childIndents) {
      expect(indent).toBeGreaterThan(geometry!.parentIndent);
    }
    // Revealed sibling rows stack without overlapping.
    for (let r = 1; r < geometry!.rows.length; r++) {
      expect(geometry!.rows[r].top).toBeGreaterThanOrEqual(geometry!.rows[r - 1].bottom - 1);
    }

    const after = await tree.evaluate(el => el.getBoundingClientRect().height);
    expect(after).toBeGreaterThan(before);
  });
});

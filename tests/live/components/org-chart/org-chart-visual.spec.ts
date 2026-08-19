import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/org-chart/visual.html';

test.describe('Snice OrgChart visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-org-chart'));
    await page.waitForFunction(() => {
      const c = document.querySelector('#chart-td') as any;
      return !!c?.shadowRoot?.querySelector('.org-node');
    });
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('children hang off their parent in the configured direction without sibling overlap', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-org-chart').forEach((chart, i) => {
        const id = (chart as HTMLElement).id || `chart[${i}]`;
        const root = (chart as HTMLElement).shadowRoot;
        if (!root) { problems.push(`${id}: no shadow root`); return; }
        const leftRight = chart.getAttribute('direction') === 'left-right';

        [...root.querySelectorAll('.org-node-wrapper')].forEach((wrapper, w) => {
          const node = wrapper.querySelector(':scope > .org-node') as HTMLElement | null;
          const children = wrapper.querySelector(':scope > .org-children') as HTMLElement | null;
          if (!node || !children) return;
          const nr = node.getBoundingClientRect();
          const cr = children.getBoundingClientRect();

          if (leftRight) {
            if (cr.left < nr.right - 1) {
              problems.push(`${id} node ${w}: children start left of the parent's right edge`);
            }
          } else if (cr.top < nr.bottom - 1) {
            problems.push(`${id} node ${w}: children overlap the parent node`);
          }

          const branches = [...children.querySelectorAll(':scope > .org-branch')] as HTMLElement[];
          const rects = branches.map(b => b.getBoundingClientRect());
          for (let b = 1; b < rects.length; b++) {
            if (leftRight) {
              if (rects[b].top < rects[b - 1].bottom - 1) {
                problems.push(`${id} node ${w}: sibling branches ${b - 1}/${b} overlap vertically`);
              }
            } else if (rects[b].left < rects[b - 1].right - 1) {
              problems.push(`${id} node ${w}: sibling branches ${b - 1}/${b} overlap horizontally`);
            }
          }

          // The parent sits within the span its children occupy on the
          // cross axis, so the connector never points off into space.
          if (rects.length > 0) {
            if (leftRight) {
              const mid = nr.top + nr.height / 2;
              const span = [Math.min(...rects.map(r => r.top)), Math.max(...rects.map(r => r.bottom))];
              if (mid < span[0] - 1 || mid > span[1] + 1) {
                problems.push(`${id} node ${w}: parent is outside its children's vertical span`);
              }
            } else {
              const mid = nr.left + nr.width / 2;
              const span = [Math.min(...rects.map(r => r.left)), Math.max(...rects.map(r => r.right))];
              if (mid < span[0] - 1 || mid > span[1] + 1) {
                problems.push(`${id} node ${w}: parent is outside its children's horizontal span`);
              }
            }
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('node avatar and text stay inside the node card', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-org-chart').forEach((chart, i) => {
        const id = (chart as HTMLElement).id || `chart[${i}]`;
        const root = (chart as HTMLElement).shadowRoot;
        if (!root) return;
        [...root.querySelectorAll('.org-node')].forEach((node, n) => {
          const nr = node.getBoundingClientRect();
          if (nr.width === 0) { problems.push(`${id} node ${n}: 0-width card`); return; }
          const parts = ['.org-avatar', '.org-avatar-placeholder', '.org-node-name', '.org-node-title'];
          parts.forEach(sel => {
            const el = node.querySelector(sel) as HTMLElement | null;
            if (!el) return;
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) {
              problems.push(`${id} node ${n} ${sel}: zero size`);
              return;
            }
            if (r.left < nr.left - 1 || r.right > nr.right + 1
              || r.top < nr.top - 1 || r.bottom > nr.bottom + 1) {
              problems.push(`${id} node ${n} ${sel}: escapes the node card`);
            }
            if (sel.includes('avatar')) {
              if (Math.abs(r.width - r.height) > 1) {
                problems.push(`${id} node ${n}: avatar not square (${Math.round(r.width)}x${Math.round(r.height)})`);
              }
              if (r.width < 16 || r.width > 80) {
                problems.push(`${id} node ${n}: avatar sized ${Math.round(r.width)}px`);
              }
            }
          });
          // Name above title, never on top of it.
          const name = node.querySelector('.org-node-name');
          const title = node.querySelector('.org-node-title');
          if (name && title
            && title.getBoundingClientRect().top < name.getBoundingClientRect().bottom - 2) {
            problems.push(`${id} node ${n}: title overlaps name`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  // The collapse toggle is deliberately an absolutely-positioned round handle
  // straddling the card edge (bottom edge top-down, right edge left-right), so
  // it is checked for straddle geometry rather than containment.
  test('collapse toggle is a round handle centred on the card edge', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-org-chart').forEach((chart, i) => {
        const id = (chart as HTMLElement).id || `chart[${i}]`;
        const root = (chart as HTMLElement).shadowRoot;
        if (!root) return;
        const leftRight = chart.getAttribute('direction') === 'left-right';
        [...root.querySelectorAll('.org-node')].forEach((node, n) => {
          const toggle = node.querySelector('.org-toggle') as HTMLElement | null;
          if (!toggle) return;
          const nr = node.getBoundingClientRect();
          const tr = toggle.getBoundingClientRect();

          if (Math.abs(tr.width - tr.height) > 1) {
            problems.push(`${id} node ${n}: toggle not round (${Math.round(tr.width)}x${Math.round(tr.height)})`);
          }
          if (tr.width < 14 || tr.width > 32) {
            problems.push(`${id} node ${n}: toggle sized ${Math.round(tr.width)}px`);
          }
          if (leftRight) {
            const dy = (tr.top + tr.height / 2) - (nr.top + nr.height / 2);
            if (Math.abs(dy) > 1.5) {
              problems.push(`${id} node ${n}: toggle off the card's vertical centre by ${dy.toFixed(1)}px`);
            }
            if (tr.left < nr.right - tr.width || tr.left > nr.right) {
              problems.push(`${id} node ${n}: toggle does not straddle the right edge`);
            }
          } else {
            const dx = (tr.left + tr.width / 2) - (nr.left + nr.width / 2);
            if (Math.abs(dx) > 1.5) {
              problems.push(`${id} node ${n}: toggle off the card's horizontal centre by ${dx.toFixed(1)}px`);
            }
            if (tr.top < nr.bottom - tr.height || tr.top > nr.bottom) {
              problems.push(`${id} node ${n}: toggle does not straddle the bottom edge`);
            }
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('collapsing the root removes its subtree and expanding restores it', async ({ page }) => {
    const chart = page.locator('#chart-td');
    const measure = () => chart.evaluate(el => {
      const root = (el as HTMLElement).shadowRoot!;
      const wrapper = root.querySelector('.org-node-wrapper')!;
      const children = wrapper.querySelector(':scope > .org-children');
      return {
        nodes: root.querySelectorAll('.org-node').length,
        childrenHeight: children ? children.getBoundingClientRect().height : 0,
        hostHeight: el.getBoundingClientRect().height
      };
    });

    const expanded = await measure();
    expect(expanded.nodes).toBeGreaterThan(1);
    expect(expanded.childrenHeight).toBeGreaterThan(0);

    await chart.evaluate(el => {
      const toggle = (el as HTMLElement).shadowRoot!
        .querySelector('.org-node .org-toggle') as HTMLButtonElement;
      toggle.click();
    });
    await page.waitForTimeout(150);

    const collapsed = await measure();
    expect(collapsed.nodes).toBe(1);
    expect(collapsed.childrenHeight).toBe(0);
    expect(collapsed.hostHeight).toBeLessThan(expanded.hostHeight);

    await chart.evaluate(el => {
      const toggle = (el as HTMLElement).shadowRoot!
        .querySelector('.org-node .org-toggle') as HTMLButtonElement;
      toggle.click();
    });
    await page.waitForTimeout(150);

    const reexpanded = await measure();
    expect(reexpanded.nodes).toBe(expanded.nodes);
    expect(Math.abs(reexpanded.hostHeight - expanded.hostHeight)).toBeLessThanOrEqual(1);
  });
});

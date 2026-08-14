import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/empty-state/demo.html';

test.describe('Snice Empty State visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-empty-state'));
    await page.waitForFunction(() =>
      !!document.querySelector('snice-empty-state')?.shadowRoot?.querySelector('.empty-state__title'));
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  // Every empty state is a centred vertical stack: icon, title, description,
  // action. Each row must be horizontally centred on the container, stacked in
  // order without overlapping, and contained by the container box.
  test('content stacks in order, stays centred, and stays inside the container', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-empty-state').forEach((host, i) => {
        const root = (host as any).shadowRoot as ShadowRoot;
        const container = root.querySelector('[part="container"]') as HTMLElement | null;
        if (!container) { problems.push(`es[${i}]: no container`); return; }
        const cr = container.getBoundingClientRect();
        if (cr.width === 0 || cr.height === 0) { problems.push(`es[${i}]: container 0-size`); return; }

        const rows = ([
          ['icon', root.querySelector('.empty-state__icon-wrapper')],
          ['title', root.querySelector('.empty-state__title')],
          ['description', root.querySelector('.empty-state__description')],
          ['action', root.querySelector('.empty-state__action')]
        ] as [string, HTMLElement | null][])
          .filter(([, el]) => el && el.getBoundingClientRect().height > 0) as [string, HTMLElement][];

        let prevBottom = -Infinity;
        let prevName = '';
        rows.forEach(([name, el]) => {
          const r = el.getBoundingClientRect();
          if (r.left < cr.left - 1 || r.right > cr.right + 1
              || r.top < cr.top - 1 || r.bottom > cr.bottom + 1) {
            problems.push(`es[${i}]: ${name} escapes the container`);
          }
          const dx = (r.left + r.width / 2) - (cr.left + cr.width / 2);
          if (Math.abs(dx) > 1.5) {
            problems.push(`es[${i}]: ${name} off-centre by ${dx.toFixed(1)}px`);
          }
          if (r.top < prevBottom - 1) {
            problems.push(`es[${i}]: ${name} overlaps ${prevName}`);
          }
          prevBottom = r.bottom;
          prevName = name;
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  const measure = (page: import('@playwright/test').Page) => page.evaluate(() => {
    const out: Record<string, { icon: number; title: number }> = {};
    ['small', 'medium', 'large'].forEach(size => {
      const host = document.querySelector(`snice-empty-state[size="${size}"]`) as any;
      const root = host.shadowRoot as ShadowRoot;
      out[size] = {
        icon: root.querySelector('.empty-state__icon-wrapper')!.getBoundingClientRect().height,
        title: parseFloat(getComputedStyle(root.querySelector('.empty-state__title')!).fontSize)
      };
    });
    return out;
  });

  test('size ladder scales the title text', async ({ page }) => {
    const sizes = await measure(page);
    expect(sizes.medium.title).toBeGreaterThan(sizes.small.title);
    expect(sizes.large.title).toBeGreaterThan(sizes.medium.title);
  });

  // BUG: `size="large"` renders a SMALLER icon than `size="medium"` and is
  // pixel-identical to `size="small"` (54px vs medium's 64.8px halo). Every
  // `.empty-state--large` icon rule in snice-empty-state.css reads
  // `var(--snice-font-size-3xl, 5rem)` — the same token `--empty-state--small`
  // uses — so the 5rem fallback never applies once the theme defines
  // --snice-font-size-3xl (1.875rem) and large collapses to the small size.
  test.fixme('size ladder scales the icon', async ({ page }) => {
    const sizes = await measure(page);
    expect(sizes.medium.icon).toBeGreaterThan(sizes.small.icon);
    expect(sizes.large.icon).toBeGreaterThan(sizes.medium.icon);
  });
});

import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/pagination/visual.html';

test.describe('Snice Pagination visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-pagination'));
    await page.waitForFunction(() =>
      !!document.querySelector('snice-pagination')?.shadowRoot?.querySelector('.pagination-button'));
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('every control sits on one row with a uniform height and a 4px gap', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const expectedSize: Record<string, number> = { small: 28, medium: 32, large: 40 };
      document.querySelectorAll('snice-pagination').forEach((host: any, i) => {
        const nav = host.shadowRoot.querySelector('.pagination') as HTMLElement;
        const nr = nav.getBoundingClientRect();
        const controls = [...nav.querySelectorAll('.pagination-button, .pagination-ellipsis')] as HTMLElement[];
        if (controls.length < 3) { problems.push(`pagination[${i}]: only ${controls.length} controls`); return; }
        const rects = controls.map(c => c.getBoundingClientRect());

        // Single row: shared vertical centre.
        const centres = rects.map(r => Math.round(r.top + r.height / 2));
        if (Math.max(...centres) - Math.min(...centres) > 1) {
          problems.push(`pagination[${i}]: controls not on one baseline (${centres.join(',')})`);
        }

        // Uniform button height matching the size token.
        const size = host.getAttribute('size') ?? 'medium';
        const buttons = [...nav.querySelectorAll('.pagination-button')] as HTMLElement[];
        buttons.forEach((b, n) => {
          const r = b.getBoundingClientRect();
          if (Math.abs(r.height - expectedSize[size]) > 1) {
            problems.push(`pagination[${i}] button[${n}]: height ${Math.round(r.height)} != ${expectedSize[size]} for size=${size}`);
          }
          if (r.width < r.height - 1) {
            problems.push(`pagination[${i}] button[${n}]: ${Math.round(r.width)}px wide, narrower than tall`);
          }
        });

        // Consistent 4px gutters in document order, nothing overlapping.
        const ordered = [...rects].sort((a, b) => a.left - b.left);
        for (let n = 1; n < ordered.length; n++) {
          const gap = ordered[n].left - ordered[n - 1].right;
          if (gap < -0.5) problems.push(`pagination[${i}]: controls overlap at ${n}`);
          if (gap > 12) problems.push(`pagination[${i}]: ${gap.toFixed(1)}px gutter at ${n}`);
        }

        // Nothing overhangs the nav, and the nav matches its host.
        rects.forEach((r, n) => {
          if (r.left < nr.left - 0.5 || r.right > nr.right + 0.5) {
            problems.push(`pagination[${i}] control[${n}]: overhangs the nav`);
          }
        });
        const hr = host.getBoundingClientRect();
        if (nr.width > hr.width + 1) {
          problems.push(`pagination[${i}]: nav ${Math.round(nr.width)} wider than host ${Math.round(hr.width)}`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('exactly one page button is highlighted and it matches `current`', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-pagination').forEach((host: any, i) => {
        const active = [...host.shadowRoot.querySelectorAll('.pagination-button.active')] as HTMLElement[];
        if (active.length !== 1) {
          problems.push(`pagination[${i}]: ${active.length} active buttons`);
          return;
        }
        if (active[0].textContent!.trim() !== String(host.current)) {
          problems.push(`pagination[${i}]: active "${active[0].textContent!.trim()}" != current ${host.current}`);
        }
        // The highlight must fill the button, not sit inside it as a chip.
        const r = active[0].getBoundingClientRect();
        if (r.width < 20 || r.height < 20) {
          problems.push(`pagination[${i}]: active button collapsed to ${Math.round(r.width)}x${Math.round(r.height)}`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('rounded variant renders circular buttons, text variant drops the frames', async ({ page }) => {
    const measured = await page.evaluate(() => {
      const read = (variant: string) => {
        const host = document.querySelector(`snice-pagination[variant="${variant}"]`) as any;
        const btn = host.shadowRoot.querySelector('.pagination-page') as HTMLElement;
        const r = btn.getBoundingClientRect();
        const cs = getComputedStyle(btn);
        return { width: r.width, height: r.height, radius: cs.borderRadius, borderWidth: cs.borderTopWidth };
      };
      return { rounded: read('rounded'), text: read('text') };
    });

    // A 50% radius is only a circle when the box is square.
    expect(Math.abs(measured.rounded.width - measured.rounded.height)).toBeLessThanOrEqual(1);
    expect(measured.rounded.radius).toContain('50%');
    expect(measured.text.borderWidth).toBe('0px');
  });

  test('paging forward keeps the row geometry and moves the highlight', async ({ page }) => {
    const host = page.locator('#basic-pagination');
    const before = await host.evaluate((el: any) => {
      const nav = el.shadowRoot.querySelector('.pagination').getBoundingClientRect();
      return { current: el.current, top: Math.round(nav.top), height: Math.round(nav.height) };
    });

    await host.evaluate((el: any) => el.shadowRoot.querySelector('.pagination-next').click());
    await expect.poll(() => host.evaluate((el: any) => el.current)).toBe(before.current + 1);

    const after = await host.evaluate((el: any) => {
      const nav = el.shadowRoot.querySelector('.pagination').getBoundingClientRect();
      const active = el.shadowRoot.querySelector('.pagination-button.active') as HTMLElement;
      const ar = active.getBoundingClientRect();
      return {
        top: Math.round(nav.top),
        height: Math.round(nav.height),
        activeLabel: active.textContent!.trim(),
        activeInsideNav: ar.left >= nav.left - 0.5 && ar.right <= nav.right + 0.5
      };
    });

    expect(after.activeLabel).toBe(String(before.current + 1));
    expect(after.activeInsideNav).toBe(true);
    // Advancing must not resize or shift the control row.
    expect(after.height).toBe(before.height);
    expect(after.top).toBe(before.top);
  });
});

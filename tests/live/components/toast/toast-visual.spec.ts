import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/toast/visual.html';

test.describe('Snice Toast visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-toast'));
    await page.waitForTimeout(300);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('icon, message and close button share one centred row', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const toasts = [...document.querySelectorAll('.static-toast')] as any[];
      if (toasts.length === 0) problems.push('no static toasts');

      toasts.forEach((t, i) => {
        const sr = t.shadowRoot;
        const base = sr?.querySelector('.toast') as HTMLElement | null;
        const content = sr?.querySelector('.toast-content') as HTMLElement | null;
        if (!base || !content) { problems.push(`toast[${i}]: missing base/content`); return; }
        const br = base.getBoundingClientRect();
        const cr = content.getBoundingClientRect();
        if (br.height < 24) { problems.push(`toast[${i}]: collapsed`); return; }

        const icon = sr.querySelector('.toast-icon') as HTMLElement | null;
        const close = sr.querySelector('.toast-close') as HTMLElement | null;

        if (icon) {
          const ir = icon.getBoundingClientRect();
          if (ir.width < 12 || ir.width > 32 || Math.abs(ir.width - ir.height) > 1) {
            problems.push(`toast[${i}]: icon ${Math.round(ir.width)}x${Math.round(ir.height)}`);
          }
          // Icon is centred on the toast, not pinned to the first text line.
          const dy = (ir.top + ir.height / 2) - (br.top + br.height / 2);
          if (Math.abs(dy) > 1.5) problems.push(`toast[${i}]: icon off-centre by ${Math.round(dy)}px`);
          if (cr.left < ir.right) problems.push(`toast[${i}]: message overlaps the icon`);
        }

        if (close) {
          const xr = close.getBoundingClientRect();
          if (xr.width < 12) problems.push(`toast[${i}]: close button ${Math.round(xr.width)}px`);
          const dy = (xr.top + xr.height / 2) - (br.top + br.height / 2);
          if (Math.abs(dy) > 1.5) problems.push(`toast[${i}]: close off-centre by ${Math.round(dy)}px`);
          if (cr.right > xr.left) problems.push(`toast[${i}]: message runs under the close button`);
          if (xr.right > br.right + 1) problems.push(`toast[${i}]: close button escapes the toast`);
        }

        // The wrapped message must stay inside the bubble.
        if (cr.top < br.top - 1 || cr.bottom > br.bottom + 1
            || cr.left < br.left - 1 || cr.right > br.right + 1) {
          problems.push(`toast[${i}]: message escapes the toast box`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('toasts dock to the requested viewport corner', async ({ page }) => {
    const positions = [
      'top-left', 'top-center', 'top-right',
      'bottom-left', 'bottom-center', 'bottom-right'
    ];

    for (const position of positions) {
      await page.evaluate(() => (window as any).clearAll());
      await page.waitForFunction(() =>
        [...document.querySelectorAll('snice-toast-container')]
          .every((c: any) => !c.shadowRoot?.querySelector('snice-toast')));
      await page.evaluate(pos => (window as any).showToast(pos), position);
      // Wait for the container to mount and the toast to finish animating in.
      await page.waitForFunction(() => {
        const containers = [...document.querySelectorAll('snice-toast-container')] as any[];
        return containers.some(c => {
          const t = c.shadowRoot?.querySelector('snice-toast');
          return !!t && t.getBoundingClientRect().height > 0;
        });
      });
      await page.waitForTimeout(300);

      const geo = await page.evaluate(() => {
        // Containers keep their toasts in their own shadow root, one container
        // per position.
        let toast: HTMLElement | null = null;
        document.querySelectorAll('snice-toast-container').forEach((c: any) => {
          const found = c.shadowRoot?.querySelector('snice-toast') as HTMLElement | null;
          if (found && found.getBoundingClientRect().height > 0) toast = found;
        });
        if (!toast) return null;
        const r = toast.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom,
          w: r.width, h: r.height, vw: window.innerWidth, vh: window.innerHeight };
      });

      expect(geo, `no toast rendered for ${position}`).not.toBeNull();
      const g = geo!;
      // A readable bubble, wholly on screen.
      expect(g.w, position).toBeGreaterThan(100);
      expect(g.h, position).toBeGreaterThan(24);
      expect(g.left, position).toBeGreaterThanOrEqual(0);
      expect(g.top, position).toBeGreaterThanOrEqual(0);
      expect(g.right, position).toBeLessThanOrEqual(g.vw);
      expect(g.bottom, position).toBeLessThanOrEqual(g.vh);

      // Docked to the named edge, within a normal gutter.
      const gutter = 40;
      if (position.startsWith('top')) {
        expect(g.top, position).toBeLessThan(gutter);
      } else {
        expect(g.vh - g.bottom, position).toBeLessThan(gutter);
      }
      if (position.endsWith('left')) {
        expect(g.left, position).toBeLessThan(gutter);
      } else if (position.endsWith('right')) {
        expect(g.vw - g.right, position).toBeLessThan(gutter);
      } else {
        const off = (g.left + g.w / 2) - g.vw / 2;
        expect(Math.abs(off), position).toBeLessThanOrEqual(2);
      }
    }
  });
});

import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/avatar-group/demo.html';

test.describe('Snice AvatarGroup visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => !!customElements.get('snice-avatar-group'));
    await page.waitForTimeout(300);
  });

  // BUG: declarative mode (child <snice-avatar> elements) renders nothing —
  // renderContent()'s slotted branch emits `<slot></slot>`, but the shadow root
  // ends up with a comment placeholder instead of a real slot element, so the
  // light-DOM avatars are never assigned. Both declarative groups in the
  // showcase collapse to 0x0, as do their unslotted <snice-avatar> children.
  test.fixme('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  // Same bug as above: the two declarative groups render zero chips.
  test.fixme('declarative <snice-avatar> children render as stacked chips', async ({ page }) => {
    const empties = await page.evaluate(() =>
      [...document.querySelectorAll('snice-avatar-group')]
        .filter(g => g.querySelectorAll('snice-avatar').length > 0)
        .filter(g => g.getBoundingClientRect().width === 0)
        .length);
    expect(empties).toBe(0);
  });

  test('stacked avatars are square, uniform and overlap by the configured amount', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-avatar-group').forEach((group, gi) => {
        const id = (group as HTMLElement).id || `group[${gi}]`;
        const root = (group as HTMLElement).shadowRoot;
        if (!root) { problems.push(`${id}: no shadow root`); return; }
        const items = [...root.querySelectorAll('.avatar-item')] as HTMLElement[];
        if (items.length === 0) return; // the intentionally empty group

        const hostRect = group.getBoundingClientRect();
        const rects = items.map(i => i.getBoundingClientRect());

        // Every stacked chip is a square of the same size, and big enough to see.
        const w0 = rects[0].width;
        rects.forEach((r, i) => {
          if (Math.abs(r.width - r.height) > 1) {
            problems.push(`${id} item ${i}: not square (${Math.round(r.width)}x${Math.round(r.height)})`);
          }
          if (r.width < 16) {
            problems.push(`${id} item ${i}: undersized (${Math.round(r.width)}px)`);
          }
          if (Math.abs(r.width - w0) > 1) {
            problems.push(`${id} item ${i}: width ${Math.round(r.width)} != first ${Math.round(w0)}`);
          }
          // Baseline alignment: all chips share a top edge.
          if (Math.abs(r.top - rects[0].top) > 1) {
            problems.push(`${id} item ${i}: top ${Math.round(r.top)} != first ${Math.round(rects[0].top)}`);
          }
          // Containment inside the host box.
          if (r.left < hostRect.left - 1 || r.right > hostRect.right + 1) {
            problems.push(`${id} item ${i}: escapes host horizontally`);
          }
        });

        // Consecutive chips overlap by exactly the `overlap` px (default 8).
        const overlap = Number((group as any).overlap ?? 8);
        for (let i = 1; i < rects.length; i++) {
          const seam = rects[i - 1].right - rects[i].left;
          if (Math.abs(seam - overlap) > 1.5) {
            problems.push(`${id} seam ${i}: overlap ${seam.toFixed(1)} != ${overlap}`);
          }
        }

        // `max` caps the visible chips; an overflow badge may add exactly one.
        const max = Number((group as any).max ?? 5);
        const overflow = root.querySelectorAll('.avatar-overflow').length;
        if (items.length - overflow > max) {
          problems.push(`${id}: ${items.length - overflow} avatars shown for max=${max}`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});

import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/tabs/visual.html';

test.describe('Snice Tabs visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-tabs'));
    await page.waitForFunction(() => {
      const groups = [...document.querySelectorAll('snice-tabs')];
      return groups.length > 0 && groups.every(g => !!(g as any).shadowRoot?.querySelector('.tabs__indicator'));
    });
    // Indicator slides with a 320ms spring.
    await page.waitForTimeout(600);
  });

  // BUG: `placement="start"`/`"end"` groups given a fixed host height overflow
  // it. `.tabs` never adopts the host height and `.tabs__panels` is
  // `min-height: 12.5rem` + `padding: 1rem` in the default content-box, so the
  // panels area is always at least 232px: the two 200px-tall vertical demos
  // render 232px of shadow content that spills 32px below the host box.
  test.fixme('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  // Exactly one panel is visible per tab group, and the panels area must be
  // laid out on the correct side of the nav for the placement.
  test('one panel is visible and the panels area sits opposite the nav', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-tabs').forEach((group, i) => {
        const root = (group as any).shadowRoot as ShadowRoot;
        const nav = root.querySelector('.tabs__nav')!.getBoundingClientRect();
        const area = root.querySelector('.tabs__panels')!.getBoundingClientRect();
        const gr = group.getBoundingClientRect();
        const placement = group.getAttribute('placement') || 'top';
        const panels = [...group.querySelectorAll('snice-tab-panel')] as HTMLElement[];
        const visible = panels.filter(p => p.getBoundingClientRect().height > 0
          && getComputedStyle(p).display !== 'none');
        if (visible.length !== 1) {
          problems.push(`tabs[${i}] (${placement}): ${visible.length} visible panels`);
          return;
        }
        if (area.left < gr.left - 1 || area.right > gr.right + 1) {
          problems.push(`tabs[${i}]: panels area escapes the group horizontally`);
        }
        if (area.width < 50 || area.height < 50) {
          problems.push(`tabs[${i}]: panels area ${Math.round(area.width)}x${Math.round(area.height)}`);
        }
        const ok =
          placement === 'top' ? area.top >= nav.bottom - 1 :
          placement === 'bottom' ? area.bottom <= nav.top + 1 :
          placement === 'start' ? area.left >= nav.right - 1 :
          /* end */ area.right <= nav.left + 1;
        if (!ok) problems.push(`tabs[${i}]: panels area is on the wrong side for placement=${placement}`);
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  // BUG: `snice-tab-panel`'s `:host { width: 100% }` keeps the browser default
  // `box-sizing: content-box`, so any padding a consumer puts on the panel (as
  // this showcase does: `snice-tab-panel { padding: 1rem }`) is ADDED to the
  // full container width. Each visible panel ends up 32px wider than the
  // `.tabs__panels` content box, shifted right, with its right padding clipped
  // away by that container's `overflow: hidden`.
  test.fixme('visible panel fits inside the panels container', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-tabs').forEach((group, i) => {
        const root = (group as any).shadowRoot as ShadowRoot;
        const container = root.querySelector('.tabs__panels') as HTMLElement;
        const cs = getComputedStyle(container);
        const cr = container.getBoundingClientRect();
        const inner = {
          left: cr.left + parseFloat(cs.paddingLeft),
          right: cr.right - parseFloat(cs.paddingRight)
        };
        const panel = ([...group.querySelectorAll('snice-tab-panel')] as HTMLElement[])
          .find(p => p.getBoundingClientRect().height > 0);
        if (!panel) return;
        const pr = panel.getBoundingClientRect();
        if (pr.left < inner.left - 1 || pr.right > inner.right + 1) {
          problems.push(`tabs[${i}]: panel ${Math.round(pr.left)}..${Math.round(pr.right)}`
            + ` outside padded area ${Math.round(inner.left)}..${Math.round(inner.right)}`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  // The active indicator must track the selected tab: for horizontal
  // placements it matches the tab's width and x-span; for vertical ones its
  // height and y-span.
  test('active indicator aligns with the selected tab', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-tabs').forEach((group, i) => {
        const root = (group as any).shadowRoot as ShadowRoot;
        const indicator = root.querySelector('.tabs__indicator') as HTMLElement;
        const tabs = [...group.querySelectorAll('snice-tab')] as HTMLElement[];
        const selected = Number(group.getAttribute('selected') || 0);
        const active = tabs[selected];
        if (!active) { problems.push(`tabs[${i}]: no tab at index ${selected}`); return; }
        const ar = active.getBoundingClientRect();
        const ir = indicator.getBoundingClientRect();
        const placement = group.getAttribute('placement') || 'top';
        if (placement === 'top' || placement === 'bottom') {
          if (Math.abs(ir.width - ar.width) > 1.5) {
            problems.push(`tabs[${i}]: indicator width ${ir.width.toFixed(1)} vs tab ${ar.width.toFixed(1)}`);
          }
          if (Math.abs(ir.left - ar.left) > 1.5) {
            problems.push(`tabs[${i}]: indicator x ${ir.left.toFixed(1)} vs tab ${ar.left.toFixed(1)}`);
          }
        } else {
          if (Math.abs(ir.height - ar.height) > 1.5) {
            problems.push(`tabs[${i}]: indicator height ${ir.height.toFixed(1)} vs tab ${ar.height.toFixed(1)}`);
          }
          if (Math.abs(ir.top - ar.top) > 1.5) {
            problems.push(`tabs[${i}]: indicator y ${ir.top.toFixed(1)} vs tab ${ar.top.toFixed(1)}`);
          }
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  // Clicking a tab must move the indicator onto it and swap in that panel.
  test('clicking a tab moves the indicator and swaps the panel', async ({ page }) => {
    const group = page.locator('snice-tabs').first();
    await group.locator('snice-tab').nth(2).click();
    await page.waitForTimeout(600); // indicator spring settles

    const state = await page.evaluate(() => {
      const g = document.querySelector('snice-tabs') as any;
      const root = g.shadowRoot as ShadowRoot;
      const tab = g.querySelectorAll('snice-tab')[2] as HTMLElement;
      const ir = root.querySelector('.tabs__indicator')!.getBoundingClientRect();
      const tr = tab.getBoundingClientRect();
      const panels = [...g.querySelectorAll('snice-tab-panel')] as HTMLElement[];
      const visible = panels
        .map((p, i) => ({ i, r: p.getBoundingClientRect(), text: p.textContent?.trim() }))
        .filter(p => p.r.height > 0);
      return {
        dx: ir.left - tr.left,
        dw: ir.width - tr.width,
        visibleCount: visible.length,
        visibleIndex: visible[0]?.i,
        visibleText: visible[0]?.text
      };
    });

    expect(Math.abs(state.dx)).toBeLessThanOrEqual(1.5);
    expect(Math.abs(state.dw)).toBeLessThanOrEqual(1.5);
    expect(state.visibleCount).toBe(1);
    expect(state.visibleIndex).toBe(2);
    expect(state.visibleText).toBe('Content for Tab 3');
  });
});

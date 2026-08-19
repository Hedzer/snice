import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/spotlight/visual.html';

test.describe('Snice Spotlight visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('an idle tour paints nothing and leaves no portal behind', async ({ page }) => {
    const state = await page.evaluate(() => ({
      portals: document.querySelectorAll('[data-snice-spotlight-portal]').length,
      hostBoxes: [...document.querySelectorAll('snice-spotlight')]
        .map(el => el.getBoundingClientRect().height)
    }));
    expect(state.portals).toBe(0);
    expect(state.hostBoxes.length).toBeGreaterThan(0);
    for (const h of state.hostBoxes) expect(h).toBe(0);
  });

  test('starting a tour dims the page and cuts out the target with even padding', async ({ page }) => {
    await page.evaluate(() => (document.getElementById('tour-basic') as any).start());
    await page.waitForTimeout(500);

    const geo = await page.evaluate(() => {
      const portal = document.querySelector('[data-snice-spotlight-portal]')!;
      const rect = (s: string) => portal.querySelector(s)!.getBoundingClientRect().toJSON();
      return {
        backdrop: rect('.backdrop'),
        cutout: rect('.cutout'),
        popover: rect('.popover'),
        target: document.getElementById('target-1')!.getBoundingClientRect().toJSON(),
        step: portal.querySelector('.step-indicator')!.textContent,
        title: portal.querySelector('.popover-title')!.textContent,
        viewport: { w: window.innerWidth, h: window.innerHeight }
      };
    });

    // The backdrop covers the whole viewport.
    expect(Math.round(geo.backdrop.width)).toBe(geo.viewport.w);
    expect(Math.round(geo.backdrop.height)).toBe(geo.viewport.h);

    // The cutout hugs the target with the same inset on all four sides.
    const insets = [
      geo.target.left - geo.cutout.left,
      geo.cutout.right - geo.target.right,
      geo.target.top - geo.cutout.top,
      geo.cutout.bottom - geo.target.bottom
    ];
    for (const inset of insets) expect(inset).toBeGreaterThanOrEqual(0);
    expect(Math.max(...insets) - Math.min(...insets)).toBeLessThanOrEqual(1);

    // The popover is fully on screen and clear of the highlighted target.
    expect(geo.popover.width).toBeGreaterThan(150);
    expect(geo.popover.height).toBeGreaterThan(60);
    expect(geo.popover.left).toBeGreaterThanOrEqual(-1);
    expect(geo.popover.top).toBeGreaterThanOrEqual(-1);
    expect(geo.popover.right).toBeLessThanOrEqual(geo.viewport.w + 1);
    expect(geo.popover.bottom).toBeLessThanOrEqual(geo.viewport.h + 1);
    const overlapsX = geo.popover.right > geo.cutout.left + 1 && geo.cutout.right > geo.popover.left + 1;
    const overlapsY = geo.popover.bottom > geo.cutout.top + 1 && geo.cutout.bottom > geo.popover.top + 1;
    expect(overlapsX && overlapsY).toBe(false);

    expect(geo.step!.trim()).toBe('1 / 3');
    expect(geo.title!.trim()).toBe('First Step');
  });

  test('popover title, description and footer stack inside the card', async ({ page }) => {
    await page.evaluate(() => (document.getElementById('tour-basic') as any).start());
    await page.waitForTimeout(500);

    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const portal = document.querySelector('[data-snice-spotlight-portal]')!;
      const pop = portal.querySelector('.popover') as HTMLElement;
      const pr = pop.getBoundingClientRect();
      const parts = ['.popover-title', '.popover-description', '.popover-footer']
        .map(s => pop.querySelector(s) as HTMLElement);
      let prevBottom = pr.top - 1;
      parts.forEach((el, i) => {
        if (!el) { problems.push(`missing part ${i}`); return; }
        const r = el.getBoundingClientRect();
        if (r.left < pr.left - 1 || r.right > pr.right + 1
            || r.top < pr.top - 1 || r.bottom > pr.bottom + 1) {
          problems.push(`part[${i}] ${el.className} escapes the popover`);
        }
        if (r.top < prevBottom - 1) problems.push(`part[${i}] ${el.className} overlaps the part above`);
        prevBottom = r.bottom;
      });

      const footer = pop.querySelector('.popover-footer') as HTMLElement;
      const fr = footer.getBoundingClientRect();
      const indicator = footer.querySelector('.step-indicator')!.getBoundingClientRect();
      const buttons = [...footer.querySelectorAll('button')] as HTMLElement[];
      if (buttons.length === 0) problems.push('no footer buttons');
      buttons.forEach((btn, i) => {
        const br = btn.getBoundingClientRect();
        if (br.width < 20 || br.height < 16) {
          problems.push(`button[${i}]: ${Math.round(br.width)}x${Math.round(br.height)} is too small`);
        }
        if (br.left < indicator.right - 0.5) problems.push(`button[${i}]: overlaps the step indicator`);
        if (br.right > fr.right + 1) problems.push(`button[${i}]: escapes the footer`);
        buttons.slice(i + 1).forEach((other, j) => {
          const or = other.getBoundingClientRect();
          if (br.right > or.left + 0.5 && or.right > br.left + 0.5) {
            problems.push(`buttons ${i}/${i + 1 + j} overlap`);
          }
        });
      });
      // Actions hug the right edge of the footer.
      const last = buttons[buttons.length - 1].getBoundingClientRect();
      if (fr.right - last.right > 2) {
        problems.push(`actions not right-aligned (${Math.round(fr.right - last.right)}px inset)`);
      }
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('each step places the popover on the side its position asks for', async ({ page }) => {
    const sides = ['top', 'bottom', 'left', 'right'];
    for (let i = 0; i < sides.length; i++) {
      await page.evaluate(idx => (document.getElementById('tour-positions') as any).goToStep(idx), i);
      await page.waitForTimeout(450);

      const geo = await page.evaluate(() => {
        const portal = document.querySelector('[data-snice-spotlight-portal]')!;
        return {
          cutout: portal.querySelector('.cutout')!.getBoundingClientRect().toJSON(),
          pop: portal.querySelector('.popover')!.getBoundingClientRect().toJSON(),
          viewport: { w: window.innerWidth, h: window.innerHeight }
        };
      });

      const side = sides[i];
      if (side === 'top') expect(geo.pop.bottom, side).toBeLessThanOrEqual(geo.cutout.top + 1);
      if (side === 'bottom') expect(geo.pop.top, side).toBeGreaterThanOrEqual(geo.cutout.bottom - 1);
      if (side === 'left') expect(geo.pop.right, side).toBeLessThanOrEqual(geo.cutout.left + 1);
      if (side === 'right') expect(geo.pop.left, side).toBeGreaterThanOrEqual(geo.cutout.right - 1);

      expect(geo.pop.left, `${side} on-screen left`).toBeGreaterThanOrEqual(-1);
      expect(geo.pop.right, `${side} on-screen right`).toBeLessThanOrEqual(geo.viewport.w + 1);
      expect(geo.pop.top, `${side} on-screen top`).toBeGreaterThanOrEqual(-1);
      expect(geo.pop.bottom, `${side} on-screen bottom`).toBeLessThanOrEqual(geo.viewport.h + 1);
    }
  });

  test('ending a tour removes the overlay entirely', async ({ page }) => {
    await page.evaluate(() => (document.getElementById('tour-basic') as any).start());
    await page.waitForTimeout(400);
    expect(await page.locator('[data-snice-spotlight-portal]').count()).toBe(1);

    await page.evaluate(() => (document.getElementById('tour-basic') as any).end());
    await page.waitForTimeout(300);
    expect(await page.locator('[data-snice-spotlight-portal]').count()).toBe(0);
    expect(await page.evaluate(() =>
      document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  });
});

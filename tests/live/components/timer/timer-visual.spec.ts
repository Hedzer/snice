import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/timer/demo.html';

test.describe('Snice Timer visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('display and control row are centred in the card and stay inside it', async ({ page }) => {
    const result = await page.evaluate(() => {
      const problems: string[] = [];
      const timers = [...document.querySelectorAll('snice-timer')] as any[];
      if (!timers.length) problems.push('no snice-timer on page');

      timers.forEach((host, i) => {
        const root = host.shadowRoot;
        const card = root?.querySelector('.timer-container') as HTMLElement | null;
        const display = root?.querySelector('.timer-display') as HTMLElement | null;
        const controls = root?.querySelector('.timer-controls') as HTMLElement | null;
        if (!card || !display || !controls) { problems.push(`timer[${i}]: missing card parts`); return; }
        const cr = card.getBoundingClientRect();
        const dr = display.getBoundingClientRect();
        const kr = controls.getBoundingClientRect();

        [[dr, 'display'], [kr, 'controls']].forEach(([r, name]: any) => {
          if (r.left < cr.left - 1 || r.right > cr.right + 1
              || r.top < cr.top - 1 || r.bottom > cr.bottom + 1) {
            problems.push(`timer[${i}]: ${name} escapes the card`);
          }
          const dx = (r.left + r.width / 2) - (cr.left + cr.width / 2);
          if (Math.abs(dx) > 1) {
            problems.push(`timer[${i}]: ${name} off horizontal centre by ${dx.toFixed(1)}px`);
          }
        });
        if (dr.bottom > kr.top + 1) problems.push(`timer[${i}]: display overlaps the controls`);
      });
      return problems;
    });
    expect(result).toEqual([]);
  });

  test('control buttons are equal circles with centred icons', async ({ page }) => {
    const result = await page.evaluate(() => {
      const problems: string[] = [];
      ([...document.querySelectorAll('snice-timer')] as any[]).forEach((host, i) => {
        const controls = host.shadowRoot?.querySelector('.timer-controls') as HTMLElement | null;
        if (!controls) return;
        const kr = controls.getBoundingClientRect();
        const buttons = [...controls.querySelectorAll('.timer-btn')] as HTMLElement[];
        if (!buttons.length) { problems.push(`timer[${i}]: no control buttons`); return; }

        const sizes = buttons.map(b => Math.round(b.getBoundingClientRect().width));
        if (Math.max(...sizes) - Math.min(...sizes) > 1) {
          problems.push(`timer[${i}]: unequal button widths ${sizes.join(',')}`);
        }
        buttons.forEach((btn, b) => {
          const r = btn.getBoundingClientRect();
          if (Math.abs(r.width - r.height) > 1) {
            problems.push(`timer[${i}] btn[${b}]: not a circle (${Math.round(r.width)}x${Math.round(r.height)})`);
          }
          if (r.width < 32) problems.push(`timer[${i}] btn[${b}]: only ${Math.round(r.width)}px wide`);
          if (r.top < kr.top - 1 || r.bottom > kr.bottom + 1
              || r.left < kr.left - 1 || r.right > kr.right + 1) {
            problems.push(`timer[${i}] btn[${b}]: escapes the control row`);
          }
          const icon = btn.querySelector('svg');
          if (icon) {
            const ir = icon.getBoundingClientRect();
            if (ir.width < 8 || ir.width > r.width || ir.height > r.height) {
              problems.push(`timer[${i}] btn[${b}]: icon ${Math.round(ir.width)}x${Math.round(ir.height)}`
                + ` in a ${Math.round(r.width)}px button`);
            }
            const dx = (ir.left + ir.width / 2) - (r.left + r.width / 2);
            const dy = (ir.top + ir.height / 2) - (r.top + r.height / 2);
            if (Math.abs(dx) > 1.5 || Math.abs(dy) > 1.5) {
              problems.push(`timer[${i}] btn[${b}]: icon off-centre by (${dx.toFixed(1)}, ${dy.toFixed(1)})`);
            }
          }
        });
        // Buttons must sit on one line, evenly gapped, never overlapping.
        for (let b = 1; b < buttons.length; b++) {
          const prev = buttons[b - 1].getBoundingClientRect();
          const cur = buttons[b].getBoundingClientRect();
          if (cur.left < prev.right - 0.5) problems.push(`timer[${i}] btn[${b}]: overlaps its neighbour`);
          if (Math.abs(cur.top - prev.top) > 1) problems.push(`timer[${i}] btn[${b}]: not on the control baseline`);
        }
      });
      return problems;
    });
    expect(result).toEqual([]);
  });

  test('running a stopwatch does not reflow the card', async ({ page }) => {
    const timer = page.locator('snice-timer[mode="stopwatch"]').first();
    const cardBox = () => page.evaluate(() => {
      const host = document.querySelector('snice-timer[mode="stopwatch"]') as any;
      const card = host.shadowRoot.querySelector('.timer-container').getBoundingClientRect();
      const display = host.shadowRoot.querySelector('.timer-display');
      return { width: card.width, height: card.height, text: display.textContent!.trim(),
        displayWidth: display.getBoundingClientRect().width };
    });

    const before = await cardBox();
    await timer.locator('.timer-btn').first().click();
    await page.waitForTimeout(1400);
    const after = await cardBox();

    expect(after.text).not.toBe(before.text);
    // Tabular numerals + min-width keep the card geometry stable while running.
    expect(Math.abs(after.width - before.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(after.height - before.height)).toBeLessThanOrEqual(1);
    expect(Math.abs(after.displayWidth - before.displayWidth)).toBeLessThanOrEqual(1);
  });
});

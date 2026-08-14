import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/card/demo.html';

test.describe('Snice Card visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-card'));
    await page.waitForTimeout(300);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('image, header, body and footer stack in order without overlapping', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-card').forEach((card, i) => {
        const root = (card as HTMLElement).shadowRoot;
        if (!root) { problems.push(`card[${i}]: no shadow root`); return; }
        const base = root.querySelector('.card') as HTMLElement | null;
        if (!base) { problems.push(`card[${i}]: no .card`); return; }
        const baseRect = base.getBoundingClientRect();
        if (baseRect.height === 0) return; // empty edge-case card

        const order = ['.card-image-slot', '.card-header', '.card-body', '.card-footer'];
        const visible = order
          .map(sel => ({ sel, el: root.querySelector(sel) as HTMLElement | null }))
          .filter(s => s.el && !s.el.hidden && s.el.getBoundingClientRect().height > 0)
          .map(s => ({ sel: s.sel, rect: s.el!.getBoundingClientRect() }));

        visible.forEach(({ sel, rect }) => {
          // Every section lives inside the card box.
          if (rect.top < baseRect.top - 1 || rect.bottom > baseRect.bottom + 1
            || rect.left < baseRect.left - 1 || rect.right > baseRect.right + 1) {
            problems.push(`card[${i}] ${sel}: escapes the card box`);
          }
        });

        // Sections stack top-to-bottom in slot order, never overlapping.
        for (let s = 1; s < visible.length; s++) {
          if (visible[s].rect.top < visible[s - 1].rect.bottom - 1) {
            problems.push(
              `card[${i}]: ${visible[s].sel} (top ${Math.round(visible[s].rect.top)}) overlaps `
              + `${visible[s - 1].sel} (bottom ${Math.round(visible[s - 1].rect.bottom)})`);
          }
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('slotted body content sits inside the card padding box', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-card').forEach((card, i) => {
        const body = (card as HTMLElement).shadowRoot?.querySelector('.card-body');
        if (!body) return;
        const bodyRect = body.getBoundingClientRect();
        if (bodyRect.height === 0) return;
        const slotted = [...card.children].filter(
          c => !c.hasAttribute('slot')) as HTMLElement[];
        slotted.forEach((el, j) => {
          const r = el.getBoundingClientRect();
          if (r.width === 0 && r.height === 0) return;
          if (r.left < bodyRect.left - 1 || r.right > bodyRect.right + 1
            || r.top < bodyRect.top - 1 || r.bottom > bodyRect.bottom + 1) {
            problems.push(
              `card[${i}] child ${j} <${el.tagName.toLowerCase()}> spills the body box`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('header and footer regions collapse when their slot is empty', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-card').forEach((card, i) => {
        const root = (card as HTMLElement).shadowRoot;
        if (!root) return;
        (['header', 'footer'] as const).forEach(name => {
          const region = root.querySelector(`.card-${name}`) as HTMLElement | null;
          if (!region) return;
          const hasContent = card.querySelector(`[slot="${name}"]`) !== null;
          const h = region.getBoundingClientRect().height;
          if (!hasContent && h > 0) {
            problems.push(`card[${i}]: empty ${name} still occupies ${Math.round(h)}px`);
          }
          if (hasContent && h === 0) {
            problems.push(`card[${i}]: filled ${name} collapsed to 0px`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});

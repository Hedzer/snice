import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/recipe/visual.html';

test.describe('Snice Recipe visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-recipe'));
    await page.waitForFunction(() =>
      !!document.querySelector('#r-full')?.shadowRoot?.querySelector('.recipe__ingredient'));
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('ingredient rows and step rows tile without overlap inside their lists', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const recipes = [...document.querySelectorAll('snice-recipe')] as HTMLElement[];
      if (recipes.length === 0) problems.push('no snice-recipe on the page');

      recipes.forEach((recipe, ri) => {
        const root = recipe.shadowRoot!;
        const id = `recipe[${ri}](#${recipe.id})`;

        const ingredients = [...root.querySelectorAll('.recipe__ingredient')] as HTMLElement[];
        const list = root.querySelector('.recipe__ingredients-list') as HTMLElement | null;
        if (list && ingredients.length) {
          const lr = list.getBoundingClientRect();
          ingredients.forEach((li, i) => {
            const r = li.getBoundingClientRect();
            if (r.height < 12) problems.push(`${id} ingredient ${i}: ${Math.round(r.height)}px tall`);
            if (r.left < lr.left - 1 || r.right > lr.right + 1) {
              problems.push(`${id} ingredient ${i}: escapes the list`);
            }
            if (i > 0) {
              const prev = ingredients[i - 1].getBoundingClientRect();
              if (r.top < prev.bottom - 1) {
                problems.push(`${id} ingredient ${i}: overlaps the row above`);
              }
            }
            // checkbox | amount | name run left-to-right on one centre line.
            const parts = ['.recipe__ingredient-checkbox', '.recipe__ingredient-amount',
              '.recipe__ingredient-text'].map(s => li.querySelector(s) as HTMLElement | null);
            const rects = parts.filter(Boolean).map(p => p!.getBoundingClientRect());
            for (let pi = 0; pi < rects.length; pi++) {
              const pr = rects[pi];
              if (pr.left < r.left - 1 || pr.right > r.right + 1
                  || pr.top < r.top - 1 || pr.bottom > r.bottom + 1) {
                problems.push(`${id} ingredient ${i}: part ${pi} escapes its row`);
              }
              if (pi > 0 && pr.left < rects[pi - 1].right - 1) {
                problems.push(`${id} ingredient ${i}: part ${pi} overlaps part ${pi - 1}`);
              }
            }
            const box = parts[0];
            if (box) {
              const cbr = box.getBoundingClientRect();
              if (cbr.width < 8 || Math.abs(cbr.width - cbr.height) > 2) {
                problems.push(`${id} ingredient ${i}: checkbox ${Math.round(cbr.width)}x${Math.round(cbr.height)}`);
              }
            }
          });
        }

        const steps = [...root.querySelectorAll('.recipe__step')] as HTMLElement[];
        steps.forEach((step, i) => {
          const r = step.getBoundingClientRect();
          const num = step.querySelector('.recipe__step-number') as HTMLElement | null;
          const body = step.querySelector('.recipe__step-body') as HTMLElement | null;
          if (!num || !body) { problems.push(`${id} step ${i}: missing parts`); return; }
          const nr = num.getBoundingClientRect();
          const br = body.getBoundingClientRect();

          if (nr.width < 14 || nr.width > 56) {
            problems.push(`${id} step ${i}: number badge ${Math.round(nr.width)}px`);
          }
          if (Math.abs(nr.width - nr.height) > 2) {
            problems.push(`${id} step ${i}: number badge not square`);
          }
          if (br.left < nr.right - 1) problems.push(`${id} step ${i}: body overlaps the number badge`);
          if (br.right > r.right + 1 || br.bottom > r.bottom + 1 || nr.top < r.top - 1) {
            problems.push(`${id} step ${i}: content escapes the step row`);
          }
          if (i > 0) {
            const prev = steps[i - 1].getBoundingClientRect();
            if (r.top < prev.bottom - 1) problems.push(`${id} step ${i}: overlaps the step above`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('servings adjuster keeps -/count/+ on one line with equally sized buttons', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const adjusters = [...document.querySelectorAll('snice-recipe')]
        .map(r => r.shadowRoot!.querySelector('.recipe__servings-adjuster') as HTMLElement | null)
        .filter(Boolean) as HTMLElement[];
      if (adjusters.length === 0) problems.push('no servings adjuster on the page');

      adjusters.forEach((adj, i) => {
        const ar = adj.getBoundingClientRect();
        const btns = [...adj.querySelectorAll('.recipe__servings-btn')] as HTMLElement[];
        const count = adj.querySelector('.recipe__servings-count') as HTMLElement;
        if (btns.length !== 2 || !count) { problems.push(`adjuster[${i}]: malformed`); return; }

        const [minus, plus] = btns.map(b => b.getBoundingClientRect());
        const cr = count.getBoundingClientRect();

        if (Math.abs(minus.width - plus.width) > 1 || Math.abs(minus.height - plus.height) > 1) {
          problems.push(`adjuster[${i}]: -/+ buttons differ in size`);
        }
        if (minus.width < 16 || minus.height < 16) {
          problems.push(`adjuster[${i}]: buttons ${Math.round(minus.width)}x${Math.round(minus.height)}`);
        }
        if (cr.left < minus.right - 1 || plus.left < cr.right - 1) {
          problems.push(`adjuster[${i}]: count is not between the two buttons`);
        }
        const centres = [minus, cr, plus].map(r => r.top + r.height / 2);
        if (Math.max(...centres) - Math.min(...centres) > 1) {
          problems.push(`adjuster[${i}]: -/count/+ not on one centre line`);
        }
        [minus, cr, plus].forEach((r, ci) => {
          if (r.left < ar.left - 1 || r.right > ar.right + 1
              || r.top < ar.top - 1 || r.bottom > ar.bottom + 1) {
            problems.push(`adjuster[${i}]: child ${ci} escapes the adjuster`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('bumping servings rescales ingredient amounts without breaking row alignment', async ({ page }) => {
    const recipe = page.locator('#r-full');
    const before = await recipe.evaluate((el: any) => ({
      servings: el.shadowRoot.querySelector('.recipe__servings-count').textContent.trim(),
      amount: el.shadowRoot.querySelector('.recipe__ingredient-amount').textContent.trim()
    }));

    await recipe.locator('.recipe__servings-btn').nth(1).click();
    await page.waitForFunction(prev => {
      const el = document.querySelector('#r-full')!;
      return el.shadowRoot!.querySelector('.recipe__servings-count')!.textContent!.trim() !== prev;
    }, before.servings);
    await page.waitForTimeout(150);

    const after = await recipe.evaluate((el: any) => {
      const root = el.shadowRoot;
      const problems: string[] = [];
      const rows = [...root.querySelectorAll('.recipe__ingredient')] as HTMLElement[];
      rows.forEach((li, i) => {
        const r = li.getBoundingClientRect();
        const parts = ['.recipe__ingredient-checkbox', '.recipe__ingredient-amount',
          '.recipe__ingredient-text']
          .map(s => li.querySelector(s) as HTMLElement)
          .filter(Boolean)
          .map(p => p.getBoundingClientRect());
        for (let pi = 1; pi < parts.length; pi++) {
          if (parts[pi].left < parts[pi - 1].right - 1) {
            problems.push(`row ${i}: part ${pi} overlaps part ${pi - 1}`);
          }
        }
        parts.forEach((pr, pi) => {
          if (pr.right > r.right + 1 || pr.top < r.top - 1 || pr.bottom > r.bottom + 1) {
            problems.push(`row ${i}: part ${pi} escapes its row`);
          }
        });
      });
      return {
        servings: root.querySelector('.recipe__servings-count').textContent.trim(),
        amount: root.querySelector('.recipe__ingredient-amount').textContent.trim(),
        problems
      };
    });

    expect(Number(after.servings)).toBe(Number(before.servings) + 1);
    expect(after.amount).not.toBe(before.amount);
    expect(after.problems).toEqual([]);
  });

  test('the hero image fills the card width and honours its max height', async ({ page }) => {
    const hero = page.locator('#r-image').locator('.recipe__hero img');
    await hero.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => {
      const img = document.querySelector('#r-image')!
        .shadowRoot!.querySelector('.recipe__hero img') as HTMLImageElement | null;
      return !!img && img.complete && img.naturalWidth > 0;
    }, undefined, { timeout: 15_000 });

    const geo = await page.evaluate(() => {
      const host = document.querySelector('#r-image')!;
      const root = host.shadowRoot!;
      const frame = root.querySelector('.recipe__hero') as HTMLElement;
      const img = root.querySelector('.recipe__hero img') as HTMLImageElement;
      const container = root.querySelector('.recipe') as HTMLElement;
      const fr = frame.getBoundingClientRect();
      const ir = img.getBoundingClientRect();
      const cr = container.getBoundingClientRect();
      return {
        imgWidth: ir.width, frameWidth: fr.width, containerWidth: cr.width,
        imgHeight: ir.height,
        maxHeight: parseFloat(getComputedStyle(img).maxHeight),
        insideContainer: ir.left >= cr.left - 1 && ir.right <= cr.right + 1 && ir.top >= cr.top - 1
      };
    });

    expect(geo.imgHeight).toBeGreaterThan(50);
    expect(geo.imgWidth).toBeCloseTo(geo.frameWidth, 0);
    expect(geo.imgWidth).toBeCloseTo(geo.containerWidth, 0);
    expect(geo.imgHeight).toBeLessThanOrEqual(geo.maxHeight + 1);
    expect(geo.insideContainer).toBe(true);
  });
});

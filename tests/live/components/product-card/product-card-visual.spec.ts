import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/product-card/visual.html';

test.describe('Snice Product Card visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(400);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('gallery image fills its frame without spilling out of the card', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-product-card').forEach((host, i) => {
        const root = (host as HTMLElement).shadowRoot;
        const card = root?.querySelector('.product-card') as HTMLElement | null;
        const gallery = root?.querySelector('.product-card__gallery') as HTMLElement | null;
        if (!card) { problems.push(`card[${i}]: no .product-card`); return; }
        if (!gallery) return; // "no images" showcase
        const cr = card.getBoundingClientRect();
        const gr = gallery.getBoundingClientRect();

        if (gr.left < cr.left - 1 || gr.right > cr.right + 1
            || gr.top < cr.top - 1 || gr.bottom > cr.bottom + 1) {
          problems.push(`card[${i}]: gallery escapes the card box`);
        }

        const img = root!.querySelector('.product-card__gallery-image--active') as HTMLImageElement | null;
        if (!img) return;
        const ir = img.getBoundingClientRect();
        if (ir.width < 20 || ir.height < 20) {
          problems.push(`card[${i}]: image collapsed (${Math.round(ir.width)}x${Math.round(ir.height)})`);
        }
        // WebKit rounds the cover-fit image up to 1.2px past the frame
        // (400x301.2 in a 400x300 box); a real spill is several px.
        if (ir.width > gr.width + 2 || ir.height > gr.height + 2) {
          problems.push(`card[${i}]: image ${Math.round(ir.width)}x${Math.round(ir.height)}`
            + ` overflows its ${Math.round(gr.width)}x${Math.round(gr.height)} frame`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('vertical cards stack gallery above body, with body content contained', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-product-card').forEach((host, i) => {
        const root = (host as HTMLElement).shadowRoot;
        const card = root?.querySelector('.product-card--vertical') as HTMLElement | null;
        if (!card) return;
        const gallery = card.querySelector('.product-card__gallery') as HTMLElement | null;
        const body = card.querySelector('.product-card__body') as HTMLElement | null;
        if (!gallery || !body) return;
        const gr = gallery.getBoundingClientRect();
        const br = body.getBoundingClientRect();

        if (br.top < gr.bottom - 1) {
          problems.push(`card[${i}]: body top ${Math.round(br.top)} overlaps gallery bottom ${Math.round(gr.bottom)}`);
        }
        if (Math.abs(br.left - gr.left) > 1 || Math.abs(br.right - gr.right) > 1) {
          problems.push(`card[${i}]: body and gallery are not flush`
            + ` (body ${Math.round(br.left)}-${Math.round(br.right)},`
            + ` gallery ${Math.round(gr.left)}-${Math.round(gr.right)})`);
        }
        (body.querySelectorAll('.product-card__title, .product-card__rating, [part="price"], .product-card__price') as NodeListOf<HTMLElement>)
          .forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.width === 0) return;
            if (r.left < br.left - 1 || r.right > br.right + 1
                || r.top < br.top - 1 || r.bottom > br.bottom + 1) {
              problems.push(`card[${i}]: .${el.className.split(' ')[0]} escapes the card body`);
            }
          });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('rating stars render as a row of equally sized icons', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-product-card').forEach((host, i) => {
        const stars = [...((host as HTMLElement).shadowRoot
          ?.querySelectorAll('.product-card__star') ?? [])] as SVGElement[];
        if (stars.length === 0) return;
        if (stars.length !== 5) {
          problems.push(`card[${i}]: ${stars.length} stars, expected 5`);
          return;
        }
        const rects = stars.map(s => s.getBoundingClientRect());
        const sizes = rects.map(r => Math.round(r.width));
        if (Math.max(...sizes) - Math.min(...sizes) > 1) {
          problems.push(`card[${i}]: star widths differ ${sizes.join(',')}`);
        }
        if (rects[0].width < 8 || rects[0].height < 8) {
          problems.push(`card[${i}]: stars collapsed`
            + ` (${Math.round(rects[0].width)}x${Math.round(rects[0].height)})`);
        }
        const tops = rects.map(r => Math.round(r.top));
        if (Math.max(...tops) - Math.min(...tops) > 1) {
          problems.push(`card[${i}]: stars not on one line ${tops.join(',')}`);
        }
        for (let s = 1; s < rects.length; s++) {
          if (rects[s].left < rects[s - 1].right - 1) {
            problems.push(`card[${i}]: star ${s} overlaps star ${s - 1}`);
          }
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});

import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/carousel/demo.html';

test.describe('Snice Carousel visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-carousel'));
    await page.waitForFunction(() =>
      !!document.querySelector('snice-carousel')?.shadowRoot?.querySelector('.carousel__viewport'));
    // Autoplay carousels would move mid-measurement; stop them all up front.
    await page.evaluate(() => {
      document.querySelectorAll('snice-carousel').forEach((c: any) => {
        c.autoplay = false;
        c.pause?.();
      });
    });
    await page.waitForTimeout(400);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('the visible slides tile the viewport exactly at rest', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-carousel').forEach((car: any, i) => {
        const viewport = car.shadowRoot.querySelector('.carousel__viewport') as HTMLElement;
        const slides = [...car.children] as HTMLElement[];
        const spv = Math.min(car.slidesPerView, slides.length);
        const space = car.spaceBetween;
        const vr = viewport.getBoundingClientRect();
        const rects = slides.slice(0, spv).map(s => s.getBoundingClientRect());

        // Equal slide widths.
        const widths = rects.map(r => Math.round(r.width));
        if (Math.max(...widths) - Math.min(...widths) > 1) {
          problems.push(`carousel[${i}] spv=${spv}: uneven slide widths ${widths.join(',')}`);
        }
        // Declared space-between honoured between visible slides.
        for (let s = 1; s < rects.length; s++) {
          const gap = rects[s].left - rects[s - 1].right;
          if (Math.abs(gap - space) > 1.5) {
            problems.push(`carousel[${i}] gap ${s}: ${gap.toFixed(1)} != space-between ${space}`);
          }
        }
        // The visible run fills the viewport edge to edge.
        if (Math.abs(rects[0].left - vr.left) > 1) {
          problems.push(`carousel[${i}]: first slide left ${Math.round(rects[0].left)} != viewport ${Math.round(vr.left)}`);
        }
        if (Math.abs(rects[rects.length - 1].right - vr.right) > 1.5) {
          problems.push(`carousel[${i}]: last visible slide right ${Math.round(rects[rects.length - 1].right)} != viewport ${Math.round(vr.right)}`);
        }
        // Slides must never be taller/shorter than the viewport box.
        if (Math.abs(rects[0].height - vr.height) > 1) {
          problems.push(`carousel[${i}]: slide height ${Math.round(rects[0].height)} != viewport ${Math.round(vr.height)}`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  // BUG: with space-between > 0 the slide pitch is viewportWidth/spv +
  // space/spv while the container translate step is only viewportWidth/spv,
  // so every advance drifts the active slide right by space/spv px. Visible
  // as a progressively mis-cropped first column on the spaced carousels.
  test.fixme('advancing leaves the active slide flush with the viewport left edge', async ({ page }) => {
    const failures = await page.evaluate(async () => {
      const problems: string[] = [];
      const cars = [...document.querySelectorAll('snice-carousel')] as any[];
      cars.forEach(car => car.next());
      await new Promise(r => setTimeout(r, 500));
      cars.forEach((car, i) => {
        const viewport = car.shadowRoot.querySelector('.carousel__viewport') as HTMLElement;
        const active = car.children[car.activeIndex] as HTMLElement | undefined;
        if (!active) return;
        const delta = active.getBoundingClientRect().left - viewport.getBoundingClientRect().left;
        if (Math.abs(delta) > 1.5) {
          problems.push(`carousel[${i}] index ${car.activeIndex}: active slide off by ${delta.toFixed(1)}px`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('prev/next controls stay inside the viewport and pinned to its edges', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-carousel').forEach((car: any, i) => {
        const viewport = car.shadowRoot.querySelector('.carousel__viewport') as HTMLElement;
        const buttons = [...car.shadowRoot.querySelectorAll('.carousel__button')] as HTMLElement[];
        if (!buttons.length) return; // show-controls="false"
        const vr = viewport.getBoundingClientRect();
        buttons.forEach((btn, b) => {
          const r = btn.getBoundingClientRect();
          if (r.width < 20 || r.height < 20) {
            problems.push(`carousel[${i}] button[${b}]: ${Math.round(r.width)}x${Math.round(r.height)} too small`);
          }
          if (r.left < vr.left - 1 || r.right > vr.right + 1
              || r.top < vr.top - 1 || r.bottom > vr.bottom + 1) {
            problems.push(`carousel[${i}] button[${b}]: escapes the viewport`);
          }
        });
        // The two controls must sit on opposite sides.
        if (buttons.length === 2) {
          const [prev, next] = buttons.map(b => b.getBoundingClientRect());
          if (prev.left - vr.left > vr.width / 4 || vr.right - next.right > vr.width / 4) {
            problems.push(`carousel[${i}]: controls not pinned to the viewport edges`);
          }
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  // BUG: `.carousel__controls` is `top: 50%` of `.carousel`, which also
  // contains the indicator row (1rem margin + 8px dots). Whenever indicators
  // are shown the arrows sit ~12px below the centre of the slide viewport.
  test.fixme('prev/next controls are vertically centred on the slide viewport', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-carousel').forEach((car: any, i) => {
        const vr = car.shadowRoot.querySelector('.carousel__viewport').getBoundingClientRect();
        [...car.shadowRoot.querySelectorAll('.carousel__button')].forEach((btn: any, b) => {
          const r = btn.getBoundingClientRect();
          const dy = (r.top + r.height / 2) - (vr.top + vr.height / 2);
          if (Math.abs(dy) > 1.5) {
            problems.push(`carousel[${i}] button[${b}]: off centre by ${dy.toFixed(1)}px`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});

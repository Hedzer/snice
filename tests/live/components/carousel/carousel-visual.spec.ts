import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/carousel/visual.html';

test.describe('Snice Carousel visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-carousel'));
    await page.waitForFunction(() =>
      !!document.querySelector('snice-carousel')?.shadowRoot?.querySelector('.carousel__viewport'));
    // The fixture has no autoplay carousels; the settle beat is for the
    // initial active-index transform (lands at @ready) and the 300ms
    // translate transition on the spaced views.
    await page.waitForTimeout(400);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('the visible slides tile the viewport exactly at rest', async ({ page }) => {
    const failures = await page.evaluate(async () => {
      const problems: string[] = [];
      const cars = [...document.querySelectorAll('snice-carousel')] as any[];
      const transformOf = (car: any) =>
        car.shadowRoot.querySelector('.carousel__container')?.style.transform ?? null;
      // The authored active-index is re-applied at @ready — a beat after the
      // first paint. A measurement that lands before it sees slide 0, one
      // that lands after it sees the translated track: either races, so wait
      // for every track's transform to stop changing before measuring.
      for (let attempt = 0; attempt < 20; attempt++) {
        const before = cars.map(transformOf);
        await new Promise((r) => setTimeout(r, 50));
        if (cars.every((car, i) => transformOf(car) === before[i])) break;
      }
      cars.forEach((car, i) => {
        const viewport = car.shadowRoot.querySelector('.carousel__viewport') as HTMLElement;
        const slides = [...car.children] as HTMLElement[];
        const spv = Math.min(car.slidesPerView, slides.length);
        const space = car.spaceBetween;
        const vr = viewport.getBoundingClientRect();
        // The run the viewport actually shows, by box intersection — never a
        // literal slice from 0: the demo's active-index carousels show their
        // authored slide first.
        const visible = slides.filter((s) => {
          const r = s.getBoundingClientRect();
          return r.left < vr.right - 0.5 && r.right > vr.left + 0.5;
        });
        const rects = visible.map((s) => s.getBoundingClientRect());

        // The run starts at the slide the carousel claims to be on.
        if (visible[0] !== car.children[car.activeIndex]) {
          problems.push(`carousel[${i}]: visible run starts at slide ${slides.indexOf(visible[0])}, not activeIndex ${car.activeIndex}`);
        }
        // Equal slide widths.
        const widths = rects.map((r) => Math.round(r.width));
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
          problems.push(`carousel[${i}]: first visible slide left ${Math.round(rects[0].left)} != viewport ${Math.round(vr.left)}`);
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

  // The spaced views used to drift: the slide pitch is viewportWidth/spv +
  // space/spv while the container translate step was only viewportWidth/spv,
  // so every advance dragged the active slide right by space/spv px. The
  // translate now includes the gap share (`calc(-k·100/spv% − k·space/spv
  // px)`), so the active slide stays flush at any index.
  test('advancing leaves the active slide flush with the viewport left edge', async ({ page }) => {
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

  // The controls used to hang ~12px below the slides' centre: they were
  // floated at `top: 50%` of the whole container box, which includes the
  // indicator row. They now live INSIDE the viewport (which is position:
  // relative), so the dots cannot drag them down.
  test('prev/next controls are vertically centred on the slide viewport', async ({ page }) => {
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

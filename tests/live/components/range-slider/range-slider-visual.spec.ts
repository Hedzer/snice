import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/range-slider/visual.html';

test.describe('Snice Range Slider visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);
  });

  // BUG: vertical sliders paint outside their own layout box. The wrapper keeps
  // `padding: 0.75rem/0.25rem` under `box-sizing: content-box` while
  // `.range-slider--vertical .range-slider__wrapper { height: 100% }` resolves
  // that 100% against the host's 12.5rem, so the wrapper measures 216px inside a
  // 200px host — 16px of static, unclipped overflow on every vertical slider,
  // and 38px once `show-labels` adds the label column (wrapper 27x238 vs host
  // 27x200). Whatever follows a vertical slider can be overlapped by it.
  test.fixme('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('thumb centers sit at the fraction of the track their values imply', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const sliders = [...document.querySelectorAll('snice-range-slider')] as any[];
      if (sliders.length === 0) problems.push('no sliders rendered');

      sliders.forEach((slider, i) => {
        const root = slider.shadowRoot as ShadowRoot;
        const track = root.querySelector('.range-slider__track') as HTMLElement | null;
        const low = root.querySelector('.range-slider__thumb--low') as HTMLElement | null;
        const high = root.querySelector('.range-slider__thumb--high') as HTMLElement | null;
        if (!track || !low || !high) { problems.push(`slider[${i}]: missing track or thumbs`); return; }

        const vertical = slider.orientation === 'vertical';
        const tr = track.getBoundingClientRect();
        const span = vertical ? tr.height : tr.width;
        if (span < 20) { problems.push(`slider[${i}]: track only ${Math.round(span)}px long`); return; }

        const min = Number(slider.min), max = Number(slider.max);
        const range = max - min;
        const centerOf = (el: HTMLElement) => {
          const r = el.getBoundingClientRect();
          return vertical ? r.top + r.height / 2 : r.left + r.width / 2;
        };
        // Vertical sliders are anchored from the bottom.
        const expected = (v: number) => {
          const pct = range > 0 ? (v - min) / range : 0;
          return vertical ? tr.bottom - pct * span : tr.left + pct * span;
        };

        ([['low', low, Number(slider.valueLow)], ['high', high, Number(slider.valueHigh)]] as const)
          .forEach(([name, el, value]) => {
            const delta = centerOf(el) - expected(value);
            if (Math.abs(delta) > 1.5) {
              problems.push(`slider[${i}] ${name} thumb (value ${value}): ${Math.round(delta)}px off its track position`);
            }
          });

        // Thumbs keep their order: low never crosses past high.
        if (Number(slider.valueLow) < Number(slider.valueHigh)) {
          const lc = centerOf(low), hc = centerOf(high);
          const ordered = vertical ? lc > hc : lc < hc;
          if (!ordered) problems.push(`slider[${i}]: low thumb rendered past the high thumb`);
        }

        // Sane thumb size — a square hit target, not a collapsed or blown-up box.
        [['low', low], ['high', high]].forEach(([name, el]) => {
          const r = (el as HTMLElement).getBoundingClientRect();
          if (r.width < 10 || r.width > 40 || Math.abs(r.width - r.height) > 1) {
            problems.push(`slider[${i}] ${name} thumb: ${Math.round(r.width)}x${Math.round(r.height)}`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('the selected-range fill spans exactly from the low thumb to the high thumb', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      ([...document.querySelectorAll('snice-range-slider')] as any[]).forEach((slider, i) => {
        const root = slider.shadowRoot as ShadowRoot;
        const fill = root.querySelector('.range-slider__range') as HTMLElement | null;
        const track = root.querySelector('.range-slider__track') as HTMLElement | null;
        const low = root.querySelector('.range-slider__thumb--low') as HTMLElement | null;
        const high = root.querySelector('.range-slider__thumb--high') as HTMLElement | null;
        if (!fill || !track || !low || !high) return;

        const vertical = slider.orientation === 'vertical';
        const fr = fill.getBoundingClientRect();
        const tr = track.getBoundingClientRect();
        const mid = (el: HTMLElement) => {
          const r = el.getBoundingClientRect();
          return vertical ? r.top + r.height / 2 : r.left + r.width / 2;
        };
        const lo = mid(low), hi = mid(high);
        const fillStart = vertical ? fr.bottom : fr.left;
        const fillEnd = vertical ? fr.top : fr.right;
        const wantStart = vertical ? lo : lo;
        const wantEnd = vertical ? hi : hi;

        if (Math.abs(fillStart - wantStart) > 1.5) {
          problems.push(`slider[${i}]: fill starts ${Math.round(fillStart - wantStart)}px from the low thumb`);
        }
        if (Math.abs(fillEnd - wantEnd) > 1.5) {
          problems.push(`slider[${i}]: fill ends ${Math.round(fillEnd - wantEnd)}px from the high thumb`);
        }
        // The fill lies on the track, never outside it.
        if (fr.left < tr.left - 1 || fr.right > tr.right + 1
          || fr.top < tr.top - 1 || fr.bottom > tr.bottom + 1) {
          problems.push(`slider[${i}]: fill escapes the track`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('tooltips stay centered over their thumbs after dragging one', async ({ page }) => {
    const slider = page.locator('snice-range-slider[show-tooltip]:not([disabled])').first();
    const lowThumb = slider.locator('.range-slider__thumb--low');
    const box = (await lowThumb.boundingBox())!;
    const trackBox = (await slider.locator('.range-slider__track').boundingBox())!;

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(trackBox.x + trackBox.width * 0.4, box.y + box.height / 2, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(200);

    const failures = await slider.evaluate((host: any) => {
      const problems: string[] = [];
      const root = host.shadowRoot as ShadowRoot;
      const track = root.querySelector('.range-slider__track')!.getBoundingClientRect();
      const thumbs = [...root.querySelectorAll('.range-slider__thumb')] as HTMLElement[];

      thumbs.forEach((thumb, k) => {
        const tip = thumb.querySelector('.range-slider__tooltip')
          ?? root.querySelectorAll('.range-slider__tooltip')[k];
        if (!tip) { problems.push(`thumb[${k}]: no tooltip`); return; }
        const tr = thumb.getBoundingClientRect();
        const pr = (tip as HTMLElement).getBoundingClientRect();
        if (pr.width === 0 || pr.height === 0) { problems.push(`thumb[${k}]: tooltip 0-sized`); return; }
        // Tooltip is centered horizontally on its thumb and sits above it.
        const dx = (pr.left + pr.width / 2) - (tr.left + tr.width / 2);
        if (Math.abs(dx) > 2) problems.push(`thumb[${k}]: tooltip off-center by ${Math.round(dx)}px`);
        if (pr.bottom > tr.top + 1) problems.push(`thumb[${k}]: tooltip overlaps its thumb`);
      });

      // The dragged thumb landed on the track, inside its bounds.
      thumbs.forEach((thumb, k) => {
        const tr = thumb.getBoundingClientRect();
        const c = tr.left + tr.width / 2;
        if (c < track.left - 1 || c > track.right + 1) {
          problems.push(`thumb[${k}]: center ${Math.round(c)} outside track ${Math.round(track.left)}-${Math.round(track.right)}`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
    // The drag actually moved the low value off its starting position.
    expect(await slider.evaluate((s: any) => s.valueLow)).not.toBe(25);
  });
});

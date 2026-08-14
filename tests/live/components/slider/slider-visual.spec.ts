import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/slider/demo.html';

test.describe('Snice Slider visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() =>
      !!(document.querySelector('snice-slider') as any)?.shadowRoot?.querySelector('.slider-track'));
    await page.waitForTimeout(300);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('thumb sits at value% along the track and the fill ends under it', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const sliders = [...document.querySelectorAll('snice-slider')] as any[];
      if (sliders.length === 0) problems.push('no sliders');

      sliders.forEach((s, i) => {
        const sr = s.shadowRoot;
        const track = sr?.querySelector('.slider-track') as HTMLElement | null;
        const fill = sr?.querySelector('.slider-fill') as HTMLElement | null;
        const thumb = sr?.querySelector('.slider-thumb') as HTMLElement | null;
        if (!track || !fill || !thumb) { problems.push(`slider[${i}]: missing parts`); return; }

        const tr = track.getBoundingClientRect();
        const fr = fill.getBoundingClientRect();
        const br = thumb.getBoundingClientRect();
        const vertical = s.hasAttribute('vertical');
        // Read live properties: several showcase sliders clamp or snap the
        // authored attribute.
        const min = Number(s.min ?? 0);
        const max = Number(s.max ?? 100);
        const value = Number(s.value ?? 0);
        const pct = max > min ? (value - min) / (max - min) : 0;
        const tag = `slider[${i}] (${value} of ${min}..${max}${vertical ? ', vertical' : ''})`;

        if (br.width < 10 || Math.abs(br.width - br.height) > 1) {
          problems.push(`${tag}: thumb ${Math.round(br.width)}x${Math.round(br.height)} is not a round knob`);
        }

        if (vertical) {
          if (tr.height < 40) { problems.push(`${tag}: vertical track too short`); return; }
          const expected = tr.bottom - pct * tr.height;
          const centre = br.top + br.height / 2;
          if (Math.abs(centre - expected) > 1) {
            problems.push(`${tag}: thumb centre ${centre.toFixed(1)}, expected ${expected.toFixed(1)}`);
          }
          // Thumb rides the track's own axis.
          if (Math.abs((br.left + br.width / 2) - (tr.left + tr.width / 2)) > 1) {
            problems.push(`${tag}: thumb off the track axis`);
          }
          // Fill grows from the bottom up to the thumb.
          if (Math.abs(fr.bottom - tr.bottom) > 1) problems.push(`${tag}: fill does not start at the track base`);
          if (Math.abs(fr.top - expected) > 1) {
            problems.push(`${tag}: fill top ${fr.top.toFixed(1)}, expected ${expected.toFixed(1)}`);
          }
        } else {
          if (tr.width < 40) { problems.push(`${tag}: horizontal track too short`); return; }
          const expected = tr.left + pct * tr.width;
          const centre = br.left + br.width / 2;
          if (Math.abs(centre - expected) > 1) {
            problems.push(`${tag}: thumb centre ${centre.toFixed(1)}, expected ${expected.toFixed(1)}`);
          }
          if (Math.abs((br.top + br.height / 2) - (tr.top + tr.height / 2)) > 1) {
            problems.push(`${tag}: thumb not vertically centred on the track`);
          }
          if (Math.abs(fr.left - tr.left) > 1) problems.push(`${tag}: fill does not start at the track origin`);
          if (Math.abs(fr.right - expected) > 1) {
            problems.push(`${tag}: fill right ${fr.right.toFixed(1)}, expected ${expected.toFixed(1)}`);
          }
        }

        // At the extremes the knob may only overhang by its own radius.
        const radius = br.width / 2 + 1;
        if (br.left < tr.left - radius || br.right > tr.right + radius
            || br.top < tr.top - radius || br.bottom > tr.bottom + radius) {
          problems.push(`${tag}: thumb strays off the track`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('one tick per step, evenly spaced', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const sliders = [...document.querySelectorAll('snice-slider[show-ticks]')] as any[];
      if (sliders.length === 0) problems.push('no tick sliders');

      sliders.forEach((s, i) => {
        const sr = s.shadowRoot;
        const track = sr?.querySelector('.slider-track') as HTMLElement | null;
        const ticks = [...(sr?.querySelectorAll('.tick') ?? [])] as HTMLElement[];
        if (!track) { problems.push(`ticks[${i}]: no track`); return; }
        const min = Number(s.min ?? 0);
        const max = Number(s.max ?? 100);
        const step = Number(s.step ?? 1);
        const expectedCount = Math.floor((max - min) / step) + 1;
        if (ticks.length !== expectedCount) {
          problems.push(`ticks[${i}]: ${ticks.length} ticks, expected ${expectedCount}`);
          return;
        }
        const vertical = s.hasAttribute('vertical');
        const tr = track.getBoundingClientRect();
        const centres = ticks.map(t => {
          const r = t.getBoundingClientRect();
          return vertical ? r.top + r.height / 2 : r.left + r.width / 2;
        });
        const span = vertical ? tr.height : tr.width;
        const gaps: number[] = [];
        for (let k = 1; k < centres.length; k++) gaps.push(Math.abs(centres[k] - centres[k - 1]));
        const spread = Math.max(...gaps) - Math.min(...gaps);
        if (spread > 1.5) {
          problems.push(`ticks[${i}]: uneven spacing, gaps ${gaps.map(g => g.toFixed(1)).join(',')}`);
        }
        if (span < 40) problems.push(`ticks[${i}]: track too short to judge`);
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  // BUG: tick marks do not line up with the values they mark. `.slider-ticks`
  // is inset with `padding: 0 9px`, so the first and last tick centres sit
  // ~9.5px inside the track, while the thumb is positioned by a bare
  // `left: <pct>%` and its centre travels the full track edge to edge. At
  // value=min the knob centre is on the track's left edge but the min tick is
  // 9.5px to its right; the same 9.5px error appears at max, and every tick in
  // between is compressed (26.1px pitch instead of 28px on a 280px track).
  test.fixme('tick marks line up with the thumb position for the same value', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const sliders = [...document.querySelectorAll('snice-slider[show-ticks]:not([vertical])')] as any[];
      if (sliders.length === 0) problems.push('no horizontal tick sliders');

      sliders.forEach((s, i) => {
        const sr = s.shadowRoot;
        const track = sr?.querySelector('.slider-track') as HTMLElement | null;
        const ticks = [...(sr?.querySelectorAll('.tick') ?? [])] as HTMLElement[];
        if (!track || ticks.length < 2) { problems.push(`ticks[${i}]: no track/ticks`); return; }
        const tr = track.getBoundingClientRect();
        ticks.forEach((tick, k) => {
          const centre = tick.getBoundingClientRect().left + tick.getBoundingClientRect().width / 2;
          const expected = tr.left + (k / (ticks.length - 1)) * tr.width;
          if (Math.abs(centre - expected) > 1) {
            problems.push(`ticks[${i}] tick ${k}: centre ${centre.toFixed(1)},`
              + ` thumb would sit at ${expected.toFixed(1)}`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});

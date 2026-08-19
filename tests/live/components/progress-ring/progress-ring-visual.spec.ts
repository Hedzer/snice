import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/progress-ring/visual.html';

test.describe('Snice Progress Ring visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() =>
      !!(document.querySelector('snice-progress-ring') as any)?.shadowRoot?.querySelector('svg'));
    await page.waitForTimeout(400);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('ring is square and its svg fills the whole ring box', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const rings = [...document.querySelectorAll('snice-progress-ring')] as any[];
      if (rings.length === 0) problems.push('no progress rings');

      rings.forEach((ring, i) => {
        const base = ring.shadowRoot?.querySelector('.progress-ring') as HTMLElement | null;
        const svg = ring.shadowRoot?.querySelector('svg') as SVGElement | null;
        if (!base || !svg) { problems.push(`ring[${i}]: missing base/svg`); return; }
        const br = base.getBoundingClientRect();
        const sr = svg.getBoundingClientRect();
        if (br.width < 24) { problems.push(`ring[${i}]: collapsed (${Math.round(br.width)}px)`); return; }
        if (Math.abs(br.width - br.height) > 0.5) {
          problems.push(`ring[${i}]: not square (${Math.round(br.width)}x${Math.round(br.height)})`);
        }
        if (Math.abs(sr.width - br.width) > 0.5 || Math.abs(sr.height - br.height) > 0.5) {
          problems.push(`ring[${i}]: svg ${Math.round(sr.width)}x${Math.round(sr.height)}`
            + ` != ring ${Math.round(br.width)}x${Math.round(br.height)}`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('centre readout is centred on the ring and fits inside the hole', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const rings = [...document.querySelectorAll('snice-progress-ring')] as any[];
      let checked = 0;

      rings.forEach((ring, i) => {
        const base = ring.shadowRoot?.querySelector('.progress-ring') as HTMLElement | null;
        const centre = ring.shadowRoot?.querySelector('.progress-ring__center') as HTMLElement | null;
        if (!base || !centre) return; // no label and no show-value
        const br = base.getBoundingClientRect();
        const cr = centre.getBoundingClientRect();
        if (cr.width === 0 || cr.height === 0) {
          problems.push(`ring[${i}]: centre readout has no box`); return;
        }
        checked++;
        const dx = (cr.left + cr.width / 2) - (br.left + br.width / 2);
        const dy = (cr.top + cr.height / 2) - (br.top + br.height / 2);
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
          problems.push(`ring[${i}]: readout off-centre by (${Math.round(dx)},${Math.round(dy)})`);
        }
        // The text must clear the stroke: it has to fit within the inner hole
        // (ring diameter minus two stroke widths).
        const thickness = Number(ring.getAttribute('thickness') ?? 4);
        const hole = br.width * (36 - 2 * thickness) / 36;
        if (cr.width > hole || cr.height > hole) {
          problems.push(`ring[${i}]: readout ${Math.round(cr.width)}x${Math.round(cr.height)}`
            + ` overflows the ${Math.round(hole)}px hole`);
        }
      });
      if (checked === 0) problems.push('no rings with a centre readout');
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('arc length tracks value/max and clamps at both ends', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const rings = [...document.querySelectorAll('snice-progress-ring')] as any[];

      rings.forEach((ring, i) => {
        const fill = ring.shadowRoot?.querySelector('.progress-ring__fill') as SVGCircleElement | null;
        if (!fill) { problems.push(`ring[${i}]: no fill arc`); return; }
        const circumference = Number(fill.getAttribute('stroke-dasharray'));
        const offset = Number(fill.getAttribute('stroke-dashoffset'));
        const value = Number(ring.getAttribute('value') ?? 0);
        const max = Number(ring.getAttribute('max') ?? 100);
        const pct = Math.min(1, Math.max(0, value / max));
        const expected = circumference * (1 - pct);
        if (!Number.isFinite(circumference) || circumference <= 0) {
          problems.push(`ring[${i}]: bad dasharray ${fill.getAttribute('stroke-dasharray')}`); return;
        }
        if (Math.abs(offset - expected) > 0.5) {
          problems.push(`ring[${i}] (value=${value}/${max}): dashoffset ${offset.toFixed(1)},`
            + ` expected ${expected.toFixed(1)}`);
        }
        // Never draw a negative or over-full arc.
        if (offset < -0.5 || offset > circumference + 0.5) {
          problems.push(`ring[${i}]: dashoffset ${offset} out of [0, ${circumference}]`);
        }
        // The arc must trace the same circle as the track.
        const track = ring.shadowRoot!.querySelector('.progress-ring__track') as SVGCircleElement;
        if (track.getAttribute('r') !== fill.getAttribute('r')
            || track.getAttribute('cx') !== fill.getAttribute('cx')
            || track.getAttribute('cy') !== fill.getAttribute('cy')) {
          problems.push(`ring[${i}]: fill circle does not match the track circle`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});

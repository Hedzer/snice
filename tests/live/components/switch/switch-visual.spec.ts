import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/switch/visual.html';

test.describe('Snice Switch visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    // Thumb travel is animated.
    await page.waitForTimeout(500);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('thumb sits inside the track and parks at the end matching checked state', async ({ page }) => {
    const result = await page.evaluate(() => {
      const problems: string[] = [];
      const hosts = [...document.querySelectorAll('snice-switch')] as any[];
      if (!hosts.length) problems.push('no snice-switch on page');

      hosts.forEach((host, i) => {
        const root = host.shadowRoot;
        const track = root?.querySelector('.switch-track') as HTMLElement | null;
        const thumb = root?.querySelector('.switch-thumb') as HTMLElement | null;
        if (!track || !thumb) { problems.push(`switch[${i}]: missing track or thumb`); return; }
        const tr = track.getBoundingClientRect();
        const br = thumb.getBoundingClientRect();
        const checked = host.hasAttribute('checked');
        const tag = `switch[${i}] ${host.getAttribute('size') || 'medium'}${checked ? ' checked' : ''}`;

        if (br.width < 6 || br.height < 6) {
          problems.push(`${tag}: thumb ${Math.round(br.width)}x${Math.round(br.height)}`);
          return;
        }
        if (br.left < tr.left - 0.5 || br.right > tr.right + 0.5
            || br.top < tr.top - 0.5 || br.bottom > tr.bottom + 0.5) {
          problems.push(`${tag}: thumb escapes the track`);
        }
        // Vertically centred in the track.
        const dy = (br.top + br.height / 2) - (tr.top + tr.height / 2);
        if (Math.abs(dy) > 1) problems.push(`${tag}: thumb off vertical centre by ${dy.toFixed(1)}px`);
        // Parked against the correct end, with symmetric inset.
        const leftInset = br.left - tr.left;
        const rightInset = tr.right - br.right;
        if (checked && rightInset > leftInset) {
          problems.push(`${tag}: checked thumb not at the right end (${leftInset.toFixed(1)}/${rightInset.toFixed(1)})`);
        }
        if (!checked && leftInset > rightInset) {
          problems.push(`${tag}: unchecked thumb not at the left end (${leftInset.toFixed(1)}/${rightInset.toFixed(1)})`);
        }
      });
      return problems;
    });
    expect(result).toEqual([]);
  });

  test('track sizes grow with the size attribute and the text label aligns to the track', async ({ page }) => {
    const result = await page.evaluate(() => {
      const problems: string[] = [];
      const heights: Record<string, number> = {};
      ([...document.querySelectorAll('snice-switch')] as any[]).forEach((host, i) => {
        const root = host.shadowRoot;
        const track = root?.querySelector('.switch-track') as HTMLElement | null;
        if (!track) return;
        const tr = track.getBoundingClientRect();
        const size = host.getAttribute('size') || 'medium';
        if (heights[size] === undefined) heights[size] = Math.round(tr.height);
        if (Math.round(tr.height) !== heights[size]) {
          problems.push(`switch[${i}] ${size}: track height ${Math.round(tr.height)} != ${heights[size]}`);
        }
        const label = root.querySelector('.switch-label') as HTMLElement | null;
        if (label && label.getBoundingClientRect().width > 0) {
          const lr = label.getBoundingClientRect();
          const dy = (lr.top + lr.height / 2) - (tr.top + tr.height / 2);
          if (Math.abs(dy) > 2) {
            problems.push(`switch[${i}] ${size}: label off the track's centre line by ${dy.toFixed(1)}px`);
          }
          if (lr.left < tr.right - 1) problems.push(`switch[${i}] ${size}: label overlaps the track`);
        }
      });
      const { small, medium, large } = heights;
      if ([small, medium, large].some(v => v === undefined)) {
        problems.push(`missing size variants: ${JSON.stringify(heights)}`);
      } else if (!(small < medium && medium < large)) {
        problems.push(`track heights not monotonic: ${JSON.stringify(heights)}`);
      }
      return problems;
    });
    expect(result).toEqual([]);
  });

  test('clicking an unchecked switch slides the thumb to the other end', async ({ page }) => {
    const target = page.locator('snice-switch[label="Unchecked"]').first();
    const before = await page.evaluate(() => {
      const host = document.querySelector('snice-switch[label="Unchecked"]') as any;
      const tr = host.shadowRoot.querySelector('.switch-track').getBoundingClientRect();
      const br = host.shadowRoot.querySelector('.switch-thumb').getBoundingClientRect();
      return { left: br.left - tr.left, trackWidth: tr.width, thumbWidth: br.width };
    });

    await target.click();
    await page.waitForTimeout(400);

    const after = await page.evaluate(() => {
      const host = document.querySelector('snice-switch[label="Unchecked"]') as any;
      const tr = host.shadowRoot.querySelector('.switch-track').getBoundingClientRect();
      const br = host.shadowRoot.querySelector('.switch-thumb').getBoundingClientRect();
      return { left: br.left - tr.left, rightInset: tr.right - br.right, checked: host.checked };
    });

    expect(after.checked).toBe(true);
    // Thumb travelled essentially the full free width of the track.
    const travel = after.left - before.left;
    expect(travel).toBeGreaterThan((before.trackWidth - before.thumbWidth) * 0.6);
    expect(after.rightInset).toBeGreaterThanOrEqual(-0.5);
    expect(after.rightInset).toBeLessThanOrEqual(before.left + 1);
  });
});

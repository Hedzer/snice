import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/location/visual.html';

test.describe('Snice Location visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-location'));
    await page.waitForFunction(() => {
      const all = [...document.querySelectorAll('snice-location')];
      return all.length > 0 && all.every(l => !!(l as any).shadowRoot?.querySelector('.location'));
    });
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  // A location is an optional icon column followed by a text column. The icon
  // must be a sanely-sized square, the content must start to its right, and
  // the text lines must stack top-to-bottom inside the base box.
  test('icon and text columns are sized, ordered, and contained', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-location').forEach((host, i) => {
        const root = (host as any).shadowRoot as ShadowRoot;
        const base = root.querySelector('.location') as HTMLElement;
        const br = base.getBoundingClientRect();
        if (br.width === 0 || br.height === 0) { problems.push(`loc[${i}]: base 0-size`); return; }

        const icon = root.querySelector('.icon') as HTMLElement | null;
        const content = root.querySelector('.content') as HTMLElement | null;
        if (!content) { problems.push(`loc[${i}]: no content`); return; }
        const cr = content.getBoundingClientRect();

        if (icon) {
          const ir = icon.getBoundingClientRect();
          if (ir.width < 12 || ir.width > 64) {
            problems.push(`loc[${i}]: icon ${Math.round(ir.width)}px wide`);
          }
          if (cr.left < ir.right - 1) {
            problems.push(`loc[${i}]: content overlaps the icon (${Math.round(cr.left)} < ${Math.round(ir.right)})`);
          }
          if (ir.top < br.top - 1 || ir.bottom > br.bottom + 1) {
            problems.push(`loc[${i}]: icon escapes the base box`);
          }
        }

        const lines = ['.name', '.address', '.coordinates']
          .map(sel => [sel, root.querySelector(sel) as HTMLElement | null] as const)
          .filter(([, el]) => el && el.getBoundingClientRect().height > 0) as [string, HTMLElement][];

        let prevBottom = -Infinity;
        let prevSel = '';
        lines.forEach(([sel, el]) => {
          const r = el.getBoundingClientRect();
          if (r.left < cr.left - 1 || r.right > cr.right + 1
              || r.top < cr.top - 1 || r.bottom > cr.bottom + 1) {
            problems.push(`loc[${i}]: ${sel} escapes the content column`);
          }
          if (r.top < prevBottom - 1) problems.push(`loc[${i}]: ${sel} overlaps ${prevSel}`);
          prevBottom = r.bottom;
          prevSel = sel;
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  // show-map embeds a map frame: it must occupy a real area, span the content
  // column, and sit below the text rather than over it.
  test('embedded map fills its column below the text', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const maps = [...document.querySelectorAll('snice-location[show-map]')];
      if (maps.length === 0) problems.push('no show-map locations in the showcase');
      maps.forEach((host, i) => {
        const root = (host as any).shadowRoot as ShadowRoot;
        const base = root.querySelector('.location')!.getBoundingClientRect();
        const map = root.querySelector('.map-container') as HTMLElement | null;
        if (!map) { problems.push(`map[${i}]: no .map-container`); return; }
        const mr = map.getBoundingClientRect();
        if (mr.width < 100 || mr.height < 80) {
          problems.push(`map[${i}]: too small (${Math.round(mr.width)}x${Math.round(mr.height)})`);
        }
        if (mr.left < base.left - 1 || mr.right > base.right + 1 || mr.bottom > base.bottom + 1) {
          problems.push(`map[${i}]: escapes the base box`);
        }
        const name = root.querySelector('.name') as HTMLElement | null;
        if (name && mr.top < name.getBoundingClientRect().bottom - 1) {
          problems.push(`map[${i}]: overlaps the name line`);
        }
        const frame = map.querySelector('iframe') as HTMLElement | null;
        if (!frame) { problems.push(`map[${i}]: no iframe`); return; }
        const fr = frame.getBoundingClientRect();
        if (Math.abs(fr.width - mr.width) > 2 || Math.abs(fr.height - mr.height) > 2) {
          problems.push(`map[${i}]: iframe ${Math.round(fr.width)}x${Math.round(fr.height)}`
            + ` does not fill container ${Math.round(mr.width)}x${Math.round(mr.height)}`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});

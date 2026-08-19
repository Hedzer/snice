import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/code-block/visual.html';

test.describe('Snice Code Block visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('header and code pane stack flush and the copy button stays inside the header', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-code-block').forEach((host, i) => {
        const root = (host as any).shadowRoot;
        const block = root?.querySelector('.code-block');
        if (!block) { problems.push(`block[${i}]: no .code-block`); return; }
        const br = block.getBoundingClientRect();
        // A block with neither filename nor copy button collapses its header
        // to display:none — treat that as headerless rather than misplaced.
        const headerEl = root.querySelector('.code-block__header');
        const header = headerEl && headerEl.getBoundingClientRect().height > 0 ? headerEl : null;
        const content = root.querySelector('.code-block__content');
        if (!content) { problems.push(`block[${i}]: no content`); return; }
        const cr = content.getBoundingClientRect();

        if (header) {
          const hr = header.getBoundingClientRect();
          // Header sits at the top of the block and the code pane abuts it.
          if (Math.abs(hr.top - br.top) > 1) {
            problems.push(`block[${i}]: header top ${Math.round(hr.top)} != block ${Math.round(br.top)}`);
          }
          if (Math.abs(cr.top - hr.bottom) > 1) {
            problems.push(`block[${i}]: seam header ${Math.round(hr.bottom)} -> content ${Math.round(cr.top)}`);
          }
          const copy = root.querySelector('.code-block__copy');
          if (copy) {
            const cpr = copy.getBoundingClientRect();
            if (cpr.right > hr.right + 1 || cpr.left < hr.left - 1
                || cpr.top < hr.top - 1 || cpr.bottom > hr.bottom + 1) {
              problems.push(`block[${i}]: copy button escapes the header`);
            }
            const dy = (cpr.top + cpr.height / 2) - (hr.top + hr.height / 2);
            if (Math.abs(dy) > 1.5) {
              problems.push(`block[${i}]: copy button off-center in header by ${dy.toFixed(1)}px`);
            }
            const filename = root.querySelector('.code-block__filename');
            const fr = filename?.getBoundingClientRect();
            if (fr && fr.width > 0 && fr.right > cpr.left - 1) {
              problems.push(`block[${i}]: filename overlaps the copy button`);
            }
          }
        } else if (Math.abs(cr.top - br.top) > 1) {
          problems.push(`block[${i}]: headerless content top ${Math.round(cr.top)} != block ${Math.round(br.top)}`);
        }

        // The code pane spans the block and never bleeds out of it.
        if (cr.left < br.left - 1 || cr.right > br.right + 1 || cr.bottom > br.bottom + 1) {
          problems.push(`block[${i}]: content escapes the block box`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('line-number gutters align and code lines tile without gaps', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const blocks = [...document.querySelectorAll('snice-code-block[show-line-numbers]')];
      if (blocks.length === 0) problems.push('no show-line-numbers blocks in showcase');
      blocks.forEach((host, i) => {
        const root = (host as any).shadowRoot;
        const lines = [...root.querySelectorAll('.code-block__line')] as HTMLElement[];
        if (lines.length < 2) { problems.push(`numbered[${i}]: ${lines.length} lines`); return; }
        const gutters = lines
          .map(l => l.querySelector('.code-block__line-number'))
          .filter(Boolean)
          .map(g => (g as Element).getBoundingClientRect());
        if (gutters.length !== lines.length) {
          problems.push(`numbered[${i}]: ${gutters.length} gutters for ${lines.length} lines`);
          return;
        }
        const lefts = gutters.map(g => Math.round(g.left));
        const widths = gutters.map(g => Math.round(g.width));
        if (Math.max(...lefts) - Math.min(...lefts) > 1) {
          problems.push(`numbered[${i}]: gutter lefts diverge ${lefts.join(',')}`);
        }
        if (Math.max(...widths) - Math.min(...widths) > 1) {
          problems.push(`numbered[${i}]: gutter widths diverge ${widths.join(',')}`);
        }
        const rects = lines.map(l => l.getBoundingClientRect());
        for (let n = 1; n < rects.length; n++) {
          if (Math.abs(rects[n].top - rects[n - 1].bottom) > 1) {
            problems.push(`numbered[${i}] line ${n}: seam ${Math.round(rects[n - 1].bottom)} -> ${Math.round(rects[n].top)}`);
          }
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('an overlong code line scrolls inside the pane instead of widening the block', async ({ page }) => {
    const result = await page.evaluate(() => {
      const hosts = [...document.querySelectorAll('snice-code-block')];
      // The showcase's last block holds the deliberately very long line.
      const host = hosts[hosts.length - 1] as any;
      const pre = host.shadowRoot.querySelector('.code-block__pre') as HTMLElement;
      const hostRect = host.getBoundingClientRect();
      const preRect = pre.getBoundingClientRect();
      return {
        scrolls: pre.scrollWidth > pre.clientWidth + 1,
        overflowX: getComputedStyle(pre).overflowX,
        preWidth: preRect.width,
        hostWidth: hostRect.width,
      };
    });
    expect(result.scrolls).toBe(true);
    expect(result.overflowX).toBe('auto');
    expect(result.preWidth).toBeLessThanOrEqual(result.hostWidth + 1);
  });
});

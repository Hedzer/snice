import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/divider/demo.html';

test.describe('Snice Divider visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('rules are hairlines that span their host on the layout axis', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-divider').forEach((host, i) => {
        const root = (host as any).shadowRoot;
        const vertical = host.getAttribute('orientation') === 'vertical';
        const hr = host.getBoundingClientRect();
        const rules = [...root.querySelectorAll('.divider')] as HTMLElement[];
        if (rules.length === 0) { problems.push(`divider[${i}]: no rule`); return; }
        rules.forEach((rule, ri) => {
          const rr = rule.getBoundingClientRect();
          const thickness = vertical ? rr.width : rr.height;
          const extent = vertical ? rr.height : rr.width;
          if (thickness < 0.5 || thickness > 4) {
            problems.push(`divider[${i}] rule ${ri}: thickness ${thickness.toFixed(1)}px out of hairline range`);
          }
          if (extent <= 0) {
            problems.push(`divider[${i}] rule ${ri}: zero extent`);
          }
          if (rr.left < hr.left - 1 || rr.right > hr.right + 1) {
            problems.push(`divider[${i}] rule ${ri}: escapes host horizontally`);
          }
        });
        if (rules.length === 1) {
          const rr = rules[0].getBoundingClientRect();
          const span = vertical ? rr.height : rr.width;
          const hostSpan = vertical ? hr.height : hr.width;
          if (Math.abs(span - hostSpan) > 1) {
            problems.push(`divider[${i}]: rule spans ${Math.round(span)} of host ${Math.round(hostSpan)}`);
          }
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('labelled dividers flank the text without overlapping it', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const labelled = [...document.querySelectorAll('snice-divider[text]')];
      if (labelled.length === 0) problems.push('no labelled dividers in showcase');
      labelled.forEach((host, i) => {
        const root = (host as any).shadowRoot;
        const container = root.querySelector('.divider-container');
        const before = root.querySelector('.divider--before');
        const after = root.querySelector('.divider--after');
        const label = root.querySelector('.divider-text');
        if (!container || !before || !after || !label) {
          problems.push(`labelled[${i}]: missing container/rule/text parts`);
          return;
        }
        const co = container.getBoundingClientRect();
        const b = before.getBoundingClientRect();
        const a = after.getBoundingClientRect();
        const t = label.getBoundingClientRect();

        if (t.width === 0 || t.height === 0) {
          problems.push(`labelled[${i}]: text renders at 0 size`);
        }
        // The pair of rules must bracket the label, not run under it.
        if (b.right > t.left + 0.5) problems.push(`labelled[${i}]: leading rule overlaps the text`);
        if (a.left < t.right - 0.5) problems.push(`labelled[${i}]: trailing rule overlaps the text`);
        // Rules reach the container edges.
        if (Math.abs(b.left - co.left) > 1) {
          problems.push(`labelled[${i}]: leading rule starts at ${Math.round(b.left)}, container ${Math.round(co.left)}`);
        }
        if (Math.abs(a.right - co.right) > 1) {
          problems.push(`labelled[${i}]: trailing rule ends at ${Math.round(a.right)}, container ${Math.round(co.right)}`);
        }
        // Both rules sit on the label's vertical mid-line.
        const mid = t.top + t.height / 2;
        [['leading', b], ['trailing', a]].forEach(([n, r]: any) => {
          const dy = (r.top + r.height / 2) - mid;
          if (Math.abs(dy) > 1.5) {
            problems.push(`labelled[${i}]: ${n} rule off the text mid-line by ${dy.toFixed(1)}px`);
          }
        });
        // align="center" must keep the two rules the same length.
        if (host.getAttribute('align') === 'center' && Math.abs(b.width - a.width) > 1) {
          problems.push(`labelled[${i}]: centered rules uneven (${Math.round(b.width)} vs ${Math.round(a.width)})`);
        }
        // The label stays inside the divider's own box.
        if (t.left < co.left - 1 || t.right > co.right + 1) {
          problems.push(`labelled[${i}]: text escapes the divider box`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});

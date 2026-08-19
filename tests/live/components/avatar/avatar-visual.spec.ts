import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/avatar/visual.html';

test.describe('Snice Avatar visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-avatar'));
    await page.waitForFunction(() => !!document.querySelector('snice-avatar')?.shadowRoot?.querySelector('.avatar'));
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  // The showcase renders every size as initials, image, and default-icon.
  // The rendered badge must stay square (the host itself is inline-block and
  // legitimately stretches when it is a grid item, so measure .avatar) and
  // fully contain its content: initials text, <img>, or the fallback icon.
  test('every avatar badge is square and keeps its content inside', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-avatar').forEach((host, i) => {
        const hr = host.getBoundingClientRect();
        if (hr.width === 0) { problems.push(`avatar[${i}]: 0 wide`); return; }
        const base = (host as any).shadowRoot?.querySelector('.avatar') as HTMLElement | null;
        if (!base) { problems.push(`avatar[${i}]: no .avatar`); return; }
        const br = base.getBoundingClientRect();
        if (Math.abs(br.width - br.height) > 1) {
          problems.push(`avatar[${i}]: badge not square (${Math.round(br.width)}x${Math.round(br.height)})`);
        }
        if (br.width > hr.width + 1 || br.height > hr.height + 1) {
          problems.push(`avatar[${i}]: badge ${Math.round(br.width)}x${Math.round(br.height)} overflows host ${Math.round(hr.width)}x${Math.round(hr.height)}`);
        }
        base.querySelectorAll('.avatar-image, .avatar-fallback, .avatar-icon').forEach(el => {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return;
          if (r.left < br.left - 1 || r.top < br.top - 1
              || r.right > br.right + 1 || r.bottom > br.bottom + 1) {
            problems.push(`avatar[${i}]: ${el.className} escapes the badge`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  // Size tokens must be a strictly increasing ladder: xs < small < medium <
  // large < xl < xxl. The first section lists exactly that order.
  test('size ladder grows monotonically', async ({ page }) => {
    const sizes = await page.evaluate(() => {
      const row = document.querySelector('section .row')!;
      return [...row.querySelectorAll('snice-avatar')].map(a => ({
        size: a.getAttribute('size'),
        px: Math.round(a.getBoundingClientRect().width)
      }));
    });
    expect(sizes.map(s => s.size)).toEqual(['xs', 'small', 'medium', 'large', 'xl', 'xxl']);
    for (let i = 1; i < sizes.length; i++) {
      expect(sizes[i].px, `${sizes[i].size} must exceed ${sizes[i - 1].size}`)
        .toBeGreaterThan(sizes[i - 1].px);
    }
  });
});

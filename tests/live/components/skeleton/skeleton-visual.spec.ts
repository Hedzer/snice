import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/skeleton/demo.html';

test.describe('Snice Skeleton visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('count renders that many bones, stacked with the requested spacing', async ({ page }) => {
    const result = await page.evaluate(() => {
      const problems: string[] = [];
      const hosts = [...document.querySelectorAll('snice-skeleton')] as any[];
      if (!hosts.length) problems.push('no snice-skeleton on page');

      hosts.forEach((host, i) => {
        const bones = [...host.shadowRoot.querySelectorAll('.skeleton')] as HTMLElement[];
        const count = parseInt(host.getAttribute('count') || '1', 10);
        const tag = `skeleton[${i}] ${host.getAttribute('variant') || 'text'} count=${count}`;
        if (bones.length !== count) {
          problems.push(`${tag}: ${bones.length} bones rendered`);
          return;
        }
        const hr = host.getBoundingClientRect();
        const expectedGap = parseFloat(host.getAttribute('spacing') || '8');

        bones.forEach((bone, b) => {
          const r = bone.getBoundingClientRect();
          if (r.width < 1 || r.height < 1) {
            problems.push(`${tag} bone[${b}]: ${r.width}x${r.height}`);
          }
          if (r.left < hr.left - 1 || r.right > hr.right + 1
              || r.top < hr.top - 1 || r.bottom > hr.bottom + 1) {
            problems.push(`${tag} bone[${b}]: escapes the host`);
          }
          if (b > 0) {
            const prev = bones[b - 1].getBoundingClientRect();
            const gap = r.top - prev.bottom;
            if (Math.abs(gap - expectedGap) > 1) {
              problems.push(`${tag} bone[${b}]: gap ${gap.toFixed(1)}px, expected ${expectedGap}px`);
            }
          }
        });
      });
      return problems;
    });
    expect(result).toEqual([]);
  });

  test('variants keep their shape: circular bones are round, sizes honour width/height', async ({ page }) => {
    const result = await page.evaluate(() => {
      const problems: string[] = [];
      ([...document.querySelectorAll('snice-skeleton')] as any[]).forEach((host, i) => {
        const bone = host.shadowRoot.querySelector('.skeleton') as HTMLElement | null;
        if (!bone) return;
        const r = bone.getBoundingClientRect();
        const variant = host.getAttribute('variant') || 'text';
        const tag = `skeleton[${i}] ${variant}`;
        const cs = getComputedStyle(bone);

        if (variant === 'circular') {
          if (Math.abs(r.width - r.height) > 1) {
            problems.push(`${tag}: not square (${Math.round(r.width)}x${Math.round(r.height)})`);
          }
          const radius = parseFloat(cs.borderTopLeftRadius);
          if (radius < r.width / 2 - 1) {
            problems.push(`${tag}: radius ${radius.toFixed(1)} does not round the ${Math.round(r.width)}px bone`);
          }
        }

        const w = host.getAttribute('width');
        const h = host.getAttribute('height');
        if (w && w.endsWith('px') && Math.abs(r.width - parseFloat(w)) > 1) {
          problems.push(`${tag}: width ${Math.round(r.width)} != requested ${w}`);
        }
        if (h && h.endsWith('px') && Math.abs(r.height - parseFloat(h)) > 1) {
          problems.push(`${tag}: height ${Math.round(r.height)} != requested ${h}`);
        }
        if (w && w.endsWith('%')) {
          const parent = host.parentElement!.getBoundingClientRect();
          const expected = parent.width * parseFloat(w) / 100;
          if (Math.abs(r.width - expected) > 1.5) {
            problems.push(`${tag}: width ${Math.round(r.width)} != ${w} of ${Math.round(parent.width)}`);
          }
        }
      });
      return problems;
    });
    expect(result).toEqual([]);
  });
});

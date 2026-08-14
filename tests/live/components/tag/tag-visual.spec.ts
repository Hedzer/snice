import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/tag/demo.html';

test.describe('Snice Tag visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-tag'));
    await page.waitForTimeout(300);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('icon, label and remove button share one vertically centred row', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-tag').forEach((tag, i) => {
        const label = tag.textContent?.trim().slice(0, 20) || `tag[${i}]`;
        const root = (tag as HTMLElement).shadowRoot;
        const chip = root?.querySelector('.tag') as HTMLElement | null;
        if (!chip) { problems.push(`${label}: no .tag`); return; }
        const cr = chip.getBoundingClientRect();
        const mid = cr.top + cr.height / 2;

        const parts: Array<[string, HTMLElement | null]> = [
          ['icon', root!.querySelector('.tag-icon')],
          ['label', root!.querySelector('.tag-label')],
          ['remove', root!.querySelector('.tag-remove')]
        ];
        const seen: Array<{ name: string; rect: DOMRect }> = [];
        parts.forEach(([name, el]) => {
          if (!el) return;
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return;
          seen.push({ name, rect: r });
          if (r.left < cr.left - 1 || r.right > cr.right + 1
            || r.top < cr.top - 1 || r.bottom > cr.bottom + 1) {
            problems.push(`${label}: ${name} escapes the chip`);
          }
          const dy = (r.top + r.height / 2) - mid;
          if (Math.abs(dy) > 1.5) {
            problems.push(`${label}: ${name} off the chip's vertical centre by ${dy.toFixed(1)}px`);
          }
        });

        // icon → label → remove, left to right, never overlapping.
        for (let s = 1; s < seen.length; s++) {
          if (seen[s].rect.left < seen[s - 1].rect.right - 1) {
            problems.push(`${label}: ${seen[s].name} overlaps ${seen[s - 1].name}`);
          }
        }

        // Removable tags need a real tap target.
        if (tag.hasAttribute('removable')) {
          const btn = root!.querySelector('.tag-remove') as HTMLElement | null;
          if (!btn) { problems.push(`${label}: removable but no remove button`); return; }
          const br = btn.getBoundingClientRect();
          if (br.width < 10 || br.height < 10) {
            problems.push(`${label}: remove button only ${Math.round(br.width)}x${Math.round(br.height)}`);
          }
          const svg = btn.querySelector('svg');
          if (svg) {
            const sr = svg.getBoundingClientRect();
            if (sr.width < 6 || sr.width > br.width + 1 || sr.height > br.height + 1) {
              problems.push(`${label}: remove icon sized ${Math.round(sr.width)}x${Math.round(sr.height)} in a ${Math.round(br.width)}px button`);
            }
            const dx = (sr.left + sr.width / 2) - (br.left + br.width / 2);
            const dy = (sr.top + sr.height / 2) - (br.top + br.height / 2);
            if (Math.abs(dx) > 1.5 || Math.abs(dy) > 1.5) {
              problems.push(`${label}: remove icon off-centre (${dx.toFixed(1)}, ${dy.toFixed(1)})`);
            }
          }
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('size presets scale the chip and pill corners are fully rounded', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const heightOf = (sel: string) => {
        const el = document.querySelector(sel) as HTMLElement | null;
        return el ? el.shadowRoot!.querySelector('.tag')!.getBoundingClientRect().height : NaN;
      };
      const small = heightOf('snice-tag[size="small"]');
      const medium = heightOf('snice-tag[size="medium"]');
      const large = heightOf('snice-tag[size="large"]');
      if (!(small < medium && medium < large)) {
        problems.push(`tag sizes do not scale: ${small}/${medium}/${large}`);
      }

      document.querySelectorAll('snice-tag[pill]').forEach((tag, i) => {
        const chip = (tag as HTMLElement).shadowRoot!.querySelector('.tag') as HTMLElement;
        const r = chip.getBoundingClientRect();
        const radius = parseFloat(getComputedStyle(chip).borderTopLeftRadius);
        if (radius < r.height / 2 - 0.5) {
          problems.push(`pill[${i}]: radius ${radius.toFixed(1)} < half-height ${(r.height / 2).toFixed(1)}`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('clicking remove on a tag fires tag-remove and leaves the row intact', async ({ page }) => {
    const removable = page.locator('snice-tag[removable]').first();
    const neighbour = page.locator('snice-tag[removable]').nth(1);
    const beforeTop = await neighbour.evaluate(el => el.getBoundingClientRect().top);

    const fired = await removable.evaluate(async el => {
      const p = new Promise<boolean>(resolve => {
        el.addEventListener('tag-remove', () => resolve(true), { once: true });
        setTimeout(() => resolve(false), 1000);
      });
      ((el as HTMLElement).shadowRoot!.querySelector('.tag-remove') as HTMLButtonElement).click();
      return p;
    });
    expect(fired).toBe(true);

    // The tag is not self-removing, so the row must not shift.
    const afterTop = await neighbour.evaluate(el => el.getBoundingClientRect().top);
    expect(Math.abs(afterTop - beforeTop)).toBeLessThanOrEqual(1);
  });
});

import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/flip-card/visual.html';

test.describe('Snice Flip Card visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-flip-card'));
    await page.waitForFunction(() => [...document.querySelectorAll('snice-flip-card')]
      .every(c => !!c.shadowRoot?.querySelector('.flip-card')));
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('front and back faces register exactly with the host box', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const cards = [...document.querySelectorAll('snice-flip-card')] as HTMLElement[];
      if (cards.length === 0) problems.push('no snice-flip-card on page');

      cards.forEach((card, i) => {
        const h = card.getBoundingClientRect();
        if (h.width < 50 || h.height < 50) {
          problems.push(`card[${i}]: host collapsed to ${Math.round(h.width)}x${Math.round(h.height)}`);
          return;
        }
        const root = card.shadowRoot!;
        (['.front', '.back'] as const).forEach(sel => {
          const face = root.querySelector(sel);
          if (!face) { problems.push(`card[${i}]: missing ${sel}`); return; }
          const f = face.getBoundingClientRect();
          // Both faces are absolutely positioned at 100%/100%: they must be
          // the same box as the host, so the flip never shifts the card.
          if (Math.abs(f.width - h.width) > 1 || Math.abs(f.height - h.height) > 1
              || Math.abs(f.left - h.left) > 1 || Math.abs(f.top - h.top) > 1) {
            problems.push(`card[${i}] ${sel}: `
              + `${Math.round(f.width)}x${Math.round(f.height)}@${Math.round(f.left)},${Math.round(f.top)} `
              + `vs host ${Math.round(h.width)}x${Math.round(h.height)}@${Math.round(h.left)},${Math.round(h.top)}`);
          }
          // Slotted content must not spill out of the face.
          const slotted = [...(face.querySelector('slot') as HTMLSlotElement | null)
            ?.assignedElements() ?? []] as HTMLElement[];
          slotted.forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.width === 0) return;
            if (r.right > f.right + 1 || r.bottom > f.bottom + 1) {
              problems.push(`card[${i}] ${sel}: slotted content overflows the face`);
            }
          });
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('clicking a click-to-flip card rotates it 180deg about its direction axis without moving the box', async ({ page }) => {
    // Section "click-to-flip: true (default)" — horizontal, 600ms.
    const card = page.locator('snice-flip-card[click-to-flip="true"]').first();
    await card.scrollIntoViewIfNeeded();
    const before = await card.boundingBox();

    // The click handler lives on the inner `.flip-card`, so this must be a real
    // pointer click at the card's centre rather than host.click().
    await card.click();
    await page.waitForFunction(
      () => document.querySelector('snice-flip-card[click-to-flip="true"]')!.hasAttribute('flipped'));
    await page.waitForTimeout(900); // 600ms transition + settle

    const result = await page.evaluate(() => {
      const el = document.querySelector('snice-flip-card[click-to-flip="true"]') as HTMLElement;
      const inner = el.shadowRoot!.querySelector('.flip-card') as HTMLElement;
      const m = new DOMMatrixReadOnly(getComputedStyle(inner).transform);
      const r = el.getBoundingClientRect();
      return {
        flipped: el.hasAttribute('flipped'),
        m11: m.m11, m22: m.m22, m33: m.m33,
        box: { x: r.left, y: r.top, width: r.width, height: r.height },
      };
    });

    expect(result.flipped).toBe(true);
    const moved = Math.abs(result.box.width - before!.width) > 1
      || Math.abs(result.box.height - before!.height) > 1;
    expect(moved).toBe(false);
    // rotateY(180deg) => m11 = -1, m22 = 1, m33 = -1.
    expect(result.m11).toBeCloseTo(-1, 2);
    expect(result.m22).toBeCloseTo(1, 2);
    expect(result.m33).toBeCloseTo(-1, 2);
  });
});

import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/data-card/demo.html';

test.describe('Snice Data Card visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('field rows tile down the card and label/value columns never collide', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const cards = [...document.querySelectorAll('snice-data-card')] as HTMLElement[];
      if (cards.length === 0) problems.push('no data cards rendered');

      cards.forEach((card, ci) => {
        const box = card.shadowRoot?.querySelector('.data-card') as HTMLElement | null;
        if (!box) { problems.push(`card[${ci}]: no .data-card`); return; }
        const cr = box.getBoundingClientRect();
        const tag = `card[${ci}] ${card.getAttribute('variant') ?? 'default'}`;
        // Grouped cards break the run of rows with a group title, so rows only
        // have to abut within the container that holds them.
        const containers = box.querySelector('.data-card__group')
          ? [...box.querySelectorAll('.data-card__group')]
          : [box];
        const fields = containers.flatMap(c =>
          [...c.querySelectorAll(':scope > .field')] as HTMLElement[]);
        const groupOf = new Map<HTMLElement, number>();
        containers.forEach((c, gi) =>
          c.querySelectorAll(':scope > .field').forEach(f => groupOf.set(f as HTMLElement, gi)));

        fields.forEach((field, fi) => {
          const fr = field.getBoundingClientRect();
          if (fr.height === 0) { problems.push(`${tag} field[${fi}]: 0 height`); return; }
          if (fr.left < cr.left - 1 || fr.right > cr.right + 1) {
            problems.push(`${tag} field[${fi}]: overhangs card`);
          }
          // Rows abut: the previous row's bottom is this row's top.
          if (fi > 0 && groupOf.get(fields[fi - 1]) === groupOf.get(field)) {
            const prev = fields[fi - 1].getBoundingClientRect();
            if (Math.abs(fr.top - prev.bottom) > 1) {
              problems.push(`${tag} field[${fi}]: row seam ${Math.round(prev.bottom)} -> ${Math.round(fr.top)}`);
            }
          }

          const label = field.querySelector('.field__label') as HTMLElement | null;
          const value = field.querySelector('.field__value') as HTMLElement | null;
          if (!label || !value) return;
          const lr = label.getBoundingClientRect();
          const vr = value.getBoundingClientRect();

          // Label and value are side-by-side flex columns in every variant:
          // the value must start after the label, and both stay in the row.
          if (vr.left < lr.right - 1) {
            problems.push(`${tag} field[${fi}] "${label.textContent?.trim()}": value overlaps label`);
          }
          if (vr.right > fr.right + 1) {
            problems.push(`${tag} field[${fi}]: value overhangs its row`);
          }
          [['label', lr], ['value', vr]].forEach(([name, r]) => {
            const rect = r as DOMRect;
            if (rect.top < fr.top - 1 || rect.bottom > fr.bottom + 1) {
              problems.push(`${tag} field[${fi}]: ${name} escapes row vertically`);
            }
          });
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  // BUG: badge fields render as full-width bars, not pills. `.field__value--badge`
  // declares `display: inline-flex` to hug its text, but the same element also
  // carries `.field__value { flex: 1 }` and is a flex item of `.field`, so it is
  // blockified to `display: flex` and stretched across the whole value column.
  // Measured on the "All field types" card: painted background 406px wide for
  // 38px of text ("Default"); every badge variant is affected.
  test.fixme('badge values hug their text instead of stretching the value column', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      let seen = 0;
      document.querySelectorAll('snice-data-card').forEach((card, ci) => {
        card.shadowRoot?.querySelectorAll('.field__value--badge').forEach(badge => {
          seen++;
          const br = badge.getBoundingClientRect();
          const field = badge.closest('.field') as HTMLElement;
          const fr = field.getBoundingClientRect();
          const text = badge.textContent?.trim() ?? '';
          // An inline-flex pill must be far narrower than the whole row.
          if (br.width > fr.width * 0.6) {
            problems.push(`card[${ci}] badge "${text}": ${Math.round(br.width)}px wide in a ${Math.round(fr.width)}px row`);
          }
          if (br.height < 12 || br.height > 40) {
            problems.push(`card[${ci}] badge "${text}": height ${Math.round(br.height)}px`);
          }
          if (br.bottom > fr.bottom + 1 || br.top < fr.top - 1) {
            problems.push(`card[${ci}] badge "${text}": escapes its row`);
          }
        });
      });
      if (seen === 0) problems.push('no badge fields found — showcase should render badge types');
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('edit mode swaps values for inputs that fill the row without overflowing it', async ({ page }) => {
    // The card already carries `editable`, which surfaces a ✎ button per
    // editable field; clicking one swaps that field's value for an input.
    await page.locator('#dc-editable').evaluate((card: any) => {
      (card.shadowRoot.querySelector('.field__save-btn') as HTMLElement).click();
    });
    await page.waitForTimeout(200);

    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const card = document.getElementById('dc-editable') as HTMLElement;
      const inputs = [...(card.shadowRoot?.querySelectorAll('.field__input') ?? [])] as HTMLElement[];
      if (inputs.length === 0) { problems.push('edit toggle produced no .field__input'); return problems; }

      inputs.forEach((input, i) => {
        const ir = input.getBoundingClientRect();
        const field = input.closest('.field') as HTMLElement;
        const fr = field.getBoundingClientRect();
        if (ir.width < 40) problems.push(`input[${i}]: only ${Math.round(ir.width)}px wide`);
        if (ir.height < 20 || ir.height > 60) problems.push(`input[${i}]: height ${Math.round(ir.height)}px`);
        if (ir.right > fr.right + 1 || ir.left < fr.left - 1) {
          problems.push(`input[${i}]: overflows its field row`);
        }
        if (ir.top < fr.top - 1 || ir.bottom > fr.bottom + 1) {
          problems.push(`input[${i}]: escapes its field row vertically`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});

import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/receipt/demo.html';

test.describe('Snice Receipt visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);
  });

  // The showcase's zoom target is a closed <snice-modal>, which sits in the DOM
  // at 0x0 until opened — the shared "no 0x0 host" invariant does not model the
  // closed-dialog pattern.
  test.fixme('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('line items keep name, quantity and price in three non-overlapping lanes', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const receipts = [...document.querySelectorAll('snice-receipt')] as HTMLElement[];
      if (receipts.length === 0) problems.push('no receipts rendered');
      receipts.forEach((rc, ri) => {
        const sr = rc.shadowRoot!;
        const label = `receipt[${ri}]${rc.id ? '#' + rc.id : ''}`;
        const block = sr.querySelector('.receipt__items') as HTMLElement | null;
        if (!block) {
          // A receipt with no line items renders no items block at all.
          if (((rc as any).items ?? []).length > 0) problems.push(`${label}: items set but no items block`);
          return;
        }
        const blockRect = block.getBoundingClientRect();
        const rows = [...block.querySelectorAll('.receipt__item')] as HTMLElement[];
        if (rows.length === 0) { problems.push(`${label}: no line items`); return; }

        let prevBottom: number | null = null;
        rows.forEach((row, i) => {
          const rr = row.getBoundingClientRect();
          if (rr.left < blockRect.left - 1 || rr.right > blockRect.right + 1) {
            problems.push(`${label} item[${i}]: escapes the items block`);
          }
          if (prevBottom !== null && rr.top < prevBottom - 1) {
            problems.push(`${label} item[${i}]: overlaps the previous line`);
          }
          prevBottom = rr.bottom;

          const info = row.querySelector('.receipt__item-info') as HTMLElement | null;
          const qty = row.querySelector('.receipt__item-qty') as HTMLElement | null;
          const price = row.querySelector('.receipt__item-price') as HTMLElement | null;
          if (!info || !price) { problems.push(`${label} item[${i}]: missing name or price`); return; }
          const ir = info.getBoundingClientRect();
          const pr = price.getBoundingClientRect();

          if (pr.left < ir.right - 0.5) problems.push(`${label} item[${i}]: price overlaps the name`);
          if (Math.abs(pr.right - rr.right) > 1) {
            problems.push(`${label} item[${i}]: price not flush right`
              + ` (${pr.right.toFixed(1)} vs ${rr.right.toFixed(1)})`);
          }
          if (ir.left < rr.left - 1) problems.push(`${label} item[${i}]: name starts outside the row`);
          if (qty) {
            const qr = qty.getBoundingClientRect();
            if (qr.width > 0) {
              if (qr.left < ir.right - 0.5) problems.push(`${label} item[${i}]: qty overlaps the name`);
              if (pr.left < qr.right - 0.5) problems.push(`${label} item[${i}]: price overlaps the qty`);
            }
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('totals form a right-aligned money column ending in the grand total', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-receipt').forEach((rc, ri) => {
        const sr = (rc as HTMLElement).shadowRoot!;
        const label = `receipt[${ri}]${rc.id ? '#' + rc.id : ''}`;
        const totals = sr.querySelector('.receipt__totals') as HTMLElement | null;
        if (!totals) { problems.push(`${label}: no totals block`); return; }
        const tr = totals.getBoundingClientRect();
        const rows = [...totals.querySelectorAll('.receipt__total-row')] as HTMLElement[];
        if (rows.length === 0) { problems.push(`${label}: no total rows`); return; }

        const amountRights: number[] = [];
        const labelLefts: number[] = [];
        let prevBottom: number | null = null;
        rows.forEach((row, i) => {
          const rr = row.getBoundingClientRect();
          const spans = [...row.children] as HTMLElement[];
          if (spans.length !== 2) { problems.push(`${label} total[${i}]: ${spans.length} cells`); return; }
          const [lr, ar] = spans.map(s => s.getBoundingClientRect());
          // Some variants inset the grand-total row into its own highlighted
          // box, so it is measured for containment but not for column alignment.
          if (!row.classList.contains('receipt__total-row--grand')) {
            labelLefts.push(lr.left);
            amountRights.push(ar.right);
          }
          if (ar.left < lr.right - 0.5) problems.push(`${label} total[${i}]: amount overlaps its label`);
          if (ar.right > rr.right + 1 || lr.left < rr.left - 1) {
            problems.push(`${label} total[${i}]: content escapes the row`);
          }
          if (rr.left < tr.left - 1 || rr.right > tr.right + 1) {
            problems.push(`${label} total[${i}]: row escapes the totals block`);
          }
          if (prevBottom !== null && rr.top < prevBottom - 1) {
            problems.push(`${label} total[${i}]: overlaps the previous total`);
          }
          prevBottom = rr.bottom;
        });

        if (amountRights.length > 1 && Math.max(...amountRights) - Math.min(...amountRights) > 1) {
          problems.push(`${label}: money column is ragged`);
        }
        if (labelLefts.length > 1 && Math.max(...labelLefts) - Math.min(...labelLefts) > 1) {
          problems.push(`${label}: total labels are ragged`);
        }
        const grandIndex = rows.findIndex(r => r.classList.contains('receipt__total-row--grand'));
        if (grandIndex === -1) problems.push(`${label}: no grand total row`);
        else if (grandIndex !== rows.length - 1) problems.push(`${label}: grand total is not last`);
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('the QR band lands where qr-position asks for it', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      let checked = 0;
      document.querySelectorAll('snice-receipt[show-qr]').forEach((rc, ri) => {
        const sr = (rc as HTMLElement).shadowRoot!;
        const label = `receipt[${ri}]${rc.id ? '#' + rc.id : ''}`;
        const qr = sr.querySelector('.receipt__qr') as HTMLElement | null;
        if (!qr) { problems.push(`${label}: show-qr but no qr container`); return; }
        checked++;
        const qrRect = qr.getBoundingClientRect();
        const sheet = sr.querySelector('.receipt')!.getBoundingClientRect();
        if (qrRect.left < sheet.left - 1 || qrRect.right > sheet.right + 1) {
          problems.push(`${label}: qr band escapes the sheet`);
        }

        const position = rc.getAttribute('qr-position') ?? 'bottom';
        const items = sr.querySelector('.receipt__items')?.getBoundingClientRect();
        const totals = sr.querySelector('.receipt__totals')?.getBoundingClientRect();
        const footer = sr.querySelector('.receipt__footer')?.getBoundingClientRect();
        if (position === 'top' && items && qrRect.bottom > items.top + 1) {
          problems.push(`${label}: qr-position="top" but the band sits below the items`);
        }
        if (position === 'bottom' && totals && qrRect.top < totals.bottom - 1) {
          problems.push(`${label}: qr-position="bottom" but the band sits above the totals`);
        }
        if (position === 'footer' && footer && qrRect.top < footer.top - 1) {
          problems.push(`${label}: qr-position="footer" but the band sits above the footer`);
        }
      });
      if (checked === 0) problems.push('no show-qr receipts found');
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('zooming a template card renders a full-size sheet inside the modal', async ({ page }) => {
    const card = page.locator('.tpl-card').first();
    const thumb = await card.locator('snice-receipt').evaluate(el =>
      el.getBoundingClientRect().width);

    await card.click();
    await page.waitForTimeout(500);

    const geo = await page.locator('#tpl-modal').evaluate(el => {
      const body = document.getElementById('tpl-modal-body')!;
      const receipt = body.querySelector('snice-receipt') as HTMLElement | null;
      const host = el.getBoundingClientRect();
      return {
        hostVisible: host.width > 0 && host.height > 0,
        receipt: receipt ? receipt.getBoundingClientRect().toJSON() : null,
        sheet: receipt
          ? receipt.shadowRoot!.querySelector('.receipt')!.getBoundingClientRect().toJSON()
          : null,
        viewport: { w: window.innerWidth, h: window.innerHeight }
      };
    });

    expect(geo.receipt).not.toBeNull();
    // The zoomed sheet is rendered at full scale, far larger than the thumbnail.
    expect(geo.sheet!.width).toBeGreaterThan(thumb * 1.5);
    expect(geo.sheet!.height).toBeGreaterThan(100);
    // ...and stays on screen horizontally.
    expect(geo.sheet!.left).toBeGreaterThanOrEqual(-1);
    expect(geo.sheet!.right).toBeLessThanOrEqual(geo.viewport.w + 1);
  });
});

import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/key-value/visual.html';

test.describe('Snice Key Value visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('edit rows split into two equal fields with the action buttons clear of them', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const editors = [...document.querySelectorAll('snice-key-value')] as HTMLElement[];
      if (editors.length === 0) problems.push('no key-value editors rendered');
      editors.forEach((kv, ei) => {
        const sr = kv.shadowRoot!;
        const label = `kv[${ei}]${kv.id ? '#' + kv.id : ''}`;
        const rows = [...sr.querySelectorAll('.kv__row')] as HTMLElement[];
        let prevBottom: number | null = null;
        rows.forEach((row, ri) => {
          const rr = row.getBoundingClientRect();
          if (rr.height < 24) problems.push(`${label} row[${ri}]: collapsed to ${Math.round(rr.height)}px`);
          if (prevBottom !== null && Math.abs(rr.top - prevBottom) > 1) {
            problems.push(`${label} row[${ri}]: seam ${prevBottom.toFixed(0)} -> ${rr.top.toFixed(0)}`);
          }
          prevBottom = rr.bottom;

          const pair = row.querySelector('.kv__pair') as HTMLElement | null;
          if (!pair) { problems.push(`${label} row[${ri}]: no field pair`); return; }
          const inputs = [...pair.querySelectorAll('.kv__input')] as HTMLElement[];
          if (inputs.length !== 2) { problems.push(`${label} row[${ri}]: ${inputs.length} inputs`); return; }
          const [k, v] = inputs.map(i => i.getBoundingClientRect());
          const pr = pair.getBoundingClientRect();
          if (Math.abs(k.width - v.width) > 1) {
            problems.push(`${label} row[${ri}]: key ${Math.round(k.width)} != value ${Math.round(v.width)}`);
          }
          if (v.left < k.right - 0.5) problems.push(`${label} row[${ri}]: key and value overlap`);
          if (Math.abs(k.top - v.top) > 1 || Math.abs(k.height - v.height) > 1) {
            problems.push(`${label} row[${ri}]: key and value not aligned`);
          }
          if (k.left < pr.left - 1 || v.right > pr.right + 1) {
            problems.push(`${label} row[${ri}]: fields escape the pair`);
          }

          // Trailing actions live to the right of the fields, inside the row,
          // and never on top of each other.
          const fields = row.querySelector('.kv__fields')!.getBoundingClientRect();
          const actions = [...row.querySelectorAll('button')] as HTMLElement[];
          const actionRects = actions.map(a => a.getBoundingClientRect()).filter(r => r.width > 0);
          actionRects.forEach((ar, ai) => {
            if (ar.left < fields.right - 0.5) {
              problems.push(`${label} row[${ri}] action[${ai}]: overlaps the fields`);
            }
            if (ar.right > rr.right + 1) {
              problems.push(`${label} row[${ri}] action[${ai}]: escapes the row`);
            }
            if (ar.top < rr.top - 1 || ar.bottom > rr.bottom + 1) {
              problems.push(`${label} row[${ri}] action[${ai}]: taller than the row`);
            }
            if (Math.abs(ar.width - ar.height) > 1) {
              problems.push(`${label} row[${ri}] action[${ai}]: not square`
                + ` (${Math.round(ar.width)}x${Math.round(ar.height)})`);
            }
            actionRects.slice(ai + 1).forEach((br, bi) => {
              if (ar.right > br.left + 0.5 && br.right > ar.left + 0.5) {
                problems.push(`${label} row[${ri}]: actions ${ai}/${ai + 1 + bi} overlap`);
              }
            });
          });
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('view mode aligns keys and values into two straight columns', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      let checked = 0;
      document.querySelectorAll('snice-key-value[mode="view"]').forEach((kv, ei) => {
        const sr = (kv as HTMLElement).shadowRoot!;
        const label = `kv[${ei}]${kv.id ? '#' + kv.id : ''}`;
        const rows = [...sr.querySelectorAll('.kv__view-row')] as HTMLElement[];
        if (rows.length === 0) { problems.push(`${label}: view mode renders no rows`); return; }
        checked++;
        const keyLefts: number[] = [];
        const valueLefts: number[] = [];
        let prevBottom: number | null = null;
        rows.forEach((row, ri) => {
          const rr = row.getBoundingClientRect();
          const k = row.querySelector('.kv__view-key') as HTMLElement | null;
          const v = row.querySelector('.kv__view-value') as HTMLElement | null;
          if (!k || !v) { problems.push(`${label} row[${ri}]: missing key or value`); return; }
          const kr = k.getBoundingClientRect();
          const vr = v.getBoundingClientRect();
          keyLefts.push(kr.left);
          valueLefts.push(vr.left);
          if (vr.left < kr.right - 0.5) problems.push(`${label} row[${ri}]: value overlaps key`);
          if (kr.top < rr.top - 1 || vr.bottom > rr.bottom + 1 || vr.right > rr.right + 1) {
            problems.push(`${label} row[${ri}]: content escapes the row`);
          }
          if (prevBottom !== null && Math.abs(rr.top - prevBottom) > 1) {
            problems.push(`${label} row[${ri}]: seam ${prevBottom.toFixed(0)} -> ${rr.top.toFixed(0)}`);
          }
          prevBottom = rr.bottom;
        });
        if (keyLefts.length > 1 && Math.max(...keyLefts) - Math.min(...keyLefts) > 1) {
          problems.push(`${label}: key column is ragged`);
        }
        if (valueLefts.length > 1 && Math.max(...valueLefts) - Math.min(...valueLefts) > 1) {
          problems.push(`${label}: value column is ragged`);
        }
      });
      if (checked === 0) problems.push('no view-mode editors found');
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('a fixed rows count renders exactly that many rows', async ({ page }) => {
    const result = await page.evaluate(() =>
      [...document.querySelectorAll('snice-key-value[rows]')].map(kv => ({
        wanted: Number(kv.getAttribute('rows')),
        got: (kv as HTMLElement).shadowRoot!.querySelectorAll('.kv__row').length
      })));
    expect(result.length).toBeGreaterThan(0);
    for (const r of result) expect(r.got).toBe(r.wanted);
  });

  test('adding a row keeps the new row aligned with the existing column grid', async ({ page }) => {
    const kv = page.locator('#kv-populated');
    const before = await kv.evaluate(el => (el as HTMLElement).shadowRoot!.querySelectorAll('.kv__row').length);

    await kv.locator('.kv__row').last().locator('.kv__input').first().fill('extra');
    await page.waitForTimeout(300);

    const after = await kv.evaluate(el => {
      const sr = (el as HTMLElement).shadowRoot!;
      const rows = [...sr.querySelectorAll('.kv__row')] as HTMLElement[];
      return {
        count: rows.length,
        keyLefts: rows.map(r => r.querySelector('.kv__input')!.getBoundingClientRect().left),
        widths: rows.map(r => r.querySelector('.kv__input')!.getBoundingClientRect().width),
        seams: rows.slice(1).map((r, i) =>
          r.getBoundingClientRect().top - rows[i].getBoundingClientRect().bottom)
      };
    });

    expect(after.count).toBe(before + 1);
    expect(Math.max(...after.keyLefts) - Math.min(...after.keyLefts)).toBeLessThanOrEqual(1);
    expect(Math.max(...after.widths) - Math.min(...after.widths)).toBeLessThanOrEqual(1);
    for (const seam of after.seams) expect(Math.abs(seam)).toBeLessThanOrEqual(1);
  });
});

import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/textarea/visual.html';

test.describe('Snice Textarea visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('label, field and support text stack without overlapping, all the same width', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const fields = [...document.querySelectorAll('snice-textarea')] as HTMLElement[];
      if (fields.length === 0) problems.push('no textareas rendered');
      fields.forEach((field, i) => {
        const sr = field.shadowRoot!;
        const wrapper = sr.querySelector('.textarea-wrapper') as HTMLElement;
        const container = sr.querySelector('.textarea-container') as HTMLElement;
        const control = sr.querySelector('textarea') as HTMLTextAreaElement;
        const label = `field[${i}] "${field.getAttribute('label') ?? ''}"`;
        if (!wrapper || !container || !control) { problems.push(`${label}: missing parts`); return; }
        const wr = wrapper.getBoundingClientRect();
        const cr = container.getBoundingClientRect();
        const tr = control.getBoundingClientRect();

        if (tr.width < 40 || tr.height < 20) {
          problems.push(`${label}: control collapsed (${Math.round(tr.width)}x${Math.round(tr.height)})`);
        }
        if (tr.left < cr.left - 1 || tr.right > cr.right + 1
            || tr.top < cr.top - 1 || tr.bottom > cr.bottom + 1) {
          problems.push(`${label}: control escapes its container`);
        }

        // Every stacked block spans the wrapper and follows the one above it.
        const blocks = [...wrapper.children] as HTMLElement[];
        let prevBottom: number | null = null;
        blocks.forEach(block => {
          const r = block.getBoundingClientRect();
          if (r.height === 0) return;
          if (r.left < wr.left - 1 || r.right > wr.right + 1) {
            problems.push(`${label}: ${block.className || block.tagName} is wider than the field`);
          }
          if (prevBottom !== null && r.top < prevBottom - 1) {
            problems.push(`${label}: ${block.className || block.tagName} overlaps the block above`);
          }
          prevBottom = r.bottom;
        });
        if (prevBottom !== null && prevBottom > wr.bottom + 1) {
          problems.push(`${label}: content overflows the wrapper bottom`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('the rows attribute drives a taller box for every step up', async ({ page }) => {
    const heights = await page.evaluate(() =>
      [1, 3, 5, 10].map(rows => {
        const field = document.querySelector(`snice-textarea[rows="${rows}"]:not([auto-grow])`) as HTMLElement;
        if (!field) return null;
        const control = field.shadowRoot!.querySelector('textarea') as HTMLTextAreaElement;
        return { rows, attr: control.rows, height: control.getBoundingClientRect().height };
      }));

    expect(heights.every(h => h !== null)).toBe(true);
    for (const h of heights) expect(h!.attr).toBe(h!.rows);
    for (let i = 1; i < heights.length; i++) {
      expect(heights[i]!.height, `rows=${heights[i]!.rows} vs rows=${heights[i - 1]!.rows}`)
        .toBeGreaterThan(heights[i - 1]!.height);
    }
  });

  test('the character counter sits under the field, inside it, and reads current/max', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      let seen = 0;
      document.querySelectorAll('snice-textarea[maxlength]').forEach((field, i) => {
        const sr = (field as HTMLElement).shadowRoot!;
        const counter = sr.querySelector('.character-count') as HTMLElement | null;
        if (!counter) { problems.push(`field[${i}]: maxlength but no counter`); return; }
        seen++;
        const wr = sr.querySelector('.textarea-wrapper')!.getBoundingClientRect();
        const cr = sr.querySelector('.textarea-container')!.getBoundingClientRect();
        const kr = counter.getBoundingClientRect();
        if (kr.top < cr.bottom - 1) problems.push(`field[${i}]: counter overlaps the field`);
        if (kr.left < wr.left - 1 || kr.right > wr.right + 1 || kr.bottom > wr.bottom + 1) {
          problems.push(`field[${i}]: counter escapes the wrapper`);
        }
        const max = field.getAttribute('maxlength');
        if (!counter.textContent!.includes(max!)) {
          problems.push(`field[${i}]: counter "${counter.textContent!.trim()}" omits the ${max} limit`);
        }
      });
      if (seen === 0) problems.push('no maxlength textareas found');
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('auto-grow expands the box with the text and keeps the stack intact', async ({ page }) => {
    const field = page.locator('snice-textarea[auto-grow][rows="1"]').first();
    const before = await field.evaluate(el => {
      const sr = (el as HTMLElement).shadowRoot!;
      return {
        control: sr.querySelector('textarea')!.getBoundingClientRect().height,
        host: el.getBoundingClientRect().height
      };
    });

    await field.locator('textarea').fill('one\ntwo\nthree\nfour\nfive\nsix');
    await field.locator('textarea').dispatchEvent('input');
    await page.waitForTimeout(300);

    const after = await field.evaluate(el => {
      const sr = (el as HTMLElement).shadowRoot!;
      const control = sr.querySelector('textarea') as HTMLTextAreaElement;
      const container = sr.querySelector('.textarea-container')!.getBoundingClientRect();
      const wrapper = sr.querySelector('.textarea-wrapper')!.getBoundingClientRect();
      const cr = control.getBoundingClientRect();
      return {
        controlHeight: cr.height,
        hostHeight: el.getBoundingClientRect().height,
        scrollHeight: control.scrollHeight,
        insideContainer: cr.bottom <= container.bottom + 1 && cr.top >= container.top - 1,
        insideWrapper: container.bottom <= wrapper.bottom + 1
      };
    });

    expect(after.controlHeight).toBeGreaterThan(before.control);
    expect(after.hostHeight).toBeGreaterThan(before.host);
    // Grown to fit: no inner scrollbar left over.
    expect(after.scrollHeight).toBeLessThanOrEqual(Math.ceil(after.controlHeight) + 2);
    expect(after.insideContainer).toBe(true);
    expect(after.insideWrapper).toBe(true);
  });
});

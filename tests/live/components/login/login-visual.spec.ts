import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/login/demo.html';

test.describe('Snice Login visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-login'));
    await page.waitForTimeout(300);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('fields stack label-over-input and share one column inside the form', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-login').forEach((login, i) => {
        const id = login.getAttribute('title') || `login[${i}]`;
        const root = (login as HTMLElement).shadowRoot;
        if (!root) { problems.push(`${id}: no shadow root`); return; }
        const form = root.querySelector('.login__form') as HTMLElement | null;
        if (!form) { problems.push(`${id}: no form`); return; }
        const formRect = form.getBoundingClientRect();
        const fields = [...root.querySelectorAll('.login__field')] as HTMLElement[];
        if (fields.length !== 2) { problems.push(`${id}: ${fields.length} fields, expected 2`); return; }

        const inputRects: DOMRect[] = [];
        fields.forEach((field, f) => {
          const label = field.querySelector('.login__label') as HTMLElement;
          const input = field.querySelector('.login__input') as HTMLElement;
          if (!label || !input) { problems.push(`${id} field ${f}: missing label/input`); return; }
          const lr = label.getBoundingClientRect();
          const ir = input.getBoundingClientRect();
          inputRects.push(ir);

          if (lr.bottom > ir.top + 1) {
            problems.push(`${id} field ${f}: label overlaps its input`);
          }
          if (Math.abs(lr.left - ir.left) > 1) {
            problems.push(`${id} field ${f}: label left ${Math.round(lr.left)} != input ${Math.round(ir.left)}`);
          }
          if (ir.height < 24) {
            problems.push(`${id} field ${f}: input only ${Math.round(ir.height)}px tall`);
          }
          if (ir.left < formRect.left - 1 || ir.right > formRect.right + 1) {
            problems.push(`${id} field ${f}: input overhangs the form box`);
          }
        });

        // Username and password share one column: same left edge and width.
        if (inputRects.length === 2) {
          if (Math.abs(inputRects[0].left - inputRects[1].left) > 1
            || Math.abs(inputRects[0].width - inputRects[1].width) > 1) {
            problems.push(`${id}: the two inputs are not in one column`);
          }
          if (inputRects[1].top < inputRects[0].bottom - 1) {
            problems.push(`${id}: password field overlaps the username field`);
          }
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('remember-me and forgot-password sit on one row at opposite edges', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-login').forEach((login, i) => {
        const id = login.getAttribute('title') || `login[${i}]`;
        const root = (login as HTMLElement).shadowRoot;
        const options = root?.querySelector('.login__options') as HTMLElement | null;
        if (!options) return; // "Both options hidden" variant
        const optRect = options.getBoundingClientRect();
        const remember = options.querySelector('.login__remember') as HTMLElement | null;
        const forgot = options.querySelector('.login__forgot') as HTMLElement | null;

        [['remember', remember], ['forgot', forgot]].forEach(([name, el]) => {
          if (!el) return;
          const r = (el as HTMLElement).getBoundingClientRect();
          if (r.left < optRect.left - 1 || r.right > optRect.right + 1
            || r.top < optRect.top - 1 || r.bottom > optRect.bottom + 1) {
            problems.push(`${id}: ${name} escapes the options row`);
          }
        });

        if (remember && forgot) {
          const rr = remember.getBoundingClientRect();
          const fr = forgot.getBoundingClientRect();
          if (fr.left < rr.right) {
            problems.push(`${id}: forgot-password overlaps remember-me`);
          }
          // space-between: remember hugs the left edge, forgot the right.
          if (Math.abs(rr.left - optRect.left) > 1) {
            problems.push(`${id}: remember-me not flush left`);
          }
          if (Math.abs(fr.right - optRect.right) > 1) {
            problems.push(`${id}: forgot-password not flush right`);
          }
          // Vertically centred against each other.
          const dy = (rr.top + rr.height / 2) - (fr.top + fr.height / 2);
          if (Math.abs(dy) > 1.5) {
            problems.push(`${id}: options row misaligned by ${dy.toFixed(1)}px`);
          }
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('typing a long username does not widen or overflow the form', async ({ page }) => {
    const target = page.locator('snice-login').first();
    const before = await target.evaluate(el =>
      (el as HTMLElement).shadowRoot!.querySelector('.login__form')!.getBoundingClientRect().width);

    await target.evaluate(el => {
      const input = (el as HTMLElement).shadowRoot!
        .querySelector('input[name="username"]') as HTMLInputElement;
      input.focus();
    });
    await page.keyboard.type('a-very-long-username-that-should-scroll-inside-the-input-box');

    const after = await target.evaluate(el => {
      const root = (el as HTMLElement).shadowRoot!;
      const form = root.querySelector('.login__form')!.getBoundingClientRect();
      const input = root.querySelector('input[name="username"]')!.getBoundingClientRect();
      return { formWidth: form.width, inputRight: input.right, formRight: form.right };
    });

    expect(Math.abs(after.formWidth - before)).toBeLessThanOrEqual(1);
    expect(after.inputRight).toBeLessThanOrEqual(after.formRight + 1);
  });
});

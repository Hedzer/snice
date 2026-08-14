import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/comments/demo.html';

test.describe('Snice Comments visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-comments'));
    await page.waitForFunction(() => {
      const threaded = document.querySelector('#comments-threaded') as any;
      return threaded?.shadowRoot?.querySelectorAll('.comment').length >= 4;
    });
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  // A comment is an avatar column beside a body column. The avatar must be a
  // sanely-sized square badge, the body must start to its right without
  // overlapping it, and text/actions must stay inside the comment box.
  test('avatar and body columns are sized and do not overlap', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-comments').forEach((host, hi) => {
        const root = (host as any).shadowRoot as ShadowRoot | null;
        if (!root) return;
        root.querySelectorAll('.comment').forEach((comment, ci) => {
          const cr = comment.getBoundingClientRect();
          if (cr.width === 0) return;
          const avatar = comment.querySelector(':scope > .comment__avatar') as HTMLElement | null;
          const body = comment.querySelector(':scope > .comment__body') as HTMLElement | null;
          if (!avatar || !body) { problems.push(`c[${hi}][${ci}]: missing avatar/body`); return; }
          const ar = avatar.getBoundingClientRect();
          const br = body.getBoundingClientRect();

          if (ar.width < 16 || ar.width > 64 || Math.abs(ar.width - ar.height) > 1) {
            problems.push(`c[${hi}][${ci}]: avatar ${Math.round(ar.width)}x${Math.round(ar.height)}`);
          }
          if (br.left < ar.right - 1) {
            problems.push(`c[${hi}][${ci}]: body overlaps avatar (${Math.round(br.left)} < ${Math.round(ar.right)})`);
          }
          if (br.right > cr.right + 1) {
            problems.push(`c[${hi}][${ci}]: body escapes comment box`);
          }
          const text = body.querySelector('.comment__text') as HTMLElement | null;
          if (text) {
            const tr = text.getBoundingClientRect();
            if (tr.right > br.right + 1 || tr.left < br.left - 1) {
              problems.push(`c[${hi}][${ci}]: text escapes body`);
            }
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  // The threaded demo nests 3 deep. Each reply level must be indented to the
  // right of its parent and stay inside the parent's box.
  test('nested replies indent progressively and stay inside the parent', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const root = (document.querySelector('#comments-threaded') as any).shadowRoot as ShadowRoot;
      const walk = (comment: Element, depth: number) => {
        const cr = comment.getBoundingClientRect();
        const replies = comment.querySelector(':scope > .comment__body > .comment__replies');
        if (!replies) return;
        [...replies.children].filter(el => el.classList.contains('comment')).forEach(child => {
          const rr = child.getBoundingClientRect();
          if (rr.left <= cr.left + 1) {
            problems.push(`depth ${depth + 1}: reply not indented (${Math.round(rr.left)} vs parent ${Math.round(cr.left)})`);
          }
          if (rr.right > cr.right + 1) {
            problems.push(`depth ${depth + 1}: reply overflows parent right edge`);
          }
          walk(child, depth + 1);
        });
      };
      const tops = [...root.querySelectorAll('.comments__list > .comment')];
      if (tops.length === 0) problems.push('no top-level comments');
      tops.forEach(c => walk(c, 0));
      // The threaded demo must actually reach depth 2 (Alice > Bob > Alice).
      const deepest = root.querySelectorAll('.comment__replies .comment__replies .comment').length;
      if (deepest === 0) problems.push('expected a depth-2 reply in the threaded demo');
      return problems;
    });
    expect(failures).toEqual([]);
  });

  // Clicking Reply opens an inline composer: it must have usable size and sit
  // under the comment it belongs to, inside that comment's body column.
  test('reply composer opens at a usable size under its comment', async ({ page }) => {
    await page.evaluate(() => {
      const root = (document.querySelector('#comments-threaded') as any).shadowRoot as ShadowRoot;
      const btn = [...root.querySelectorAll('.comment__action')]
        .find(b => b.textContent?.includes('Reply')) as HTMLElement;
      btn.click();
    });
    await page.waitForFunction(() => {
      const root = (document.querySelector('#comments-threaded') as any).shadowRoot as ShadowRoot;
      return !!root.querySelector('.comment__reply-input');
    });

    const geometry = await page.evaluate(() => {
      const root = (document.querySelector('#comments-threaded') as any).shadowRoot as ShadowRoot;
      const panel = root.querySelector('.comment__reply-input') as HTMLElement;
      const body = panel.closest('.comment__body') as HTMLElement;
      const textarea = panel.querySelector('textarea') as HTMLElement;
      const p = panel.getBoundingClientRect();
      const b = body.getBoundingClientRect();
      const t = textarea.getBoundingClientRect();
      return {
        panelWidth: p.width, panelHeight: p.height,
        textareaWidth: t.width, textareaHeight: t.height,
        insideBody: p.left >= b.left - 1 && p.right <= b.right + 1,
        belowText: p.top >= (body.querySelector('.comment__text') as HTMLElement)
          .getBoundingClientRect().bottom - 1
      };
    });

    expect(geometry.panelWidth).toBeGreaterThan(120);
    expect(geometry.panelHeight).toBeGreaterThan(30);
    expect(geometry.textareaWidth).toBeGreaterThan(80);
    expect(geometry.textareaHeight).toBeGreaterThan(20);
    expect(geometry.insideBody).toBe(true);
    expect(geometry.belowText).toBe(true);
  });
});

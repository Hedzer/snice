import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/markdown/visual.html';

test.describe('Snice Markdown visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  // BUG: GFM task lists render as orphan <li class="task-list-item"> elements
  // with no <ul> wrapper, and the stylesheet's `margin-left: -24px` (written to
  // pull a task item back inside a list's padding) then drags every task row
  // 24px left of the markdown body, out over the card's border — measured
  // li.left = 25 against body.left = 49, while a normal <ul> <li> sits at 81.
  // The same parser gap also drops the checkbox entirely (`- [x]` and `- [ ]`
  // both render as bare text), so done and pending tasks look identical.
  test.fixme('every rendered block stays inside the markdown body box', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const hosts = [...document.querySelectorAll('snice-markdown')] as HTMLElement[];
      if (hosts.length === 0) problems.push('no markdown hosts rendered');

      hosts.forEach((host, i) => {
        const body = host.shadowRoot?.querySelector('.markdown-body') as HTMLElement | null;
        if (!body) { problems.push(`md[${i}]: no .markdown-body`); return; }
        const br = body.getBoundingClientRect();
        if (br.width === 0) return;

        [...body.children].forEach(child => {
          const el = child as HTMLElement;
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return;
          if (r.right > br.right + 1 || r.left < br.left - 1) {
            problems.push(`md[${i}] <${el.tagName.toLowerCase()}>: `
              + `${Math.round(r.left)}-${Math.round(r.right)} outside body `
              + `${Math.round(br.left)}-${Math.round(br.right)}`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('wide blocks scroll inside their own box instead of stretching the body', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-markdown').forEach((host, i) => {
        const body = host.shadowRoot?.querySelector('.markdown-body') as HTMLElement | null;
        if (!body) return;
        const br = body.getBoundingClientRect();
        if (br.width === 0) return;

        [...body.children].forEach(child => {
          const el = child as HTMLElement;
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return;
          // Code blocks and tables must clip/scroll themselves rather than
          // pushing content past their visible box.
          if (el.scrollWidth > Math.ceil(r.width) + 1
              && getComputedStyle(el).overflowX === 'visible') {
            problems.push(`md[${i}] <${el.tagName.toLowerCase()}>: content ${el.scrollWidth}px `
              + `in a ${Math.round(r.width)}px box with overflow-x:visible`);
          }
        });

        if (body.scrollWidth > Math.ceil(br.width) + 1) {
          problems.push(`md[${i}]: body scrolls horizontally (${body.scrollWidth} > ${Math.round(br.width)})`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('GFM table cells line up in columns under their headers', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      let tables = 0;
      document.querySelectorAll('snice-markdown').forEach((host, i) => {
        host.shadowRoot?.querySelectorAll('table').forEach((table, ti) => {
          tables++;
          const headers = [...table.querySelectorAll('thead th')] as HTMLElement[];
          const rows = [...table.querySelectorAll('tbody tr')] as HTMLTableRowElement[];
          if (headers.length === 0) { problems.push(`md[${i}] table[${ti}]: no header row`); return; }
          rows.forEach((row, ri) => {
            const cells = [...row.querySelectorAll('td')] as HTMLElement[];
            if (cells.length !== headers.length) {
              problems.push(`md[${i}] table[${ti}] row[${ri}]: ${cells.length} cells vs ${headers.length} headers`);
              return;
            }
            cells.forEach((cell, ci) => {
              const cr = cell.getBoundingClientRect();
              const hr = headers[ci].getBoundingClientRect();
              if (Math.abs(cr.left - hr.left) > 1 || Math.abs(cr.right - hr.right) > 1) {
                problems.push(`md[${i}] table[${ti}] row[${ri}] col[${ci}]: misaligned with its header`);
              }
            });
            if (ri > 0) {
              const prev = rows[ri - 1].getBoundingClientRect();
              if (Math.abs(row.getBoundingClientRect().top - prev.bottom) > 1) {
                problems.push(`md[${i}] table[${ti}] row[${ri}]: row seam gap/overlap`);
              }
            }
          });
        });
      });
      if (tables === 0) problems.push('no GFM tables rendered — showcase includes table markdown');
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('heading sizes descend h1 through h6 and images are constrained to the body width', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];

      // The "Headings (h1-h6)" showcase renders one of each level.
      const hostWithAll = ([...document.querySelectorAll('snice-markdown')] as HTMLElement[])
        .find(h => h.shadowRoot?.querySelector('h6'));
      if (!hostWithAll) problems.push('no markdown host rendering h1-h6');
      else {
        const sizes = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map(t => {
          const el = hostWithAll.shadowRoot!.querySelector(t) as HTMLElement | null;
          return el ? parseFloat(getComputedStyle(el).fontSize) : NaN;
        });
        sizes.forEach((s, i) => {
          if (Number.isNaN(s)) problems.push(`missing h${i + 1}`);
        });
        for (let i = 1; i < sizes.length; i++) {
          if (!(sizes[i] <= sizes[i - 1])) {
            problems.push(`h${i + 1} (${sizes[i]}px) is larger than h${i} (${sizes[i - 1]}px)`);
          }
        }
        if (sizes[0] <= sizes[5]) problems.push('h1 is not larger than h6');
      }

      let images = 0;
      document.querySelectorAll('snice-markdown').forEach((host, i) => {
        const body = host.shadowRoot?.querySelector('.markdown-body') as HTMLElement | null;
        if (!body) return;
        body.querySelectorAll('img').forEach(img => {
          images++;
          const ir = img.getBoundingClientRect();
          const br = body.getBoundingClientRect();
          if (ir.width === 0 || ir.height === 0) {
            problems.push(`md[${i}] img: rendered ${Math.round(ir.width)}x${Math.round(ir.height)}`);
          }
          if (ir.right > br.right + 1 || ir.left < br.left - 1) {
            problems.push(`md[${i}] img: escapes the body box`);
          }
        });
      });
      if (images === 0) problems.push('no images rendered — showcase includes an image');
      return problems;
    });
    expect(failures).toEqual([]);
  });
});

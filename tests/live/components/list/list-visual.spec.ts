import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/list/visual.html';

test.describe('Snice List visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-list-item'));
    await page.waitForTimeout(400);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('rows tile the list: full width, abutting, inside the container', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const lists = [...document.querySelectorAll('snice-list')] as any[];
      if (lists.length === 0) problems.push('no lists');

      lists.forEach((list, i) => {
        const container = list.shadowRoot?.querySelector('.list') as HTMLElement | null;
        if (!container) { problems.push(`list[${i}]: no container`); return; }
        const cr = container.getBoundingClientRect();
        const items = [...list.querySelectorAll(':scope > snice-list-item')] as HTMLElement[];
        if (items.length === 0) return; // skeleton/loading variants

        let prevBottom: number | null = null;
        items.forEach((item, n) => {
          const r = item.getBoundingClientRect();
          if (r.height === 0) return; // filtered out by search
          if (r.height < 24) problems.push(`list[${i}] item ${n}: height ${Math.round(r.height)}`);
          // Rows span the list rather than floating inside it.
          if (Math.abs(r.width - cr.width) > 2) {
            problems.push(`list[${i}] item ${n}: width ${Math.round(r.width)}`
              + ` vs container ${Math.round(cr.width)}`);
          }
          if (r.left < cr.left - 1 || r.right > cr.right + 1 || r.bottom > cr.bottom + 1) {
            problems.push(`list[${i}] item ${n}: escapes the container`);
          }
          if (prevBottom !== null && Math.abs(r.top - prevBottom) > 1.5) {
            problems.push(`list[${i}] item ${n}: row seam gap ${Math.round(r.top - prevBottom)}px`);
          }
          prevBottom = r.bottom;

          // The rendered row must fill its host, and the text column must stay
          // inside the row.
          const inner = (item as any).shadowRoot?.querySelector('.list-item') as HTMLElement | null;
          const content = (item as any).shadowRoot
            ?.querySelector('.list-item__content') as HTMLElement | null;
          if (!inner || !content) { problems.push(`list[${i}] item ${n}: missing inner nodes`); return; }
          const ir = inner.getBoundingClientRect();
          if (Math.abs(ir.width - r.width) > 1 || Math.abs(ir.height - r.height) > 1) {
            problems.push(`list[${i}] item ${n}: inner ${Math.round(ir.width)}x${Math.round(ir.height)}`
              + ` != host ${Math.round(r.width)}x${Math.round(r.height)}`);
          }
          const cor = content.getBoundingClientRect();
          if (cor.left < ir.left - 1 || cor.right > ir.right + 1
              || cor.top < ir.top - 1 || cor.bottom > ir.bottom + 1) {
            problems.push(`list[${i}] item ${n}: content escapes the row`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('leading slot content is vertically centred in its row', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const items = [...document.querySelectorAll('snice-list-item')] as HTMLElement[];
      let checked = 0;
      items.forEach((item, n) => {
        const before = item.querySelector('[slot="before"]') as HTMLElement | null;
        if (!before) return;
        const r = item.getBoundingClientRect();
        const br = before.getBoundingClientRect();
        if (r.height === 0 || br.height === 0) return;
        checked++;
        const dy = (br.top + br.height / 2) - (r.top + r.height / 2);
        if (Math.abs(dy) > 2) {
          problems.push(`item ${n}: leading slot off-centre by ${Math.round(dy)}px`);
        }
        if (br.left < r.left - 1 || br.right > r.right + 1) {
          problems.push(`item ${n}: leading slot escapes the row`);
        }
      });
      if (checked === 0) problems.push('no leading-slot items found');
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('search box spans the list and sits above the first row', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const lists = [...document.querySelectorAll('snice-list[searchable]')] as any[];
      if (lists.length === 0) problems.push('no searchable lists');

      lists.forEach((list, i) => {
        const container = list.shadowRoot?.querySelector('.list') as HTMLElement | null;
        const search = list.shadowRoot?.querySelector('.list__search') as HTMLElement | null;
        const input = list.shadowRoot?.querySelector('.list__search-input') as HTMLElement | null;
        if (!container || !search || !input) {
          problems.push(`searchable[${i}]: missing search chrome`); return;
        }
        const cr = container.getBoundingClientRect();
        const sr = search.getBoundingClientRect();
        const ir = input.getBoundingClientRect();
        if (Math.abs(sr.width - cr.width) > 1) {
          problems.push(`searchable[${i}]: search bar width ${Math.round(sr.width)}`
            + ` vs container ${Math.round(cr.width)}`);
        }
        if (Math.abs(sr.top - cr.top) > 1) {
          problems.push(`searchable[${i}]: search bar is not at the top of the list`);
        }
        if (ir.height < 20) problems.push(`searchable[${i}]: input height ${Math.round(ir.height)}`);
        if (ir.left < sr.left - 1 || ir.right > sr.right + 1
            || ir.top < sr.top - 1 || ir.bottom > sr.bottom + 1) {
          problems.push(`searchable[${i}]: input escapes the search bar`);
        }
        const first = list.querySelector(':scope > snice-list-item') as HTMLElement | null;
        if (first && first.getBoundingClientRect().height > 0
            && first.getBoundingClientRect().top < sr.bottom - 1) {
          problems.push(`searchable[${i}]: first row overlaps the search bar`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});

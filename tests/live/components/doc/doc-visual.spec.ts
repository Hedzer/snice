import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/doc/demo.html';

test.describe('Snice Doc visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('toolbar buttons form one contained strip above the editor', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-doc').forEach((host, i) => {
        const root = (host as HTMLElement).shadowRoot;
        const toolbar = root?.querySelector('.toolbar') as HTMLElement | null;
        const editor = root?.querySelector('.doc-editor') as HTMLElement | null;
        if (!toolbar) { problems.push(`doc[${i}]: no toolbar`); return; }
        if (!editor) { problems.push(`doc[${i}]: no editor`); return; }
        const tr = toolbar.getBoundingClientRect();
        const er = editor.getBoundingClientRect();

        if (er.top < tr.bottom - 1) {
          problems.push(`doc[${i}]: editor top ${Math.round(er.top)} overlaps toolbar bottom ${Math.round(tr.bottom)}`);
        }

        const buttons = [...toolbar.querySelectorAll('.toolbar-btn')] as HTMLElement[];
        if (buttons.length === 0) { problems.push(`doc[${i}]: toolbar has no buttons`); return; }
        const tops = new Set<number>();
        buttons.forEach((b, n) => {
          const r = b.getBoundingClientRect();
          if (r.width < 20 || r.height < 20) {
            problems.push(`doc[${i}] btn[${n}]: collapsed (${Math.round(r.width)}x${Math.round(r.height)})`);
          }
          if (r.left < tr.left - 1 || r.right > tr.right + 1
              || r.top < tr.top - 1 || r.bottom > tr.bottom + 1) {
            problems.push(`doc[${i}] btn[${n}] "${b.title}": escapes the toolbar`);
          }
          tops.add(Math.round(r.top));
        });
        // The showcase is wide enough for a single unwrapped toolbar row.
        if (tops.size > 1) {
          problems.push(`doc[${i}]: toolbar buttons on ${tops.size} rows (${[...tops].join(',')})`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('toolbar icons render at a sane size inside their button', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-doc').forEach((host, i) => {
        const root = (host as HTMLElement).shadowRoot;
        (root?.querySelectorAll('.toolbar-btn svg') as NodeListOf<SVGElement> | undefined)
          ?.forEach((svg, n) => {
            const btn = svg.closest('.toolbar-btn')!;
            const br = btn.getBoundingClientRect();
            const r = svg.getBoundingClientRect();
            if (r.width < 8 || r.height < 8) {
              problems.push(`doc[${i}] icon[${n}]: collapsed (${Math.round(r.width)}x${Math.round(r.height)})`);
            }
            if (r.width > br.width + 1 || r.height > br.height + 1) {
              problems.push(`doc[${i}] icon[${n}]: ${Math.round(r.width)}x${Math.round(r.height)}`
                + ` overflows its ${Math.round(br.width)}x${Math.round(br.height)} button`);
            }
          });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('typed content stays inside the editable area', async ({ page }) => {
    const host = page.locator('snice-doc').first();
    const editor = host.locator('.doc-editor');
    await editor.click();
    await page.keyboard.type('The quick brown fox jumps over the lazy dog. '.repeat(6));
    await page.waitForTimeout(150);

    const box = await page.evaluate(() => {
      const doc = document.querySelector('snice-doc')!;
      const root = doc.shadowRoot!;
      const wrapper = root.querySelector('.doc-wrapper')!.getBoundingClientRect();
      const editor = root.querySelector('.doc-editor') as HTMLElement;
      const er = editor.getBoundingClientRect();
      return {
        wrapper: { left: wrapper.left, right: wrapper.right },
        editor: { left: er.left, right: er.right, width: er.width },
        scrollWidth: editor.scrollWidth,
        clientWidth: editor.clientWidth,
      };
    });

    expect(box.editor.left).toBeGreaterThanOrEqual(box.wrapper.left - 1);
    expect(box.editor.right).toBeLessThanOrEqual(box.wrapper.right + 1);
    // Text must wrap, not run off horizontally.
    expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth + 1);
  });
});

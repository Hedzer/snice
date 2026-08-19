import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/file-gallery/visual.html';

test.describe('Snice File Gallery visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-file-gallery'));
    await page.waitForFunction(() =>
      !!document.querySelector('snice-file-gallery')?.shadowRoot?.querySelector('.file-gallery'));
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('drop zones span the component and keep their prompt centred inside', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-file-gallery').forEach((host: any, i) => {
        const zone = host.shadowRoot.querySelector('.drop-zone') as HTMLElement | null;
        if (host.getAttribute('show-dropzone') === 'false') {
          if (zone) problems.push(`gallery[${i}]: drop zone rendered despite show-dropzone="false"`);
          return;
        }
        if (!zone) { problems.push(`gallery[${i}]: no drop zone`); return; }
        const hr = host.getBoundingClientRect();
        const zr = zone.getBoundingClientRect();
        if (Math.abs(zr.width - hr.width) > 1) {
          problems.push(`gallery[${i}]: drop zone width ${Math.round(zr.width)} != host ${Math.round(hr.width)}`);
        }
        if (zr.height < 80) {
          problems.push(`gallery[${i}]: drop zone only ${Math.round(zr.height)}px tall`);
        }
        const content = zone.querySelector('.drop-zone-content') as HTMLElement;
        const cr = content.getBoundingClientRect();
        if (cr.left < zr.left - 1 || cr.right > zr.right + 1
            || cr.top < zr.top - 1 || cr.bottom > zr.bottom + 1) {
          problems.push(`gallery[${i}]: drop zone content escapes the dashed border`);
        }
        const dx = (cr.left + cr.width / 2) - (zr.left + zr.width / 2);
        if (Math.abs(dx) > 1.5) {
          problems.push(`gallery[${i}]: drop zone content off centre by ${dx.toFixed(1)}px`);
        }
        const icon = zone.querySelector('.drop-zone-icon') as SVGElement;
        const ir = icon.getBoundingClientRect();
        if (ir.width < 16 || ir.width > 96 || Math.abs(ir.width - ir.height) > 1) {
          problems.push(`gallery[${i}]: upload icon ${Math.round(ir.width)}x${Math.round(ir.height)} is not a sane square`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('grid view tiles added files into even rows with square previews', async ({ page }) => {
    const failures = await page.evaluate(async () => {
      const problems: string[] = [];
      const host = document.querySelector('snice-file-gallery[view="grid"]') as any;
      host.autoUpload = false;
      host.addFiles(Array.from({ length: 5 }, (_, n) =>
        new File([new Uint8Array(1024)], `doc-${n}.txt`, { type: 'text/plain' })));
      await host.rendered;
      await new Promise(r => requestAnimationFrame(() => r(null)));

      const gallery = host.shadowRoot.querySelector('.gallery') as HTMLElement;
      const items = [...gallery.querySelectorAll('.gallery-item')] as HTMLElement[];
      if (items.length !== 5) return [`expected 5 items, got ${items.length}`];

      const gr = gallery.getBoundingClientRect();
      const rects = items.map(el => el.getBoundingClientRect());

      // Equal widths across the auto-fill grid, and nothing overhangs.
      const widths = rects.map(r => Math.round(r.width));
      if (Math.max(...widths) - Math.min(...widths) > 1) {
        problems.push(`uneven grid item widths ${widths.join(',')}`);
      }
      rects.forEach((r, n) => {
        if (r.left < gr.left - 1 || r.right > gr.right + 1) {
          problems.push(`item[${n}] overhangs the gallery horizontally`);
        }
      });

      // Items sharing a row share their top edge and never overlap.
      const rows = new Map<number, DOMRect[]>();
      rects.forEach(r => {
        const key = Math.round(r.top);
        const bucket = [...rows.keys()].find(k => Math.abs(k - key) <= 1) ?? key;
        rows.set(bucket, [...(rows.get(bucket) ?? []), r]);
      });
      for (const [top, row] of rows) {
        const sorted = [...row].sort((a, b) => a.left - b.left);
        for (let n = 1; n < sorted.length; n++) {
          if (sorted[n].left < sorted[n - 1].right - 0.5) {
            problems.push(`row ${top}: items overlap`);
          }
        }
      }

      // Each preview is square and spans the item's full width.
      items.forEach((item, n) => {
        const p = item.querySelector('.gallery-item-preview')!.getBoundingClientRect();
        if (Math.abs(p.width - p.height) > 1) {
          problems.push(`item[${n}] preview not square (${Math.round(p.width)}x${Math.round(p.height)})`);
        }
        if (Math.abs(p.width - rects[n].width) > 3) {
          problems.push(`item[${n}] preview width ${Math.round(p.width)} != item ${Math.round(rects[n].width)}`);
        }
        // The file name must stay clipped inside its card, not spill out.
        const name = item.querySelector('.gallery-item-name')!.getBoundingClientRect();
        if (name.right > rects[n].right + 1 || name.left < rects[n].left - 1) {
          problems.push(`item[${n}] file name escapes the card`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('list view stacks full-width rows with a fixed square thumbnail', async ({ page }) => {
    const failures = await page.evaluate(async () => {
      const problems: string[] = [];
      const host = document.querySelector('snice-file-gallery[view="list"]') as any;
      host.autoUpload = false;
      host.addFiles(Array.from({ length: 3 }, (_, n) =>
        new File([new Uint8Array(2048)], `list-${n}.txt`, { type: 'text/plain' })));
      await host.rendered;
      await new Promise(r => requestAnimationFrame(() => r(null)));

      const gallery = host.shadowRoot.querySelector('.gallery') as HTMLElement;
      const items = [...gallery.querySelectorAll('.gallery-item')] as HTMLElement[];
      if (items.length !== 3) return [`expected 3 rows, got ${items.length}`];
      const gr = gallery.getBoundingClientRect();

      items.forEach((item, n) => {
        const r = item.getBoundingClientRect();
        if (Math.abs(r.width - gr.width) > 1) {
          problems.push(`row[${n}] width ${Math.round(r.width)} != gallery ${Math.round(gr.width)}`);
        }
        const p = item.querySelector('.gallery-item-preview')!.getBoundingClientRect();
        if (Math.abs(p.width - p.height) > 1) {
          problems.push(`row[${n}] thumbnail not square (${Math.round(p.width)}x${Math.round(p.height)})`);
        }
        if (p.width < 48 || p.width > 160) {
          problems.push(`row[${n}] thumbnail width ${Math.round(p.width)} outside sane range`);
        }
        if (p.top < r.top - 1 || p.bottom > r.bottom + 1) {
          problems.push(`row[${n}] thumbnail escapes the row`);
        }
      });
      // Rows stack in order without overlapping.
      for (let n = 1; n < items.length; n++) {
        const prev = items[n - 1].getBoundingClientRect();
        const cur = items[n].getBoundingClientRect();
        if (cur.top < prev.bottom - 0.5) problems.push(`row[${n}] overlaps row[${n - 1}]`);
      }
      return problems;
    });
    expect(failures).toEqual([]);
  });
});

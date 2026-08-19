import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/file-upload/visual.html';

test.describe('Snice File Upload visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('drop zone stacks label, area and help text without overlap, and grows with size', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const hosts = [...document.querySelectorAll('snice-file-upload')] as HTMLElement[];
      if (hosts.length === 0) problems.push('no file uploads rendered');

      const heightBySize: Record<string, number[]> = { small: [], medium: [], large: [] };

      hosts.forEach((host, i) => {
        const root = host.shadowRoot!;
        const area = root.querySelector('.upload-area') as HTMLElement | null;
        if (!area) { problems.push(`upload[${i}]: no .upload-area`); return; }
        const ar = area.getBoundingClientRect();
        const hr = host.getBoundingClientRect();
        if (ar.width === 0 || ar.height === 0) { problems.push(`upload[${i}]: area 0-sized`); return; }
        if (ar.left < hr.left - 1 || ar.right > hr.right + 1) {
          problems.push(`upload[${i}]: area overhangs host`);
        }

        // Vertical stack: label above the area, helper/error text below it.
        const label = root.querySelector('.label') as HTMLElement | null;
        if (label) {
          const lr = label.getBoundingClientRect();
          if (lr.height > 0 && lr.bottom > ar.top + 1) {
            problems.push(`upload[${i}]: label overlaps the drop area`);
          }
        }
        ['.helper-text', '.error-text'].forEach(sel => {
          const note = root.querySelector(sel) as HTMLElement | null;
          if (!note) return;
          const nr = note.getBoundingClientRect();
          if (nr.height === 0) return;
          if (nr.top < ar.bottom - 1) problems.push(`upload[${i}]: ${sel} overlaps the drop area`);
          if (nr.right > hr.right + 1) problems.push(`upload[${i}]: ${sel} overhangs host`);
        });

        // Drop-zone contents are horizontally centered on the area.
        const areaMid = ar.left + ar.width / 2;
        ['.upload-icon', '.upload-text', '.upload-button'].forEach(sel => {
          const el = area.querySelector(sel) as HTMLElement | null;
          if (!el) return;
          const r = el.getBoundingClientRect();
          if (r.width === 0) return;
          if (Math.abs((r.left + r.width / 2) - areaMid) > 2) {
            problems.push(`upload[${i}] ${sel}: not centered in the drop area`);
          }
          if (r.top < ar.top - 1 || r.bottom > ar.bottom + 1) {
            problems.push(`upload[${i}] ${sel}: escapes the drop area`);
          }
        });

        const size = host.getAttribute('size') ?? 'medium';
        if (heightBySize[size]) heightBySize[size].push(Math.round(ar.height));
      });

      // Padding scale must actually produce three distinct drop-zone heights.
      const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
      const s = heightBySize.small, m = heightBySize.medium, l = heightBySize.large;
      if (s.length && m.length && avg(s) >= avg(m)) {
        problems.push(`size scale broken: small ${avg(s)} >= medium ${avg(m)}`);
      }
      if (m.length && l.length && avg(m) >= avg(l)) {
        problems.push(`size scale broken: medium ${avg(m)} >= large ${avg(l)}`);
      }
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('a selected file renders a list row with a fixed-size icon and contained text', async ({ page }) => {
    await page.locator('#file-contract-control input[type=file]').setInputFiles({
      name: 'a-rather-long-attachment-filename.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('hello snice'),
    });
    await page.waitForTimeout(250);

    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const host = document.getElementById('file-contract-control') as HTMLElement;
      const root = host.shadowRoot!;
      const items = [...root.querySelectorAll('.file-item')] as HTMLElement[];
      if (items.length !== 1) { problems.push(`expected 1 file row, got ${items.length}`); return problems; }

      const item = items[0];
      const ir = item.getBoundingClientRect();
      const hr = host.getBoundingClientRect();
      if (ir.height < 24) problems.push(`file row only ${Math.round(ir.height)}px tall`);
      if (ir.right > hr.right + 1 || ir.left < hr.left - 1) problems.push('file row overhangs host');

      // The thumbnail/icon slot is a fixed 40px square.
      const glyph = item.querySelector('.file-preview, .file-icon') as HTMLElement | null;
      if (!glyph) problems.push('file row has no preview or icon');
      else {
        const gr = glyph.getBoundingClientRect();
        if (Math.abs(gr.width - 40) > 2 || Math.abs(gr.height - 40) > 2) {
          problems.push(`file glyph ${Math.round(gr.width)}x${Math.round(gr.height)}, expected 40x40`);
        }
        if (gr.top < ir.top - 1 || gr.bottom > ir.bottom + 1) problems.push('file glyph escapes its row');
      }

      // Name/size text sits right of the glyph and never runs under the remove button.
      const info = item.querySelector('.file-info') as HTMLElement | null;
      const remove = item.querySelector('.file-remove') as HTMLElement | null;
      if (info && remove) {
        const fr = info.getBoundingClientRect();
        const rr = remove.getBoundingClientRect();
        if (fr.right > rr.left + 1) problems.push('file name runs under the remove button');
        if (rr.right > ir.right + 1) problems.push('remove button overhangs the row');
      }
      return problems;
    });
    expect(failures).toEqual([]);
  });
});

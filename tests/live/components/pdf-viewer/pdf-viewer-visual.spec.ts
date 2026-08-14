import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/pdf-viewer/demo.html';

// The showcase pulls a sample PDF from mozilla.github.io. Every assertion here
// is written to hold in the loaded, the empty, and the error state so the spec
// is not a network test.
test.describe('Snice PDF Viewer visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-pdf-viewer'));
    await page.waitForFunction(() => [...document.querySelectorAll('snice-pdf-viewer')]
      .every(v => !!v.shadowRoot?.querySelector('.pdf-toolbar')));
    await page.waitForTimeout(500);
  });

  // Fails on the same genuine bug documented below: `.pdf-container` grows past
  // the host, so the shared "content escapes its host" invariant is a TRUE
  // positive here, not an overlay/portal false positive.
  test.fixme('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('toolbar controls are sanely sized and laid out inside the toolbar band', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const viewers = [...document.querySelectorAll('snice-pdf-viewer')] as HTMLElement[];
      if (viewers.length === 0) problems.push('no snice-pdf-viewer on page');

      viewers.forEach((v, i) => {
        const root = v.shadowRoot!;
        const bar = root.querySelector('.pdf-toolbar');
        const viewport = root.querySelector('.pdf-viewport');
        if (!bar || !viewport) { problems.push(`viewer[${i}]: missing toolbar/viewport`); return; }
        const b = bar.getBoundingClientRect();
        const vp = viewport.getBoundingClientRect();

        if (b.height < 32 || b.height > 72) {
          problems.push(`viewer[${i}]: toolbar height ${Math.round(b.height)} out of range`);
        }
        // Toolbar band and viewport must abut with no seam and no overlap.
        if (Math.abs(vp.top - b.bottom) > 1) {
          problems.push(`viewer[${i}]: seam between toolbar (${Math.round(b.bottom)}) `
            + `and viewport (${Math.round(vp.top)})`);
        }

        [...root.querySelectorAll('.pdf-btn')].forEach((btn, n) => {
          const r = btn.getBoundingClientRect();
          if (r.width < 24 || r.height < 24) {
            problems.push(`viewer[${i}] btn ${n}: ${Math.round(r.width)}x${Math.round(r.height)} too small`);
          }
          if (r.top < b.top - 1 || r.bottom > b.bottom + 1
              || r.left < b.left - 1 || r.right > b.right + 1) {
            problems.push(`viewer[${i}] btn ${n}: escapes the toolbar band`);
          }
          const icon = btn.querySelector('svg');
          if (icon) {
            const ir = icon.getBoundingClientRect();
            if (ir.width < 10 || ir.width > r.width || ir.height > r.height) {
              problems.push(`viewer[${i}] btn ${n}: icon ${Math.round(ir.width)}x${Math.round(ir.height)} `
                + `does not fit its ${Math.round(r.width)}x${Math.round(r.height)} button`);
            }
            const dx = (ir.left + ir.width / 2) - (r.left + r.width / 2);
            const dy = (ir.top + ir.height / 2) - (r.top + r.height / 2);
            if (Math.abs(dx) > 1.5 || Math.abs(dy) > 1.5) {
              problems.push(`viewer[${i}] btn ${n}: icon off-centre by `
                + `${dx.toFixed(1)},${dy.toFixed(1)}`);
            }
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  // BUG: `.pdf-container` is a flex column with no height constraint, so it
  // never picks up the host's height. `.pdf-viewport { flex: 1; overflow: auto;
  // min-height: 30rem }` therefore always grows to at least 480px — and to the
  // full rendered page height once a PDF loads (3138px at zoom="2") — instead
  // of scrolling inside the host. `:host { contain: layout style paint }` then
  // clips everything past the author-set height, so most of the document is
  // invisible AND unreachable: the viewport's scrollHeight equals its own
  // height, so there is nothing to scroll.
  test.fixme('viewer chrome fits inside the host box so the viewport can scroll', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      ([...document.querySelectorAll('snice-pdf-viewer')] as HTMLElement[]).forEach((v, i) => {
        const host = v.getBoundingClientRect();
        const container = v.shadowRoot!.querySelector('.pdf-container')!.getBoundingClientRect();
        if (container.height > host.height + 1) {
          problems.push(`viewer[${i}] ${v.id || '(no src)'}: container ${Math.round(container.height)}px `
            + `exceeds host ${Math.round(host.height)}px`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});

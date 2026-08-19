import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/link-preview/visual.html';

// The showcase pulls thumbnails from picsum.photos, so the page never reaches
// networkidle offline. Geometry comes from the CSS aspect-ratio/fixed-width
// image box, which holds whether or not the remote image resolves.
test.describe('Snice Link Preview visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!customElements.get('snice-link-preview'));
    await page.waitForFunction(() =>
      !!document.querySelector('snice-link-preview')?.shadowRoot?.querySelector('.link-preview'));
    await page.waitForTimeout(300);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('image box and content column tile the card per variant', async ({ page }) => {
    const result = await page.evaluate(() => {
      const problems: string[] = [];
      const cards = [...document.querySelectorAll('snice-link-preview')] as any[];
      if (!cards.length) problems.push('no snice-link-preview on page');

      cards.forEach((host, i) => {
        const root = host.shadowRoot;
        const card = root?.querySelector('.link-preview') as HTMLElement | null;
        if (!card) { problems.push(`preview[${i}]: no .link-preview`); return; }
        const cr = card.getBoundingClientRect();
        const image = root.querySelector('.link-preview__image') as HTMLElement | null;
        const content = root.querySelector('.link-preview__content') as HTMLElement | null;
        const horizontal = host.getAttribute('variant') === 'horizontal';
        const tag = `preview[${i}] ${horizontal ? 'horizontal' : 'vertical'}/${host.getAttribute('size') || 'medium'}`;

        if (image) {
          const ir = image.getBoundingClientRect();
          if (ir.width < 40 || ir.height < 40) {
            problems.push(`${tag}: image box ${Math.round(ir.width)}x${Math.round(ir.height)}`);
          }
          if (ir.left < cr.left - 1 || ir.right > cr.right + 1
              || ir.top < cr.top - 1 || ir.bottom > cr.bottom + 1) {
            problems.push(`${tag}: image box escapes the card`);
          }
          if (!horizontal) {
            // Vertical: full-bleed banner with a fixed aspect ratio.
            if (Math.abs(ir.width - cr.width) > 2) {
              problems.push(`${tag}: banner width ${Math.round(ir.width)} != card ${Math.round(cr.width)}`);
            }
            const expected = host.getAttribute('size') === 'small' ? 2 : 1.91;
            const ratio = ir.width / ir.height;
            if (Math.abs(ratio - expected) > 0.05) {
              problems.push(`${tag}: banner aspect ${ratio.toFixed(2)} != ${expected}`);
            }
            if (content) {
              const or = content.getBoundingClientRect();
              if (or.top < ir.bottom - 1) problems.push(`${tag}: content overlaps the banner`);
            }
          } else {
            // Horizontal: fixed-width thumbnail column beside the content.
            if (ir.width > cr.width * 0.6) {
              problems.push(`${tag}: thumbnail takes ${Math.round(ir.width / cr.width * 100)}% of the card`);
            }
            if (content) {
              const or = content.getBoundingClientRect();
              if (or.left < ir.right - 1) problems.push(`${tag}: content overlaps the thumbnail`);
              if (or.right > cr.right + 1) problems.push(`${tag}: content overflows the card`);
            }
          }
        }

        if (content) {
          const or = content.getBoundingClientRect();
          ['.link-preview__title', '.link-preview__description', '.link-preview__footer'].forEach(sel => {
            const el = content.querySelector(sel) as HTMLElement | null;
            if (!el) return;
            const r = el.getBoundingClientRect();
            if (r.width === 0 && r.height === 0) return;
            if (r.right > or.right + 1 || r.bottom > or.bottom + 1
                || r.left < or.left - 1 || r.top < or.top - 1) {
              problems.push(`${tag}: ${sel} escapes the content column`);
            }
          });
        }
      });
      return problems;
    });
    expect(result).toEqual([]);
  });

  test('long title/description stay clamped so cards keep a bounded height', async ({ page }) => {
    const result = await page.evaluate(() => {
      const problems: string[] = [];
      ([...document.querySelectorAll('snice-link-preview')] as any[]).forEach((host, i) => {
        const root = host.shadowRoot;
        const title = root?.querySelector('.link-preview__title') as HTMLElement | null;
        const desc = root?.querySelector('.link-preview__description') as HTMLElement | null;
        const size = host.getAttribute('size') || 'medium';
        const check = (el: HTMLElement | null, name: string, maxLines: number) => {
          if (!el) return;
          const r = el.getBoundingClientRect();
          if (r.height === 0) return;
          const lh = parseFloat(getComputedStyle(el).lineHeight);
          if (!Number.isFinite(lh)) return;
          if (r.height > lh * maxLines + 2) {
            problems.push(`preview[${i}] ${size} ${name}: ${Math.round(r.height)}px`
              + ` exceeds ${maxLines} lines (${Math.round(lh * maxLines)}px)`);
          }
        };
        check(title, 'title', size === 'small' ? 1 : 2);
        check(desc, 'description', size === 'small' ? 2 : size === 'large' ? 4 : 3);
      });
      return problems;
    });
    expect(result).toEqual([]);
  });

  test('favicon renders at icon scale inside the footer', async ({ page }) => {
    const result = await page.evaluate(() => {
      const problems: string[] = [];
      ([...document.querySelectorAll('snice-link-preview[favicon]')] as any[]).forEach((host, i) => {
        const root = host.shadowRoot;
        const icon = root?.querySelector('.link-preview__favicon') as HTMLElement | null;
        const footer = root?.querySelector('.link-preview__footer') as HTMLElement | null;
        if (!icon || !footer) { problems.push(`favicon preview[${i}]: missing icon or footer`); return; }
        const r = icon.getBoundingClientRect();
        const fr = footer.getBoundingClientRect();
        if (r.width < 8 || r.width > 32 || Math.abs(r.width - r.height) > 1) {
          problems.push(`favicon preview[${i}]: ${Math.round(r.width)}x${Math.round(r.height)}`);
        }
        if (r.left < fr.left - 1 || r.right > fr.right + 1
            || r.top < fr.top - 1 || r.bottom > fr.bottom + 1) {
          problems.push(`favicon preview[${i}]: escapes the footer row`);
        }
      });
      return problems;
    });
    expect(result).toEqual([]);
  });
});

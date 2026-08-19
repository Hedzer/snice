import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/testimonial/visual.html';

test.describe('Snice Testimonial visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-testimonial'));
    await page.waitForFunction(() => [...document.querySelectorAll('snice-testimonial')]
      .every(t => !!t.shadowRoot?.querySelector('.quote')));
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('quote, stars and author block stack inside the card with symmetric padding', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const cards = [...document.querySelectorAll('snice-testimonial')] as HTMLElement[];
      if (cards.length === 0) problems.push('no snice-testimonial on page');

      cards.forEach((card, i) => {
        const label = `card[${i}] variant=${card.getAttribute('variant') ?? 'card'}`;
        const box = card.shadowRoot!.querySelector('.testimonial');
        if (!box) { problems.push(`${label}: no .testimonial`); return; }
        const b = box.getBoundingClientRect();

        const blocks = ['.quote-icon', '.stars', '.quote', '.author-info']
          .map(sel => ({ sel, el: box.querySelector(sel) }))
          .filter(x => x.el && x.el.getBoundingClientRect().height > 0)
          .map(x => ({ sel: x.sel, r: x.el!.getBoundingClientRect() }));

        if (!blocks.some(x => x.sel === '.quote')) problems.push(`${label}: no quote rendered`);

        blocks.forEach((blk, n) => {
          if (blk.r.left < b.left - 0.5 || blk.r.right > b.right + 0.5
              || blk.r.top < b.top - 0.5 || blk.r.bottom > b.bottom + 0.5) {
            problems.push(`${label}: ${blk.sel} escapes the card box`);
          }
          if (n > 0 && blk.r.top < blocks[n - 1].r.bottom - 0.5) {
            problems.push(`${label}: ${blocks[n - 1].sel} and ${blk.sel} overlap`);
          }
        });

        // The stacked blocks share one content column. The `minimal` variant
        // is deliberately flush right (`padding: 1rem 0` plus a 3px left bar),
        // so only the boxed variants are checked for symmetric padding.
        const left = blocks[0].r.left - b.left;
        const right = b.right - blocks[0].r.right;
        if (card.getAttribute('variant') !== 'minimal' && Math.abs(left - right) > 1) {
          problems.push(`${label}: asymmetric horizontal padding ${left.toFixed(1)} vs ${right.toFixed(1)}`);
        }
        blocks.forEach(blk => {
          if (Math.abs((blk.r.left - b.left) - left) > 1) {
            problems.push(`${label}: ${blk.sel} is not on the content column`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('rating renders five evenly-pitched square stars split at the rating value', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      ([...document.querySelectorAll('snice-testimonial')] as HTMLElement[]).forEach((card, i) => {
        const strip = card.shadowRoot!.querySelector('.stars');
        if (!strip) return; // no rating on this card
        const rating = Number(card.getAttribute('rating') ?? 0);
        const glyphs = [...strip.querySelectorAll('.star-glyph')] as HTMLElement[];
        const s = strip.getBoundingClientRect();

        if (glyphs.length !== 5) { problems.push(`card[${i}]: ${glyphs.length} star glyphs`); return; }

        const rects = glyphs.map(g => g.getBoundingClientRect());
        rects.forEach((r, n) => {
          if (Math.abs(r.width - r.height) > 0.5) {
            problems.push(`card[${i}] star ${n}: not square (${r.width.toFixed(1)}x${r.height.toFixed(1)})`);
          }
          if (r.width < 10) problems.push(`card[${i}] star ${n}: only ${r.width.toFixed(1)}px`);
          if (r.left < s.left - 0.5 || r.right > s.right + 0.5
              || r.top < s.top - 0.5 || r.bottom > s.bottom + 0.5) {
            problems.push(`card[${i}] star ${n}: escapes the star strip`);
          }
        });
        const tops = rects.map(r => Math.round(r.top));
        if (Math.max(...tops) - Math.min(...tops) > 1) {
          problems.push(`card[${i}]: stars off a single baseline`);
        }
        const pitches: number[] = [];
        for (let n = 1; n < rects.length; n++) pitches.push(+(rects[n].left - rects[n - 1].left).toFixed(1));
        if (Math.max(...pitches) - Math.min(...pitches) > 0.5) {
          problems.push(`card[${i}]: uneven star pitch ${pitches.join(',')}`);
        }

        // Filled and outline glyphs use different icon markup; the boundary
        // between the two runs must land exactly on the rating.
        const markup = glyphs.map(g => g.innerHTML);
        let boundary = 5;
        for (let n = 0; n < 5; n++) if (markup[n] !== markup[0]) { boundary = n; break; }
        const filled = markup[0] === markup[4] ? (rating >= 5 ? 5 : 0) : boundary;
        if (filled !== rating) {
          problems.push(`card[${i}]: ${filled} filled stars for rating="${rating}"`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('avatars render as sane squares beside, not under, the author name', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      let seen = 0;
      ([...document.querySelectorAll('snice-testimonial')] as HTMLElement[]).forEach((card, i) => {
        const info = card.shadowRoot!.querySelector('.author-info');
        const avatar = info?.querySelector('.avatar') as HTMLElement | null;
        const name = info?.querySelector('.author-name') as HTMLElement | null;
        if (!info || !avatar) return;
        seen++;

        const a = avatar.getBoundingClientRect();
        const f = info.getBoundingClientRect();
        if (Math.abs(a.width - a.height) > 0.5) {
          problems.push(`card[${i}]: avatar not square (${a.width.toFixed(1)}x${a.height.toFixed(1)})`);
        }
        if (a.width < 24 || a.width > 96) {
          problems.push(`card[${i}]: avatar ${Math.round(a.width)}px out of range`);
        }
        if (a.top < f.top - 0.5 || a.bottom > f.bottom + 0.5 || a.left < f.left - 0.5) {
          problems.push(`card[${i}]: avatar escapes the author block`);
        }
        if (name) {
          const n = name.getBoundingClientRect();
          if (n.left < a.right) problems.push(`card[${i}]: author name overlaps the avatar`);
        }
      });
      if (seen === 0) problems.push('showcase rendered no avatars');
      return problems;
    });
    expect(failures).toEqual([]);
  });
});

import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/podcast-player/demo.html';

test.describe('Snice Podcast Player visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-podcast-player'));
    await page.waitForFunction(() =>
      !!document.querySelector('snice-podcast-player')?.shadowRoot?.querySelector('.podcast-progress'));
    await page.waitForTimeout(300);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('artwork is a square thumbnail beside the metadata, and the meta text never spills the card', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const players = [...document.querySelectorAll('snice-podcast-player')] as HTMLElement[];
      if (players.length === 0) problems.push('no snice-podcast-player on the page');

      players.forEach((player, i) => {
        const root = player.shadowRoot!;
        const container = root.querySelector('.podcast-container') as HTMLElement;
        const art = root.querySelector('.podcast-artwork') as HTMLElement;
        const meta = root.querySelector('.podcast-meta') as HTMLElement;
        const id = `player[${i}](${player.getAttribute('episode-title') || 'untitled'})`;
        if (!container || !art || !meta) { problems.push(`${id}: missing parts`); return; }

        const cr = container.getBoundingClientRect();
        const ar = art.getBoundingClientRect();
        const mr = meta.getBoundingClientRect();

        // Thumbnail: square, sanely sized, inside the card.
        if (Math.abs(ar.width - ar.height) > 1) {
          problems.push(`${id}: artwork not square (${Math.round(ar.width)}x${Math.round(ar.height)})`);
        }
        if (ar.width < 48 || ar.width > 200) {
          problems.push(`${id}: artwork ${Math.round(ar.width)}px`);
        }
        if (ar.left < cr.left - 1 || ar.top < cr.top - 1 || ar.bottom > cr.bottom + 1) {
          problems.push(`${id}: artwork escapes the card`);
        }

        // Artwork content (real image or placeholder glyph) fills the frame
        // without bursting out of it.
        const img = art.querySelector('img') as HTMLImageElement | null;
        if (img) {
          const ir = img.getBoundingClientRect();
          if (ir.width > ar.width + 1 || ir.height > ar.height + 1) {
            problems.push(`${id}: artwork image overflows its frame`);
          }
          if (ir.width < ar.width - 1 || ir.height < ar.height - 1) {
            problems.push(`${id}: artwork image does not fill its frame`);
          }
        } else {
          const ph = art.querySelector('.podcast-artwork-placeholder svg') as SVGElement | null;
          if (!ph) { problems.push(`${id}: artwork frame is empty`); }
          else {
            const pr = ph.getBoundingClientRect();
            if (pr.width < 12 || pr.width > ar.width + 1) {
              problems.push(`${id}: placeholder glyph ${Math.round(pr.width)}px in a ${Math.round(ar.width)}px frame`);
            }
          }
        }

        // Metadata sits to the right of the artwork, clipped to the card.
        if (mr.left < ar.right - 1) problems.push(`${id}: metadata overlaps the artwork`);
        if (mr.right > cr.right + 1) problems.push(`${id}: metadata overflows the card`);
        ['.podcast-show', '.podcast-title', '.podcast-description'].forEach(sel => {
          const el = root.querySelector(sel) as HTMLElement | null;
          if (!el) return;
          const r = el.getBoundingClientRect();
          if (r.width === 0) return;
          if (r.right > cr.right + 1 || r.left < mr.left - 1) {
            problems.push(`${id}: ${sel} escapes the metadata column`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('transport buttons share one row with play centred, above a full-width seek bar', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const players = [...document.querySelectorAll('snice-podcast-player')] as HTMLElement[];

      players.forEach((player, i) => {
        const root = player.shadowRoot!;
        const row = root.querySelector('.podcast-control-buttons') as HTMLElement;
        const play = root.querySelector('.podcast-btn-play') as HTMLElement;
        const id = `player[${i}]`;
        if (!row || !play) { problems.push(`${id}: no transport row`); return; }

        const rr = row.getBoundingClientRect();
        const buttons = [...row.querySelectorAll('button')] as HTMLElement[];
        const rects = buttons.map(b => b.getBoundingClientRect());

        rects.forEach((r, bi) => {
          if (r.width < 16 || r.height < 16) {
            problems.push(`${id} button ${bi}: ${Math.round(r.width)}x${Math.round(r.height)}`);
          }
          if (r.left < rr.left - 1 || r.right > rr.right + 1) {
            problems.push(`${id} button ${bi}: escapes the transport row`);
          }
          if (bi > 0) {
            // Controls have different heights (44px skips, 60px play, 26px
            // labels) so they share a vertical CENTRE, not a top edge.
            const cy = r.top + r.height / 2;
            const prevCy = rects[bi - 1].top + rects[bi - 1].height / 2;
            if (Math.abs(cy - prevCy) > 1) {
              problems.push(`${id} button ${bi}: vertical centre off by ${(cy - prevCy).toFixed(1)}px`);
            }
            if (r.left < rects[bi - 1].right - 1) {
              problems.push(`${id} button ${bi}: overlaps button ${bi - 1}`);
            }
          }
        });

        // Play is the visual anchor: biggest button, flanked by the two skip
        // buttons at equal gaps.
        const pr = play.getBoundingClientRect();
        const widest = Math.max(...rects.map(r => r.width));
        if (pr.width < widest - 0.5) problems.push(`${id}: play is not the largest control`);
        const playIdx = buttons.indexOf(play);
        if (playIdx > 0 && playIdx < rects.length - 1) {
          const gapBefore = pr.left - rects[playIdx - 1].right;
          const gapAfter = rects[playIdx + 1].left - pr.right;
          if (Math.abs(gapBefore - gapAfter) > 1) {
            problems.push(`${id}: play gaps ${gapBefore.toFixed(1)} vs ${gapAfter.toFixed(1)}`);
          }
        }
        // The row is `justify-content: center`, so play only lands dead centre
        // when the outermost controls are equally wide; the "1x" speed label
        // and the sleep icon differ by a few px, hence the small tolerance.
        const dx = (pr.left + pr.width / 2) - (rr.left + rr.width / 2);
        if (Math.abs(dx) > 5) problems.push(`${id}: play off-centre by ${dx.toFixed(1)}px`);

        // Seek bar: sits under the transport row, flanked by the two time
        // labels, and takes the bulk of the width.
        const bar = root.querySelector('.podcast-progress') as HTMLElement;
        const strip = root.querySelector('.podcast-progress-container') as HTMLElement;
        const cur = root.querySelector('.podcast-time-current') as HTMLElement;
        const rem = root.querySelector('.podcast-time-remaining') as HTMLElement;
        if (!bar || !strip || !cur || !rem) { problems.push(`${id}: no seek strip`); return; }

        const br = bar.getBoundingClientRect();
        const sr = strip.getBoundingClientRect();
        if (br.top < rr.bottom - 1) problems.push(`${id}: seek bar is not below the transport row`);
        if (br.width < sr.width * 0.4) {
          problems.push(`${id}: seek bar only ${Math.round(br.width / sr.width * 100)}% of the strip`);
        }
        if (br.height < 2 || br.height > 24) {
          problems.push(`${id}: seek bar ${Math.round(br.height)}px tall`);
        }
        const cr2 = cur.getBoundingClientRect();
        const rr2 = rem.getBoundingClientRect();
        if (br.left < cr2.right - 1) problems.push(`${id}: seek bar overlaps the elapsed time`);
        if (rr2.left < br.right - 1) problems.push(`${id}: remaining time overlaps the seek bar`);
        [cr2, rr2, br].forEach((r, ri) => {
          if (r.left < sr.left - 1 || r.right > sr.right + 1) {
            problems.push(`${id}: seek strip child ${ri} escapes its row`);
          }
        });

        // The fill can never be wider than its track.
        const fill = bar.querySelector('.podcast-progress-bar') as HTMLElement;
        const fr = fill.getBoundingClientRect();
        if (fr.width > br.width + 1) problems.push(`${id}: progress fill overflows the track`);
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('clicking the middle of the seek bar fills it to roughly half its track', async ({ page }) => {
    const player = page.locator('snice-podcast-player').first();
    // Wait for real metadata so the seek bar has a duration to map onto.
    await player.evaluate(async (el: any) => {
      if (!el.duration) {
        await new Promise<void>(res => {
          const t = setTimeout(res, 8000);
          const check = () => { if (el.duration) { clearTimeout(t); res(); } else setTimeout(check, 100); };
          check();
        });
      }
    });

    const bar = player.locator('.podcast-progress');
    const before = await bar.evaluate(el => {
      const fill = el.querySelector('.podcast-progress-bar') as HTMLElement;
      return fill.getBoundingClientRect().width;
    });
    expect(before).toBeLessThan(4);

    const box = (await bar.boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(400);

    const after = await bar.evaluate(el => {
      const fill = el.querySelector('.podcast-progress-bar') as HTMLElement;
      const track = el.getBoundingClientRect();
      const f = fill.getBoundingClientRect();
      return {
        ratio: f.width / track.width,
        alignedLeft: Math.abs(f.left - track.left) <= 1,
        withinTrack: f.right <= track.right + 1,
        sameTop: Math.abs(f.top - track.top) <= 1
      };
    });

    expect(after.ratio).toBeGreaterThan(0.35);
    expect(after.ratio).toBeLessThan(0.65);
    expect(after.alignedLeft).toBe(true);
    expect(after.withinTrack).toBe(true);
    expect(after.sameTop).toBe(true);
  });
});

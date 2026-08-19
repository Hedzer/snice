import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/music-player/visual.html';

test.describe('Snice Music Player visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('transport buttons form one centered row with play/pause biggest and in the middle', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-music-player').forEach((host, pi) => {
        const row = (host as any).shadowRoot?.querySelector('.player-control-buttons');
        if (!row) return; // show-controls="false"
        const rr = row.getBoundingClientRect();
        const btns = [...row.querySelectorAll('.player-btn')] as HTMLElement[];
        if (btns.length === 0) { problems.push(`player[${pi}]: no transport buttons`); return; }
        const rects = btns.map(b => b.getBoundingClientRect());

        rects.forEach((r, i) => {
          if (r.left < rr.left - 1 || r.right > rr.right + 1
              || r.top < rr.top - 1 || r.bottom > rr.bottom + 1) {
            problems.push(`player[${pi}] btn ${i}: escapes the control row`);
          }
          if (Math.abs(r.width - r.height) > 1) {
            problems.push(`player[${pi}] btn ${i}: not circular (${Math.round(r.width)}x${Math.round(r.height)})`);
          }
          const dy = (r.top + r.height / 2) - (rr.top + rr.height / 2);
          if (Math.abs(dy) > 1.5) {
            problems.push(`player[${pi}] btn ${i}: off row center by ${dy.toFixed(1)}px`);
          }
          if (i > 0 && r.left < rects[i - 1].right - 1) {
            problems.push(`player[${pi}] btn ${i}: overlaps the previous button`);
          }
          // Each button's glyph must render and stay within the hit target.
          const svg = btns[i].querySelector('svg');
          if (svg) {
            const sr = svg.getBoundingClientRect();
            if (sr.width < 8 || sr.width > r.width || sr.height > r.height) {
              problems.push(`player[${pi}] btn ${i}: icon ${Math.round(sr.width)}x${Math.round(sr.height)} vs button ${Math.round(r.width)}`);
            }
          }
        });

        const play = row.querySelector('.player-btn-play-pause');
        if (play) {
          const pr = play.getBoundingClientRect();
          const dx = (pr.left + pr.width / 2) - (rr.left + rr.width / 2);
          if (Math.abs(dx) > 1.5) {
            problems.push(`player[${pi}]: play/pause off row center by ${dx.toFixed(1)}px`);
          }
          const biggest = Math.max(...rects.map(r => r.width));
          if (pr.width < biggest) {
            problems.push(`player[${pi}]: play/pause ${Math.round(pr.width)} is not the largest button (${Math.round(biggest)})`);
          }
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('artwork is square and the progress fill never outruns its track', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-music-player').forEach((host, pi) => {
        const root = (host as any).shadowRoot;
        if (!root) return;
        const art = root.querySelector('.player-artwork');
        if (art) {
          const ar = art.getBoundingClientRect();
          if (Math.abs(ar.width - ar.height) > 1) {
            problems.push(`player[${pi}]: artwork not square (${Math.round(ar.width)}x${Math.round(ar.height)})`);
          }
          if (ar.width < 32 || ar.width > 160) {
            problems.push(`player[${pi}]: artwork ${Math.round(ar.width)}px out of range`);
          }
          const info = root.querySelector('.player-track-info');
          if (info && info.getBoundingClientRect().left < ar.right - 1) {
            problems.push(`player[${pi}]: track info overlaps the artwork`);
          }
        }
        const track = root.querySelector('.player-progress');
        const fill = root.querySelector('.player-progress-bar');
        if (track && fill) {
          const tr = track.getBoundingClientRect();
          const fr = fill.getBoundingClientRect();
          if (Math.abs(fr.left - tr.left) > 1) {
            problems.push(`player[${pi}]: progress fill not anchored to the track start`);
          }
          if (fr.width > tr.width + 1 || fr.right > tr.right + 1) {
            problems.push(`player[${pi}]: progress fill ${Math.round(fr.width)} overruns track ${Math.round(tr.width)}`);
          }
          if (fr.height > tr.height + 1) {
            problems.push(`player[${pi}]: progress fill taller than its track`);
          }
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('playlist rows tile on a uniform pitch and their columns never collide', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-music-player').forEach((host, pi) => {
        const list = (host as any).shadowRoot?.querySelector('.player-playlist-items');
        if (!list) return;
        const lr = list.getBoundingClientRect();
        const rows = [...list.querySelectorAll('.player-playlist-item')].map(r => r.getBoundingClientRect());
        // The list is a flex column with a deliberate `gap`, so rows are
        // evenly pitched rather than abutting: the pitch must be uniform and
        // never let two rows collide.
        const gaps: number[] = [];
        // Rows must stay inside the playlist's box and keep a uniform width.
        // The box comparison is containment, not equality: WebKit reserves
        // ~8px inside the list for its non-overlay scrollbar when the
        // playlist overflows its max-height, so rows are legitimately
        // narrower than the list's border box there.
        rows.forEach((r, i) => {
          if (r.left < lr.left - 1 || r.right > lr.right + 1) {
            problems.push(`player[${pi}] row ${i}: escapes the playlist (${Math.round(r.left)}..${Math.round(r.right)} vs ${Math.round(lr.left)}..${Math.round(lr.right)})`);
          }
          if (rows.length > 1 && Math.abs(r.width - rows[0].width) > 1) {
            problems.push(`player[${pi}] row ${i}: width ${Math.round(r.width)} != first row ${Math.round(rows[0].width)}`);
          }
          if (i > 0) {
            const gap = r.top - rows[i - 1].bottom;
            if (gap < 0) {
              problems.push(`player[${pi}] row ${i}: overlaps the previous row by ${(-gap).toFixed(1)}px`);
            }
            gaps.push(gap);
          }
        });
        if (gaps.length > 1 && Math.max(...gaps) - Math.min(...gaps) > 1) {
          problems.push(`player[${pi}]: uneven row gaps ${gaps.map(g => g.toFixed(1)).join(',')}`);
        }
        // Row internals must not collide.
        [...list.querySelectorAll('.player-playlist-item')].forEach((row: Element, i: number) => {
          const num = row.querySelector('.player-playlist-item-number');
          const info = row.querySelector('.player-playlist-item-info');
          const dur = row.querySelector('.player-playlist-item-duration');
          if (!num || !info || !dur) return;
          const [n, f, d] = [num, info, dur].map(e => e.getBoundingClientRect());
          if (f.left < n.right - 1) problems.push(`player[${pi}] row ${i}: title overlaps the index`);
          if (d.left < f.right - 1) problems.push(`player[${pi}] row ${i}: duration overlaps the title`);
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('the volume control expands to a usable slider inside the player', async ({ page }) => {
    const before = await page.evaluate(() => {
      const host = document.querySelector('#mp-default') as any;
      return !!host.shadowRoot.querySelector('.player-volume-slider');
    });
    expect(before).toBe(false);

    await page.evaluate(() => {
      const host = document.querySelector('#mp-default') as any;
      (host.shadowRoot.querySelector('.player-btn-volume') as HTMLElement).click();
    });
    await page.waitForFunction(() => {
      const host = document.querySelector('#mp-default') as any;
      const s = host?.shadowRoot?.querySelector('.player-volume-slider');
      return !!s && s.getBoundingClientRect().width > 0;
    });

    const box = await page.evaluate(() => {
      const host = document.querySelector('#mp-default') as any;
      const root = host.shadowRoot;
      const slider = root.querySelector('.player-volume-slider');
      if (!slider) return null;
      const container = root.querySelector('.player-container').getBoundingClientRect();
      const progress = root.querySelector('.player-progress').getBoundingClientRect();
      const s = slider.getBoundingClientRect();
      return {
        width: s.width, height: s.height,
        insideContainer: s.left >= container.left - 1 && s.right <= container.right + 1
          && s.top >= container.top - 1 && s.bottom <= container.bottom + 1,
        clearOfProgress: s.left >= progress.right - 1,
      };
    });

    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(40);
    expect(box!.height).toBeGreaterThan(2);
    expect(box!.insideContainer).toBe(true);
    expect(box!.clearOfProgress).toBe(true);
  });
});

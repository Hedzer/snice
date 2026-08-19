import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/video-player/visual.html';

// The fixture points all players at the local fixture-clip.webm, so playback
// never leaves the dev server. The remote-asset abort below is a no-op kept
// as a guard in case a showcase copy ever regresses the fixture.
test.describe('Snice Video Player visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**commondatastorage.googleapis.com/**', route => route.abort());
    await page.goto(demoPath, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!customElements.get('snice-video-player'));
    await page.waitForFunction(() => [...document.querySelectorAll('snice-video-player')]
      .every(p => !!p.shadowRoot?.querySelector('.video-container')));
    await page.waitForTimeout(300);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('poster overlay covers the video and centres a sane play button', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const players = [...document.querySelectorAll('snice-video-player')] as HTMLElement[];
      if (players.length === 0) problems.push('no snice-video-player on page');

      let posters = 0;
      players.forEach((player, i) => {
        const root = player.shadowRoot!;
        const container = root.querySelector('.video-container');
        const video = root.querySelector('video');
        const poster = root.querySelector('.video-poster');
        if (!container || !video) { problems.push(`player[${i}]: missing container/video`); return; }

        const c = container.getBoundingClientRect();
        const v = video.getBoundingClientRect();
        if (Math.abs(v.width - c.width) > 1 || Math.abs(v.left - c.left) > 1) {
          problems.push(`player[${i}]: video does not fill the container width`);
        }

        if (!poster) return;
        posters++;
        const p = poster.getBoundingClientRect();
        if (Math.abs(p.width - v.width) > 1 || Math.abs(p.height - v.height) > 1
            || Math.abs(p.left - v.left) > 1 || Math.abs(p.top - v.top) > 1) {
          problems.push(`player[${i}]: poster overlay does not cover the video`);
        }

        const play = poster.querySelector('.video-poster-play');
        if (!play) { problems.push(`player[${i}]: no play affordance on the poster`); return; }
        const b = play.getBoundingClientRect();
        if (Math.abs(b.width - b.height) > 0.5) {
          problems.push(`player[${i}]: play button not round (${b.width.toFixed(1)}x${b.height.toFixed(1)})`);
        }
        if (b.width < 40 || b.width > 120) {
          problems.push(`player[${i}]: play button ${Math.round(b.width)}px out of range`);
        }
        if (b.width > p.width || b.height > p.height) {
          problems.push(`player[${i}]: play button larger than the poster`);
        }
        const dx = (b.left + b.width / 2) - (p.left + p.width / 2);
        const dy = (b.top + b.height / 2) - (p.top + p.height / 2);
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
          problems.push(`player[${i}]: play button off-centre by ${dx.toFixed(1)},${dy.toFixed(1)}`);
        }
        const icon = play.querySelector('svg');
        if (icon) {
          const ir = icon.getBoundingClientRect();
          if (ir.width < 12 || ir.width > b.width || ir.height > b.height) {
            problems.push(`player[${i}]: play glyph ${Math.round(ir.width)}px does not fit the button`);
          }
        }
      });
      if (posters === 0) problems.push('no poster overlays rendered');
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('controls bar is pinned to the bottom edge with non-overlapping control groups', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      let bars = 0;
      ([...document.querySelectorAll('snice-video-player')] as HTMLElement[]).forEach((player, i) => {
        const root = player.shadowRoot!;
        const container = root.querySelector('.video-container');
        const controls = root.querySelector('.video-controls');
        if (!container || !controls) return; // controls="false" showcase
        bars++;

        const c = container.getBoundingClientRect();
        const b = controls.getBoundingClientRect();

        if (Math.abs(b.bottom - c.bottom) > 1) {
          problems.push(`player[${i}]: controls bottom ${Math.round(b.bottom)} != container ${Math.round(c.bottom)}`);
        }
        if (Math.abs(b.width - c.width) > 1 || Math.abs(b.left - c.left) > 1) {
          problems.push(`player[${i}]: controls do not span the container width`);
        }
        if (b.height > c.height) {
          problems.push(`player[${i}]: controls taller than the video`);
        }

        const row = controls.querySelector('.video-controls-row');
        const track = controls.querySelector('.video-progress-track');
        const left = controls.querySelector('.video-controls-left');
        const right = controls.querySelector('.video-controls-right');

        if (track && row) {
          const t = track.getBoundingClientRect();
          const r = row.getBoundingClientRect();
          // Progress track and the button row share the same padded column.
          if (Math.abs(t.left - r.left) > 1 || Math.abs(t.right - r.right) > 1) {
            problems.push(`player[${i}]: progress track not aligned with the controls row`);
          }
          if (t.bottom > r.top + 1) {
            problems.push(`player[${i}]: progress track overlaps the controls row`);
          }
          if (t.left < b.left || t.right > b.right) {
            problems.push(`player[${i}]: progress track escapes the controls bar`);
          }
        }

        if (left && right && row) {
          const l = left.getBoundingClientRect();
          const rt = right.getBoundingClientRect();
          const r = row.getBoundingClientRect();
          if (l.width > 0 && rt.width > 0 && rt.left < l.right - 1) {
            problems.push(`player[${i}]: left and right control groups overlap`);
          }
          [['left', l], ['right', rt]].forEach(([name, g]) => {
            const rect = g as DOMRect;
            if (rect.width === 0) return;
            if (rect.left < r.left - 1 || rect.right > r.right + 1
                || rect.top < r.top - 1 || rect.bottom > r.bottom + 1) {
              problems.push(`player[${i}]: ${name} control group escapes the controls row`);
            }
          });
        }
      });
      if (bars === 0) problems.push('no controls bars rendered');
      return problems;
    });
    expect(failures).toEqual([]);
  });
});

/**
 * snice-audio-recorder TRUE-VISUAL matrix.
 *
 * The DOM matrix (tests/matrix/audio-recorder, 99 combos) owns the state
 * machine, the `AudioRecording` shape and the event order. It cannot own any of
 * the below: in happy-dom every control, bar and progress fill reads 0x0, and
 * the visualiser's whole job — turning real audio into 32 bar heights — has no
 * observable output at all without a real `AnalyserNode`.
 *
 * LAYER 1 — geometry / computed style / occlusion, for
 *   {idle, recording, paused, playback} x {all switches on, visualizer off,
 *   timer off, controls off} = 16 combos, plus the control hit-target probe.
 *
 * LAYER 2 — real screenshots, three pinned combos: the visualizer paints bars
 * of different heights while real audio flows, the record control is visible
 * against the recorder's own surface, and the playback progress fill paints.
 */
import { test, expect, type Page } from '@playwright/test';
import { openChartStage, mount, collectChartProblems } from '../chart-visual-support';
import { capture, contrast, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/audio-recorder/matrix.html';

/**
 * The documented recording pipeline (docs/ai/components/audio-recorder.md:
 * `start()` → MediaRecorder → `stop()` → `AudioRecording`) needs the
 * platform's MediaRecorder. Playwright's WebKit build ships WITHOUT it
 * (desktop Safari has it), so `start()` throws inside its own catch, the state
 * machine never leaves 'inactive', and every phase past idle is unreachable
 * THROUGH THE COMPONENT on that engine build. Those specs below are scoped to
 * engines that actually have MediaRecorder rather than deleted: the chromium
 * and firefox runs still hold the whole contract, and the skip description
 * says exactly why the engine cannot.
 */
async function lacksMediaRecorder(page: Page): Promise<boolean> {
  return page.evaluate(() => typeof MediaRecorder === 'undefined');
}

const NO_MEDIA_RECORDER = 'this engine build has no MediaRecorder, so the'
  + ' documented recording pipeline cannot run (see the comment above the'
  + ' lacksMediaRecorder helper)';

const PHASES = ['idle', 'recording', 'paused', 'playback'] as const;
const VARIANTS = [
  { id: 'all-on', props: {} },
  { id: 'no-visualizer', props: { showVisualizer: false } },
  { id: 'no-timer', props: { showTimer: false } },
  { id: 'no-controls', props: { showControls: false } },
] as const;

test.describe('snice-audio-recorder visual matrix (layer 1)', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => { page = await openChartStage(browser, FIXTURE); });
  test.afterAll(async () => { await page?.close(); });

  for (const phase of PHASES) {
    for (const variant of VARIANTS) {
      test(`${phase}/${variant.id}`, async () => {
        // Only PLAYBACK is unreachable without MediaRecorder: the recording
        // and paused combos render the recorder's genuine no-recording-yet UI
        // on such an engine and their geometry assertions still hold there.
        if (phase === 'playback') {
          test.skip(await lacksMediaRecorder(page), NO_MEDIA_RECORDER);
        }
        const combo = { id: `${phase}/${variant.id}`, phase, ...variant.props };
        await mount(page, combo);

        // The shell always has a laid-out base with real height.
        expect(await collectChartProblems(page, {
          surface: '[part~="base"]',
          marks: '.recorder-status',
          marks_expected: 1,
          boxes: ['[part~="base"]'],
        }), `${combo.id}: shell`).toEqual([]);

        const layout = await page.evaluate(() => {
          const host = document.getElementById('subject')!;
          const sr = host.shadowRoot!;
          const read = (selector: string) => {
            const el = sr.querySelector(selector) as HTMLElement | null;
            if (!el) return null;
            const b = el.getBoundingClientRect();
            return { w: b.width, h: b.height, display: getComputedStyle(el).display };
          };
          return {
            base: read('[part~="base"]'),
            controls: read('[part~="controls"]'),
            visualizer: read('[part~="visualizer"]'),
            progress: read('[part~="progress"]'),
            timer: read('.recorder-timer'),
            buttons: [...sr.querySelectorAll('button')].map((b) => {
              const box = b.getBoundingClientRect();
              return { name: b.getAttribute('aria-label'), w: box.width, h: box.height };
            }),
            bars: [...sr.querySelectorAll('.visualizer-bar')]
              .map(bar => bar.getBoundingClientRect())
              .map(b => ({ w: b.width, h: b.height })),
          };
        });

        expect(layout.base!.h, `${combo.id}: base height`).toBeGreaterThan(0);

        // A part that exists must be laid out; a part that does not exist is
        // the DOM matrix's business, not this tier's.
        for (const [name, box] of Object.entries(layout)) {
          if (!box || Array.isArray(box)) continue;
          expect((box as any).h, `${combo.id}: ${name} height`).toBeGreaterThan(0);
          expect((box as any).w, `${combo.id}: ${name} width`).toBeGreaterThan(0);
        }

        // Every rendered control is a real, tappable target.
        for (const button of layout.buttons) {
          expect(button.w, `${combo.id}: control "${button.name}" width`).toBeGreaterThan(0);
          expect(button.h, `${combo.id}: control "${button.name}" height`).toBeGreaterThan(0);
        }

        // The visualiser is 32 bars or nothing at all.
        expect(layout.bars.length, `${combo.id}: bar count`)
          .toBe(layout.visualizer ? 32 : 0);
        expect(layout.bars.filter(bar => bar.w <= 0 || bar.h <= 0),
          `${combo.id}: collapsed bars`).toEqual([]);
      });
    }
  }
});

test.describe('snice-audio-recorder visual matrix (layer 1: hit targets)', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => { page = await openChartStage(browser, FIXTURE); });
  test.afterAll(async () => { await page?.close(); });

  for (const phase of ['idle', 'recording', 'paused', 'playback'] as const) {
    test(`${phase}: every control is hit-testable at its own centre`, async () => {
      if (phase === 'playback') {
        test.skip(await lacksMediaRecorder(page), NO_MEDIA_RECORDER);
      }
      await mount(page, { id: `hit/${phase}`, phase });

      const problems = await page.evaluate(() => {
        const sr = document.getElementById('subject')!.shadowRoot!;
        const root = sr as unknown as { elementFromPoint(x: number, y: number): Element | null };
        const bad: string[] = [];
        for (const button of sr.querySelectorAll('button')) {
          const b = button.getBoundingClientRect();
          const hit = root.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
          if (hit !== button && !button.contains(hit!)) {
            bad.push(`${button.getAttribute('aria-label')}: occluded by <${hit?.tagName.toLowerCase()}>`);
          }
        }
        return bad;
      });
      expect(problems).toEqual([]);
    });
  }

  test('the recording controls actually drive the recorder', async () => {
    test.skip(await lacksMediaRecorder(page), NO_MEDIA_RECORDER);
    await mount(page, { id: 'drive', phase: 'recording' });
    expect(await page.evaluate(() => (window as any).matrix.press('Pause'))).toBe(true);
    expect(await page.evaluate(() => (window as any).matrix.el.getState())).toBe('paused');
    expect(await page.evaluate(() => (window as any).matrix.press('Resume'))).toBe(true);
    expect(await page.evaluate(() => (window as any).matrix.el.getState())).toBe('recording');
    expect(await page.evaluate(() => (window as any).matrix.press('Stop'))).toBe(true);
    expect(await page.evaluate(() => (window as any).matrix.el.getState())).toBe('inactive');
  });

  test('the visualizer responds to real audio while recording', async () => {
    // The whole point of the visualiser: with a live analyser and real sound,
    // the 32 bars must not all sit at the idle height. The analyser is only
    // created once MediaRecorder.start() has succeeded, so this too belongs to
    // the engines that can record.
    test.skip(await lacksMediaRecorder(page), NO_MEDIA_RECORDER);
    await mount(page, { id: 'bars', phase: 'recording' });
    const heights: number[] = await page.evaluate(() => (window as any).matrix.barHeights());
    expect(heights).toHaveLength(32);
    expect(Math.max(...heights)).toBeGreaterThan(Math.min(...heights));
  });

  test('an engine without MediaRecorder surfaces the documented error event', async () => {
    // The doc promises `recorder-error` → `{ recorder, error }`. That promise
    // is assertable on EVERY engine, and the one place it is exercised for
    // real is exactly here: an engine whose platform cannot record. A failed
    // start() must surface the event and leave the machine inactive rather
    // than wedging it in a phantom recording state.
    test.skip(!(await lacksMediaRecorder(page)),
      'engine has MediaRecorder; the chromium/firefox tier exercises the real recording path instead');
    const result = await page.evaluate(async () => {
      const matrix = (window as any).matrix;
      await matrix.mount({ id: 'mr-error', phase: 'idle' });
      let fired = 0;
      document.getElementById('subject')!.addEventListener('recorder-error', () => { fired++; });
      await matrix.el.start();
      await matrix.settle();
      return { fired, state: matrix.el.getState() };
    });
    expect(result.fired, 'a failed start() must emit recorder-error').toBeGreaterThan(0);
    expect(result.state, 'a failed start() must leave the recorder inactive').toBe('inactive');
  });
});

// ── LAYER 2: real pixels, three pinned combos ───────────────────────────────

test.describe('snice-audio-recorder visual matrix (layer 2: painted pixels)', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => { page = await openChartStage(browser, FIXTURE); });
  test.afterAll(async () => { await page?.close(); });

  test('the record control paints against the recorder surface', async () => {
    await mount(page, { id: 'px-record', phase: 'idle' });
    // Probe the DISC, not the button's centre: the centre is the white glyph
    // drawn on top of it, and a glyph-vs-surface reading would say nothing
    // about whether the control itself is painted.
    const probe = `(host) => { const b = host.shadowRoot.querySelector('.recorder-btn.record')
      .getBoundingClientRect();
      const base = host.shadowRoot.querySelector('[part~="base"]').getBoundingClientRect();
      return [{ x: b.left + b.width * 0.14, y: b.top + b.height / 2 },
              { x: base.left + 4, y: base.top + 4 }]; }`;
    const [disc, surface] = await capture(page, '#subject', 'audio-recorder-record', probe);
    expect(sameColor(disc, surface), 'the record control is invisible on its surface').toBe(false);
    // The record affordance is the loudest control the component has; it has to
    // stand off its own surface by more than an antialiasing wobble.
    expect(contrast(disc, surface)).toBeGreaterThan(1.5);
  });

  test('the visualizer paints ink where a bar is', async () => {
    await mount(page, { id: 'px-bars', phase: 'recording' });
    const probe = `(host) => { const bars = [...host.shadowRoot.querySelectorAll('.visualizer-bar')];
      const tall = bars.map(b => b.getBoundingClientRect())
        .reduce((a, b) => (b.height > a.height ? b : a));
      const wrap = host.shadowRoot.querySelector('[part~="visualizer"]').getBoundingClientRect();
      return [{ x: tall.left + tall.width / 2, y: tall.bottom - 2 },
              { x: wrap.right - 3, y: wrap.top + 2 }]; }`;
    const [bar, empty] = await capture(page, '#subject', 'audio-recorder-visualizer', probe);
    expect(sameColor(bar, empty), 'the bars paint the same colour as the empty track').toBe(false);
  });

  test('the playback progress bar paints its fill', async () => {
    // Reaching playback needs a completed take, which needs MediaRecorder.
    test.skip(await lacksMediaRecorder(page), NO_MEDIA_RECORDER);
    await mount(page, { id: 'px-progress', phase: 'playback' });
    const geometry = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const track = sr.querySelector('[part~="progress"]')!.getBoundingClientRect();
      const fill = sr.querySelector('.playback-progress-fill')!.getBoundingClientRect();
      return { track: { w: track.width, h: track.height }, fill: { w: fill.width, h: fill.height } };
    });
    // The track is laid out even at 0% played, and the fill never overflows it.
    expect(geometry.track.w).toBeGreaterThan(0);
    expect(geometry.track.h).toBeGreaterThan(0);
    expect(geometry.fill.w).toBeLessThanOrEqual(geometry.track.w + 1);

    const probe = `(host) => { const t = host.shadowRoot.querySelector('[part~="progress"]')
      .getBoundingClientRect();
      const base = host.shadowRoot.querySelector('[part~="base"]').getBoundingClientRect();
      return [{ x: t.left + t.width / 2, y: t.top + t.height / 2 },
              { x: base.left + 4, y: base.top + 4 }]; }`;
    const [track, surface] = await capture(page, '#subject', 'audio-recorder-progress', probe);
    const isPainted = (px: RGB) => !sameColor(px, [255, 0, 255]);
    // Not the stage colour: the progress track is drawn by the component, not
    // a hole punched through it.
    expect(isPainted(track), `progress track painted ${track}`).toBe(true);
    expect(sameColor(track, surface), 'the progress track is invisible on its surface').toBe(false);
  });
});

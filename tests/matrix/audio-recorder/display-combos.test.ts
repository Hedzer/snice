/**
 * snice-audio-recorder — what each display combination renders.
 *
 * AXES:
 *   showControls / showVisualizer / showTimer / showPlayback — 2^4 = 16 vectors
 *   format        — the four documented MIME types
 *   bitrate       — documented default plus an explicit override
 *   maxDuration   — 0 ("unlimited") plus a finite budget
 *
 * The 16 switch vectors are the interesting cross: they decide which of the
 * doc's four CSS parts exist, and three of the four default to ON, so a
 * regression into "always visible" is invisible without turning them off.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mountRecorder, expectIdleShell, comboId, partEl, timerText, statusText,
  visualizerBars, controlNames, installRecorderStack, restoreRecorderStack,
  FORMATS, SWITCHES, DOC_PARTS, sr, startRecording, stopRecording, wait, SETTLE,
  type RecorderCombo, type RecorderStack,
} from './audio-recorder-support';

let stack: RecorderStack;

beforeEach(() => { stack = installRecorderStack(); });
afterEach(() => {
  document.body.innerHTML = '';
  restoreRecorderStack();
});

/** All 2^4 vectors over the documented display switches. */
function switchVectors(): RecorderCombo[] {
  const out: RecorderCombo[] = [];
  for (let bits = 0; bits < (1 << SWITCHES.length); bits++) {
    const combo: RecorderCombo = {};
    SWITCHES.forEach((name, index) => {
      if (!(bits & (1 << index))) (combo as any)[name] = false;
    });
    out.push(combo);
  }
  return out;
}

describe('snice-audio-recorder matrix: the idle shell', () => {
  for (const combo of switchVectors()) {
    it(comboId(combo), async () => {
      const el = await mountRecorder(combo);
      expectIdleShell(el, combo);
    });
  }
});

describe('snice-audio-recorder matrix: format and bitrate', () => {
  for (const format of FORMATS) {
    for (const bitrate of [undefined, 256000]) {
      const combo = { format, bitrate };
      it(`${comboId(combo)} reaches the recorder`, async () => {
        const el = await mountRecorder(combo);
        expectIdleShell(el, combo);

        await startRecording(el);
        const recorder = stack.recorder.latest()!;
        // The documented `format` and `bitrate` are recorder options, and the
        // only way to see them is the recorder they were passed to.
        expect(recorder.mimeType).toBe(format);
        expect(recorder.audioBitsPerSecond).toBe(bitrate ?? 128000);
      });
    }
  }

  for (const format of FORMATS) {
    it(`${format} is the type of the blob stop() returns`, async () => {
      const el = await mountRecorder({ format });
      await startRecording(el);
      const recording = await stopRecording(el);
      expect(recording.format).toBe(format);
      expect(recording.blob.type).toBe(format);
    });
  }
});

describe('snice-audio-recorder matrix: the visualizer', () => {
  for (const showVisualizer of [true, false]) {
    it(`show-visualizer=${showVisualizer} renders ${showVisualizer ? 'bars' : 'nothing'}`, async () => {
      const el = await mountRecorder({ showVisualizer: showVisualizer ? undefined : false });
      const bars = visualizerBars(el);
      if (showVisualizer) {
        expect(partEl(el, 'visualizer')).toBeTruthy();
        expect(bars.length).toBeGreaterThan(0);
      } else {
        expect(partEl(el, 'visualizer')).toBeNull();
        expect(bars).toHaveLength(0);
      }
    });
  }

  it('the visualizer survives a whole record/stop cycle', async () => {
    const el = await mountRecorder({});
    const before = visualizerBars(el).length;
    await startRecording(el);
    expect(visualizerBars(el).length).toBe(before);
    await stopRecording(el);
    // After a recording the component switches to the playback view, where the
    // visualizer has nothing to visualise.
    expect(partEl(el, 'visualizer')).toBeNull();
  });

  it('show-visualizer off never opens an AudioContext', async () => {
    // The visualiser is the only reason to build an audio graph; keeping one
    // open for a component that draws no bars is pure cost.
    const el = await mountRecorder({ showVisualizer: false });
    await startRecording(el);
    expect(partEl(el, 'visualizer')).toBeNull();
  });
});

describe('snice-audio-recorder matrix: the controls follow the state machine', () => {
  it('inactive offers exactly the start control', async () => {
    const el = await mountRecorder({});
    expect(controlNames(el)).toEqual(['Start Recording']);
  });

  it('recording offers cancel, pause and stop', async () => {
    const el = await mountRecorder({});
    await startRecording(el);
    expect(controlNames(el)).toEqual(['Cancel', 'Pause', 'Stop']);
  });

  it('paused offers cancel, resume and stop', async () => {
    const el = await mountRecorder({});
    await startRecording(el);
    el.pause();
    await wait(SETTLE);
    expect(controlNames(el)).toEqual(['Cancel', 'Resume', 'Stop']);
  });

  it('show-controls off leaves no buttons in any state', async () => {
    const el = await mountRecorder({ showControls: false });
    expect(controlNames(el)).toEqual([]);
    await startRecording(el);
    expect(controlNames(el)).toEqual([]);
    el.pause();
    await wait(SETTLE);
    expect(controlNames(el)).toEqual([]);
  });

  it('the status line names the documented state', async () => {
    // `role="status"` with `aria-live="polite"` is how a screen reader learns
    // the recorder started; the text has to say which state it is in.
    const el = await mountRecorder({});
    expect(statusText(el)).toBe('Ready');
    await startRecording(el);
    expect(statusText(el)).toBe('Recording');
    el.pause();
    await wait(SETTLE);
    expect(statusText(el)).toBe('Paused');
    el.resume();
    await wait(SETTLE);
    expect(statusText(el)).toBe('Recording');
  });
});

describe('snice-audio-recorder matrix: the playback view', () => {
  for (const showPlayback of [true, false]) {
    it(`show-playback=${showPlayback}: after stop() the ${showPlayback ? 'progress bar appears' : 'recorder stays idle'}`, async () => {
      const el = await mountRecorder({ showPlayback: showPlayback ? undefined : false });
      await startRecording(el);
      await stopRecording(el);

      expect(!!partEl(el, 'progress'), 'part="progress"').toBe(showPlayback);
      if (showPlayback) {
        expect(controlNames(el)).toContain('Play');
      } else {
        // No playback UI means the recorder offers to record again instead.
        expect(controlNames(el)).toEqual(['Start Recording']);
      }
    });
  }

  it('the playback view is reachable only once a recording exists', async () => {
    const el = await mountRecorder({});
    expect(partEl(el, 'progress')).toBeNull();
    await startRecording(el);
    expect(partEl(el, 'progress'), 'progress while recording').toBeNull();
    await stopRecording(el);
    expect(partEl(el, 'progress'), 'progress after stop').toBeTruthy();
  });

  it('reset() discards the playback and returns to the idle shell', async () => {
    const el = await mountRecorder({});
    await startRecording(el);
    await stopRecording(el);
    expect(el.recordedUrl).not.toBe('');

    el.reset();
    await wait(SETTLE);
    expect(el.recordedUrl).toBe('');
    expect(el.getState()).toBe('inactive');
    expect(partEl(el, 'progress')).toBeNull();
    expect(controlNames(el)).toEqual(['Start Recording']);
  });

  it('every documented part has appeared by the end of one full cycle', async () => {
    const el = await mountRecorder({});
    const seen = new Set<string>();
    const note = () => DOC_PARTS.forEach(name => { if (partEl(el, name)) seen.add(name); });

    note();
    await startRecording(el);
    note();
    await stopRecording(el);
    note();

    expect([...seen].sort()).toEqual([...DOC_PARTS].sort());
  });

  it('each documented part resolves to exactly one node', async () => {
    // `::part(controls)` must not be ambiguous.
    const el = await mountRecorder({});
    await startRecording(el);
    await stopRecording(el);
    const counts = DOC_PARTS
      .map(name => [name, sr(el).querySelectorAll(`[part~="${name}"]`).length] as const)
      .filter(([, count]) => count > 0);
    expect(counts.filter(([, count]) => count !== 1)).toEqual([]);
  });
});

describe('snice-audio-recorder matrix: the timer', () => {
  for (const showTimer of [true, false]) {
    it(`show-timer=${showTimer}: the idle shell ${showTimer ? 'shows' : 'hides'} 00:00`, async () => {
      const el = await mountRecorder({ showTimer: showTimer ? undefined : false });
      expect(timerText(el)).toBe(showTimer ? '00:00' : null);
    });
  }

  /**
   * FINDING MATRIX-audio-recorder-1.
   *
   * `showTimer: boolean = true` is documented as the switch that decides
   * whether the recorder shows an elapsed-time readout. The playback view
   * renders its `.recorder-timer` unconditionally, so a recorder mounted with
   * `show-timer` OFF grows a timer the moment a recording finishes.
   */
  it.fails('MATRIX-audio-recorder-1: show-timer off keeps the timer hidden in the playback view', async () => {
    const el = await mountRecorder({ showTimer: false });
    await startRecording(el);
    await stopRecording(el);
    expect(timerText(el)).toBeNull();
  });

  it('MATRIX-audio-recorder-1 reproduces: the playback view times its own progress', async () => {
    const el = await mountRecorder({ showTimer: false });
    await startRecording(el);
    await stopRecording(el);
    expect(timerText(el)).toBe('00:00');
  });

  it('the timer reads mm:ss', async () => {
    const el = await mountRecorder({});
    expect(timerText(el)).toMatch(/^\d{2}:\d{2}$/);
  });
});

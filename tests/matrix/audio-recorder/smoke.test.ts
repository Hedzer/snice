/**
 * Smoke slice of the snice-audio-recorder matrix — the everyday-loop tier.
 *
 * The full matrix (tests/matrix/audio-recorder, 99 combos) is excluded from the
 * default Vitest include and runs via `npm run test:matrix`. This file is the
 * standing cost the everyday loop pays.
 *
 * Marquee combos only — one per feature family:
 *   · the doc's bare `<snice-audio-recorder>`, which owns every default at once;
 *   · `show-controls` / `show-visualizer` off, the switches that regress into
 *     "always visible";
 *   · `stop()`'s documented `AudioRecording`, the only method with a return
 *     shape;
 *   · the pause/resume/cancel transitions and their event order;
 *   · MATRIX-audio-recorder-1, the timer regression guard.
 *
 * BUDGET: under ~1s. New combinations belong in the matrix, not here.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mountRecorder, expectIdleShell, expectRecordingShape, startRecording, stopRecording,
  captureEvents, controlNames, partEl, timerText, installRecorderStack,
  restoreRecorderStack, wait, SETTLE, type RecorderStack,
} from './audio-recorder-support';

let stack: RecorderStack;

describe('snice-audio-recorder matrix smoke', () => {
  beforeEach(() => { stack = installRecorderStack(); });
  afterEach(() => {
    document.body.innerHTML = '';
    restoreRecorderStack();
  });

  it('the documented bare markup renders the whole idle shell', async () => {
    const el = await mountRecorder({});
    expectIdleShell(el, {});
    expect(stack.media.requests, 'a bare recorder opened the microphone').toEqual([]);
  });

  it('show-controls and show-visualizer off remove their parts', async () => {
    const combo = { showControls: false, showVisualizer: false };
    const el = await mountRecorder(combo);
    expectIdleShell(el, combo);
    expect(partEl(el, 'controls')).toBeNull();
    expect(partEl(el, 'visualizer')).toBeNull();
  });

  it('stop() returns the documented AudioRecording', async () => {
    const el = await mountRecorder({ format: 'audio/mp4', bitrate: 256000 });
    await startRecording(el);
    const recording = await stopRecording(el);
    expectRecordingShape(recording, { format: 'audio/mp4' }, 'smoke');
    expect(el.recordedUrl).toBe(recording.url);
  });

  it('pause, resume and cancel move the documented state machine', async () => {
    const el = await mountRecorder({});
    const events = captureEvents(el);

    await startRecording(el);
    expect(el.getState()).toBe('recording');
    el.pause();
    await wait(SETTLE);
    expect(el.getState()).toBe('paused');
    el.resume();
    await wait(SETTLE);
    expect(el.getState()).toBe('recording');
    el.cancel();
    await wait(SETTLE);
    expect(el.getState()).toBe('inactive');

    expect(events.map(event => event.type)).toEqual([
      'recorder-start', 'recorder-pause', 'recorder-resume', 'recorder-cancel',
    ]);
    expect(controlNames(el)).toEqual(['Start Recording']);
  });

  it('a denied microphone announces recorder-error', async () => {
    const el = await mountRecorder({});
    const events = captureEvents(el, ['recorder-error']);
    stack.media.denyWith(new Error('Permission denied'));
    await el.start();
    await wait(SETTLE);

    expect(events).toHaveLength(1);
    expect(el.getState()).toBe('inactive');
  });

  // MATRIX-audio-recorder-1: `show-timer` off must stay off in the playback
  // view too. The guard lives here so the everyday loop notices the day it
  // changes in either direction.
  it.fails('MATRIX-audio-recorder-1: show-timer off keeps the timer hidden after a recording', async () => {
    const el = await mountRecorder({ showTimer: false });
    await startRecording(el);
    await stopRecording(el);
    expect(timerText(el)).toBeNull();
  });
});

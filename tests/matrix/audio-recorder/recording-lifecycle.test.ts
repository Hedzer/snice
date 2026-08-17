/**
 * snice-audio-recorder — the documented state machine and its events.
 *
 * The doc gives three states ('inactive' | 'recording' | 'paused'), six methods
 * that move between them (`start`, `stop`, `pause`, `resume`, `cancel`,
 * `reset`), three read-backs (`getState`, `getDuration`, `isRecording`) and six
 * events. This slice crosses the transitions against the four documented
 * formats and against the display switches that change which controls drive
 * them, and asserts the announced event ORDER — a consumer wiring an upload on
 * `recorder-stop` depends on it.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mountRecorder, startRecording, stopRecording, expectRecordingShape, comboId,
  captureEvents, keysOf, clickControl, controlNames, installRecorderStack,
  restoreRecorderStack, FORMATS, STATES, wait, SETTLE,
  type RecorderStack, type SniceAudioRecorderElement,
} from './audio-recorder-support';

let stack: RecorderStack;

beforeEach(() => { stack = installRecorderStack(); });
afterEach(() => {
  document.body.innerHTML = '';
  restoreRecorderStack();
});

describe('snice-audio-recorder matrix: start → stop', () => {
  for (const format of FORMATS) {
    for (const showVisualizer of [true, false]) {
      const combo = { format, showVisualizer: showVisualizer ? undefined : false };
      it(`${comboId(combo)}: stop() returns the documented AudioRecording`, async () => {
        const el = await mountRecorder(combo);
        await startRecording(el);
        const recording = await stopRecording(el);
        expectRecordingShape(recording, combo, comboId(combo));
      });

      it(`${comboId(combo)}: the state machine walks inactive → recording → inactive`, async () => {
        const el = await mountRecorder(combo);
        expect(el.getState()).toBe('inactive');
        expect(el.isRecording()).toBe(false);

        await startRecording(el);
        expect(el.getState()).toBe('recording');
        expect(el.isRecording()).toBe(true);

        await stopRecording(el);
        expect(el.getState()).toBe('inactive');
        expect(el.isRecording()).toBe(false);
      });
    }
  }

  it('the recorded url is published on the element after stop', async () => {
    // "recordedUrl: string = '' — URL of recorded audio (set after stop)".
    const el = await mountRecorder({});
    expect(el.recordedUrl).toBe('');
    await startRecording(el);
    expect(el.recordedUrl, 'while recording').toBe('');

    const recording = await stopRecording(el);
    expect(el.recordedUrl).toBe(recording.url);
    expect(stack.urls.created).toContain(recording.url);
  });

  it('a second recording revokes the first one\'s object url', async () => {
    // Leaking blob URLs pins the recorded audio in memory for the page's life.
    const el = await mountRecorder({});
    await startRecording(el);
    const first = await stopRecording(el);

    await startRecording(el);
    expect(stack.urls.revoked, 'previous recording url').toContain(first.url);
  });

  it('every state the doc names is reachable', async () => {
    const el = await mountRecorder({});
    const seen = new Set<string>([el.getState()]);
    await startRecording(el);
    seen.add(el.getState());
    el.pause();
    await wait(SETTLE);
    seen.add(el.getState());
    el.resume();
    await wait(SETTLE);
    seen.add(el.getState());
    await stopRecording(el);
    seen.add(el.getState());
    expect([...seen].sort()).toEqual([...STATES].sort());
  });
});

describe('snice-audio-recorder matrix: pause and resume', () => {
  for (const format of FORMATS) {
    it(`${format}: pause/resume keeps one recorder and one recording`, async () => {
      const el = await mountRecorder({ format });
      await startRecording(el);
      el.pause();
      await wait(SETTLE);
      expect(el.getState()).toBe('paused');
      expect(el.isRecording()).toBe(false);
      expect(stack.recorder.latest()!.state).toBe('paused');

      el.resume();
      await wait(SETTLE);
      expect(el.getState()).toBe('recording');
      expect(stack.recorder.latest()!.state).toBe('recording');

      const recording = await stopRecording(el);
      // Pausing must not start a second recorder, or the paused audio would be
      // dropped from the result.
      expect(stack.recorder.instances).toHaveLength(1);
      expect(recording.format).toBe(format);
    });
  }

  it('pause() while inactive is a no-op', async () => {
    const el = await mountRecorder({});
    const events = captureEvents(el);
    el.pause();
    await wait(SETTLE);
    expect(el.getState()).toBe('inactive');
    expect(events).toEqual([]);
  });

  it('resume() while recording is a no-op', async () => {
    const el = await mountRecorder({});
    await startRecording(el);
    const events = captureEvents(el, ['recorder-resume']);
    el.resume();
    await wait(SETTLE);
    expect(el.getState()).toBe('recording');
    expect(events).toEqual([]);
  });

  it('the paused controls drive the same transitions the methods do', async () => {
    const el = await mountRecorder({});
    await startRecording(el);

    expect(clickControl(el, 'Pause')).toBe(true);
    await wait(SETTLE);
    expect(el.getState()).toBe('paused');

    expect(clickControl(el, 'Resume')).toBe(true);
    await wait(SETTLE);
    expect(el.getState()).toBe('recording');

    expect(clickControl(el, 'Stop')).toBe(true);
    await wait(SETTLE);
    expect(el.getState()).toBe('inactive');
  });
});

describe('snice-audio-recorder matrix: cancel', () => {
  for (const format of FORMATS) {
    it(`${format}: cancel() discards the recording`, async () => {
      const el = await mountRecorder({ format });
      await startRecording(el);
      el.cancel();
      await wait(SETTLE);

      expect(el.getState()).toBe('inactive');
      expect(el.getDuration()).toBe(0);
      // "Cancel and discard" — nothing to play back, nothing to download.
      expect(el.recordedUrl).toBe('');
      expect(controlNames(el)).toEqual(['Start Recording']);
    });
  }

  it('cancel() releases the microphone', async () => {
    const el = await mountRecorder({});
    await startRecording(el);
    el.cancel();
    await wait(SETTLE);

    const live = stack.media.streams.flatMap(stream => stream.getTracks())
      .filter(track => track.readyState === 'live');
    expect(live).toEqual([]);
  });

  it('cancel() from paused also discards', async () => {
    const el = await mountRecorder({});
    await startRecording(el);
    el.pause();
    await wait(SETTLE);
    el.cancel();
    await wait(SETTLE);
    expect(el.getState()).toBe('inactive');
    expect(el.recordedUrl).toBe('');
  });
});

describe('snice-audio-recorder matrix: events', () => {
  it('a full cycle announces start → pause → resume → stop, in order', async () => {
    const el = await mountRecorder({});
    const events = captureEvents(el);

    await startRecording(el);
    el.pause();
    await wait(SETTLE);
    el.resume();
    await wait(SETTLE);
    await stopRecording(el);

    expect(events.map(event => event.type)).toEqual([
      'recorder-start', 'recorder-pause', 'recorder-resume', 'recorder-stop',
    ]);
  });

  it('every event carries the documented { recorder } detail', async () => {
    const el = await mountRecorder({});
    const events = captureEvents(el);

    await startRecording(el);
    el.pause();
    await wait(SETTLE);
    el.resume();
    await wait(SETTLE);
    await stopRecording(el);

    for (const event of events) {
      expect(keysOf(event.detail), event.type).toEqual(['recorder']);
      expect(event.detail.recorder, event.type).toBe(el);
    }
  });

  it('a cancelled recording announces cancel and nothing else', async () => {
    const el = await mountRecorder({});
    const events = captureEvents(el);
    await startRecording(el);
    el.cancel();
    await wait(SETTLE);

    // The native recorder's own `stop` must not surface as `recorder-stop`:
    // a listener uploading on stop would upload the discarded take.
    expect(events.map(event => event.type)).toEqual(['recorder-start', 'recorder-cancel']);
  });

  it('a denied microphone announces recorder-error with the reason', async () => {
    const el = await mountRecorder({});
    const events = captureEvents(el);
    stack.media.denyWith(new Error('Permission denied'));

    await el.start();
    await wait(SETTLE);

    expect(events.map(event => event.type)).toEqual(['recorder-error']);
    expect(keysOf(events[0].detail)).toEqual(['error', 'recorder']);
    expect((events[0].detail.error as Error).message).toBe('Permission denied');
    // A failed start leaves the documented state machine where it was.
    expect(el.getState()).toBe('inactive');
    expect(el.isRecording()).toBe(false);
  });

  it('the error is shown to the user, not only to a listener', async () => {
    const el = await mountRecorder({});
    stack.media.denyWith(new Error('Permission denied'));
    await el.start();
    await wait(SETTLE);
    expect((el.shadowRoot!.textContent ?? '')).toContain('Permission denied');
  });

  it('auto-start records without anyone pressing anything', async () => {
    const el = await mountRecorder({ autoStart: true });
    await wait(SETTLE);
    expect(el.getState()).toBe('recording');
    expect(el.isRecording()).toBe(true);
    expect(stack.media.requests).toHaveLength(1);
    expect(stack.media.requests[0]).toEqual({ audio: true });
  });

  it('without auto-start nothing touches the microphone', async () => {
    const el = await mountRecorder({});
    expect(stack.media.requests).toEqual([]);
    expect(el.getState()).toBe('inactive');
  });
});

describe('snice-audio-recorder matrix: max-duration', () => {
  for (const maxDuration of [0, 0.3]) {
    it(`max-duration=${maxDuration} ${maxDuration ? 'stops itself' : 'records until told'}`, async () => {
      const el = await mountRecorder({ maxDuration });
      const events = captureEvents(el, ['recorder-stop']);
      await startRecording(el);
      await wait(500);

      if (maxDuration) {
        // "max-duration, 0=unlimited": a finite budget must end the take.
        expect(el.getState()).toBe('inactive');
        expect(events.map(event => event.type)).toEqual(['recorder-stop']);
        expect(el.recordedUrl).not.toBe('');
      } else {
        expect(el.getState()).toBe('recording');
        expect(events).toEqual([]);
        await stopRecording(el);
      }
    });
  }

  it('getDuration() grows while recording and freezes when paused', async () => {
    const el = await mountRecorder({});
    await startRecording(el);
    await wait(250);
    const running = el.getDuration();
    expect(running).toBeGreaterThan(0);

    el.pause();
    await wait(250);
    // A paused recorder is not recording; its duration cannot keep climbing.
    expect(el.getDuration()).toBeCloseTo(running, 1);
    await stopRecording(el);
  });
});

describe('snice-audio-recorder matrix: download and disposal', () => {
  it('download() is available once a recording exists', async () => {
    const el = await mountRecorder({});
    await startRecording(el);
    const recording = await stopRecording(el);

    const clicked: string[] = [];
    const anchor = document.createElement('a');
    anchor.click = () => { clicked.push(anchor.download); };
    const create = document.createElement.bind(document);
    (document as any).createElement = (tag: string) => (tag === 'a' ? anchor : create(tag));
    try {
      el.download('take.webm');
    } finally {
      (document as any).createElement = create;
    }

    expect(clicked).toEqual(['take.webm']);
    expect(anchor.getAttribute('href')).toBe(recording.url);
  });

  it('a removed recorder leaves no microphone running', async () => {
    const el = await mountRecorder({ autoStart: true });
    await wait(SETTLE);
    (el as HTMLElement).remove();
    await wait(SETTLE);

    const live = stack.media.streams.flatMap(stream => stream.getTracks())
      .filter(track => track.readyState === 'live');
    expect(live).toEqual([]);
  });

  it('a removed recorder revokes the url it published', async () => {
    const el = await mountRecorder({});
    await startRecording(el);
    const recording = await stopRecording(el);
    (el as HTMLElement).remove();
    await wait(SETTLE);
    expect(stack.urls.revoked).toContain(recording.url);
  });
});

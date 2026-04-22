import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { wait } from './test-utils';

// Batch: leak / cleanup bugs. audio-recorder, file-upload, tabs, draw.

afterEach(() => { document.body.innerHTML = ''; });

// ---------------------------------------------------------------------------
// audio-recorder
// ---------------------------------------------------------------------------

function stubMediaRecorder() {
  // Minimal MediaRecorder stub for happy-dom
  class FakeMR {
    static isTypeSupported() { return true; }
    state = 'inactive';
    ondataavailable: ((e: any) => void) | null = null;
    onstop: (() => void) | null = null;
    constructor(_stream: any, _opts?: any) {}
    start(_interval?: number) { this.state = 'recording'; }
    stop() {
      this.state = 'inactive';
      this.onstop?.();
    }
    pause() { this.state = 'paused'; }
    resume() { this.state = 'recording'; }
    addEventListener(type: string, fn: any) {
      if (type === 'stop') {
        const prev = this.onstop;
        this.onstop = () => { prev?.(); fn(); };
      }
    }
  }
  (globalThis as any).MediaRecorder = FakeMR;

  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: {
      getUserMedia: async () => ({
        getTracks: () => [],
        getAudioTracks: () => [],
      }),
    },
  });
}

describe('audio-recorder: cancel() does not fire recorder-stop', () => {
  beforeEach(stubMediaRecorder);

  it('cancel() after start() emits only recorder-cancel, not recorder-stop', async () => {
    await import('../../components/audio-recorder/snice-audio-recorder');
    const el = document.createElement('snice-audio-recorder') as any;
    document.body.appendChild(el);
    await el.ready;

    await el.start();
    await wait(20);

    const events: string[] = [];
    el.addEventListener('recorder-stop', () => events.push('stop'));
    el.addEventListener('recorder-cancel', () => events.push('cancel'));

    el.cancel();
    await wait(30);

    expect(events).toContain('cancel');
    expect(events).not.toContain('stop');
  });
});

describe('audio-recorder: object URL is revoked on new recording', () => {
  beforeEach(stubMediaRecorder);

  it('starting a new recording revokes the previous recordedUrl', async () => {
    await import('../../components/audio-recorder/snice-audio-recorder');

    const revoked: string[] = [];
    const origRevoke = URL.revokeObjectURL;
    URL.revokeObjectURL = (url: string) => { revoked.push(url); };

    try {
      const el = document.createElement('snice-audio-recorder') as any;
      document.body.appendChild(el);
      await el.ready;

      el.recordedUrl = 'blob:fake-1';
      await el.start();
      await wait(20);

      expect(revoked).toContain('blob:fake-1');
    } finally {
      URL.revokeObjectURL = origRevoke;
    }
  });
});

describe('audio-recorder: duration resets when a new recording starts', () => {
  beforeEach(stubMediaRecorder);

  it('calling start() resets duration to 0', async () => {
    await import('../../components/audio-recorder/snice-audio-recorder');
    const el = document.createElement('snice-audio-recorder') as any;
    document.body.appendChild(el);
    await el.ready;

    (el as any).duration = 42;
    await el.start();
    await wait(20);
    // Small tolerance for timer tick
    expect((el as any).duration).toBeLessThan(1);
  });
});

// ---------------------------------------------------------------------------
// file-upload
// ---------------------------------------------------------------------------

describe('file-upload: image preview object URLs are revoked', () => {
  it('removing an uploaded image file revokes its preview URL', async () => {
    await import('../../components/file-upload/snice-file-upload');

    const created: string[] = [];
    const revoked: string[] = [];
    const origCreate = URL.createObjectURL;
    const origRevoke = URL.revokeObjectURL;
    let n = 0;
    URL.createObjectURL = ((_f: any) => {
      const u = `blob:preview-${++n}`;
      created.push(u);
      return u;
    }) as any;
    URL.revokeObjectURL = (url: string) => { revoked.push(url); };

    try {
      const el = document.createElement('snice-file-upload') as any;
      el.showPreview = true;
      el.accept = 'image/*';
      document.body.appendChild(el);
      await el.ready;
      await wait(30);

      const file = new File(['x'], 'a.png', { type: 'image/png' });
      (el as any).selectedFiles = [file];
      await wait(30);
      // Trigger preview URL creation via the render pipeline
      (el as any).renderFileItem?.(file, 0);
      await wait(30);

      el.removeFile(0);
      await wait(30);

      expect(created.length).toBeGreaterThan(0);
      expect(revoked.length).toBeGreaterThan(0);
    } finally {
      URL.createObjectURL = origCreate;
      URL.revokeObjectURL = origRevoke;
    }
  });
});

// ---------------------------------------------------------------------------
// tabs: ResizeObserver disconnect
// ---------------------------------------------------------------------------

describe('tabs: ResizeObserver is disconnected on @dispose', () => {
  it('disconnecting the tabs element disconnects its ResizeObserver', async () => {
    const disconnects: number[] = [];
    class SpyRO {
      static n = 0; id = ++SpyRO.n;
      _cb: any;
      constructor(cb: any) { this._cb = cb; }
      observe() {}
      unobserve() {}
      disconnect() { disconnects.push(this.id); }
    }
    const origRO = (globalThis as any).ResizeObserver;
    (globalThis as any).ResizeObserver = SpyRO as any;

    try {
      await import('../../components/tabs/snice-tabs');
      const el = document.createElement('snice-tabs') as any;
      el.innerHTML = '<snice-tab label="One" active></snice-tab>';
      document.body.appendChild(el);
      await el.ready;
      await wait(30);

      const createdBefore = SpyRO.n;
      el.remove();
      await wait(30);

      // At least one RO created during mount was disconnected
      expect(createdBefore).toBeGreaterThan(0);
      expect(disconnects.length).toBeGreaterThan(0);
    } finally {
      (globalThis as any).ResizeObserver = origRO;
    }
  });
});

// ---------------------------------------------------------------------------
// draw: requestAnimationFrame loop pauses when idle
// ---------------------------------------------------------------------------

describe('draw: rAF loop does not run forever when idle', () => {
  it('rAF ticks stop shortly after init when user is not drawing', async () => {
    let rafCount = 0;
    const origRaf = globalThis.requestAnimationFrame;
    globalThis.requestAnimationFrame = ((cb: any) => {
      rafCount++;
      return origRaf(cb);
    }) as any;

    try {
      await import('../../components/draw/snice-draw');
      // happy-dom lacks getContext; stub it
      (HTMLCanvasElement.prototype as any).getContext = () => ({
        clearRect: () => {}, fillRect: () => {}, beginPath: () => {}, moveTo: () => {},
        lineTo: () => {}, stroke: () => {}, fill: () => {}, save: () => {}, restore: () => {},
        scale: () => {}, setTransform: () => {},
      });
      const el = document.createElement('snice-draw') as any;
      document.body.appendChild(el);
      await el.ready;
      await wait(50);

      const countAfterMount = rafCount;
      await wait(150);
      const countAfterIdle = rafCount;
      // Bug: loop keeps ticking forever even when idle
      // Fix: rAF should stop when not drawing (tiny tolerance for any cleanup ticks)
      expect(countAfterIdle - countAfterMount).toBeLessThan(4);
    } finally {
      globalThis.requestAnimationFrame = origRaf;
    }
  });
});

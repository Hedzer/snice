import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { wait } from './test-utils';

afterEach(() => { document.body.innerHTML = ''; });

function stubMedia(getUserMediaImpl: () => Promise<any>) {
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: {
      getUserMedia: getUserMediaImpl,
      enumerateDevices: async () => [],
    },
  });
}

function fakeStream() {
  const tracks: any[] = [];
  const stream = {
    getTracks: () => tracks,
    getVideoTracks: () => tracks,
  };
  const track = { stopped: false, stop() { this.stopped = true; tracks.splice(tracks.indexOf(this), 1); } };
  tracks.push(track);
  return { stream, track };
}

describe('qr-reader: rapid start/switchCamera does not leak orphan streams', () => {
  it('a second start() while the first is in-flight stops the first stream', async () => {
    const acquired: Array<{ track: any }> = [];
    let resolveFirst: ((v: any) => void) | null = null;
    stubMedia(async () => {
      if (resolveFirst === null) {
        const f = fakeStream();
        acquired.push({ track: f.track });
        // First call — hold it unresolved
        return new Promise(res => { resolveFirst = () => res(f.stream); });
      }
      const f = fakeStream();
      acquired.push({ track: f.track });
      return f.stream;
    });

    await import('../../components/qr-reader/snice-qr-reader');
    const el = document.createElement('snice-qr-reader') as any;
    document.body.appendChild(el);
    await el.ready;
    (el as any).video = { play: async () => {}, set srcObject(_v: any) {}, get srcObject() { return null; } };

    // Kick off first start (pending)
    const p1 = el.start();
    await wait(20);

    // Second start while first is in-flight
    const p2 = el.start();
    await wait(20);

    // Now resolve the first — its stream should be discarded (track stopped)
    resolveFirst!(undefined);
    await p1;
    await p2;
    await wait(30);

    // The first stream's track must have been stopped since the second
    // start superseded it. `acquired[0]` is the first stream's track.
    expect(acquired[0].track.stopped).toBe(true);
  });
});

describe('qr-reader: autoStart is opt-in', () => {
  it('default snice-qr-reader does not call getUserMedia on connect', async () => {
    let gumCalls = 0;
    stubMedia(async () => { gumCalls++; return fakeStream().stream; });
    await import('../../components/qr-reader/snice-qr-reader');
    const el = document.createElement('snice-qr-reader') as any;
    document.body.appendChild(el);
    await el.ready;
    await wait(30);
    expect(gumCalls).toBe(0);
  });
});

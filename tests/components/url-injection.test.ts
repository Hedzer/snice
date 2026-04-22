import { describe, it, expect, afterEach } from 'vitest';
import { wait } from './test-utils';

// URL-scheme injection cluster. link-preview, location, pdf-viewer, video-player.

afterEach(() => {
  try { document.body.innerHTML = ''; } catch {}
  delete (window as any).__xss;
});

// ---------------------------------------------------------------------------
// link-preview: window.open(this.url) must reject javascript: scheme
// ---------------------------------------------------------------------------

describe('link-preview: javascript: URLs are not opened', () => {
  it('clicking a preview with javascript:... href does not call window.open with it', async () => {
    await import('../../components/link-preview/snice-link-preview');

    const opens: string[] = [];
    const origOpen = window.open;
    window.open = ((u: string) => { opens.push(String(u)); return null; }) as any;

    try {
      const el = document.createElement('snice-link-preview') as any;
      el.url = 'javascript:window.__xss=1';
      document.body.appendChild(el);
      await el.ready;
      await wait(30);

      // Click the preview root
      const root = el.shadowRoot.querySelector('[part="base"]') ?? el.shadowRoot.firstElementChild;
      (root as HTMLElement)?.click();
      await wait(30);

      const unsafe = opens.some(u => u.toLowerCase().startsWith('javascript:'));
      expect(unsafe).toBe(false);
    } finally {
      window.open = origOpen;
    }
  });
});

// ---------------------------------------------------------------------------
// location: iframe src / window.open must reject javascript:
// ---------------------------------------------------------------------------

describe('location: map-url javascript: scheme is blocked', () => {
  it('iframe src is empty (not javascript:) when map-url has unsafe scheme', async () => {
    await import('../../components/location/snice-location');
    const el = document.createElement('snice-location') as any;
    el.showMap = true;
    el.mapUrl = 'javascript:window.__xss=1';
    document.body.appendChild(el);
    await el.ready;
    await wait(40);

    const iframe = el.shadowRoot.querySelector('iframe');
    const src = iframe?.getAttribute('src') ?? '';
    expect(src.toLowerCase().startsWith('javascript:')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// pdf-viewer: print() must reject javascript: src
// ---------------------------------------------------------------------------

describe('pdf-viewer: print() does not open javascript: src', () => {
  it('print() with src=javascript:... does not invoke window.open', async () => {
    await import('../../components/pdf-viewer/snice-pdf-viewer');

    const opens: string[] = [];
    const origOpen = window.open;
    window.open = ((u: string) => { opens.push(String(u)); return null; }) as any;

    try {
      const el = document.createElement('snice-pdf-viewer') as any;
      el.src = 'javascript:window.__xss=1';
      document.body.appendChild(el);
      await el.ready;

      el.print();
      await wait(30);

      const unsafe = opens.some(u => u.toLowerCase().startsWith('javascript:'));
      expect(unsafe).toBe(false);
    } finally {
      window.open = origOpen;
    }
  });
});

// ---------------------------------------------------------------------------
// video-player: poster must not allow CSS injection via `url('...')`
// ---------------------------------------------------------------------------

describe('video-player: poster cannot inject CSS via background-image', () => {
  it('a poster string that breaks out of url() does not inject extra CSS declarations', async () => {
    await import('../../components/video-player/snice-video-player');
    const el = document.createElement('snice-video-player') as any;
    el.poster = `x'); background: red url('https://evil/`;
    el.src = 'about:blank';
    document.body.appendChild(el);
    await el.ready;
    await wait(40);

    // Find any element whose inline style includes "background:" beyond the
    // expected background-image. A safe implementation either quotes/encodes
    // the URL (so it stays inside url('...')) or sets it via property, not inline.
    // Check each interpolation of poster for CSS escape via `\'` (the safe
    // encoding) vs a bare unescaped quote that would close url(). A safe
    // implementation escapes single quotes inside url('...').
    const nodes = Array.from(el.shadowRoot.querySelectorAll('[style*="background"]')) as HTMLElement[];
    let unescapedQuote = false;
    for (const node of nodes) {
      const s = node.getAttribute('style') || '';
      // Match any single-quote inside style that is NOT preceded by a backslash.
      // If an unescaped quote exists, the attacker's payload has closed url().
      const match = s.match(/[^\\]'[^']*background/);
      if (match) unescapedQuote = true;
    }
    expect(unescapedQuote).toBe(false);
  });
});

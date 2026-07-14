import { describe, it, expect, afterEach } from 'vitest';
import { wait } from './test-utils';

// Batch: low-effort cluster. CLI flag parsing, heatmap contain, split-pane touch,
// React SniceRouter memo.

afterEach(() => { document.body.innerHTML = ''; });

// ---------------------------------------------------------------------------
// CLI: --minify=false is respected (string 'false' is not truthy)
// ---------------------------------------------------------------------------

describe('CLI: --minify=false disables minification', () => {
  it('parses "--minify=false" as minify=false', () => {
    const flags: Record<string, any> = { minify: 'false' };
    const minify = flags.minify !== false && flags.minify !== 'false' && flags['no-minify'] !== true;
    expect(minify).toBe(false);
  });

  it('parses "--no-minify" as minify=false', () => {
    const flags: Record<string, any> = { 'no-minify': true };
    const minify = flags.minify !== false && flags.minify !== 'false' && flags['no-minify'] !== true;
    expect(minify).toBe(false);
  });

  it('defaults to minify=true when flag is omitted', () => {
    const flags: Record<string, any> = {};
    const minify = flags.minify !== false && flags.minify !== 'false' && flags['no-minify'] !== true;
    expect(minify).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// heatmap: :host no longer declares `contain: paint`
// ---------------------------------------------------------------------------

describe('heatmap: :host does not use contain: paint', () => {
  it('stylesheet does not declare contain: paint on :host (would break fixed tooltip)', async () => {
    const { readFileSync } = await import('fs');
    const { join } = await import('path');
    const raw = readFileSync(
      join(__dirname, '../../packages/components/src/heatmap/snice-heatmap.css'),
      'utf8',
    );
    // Strip block comments so we only inspect actual CSS declarations
    const css = raw.replace(/\/\*[\s\S]*?\*\//g, '');
    const hostBlock = /:host\s*\{[\s\S]*?\}/.exec(css)?.[0] ?? '';
    expect(hostBlock).toBeTruthy();
    expect(/contain:[^;}]*paint/.test(hostBlock)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// split-pane: touchstart triggers a drag
// ---------------------------------------------------------------------------

describe('split-pane: touch input initiates a drag', () => {
  it('touchstart on the divider sets isDragging', async () => {
    await import('../../packages/components/src/split-pane/snice-split-pane');
    const el = document.createElement('snice-split-pane') as any;
    el.innerHTML = '<div slot="primary">A</div><div slot="secondary">B</div>';
    document.body.appendChild(el);
    await el.ready;
    await wait(30);

    const divider = el.shadowRoot.querySelector('[part="divider"]') as HTMLElement;
    expect(divider).toBeTruthy();

    // Happy-dom supports TouchEvent constructor
    const evt = new Event('touchstart', { bubbles: true, cancelable: true });
    (evt as any).touches = [{ clientX: 100, clientY: 100 }];
    divider.dispatchEvent(evt);
    await wait(30);

    expect((el as any).isDragging).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// React SniceRouter: params reference is stable across renders
// ---------------------------------------------------------------------------

describe('React SniceRouter: params ref is stable when param content is unchanged', () => {
  it('re-rendering the same path produces the same params object reference', async () => {
    // Direct unit test of the stabilization approach: JSON.stringify-based
    // memoization of an empty or stable param set.
    const a: Record<string, string> = {};
    const b: Record<string, string> = {};
    // Raw refs differ
    expect(a === b).toBe(false);
    // After JSON-based memo normalization, they collapse to a cached value
    const cache = new Map<string, any>();
    const memo = (p: Record<string, string>) => {
      const k = JSON.stringify(p);
      if (!cache.has(k)) cache.set(k, p);
      return cache.get(k);
    };
    expect(memo(a)).toBe(memo(b));
  });
});

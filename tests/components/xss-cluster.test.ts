import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { wait } from './test-utils';

// XSS cluster — components that interpolate user data into `unsafeHTML` or
// raw attribute contexts without escaping. Each test is marked `.fails` so
// it passes today (bug reproduces) and flips to red once fixed.

afterEach(() => {
  try { document.body.innerHTML = ''; } catch {}
  delete (window as any).__xss;
});

// ---------------------------------------------------------------------------
// terminal: writeLines() bypasses HTML escaping
// ---------------------------------------------------------------------------

describe('terminal: writeLines escapes HTML', () => {
  it('an HTML tag passed to writeLines is rendered as text, not an element', async () => {
    await import('../../packages/components/src/terminal/snice-terminal');
    const el = document.createElement('snice-terminal') as any;
    document.body.appendChild(el);
    await el.ready;

    el.writeLines([{ content: '<img src=x onerror="window.__xss=1">', type: 'output' }]);
    await wait(50);

    expect(el.shadowRoot.querySelectorAll('img').length).toBe(0);
    expect((window as any).__xss).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// table cell-json: XSS via keys and string values
// ---------------------------------------------------------------------------

describe('table cell-json: JSON keys and values are escaped', () => {
  it('renderExpanded output does not contain raw HTML-bearing keys or values', async () => {
    await import('../../packages/components/src/table/snice-cell-json');
    const el = document.createElement('snice-cell-json') as any;
    document.body.appendChild(el);
    await el.ready;

    // Call the renderer directly — happy-dom's unsafeHTML path is flaky here
    const html = (el as any).renderExpanded({
      '<img src=x onerror=1>': '<script>alert(1)</script>',
    }, 0);
    // A fixed renderer escapes `<` and `>` in both keys and values
    expect(html).not.toMatch(/<img[^>]*>/i);
    expect(html).not.toMatch(/<script/i);
  });
});

// ---------------------------------------------------------------------------
// treemap: XSS via node labels in SVG <text>
// ---------------------------------------------------------------------------

describe('treemap: node labels are escaped into SVG text', () => {
  it('a node label containing </text><script> does not inject a script', async () => {
    await import('../../packages/components/src/treemap/snice-treemap');
    const el = document.createElement('snice-treemap') as any;
    el.data = {
      label: 'Root',
      value: 10,
      children: [{ label: '</text><script>window.__xss=1</script>', value: 5 }],
    };
    document.body.appendChild(el);
    await el.ready;
    await wait(80);

    expect(el.shadowRoot.querySelectorAll('script').length).toBe(0);
    expect((window as any).__xss).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// virtual-scroller: default renderItem XSS via JSON stringify → unsafeHTML
// ---------------------------------------------------------------------------

describe('virtual-scroller: default renderer escapes data', () => {
  it('default renderer does not render an <img> tag from item data', async () => {
    await import('../../packages/components/src/virtual-scroller/snice-virtual-scroller');
    const el = document.createElement('snice-virtual-scroller') as any;
    el.items = [{ id: 1, data: '<img src=x onerror="window.__xss=1">' }];
    el.itemHeight = 30;
    el.style.height = '100px';
    document.body.appendChild(el);
    await el.ready;
    await wait(80);

    expect(el.shadowRoot.querySelectorAll('img').length).toBe(0);
    expect((window as any).__xss).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// flow: node/edge labels interpolated raw into innerHTML
// ---------------------------------------------------------------------------

describe('flow: node labels are escaped into SVG', () => {
  it('a node with HTML label does not inject elements', async () => {
    await import('../../packages/components/src/flow/snice-flow');
    const el = document.createElement('snice-flow') as any;
    el.nodes = [{ id: 'a', type: 'default', label: '<img src=x onerror="window.__xss=1">', x: 10, y: 10 }];
    el.edges = [];
    document.body.appendChild(el);
    await el.ready;
    await wait(80);

    expect(el.shadowRoot.querySelectorAll('img').length).toBe(0);
    expect((window as any).__xss).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// markdown: link regex unescaped href
// ---------------------------------------------------------------------------

describe('markdown: link href is escaped (sanitize=false path)', () => {
  it('a link payload that breaks out of the href quote does not inject attributes', async () => {
    await import('../../packages/components/src/markdown/snice-markdown');
    const el = document.createElement('snice-markdown') as any;
    el.sanitize = false;
    // Payload closes the href quote, injects onmouseover
    el.content = '[click](hi" onmouseover="window.__xss=1)';
    document.body.appendChild(el);
    await el.ready;
    await wait(50);

    const a = el.shadowRoot.querySelector('a');
    expect(a?.hasAttribute('onmouseover')).toBe(false);
  });
});

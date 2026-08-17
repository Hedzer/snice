/**
 * Smoke slice of the snice-markdown matrix — the everyday-loop tier.
 *
 * The full matrix (tests/matrix/markdown: 21 documented syntaxes crossed
 * against `sanitize` and both delivery channels, 8 sanitization payloads, and
 * the two events) runs via `npm run test:matrix`. This file stays collected by
 * the default loop and pays for one combo per family:
 *
 *   · a document exercising several documented syntaxes at once, through the
 *     documented `setContent()` channel;
 *   · the same source through the slot, the other documented channel;
 *   · one sanitization payload, the component's headline promise;
 *   · `link-click`, including the "default prevented" half;
 *   · the two pinned findings, MATRIX-markdown-1 and MATRIX-markdown-2.
 *
 * Every structural assertion routes through the matrix's own oracle.
 * BUDGET: well under 1s.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { expectClean, removeComponent, wait } from '../matrix-common';
import {
  SYNTAX, body, checkFrame, checkSyntax, mountMarkdown, recordEvents,
} from './markdown-support';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const find = (name: string) => SYNTAX.find(s => s.name === name)!;

describe('markdown matrix smoke', () => {
  it('a GFM table renders real thead/tbody structure', async () => {
    const syntax = find('GFM table');
    const combo = { source: syntax.source };
    el = await mountMarkdown(combo);
    expectClean(checkSyntax(el, syntax, combo), 'GFM table');
  });

  it('headings, emphasis and code render their semantic elements', async () => {
    const source = '# Title\n\nSome **bold**, some *italic*, and `code`.\n\n```javascript\nconst x = 1;\n```';
    const combo = { source };
    el = await mountMarkdown(combo);
    expectClean(checkFrame(el, combo), 'mixed document');

    const base = body(el)!;
    expect(base.querySelector('h1')!.textContent).toBe('Title');
    expect(base.querySelector('strong')!.textContent).toBe('bold');
    expect(base.querySelector('em')!.textContent).toBe('italic');
    expect(base.querySelector('code.language-javascript')!.textContent).toBe('const x = 1;');
  });

  it('slotted source is the same document as setContent', async () => {
    const syntax = find('unordered list');
    const combo = { source: syntax.source, viaSlot: true };
    el = await mountMarkdown(combo);
    expectClean(checkSyntax(el, syntax, combo), 'unordered list via slot');
  });

  it('sanitization strips a script but keeps the markdown around it', async () => {
    el = await mountMarkdown({ source: '<script>window.pwned = 1;</script>\n\n**kept**' });
    expect(body(el)!.querySelectorAll('script')).toHaveLength(0);
    expect(body(el)!.querySelector('strong')!.textContent).toBe('kept');
  });

  it('clicking a rendered link emits link-click and prevents the default', async () => {
    el = await mountMarkdown({ source: 'See [the docs](https://example.com/docs).' });
    const events = recordEvents(el);

    const event = new MouseEvent('click', { bubbles: true, composed: true, cancelable: true });
    body(el)!.querySelector('a')!.dispatchEvent(event);
    await wait(20);

    expect(events.of('link-click')[0])
      .toEqual({ href: 'https://example.com/docs', text: 'the docs' });
    expect(event.defaultPrevented).toBe(true);
  });

  // MATRIX-markdown-1: the sanitizer's dangerous-tag list contains `input`, so
  // the documented task-list syntax loses its checkboxes at the documented
  // `sanitize` default.
  it.fails('MATRIX-markdown-1: a task list renders checkboxes by default', async () => {
    const syntax = find('task list');
    const combo = { source: syntax.source };
    el = await mountMarkdown(combo);
    expectClean(checkSyntax(el, syntax, combo), 'task list');
  });

  it('MATRIX-markdown-1 reproduces: the checkboxes are stripped, the labels remain', async () => {
    el = await mountMarkdown({ source: '- [ ] Todo\n- [x] Done' });
    expect(body(el)!.querySelectorAll('input[type="checkbox"]')).toHaveLength(0);
    expect(body(el)!.querySelectorAll('li')).toHaveLength(2);
    expect(body(el)!.textContent).toContain('Todo');
  });

  // MATRIX-markdown-2: setContent assigns the reactive `content` property AND
  // calls renderMarkdown(), so one call renders and announces twice.
  it.fails('MATRIX-markdown-2: setContent emits markdown-render exactly once', async () => {
    el = await mountMarkdown({ source: 'first' });
    const events = recordEvents(el);
    (el as any).setContent('# One');
    await wait(30);
    expect(events.of('markdown-render')).toHaveLength(1);
  });

  it('MATRIX-markdown-2 reproduces: one setContent call renders twice', async () => {
    el = await mountMarkdown({ source: 'first' });
    const events = recordEvents(el);
    (el as any).setContent('# One');
    await wait(30);
    expect(events.of('markdown-render')).toHaveLength(2);
  });
});

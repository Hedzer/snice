/**
 * snice-markdown matrix — the EVENT and DELIVERY cross.
 *
 * The docs give the component two events and two ways in:
 *
 *   · `markdown-render` -> { html } — "after render";
 *   · `link-click` -> { href, text } — "default prevented", so the component
 *     takes over navigation without the consumer losing the link;
 *   · `setContent(markdown)` — "Set markdown source and re-render";
 *   · the default slot — "Markdown source text".
 *
 * Every link shape the parser can produce is crossed against the two delivery
 * channels, because `link-click` is delegated to whatever `<a>` the render
 * happened to create.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent, wait } from '../matrix-common';
import { body, mountMarkdown, recordEvents, renderedHtml } from './markdown-support';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

/** The three link shapes the documented syntax can produce. */
const LINKS = [
  { name: 'inline link', source: 'See [the docs](https://example.com/docs).', href: 'https://example.com/docs', text: 'the docs' },
  { name: 'autolink', source: 'Visit https://example.com now.', href: 'https://example.com', text: 'https://example.com' },
  { name: 'relative link', source: 'Go [home](/index.html).', href: '/index.html', text: 'home' },
];

describe('markdown matrix: link-click x link shape x delivery channel', () => {
  for (const link of LINKS) {
    for (const viaSlot of [false, true]) {
      const id = `${link.name}/${viaSlot ? 'slot' : 'setContent'}`;
      it(id, async () => {
        el = await mountMarkdown({ source: link.source, viaSlot });
        const events = recordEvents(el);

        const anchor = body(el)!.querySelector('a') as HTMLAnchorElement | null;
        expect(anchor, `${id} rendered no anchor to click`).not.toBeNull();
        expect(anchor!.getAttribute('href')).toBe(link.href);

        const event = new MouseEvent('click', {
          bubbles: true, composed: true, cancelable: true,
        });
        anchor!.dispatchEvent(event);
        await wait(20);

        expect(events.of('link-click'), `${id} emitted no link-click`).toHaveLength(1);
        expect(events.of('link-click')[0]).toEqual({ href: link.href, text: link.text });
        expect(event.defaultPrevented,
          'link-click is documented as "default prevented"').toBe(true);
      });
    }
  }
});

describe('markdown matrix: markdown-render', () => {
  it('setContent emits markdown-render carrying exactly what was rendered', async () => {
    el = await mountMarkdown({ source: 'seed' });
    const events = recordEvents(el);

    (el as any).setContent('# Title\n\nSome **bold** text.');
    await wait(30);

    const rendered = events.of('markdown-render');
    expect(rendered.length).toBeGreaterThan(0);
    const { html } = rendered[rendered.length - 1];
    expect(html).toContain('<h1>Title</h1>');
    expect(html).toContain('<strong>bold</strong>');
    expect(renderedHtml(el)).toBe((html as string).trim());
  });

  it('each setContent call emits again, in order, and the body follows', async () => {
    el = await mountMarkdown({ source: 'first' });
    const events = recordEvents(el);

    (el as any).setContent('# One');
    await wait(20);
    (el as any).setContent('# Two');
    await wait(20);
    (el as any).setContent('# Three');
    await wait(20);

    // The ORDER is the claim here; how many events each call produces is
    // MATRIX-markdown-2 below.
    const headings = events.of('markdown-render')
      .map(detail => (detail.html as string).match(/<h1>(.*?)<\/h1>/)?.[1])
      .filter(Boolean);
    const distinct = headings.filter((value, i) => value !== headings[i - 1]);
    expect(distinct).toEqual(['One', 'Two', 'Three']);
    expect(body(el)!.querySelector('h1')!.textContent).toBe('Three');
  });

  // ── MATRIX-markdown-2 ─────────────────────────────────────────────────────
  //
  // `setContent(markdown)` is documented as "Set markdown source and
  // re-render", and `markdown-render` as firing "after render" — one render,
  // one event. The method assigns `this.content` (which the `@watch('content')`
  // handler already answers by rendering) and then calls `renderMarkdown()`
  // itself, so every call renders twice and announces twice.
  //
  // A consumer listening for `markdown-render` to, say, re-run syntax
  // highlighting or measure the body therefore does that work twice per
  // update.
  //
  // Minimal repro:
  //   md.addEventListener('markdown-render', () => count++);
  //   md.setContent('# One');     // count === 2
  //
  // Reported, not fixed — see setContent() and handleContentChange() in
  // packages/components/src/markdown/snice-markdown.ts.
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
    // Both announcements describe the same, correct output — the duplication
    // is the whole of the defect.
    const [first, second] = events.of('markdown-render');
    expect(first.html).toBe(second.html);
  });

  it('assigning the content property directly emits once', async () => {
    // The counterpart: `content` is reactive on its own, so the plain
    // assignment does exactly one render. (The doc's note that `content` is
    // "a plain class field, not @property" is stale — it is declared
    // `@property({ attribute: false })`.)
    el = await mountMarkdown({ source: 'first' });
    const events = recordEvents(el);
    (el as any).content = '# One';
    await wait(30);
    expect(events.of('markdown-render')).toHaveLength(1);
    expect(body(el)!.querySelector('h1')!.textContent).toBe('One');
  });

  it('an empty source renders an empty body', async () => {
    el = await mountMarkdown({ source: '# Something' });
    (el as any).setContent('');
    await wait(30);
    expect(renderedHtml(el)).toBe('');
  });

  it('setContent replaces the whole body rather than appending', async () => {
    el = await mountMarkdown({ source: '# One\n\n- a\n- b' });
    expect(body(el)!.querySelectorAll('li')).toHaveLength(2);

    (el as any).setContent('# Two');
    await wait(30);
    expect(body(el)!.querySelectorAll('li')).toHaveLength(0);
    expect(body(el)!.querySelectorAll('h1')).toHaveLength(1);
  });
});

describe('markdown matrix: the two documented delivery channels agree', () => {
  const SOURCE = '# Title\n\n- one\n- two\n\n`code` and [a link](https://example.com).';

  it('slotted text and setContent produce the same body', async () => {
    el = await mountMarkdown({ source: SOURCE, viaSlot: true });
    const slotted = renderedHtml(el);
    removeComponent(el);

    el = await mountMarkdown({ source: SOURCE });
    expect(renderedHtml(el)).toBe(slotted);
  });
});

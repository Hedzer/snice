/**
 * Matrix slice LINK-PREVIEW / INTERACTION — the one documented event.
 *
 * Contract (docs/ai/components/link-preview.md § Events):
 *   `link-click` -> `{ url: string }`
 *
 * The card is a link, so the matrix crosses the ways one is followed (pointer,
 * Enter, Space) against the `url` shapes an author can supply, and against both
 * layout axes to prove the affordance is not a property of one variant.
 *
 * `window.open` is stubbed for the whole slice: navigating away is the browser's
 * job, not this assertion's, and an unstubbed open would either navigate the
 * test environment or throw inside the handler before the event is dispatched.
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { mount, unmountAll, product, captureEvents, click, key, part } from '../matrix-utils';
import { VARIANTS, SIZES, preview, attrsOf, propsOf, type PreviewCombo } from './link-preview-support';

const URL = 'https://example.com/posts/1';

const mountPreview = (c: PreviewCombo) =>
  mount<HTMLElement>('snice-link-preview', attrsOf(c), '', propsOf(c));

describe('link-preview matrix: interaction', () => {
  let opened: Array<any[]>;

  beforeEach(() => {
    opened = [];
    vi.stubGlobal('open', (...args: any[]) => { opened.push(args); return null; });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    unmountAll();
  });

  // ── Following the link ───────────────────────────────────────────────────

  for (const combo of product({
    variant: VARIANTS,
    size: SIZES,
    how: ['click', 'Enter', ' '] as const,
  })) {
    const id = `${combo.variant}/${combo.size} via ${combo.how === ' ' ? 'Space' : combo.how}`;

    it(`${id} emits link-click with the url`, async () => {
      const c = preview({ url: URL, title: 'Article', variant: combo.variant, size: combo.size });
      const el = await mountPreview(c);
      const recorder = captureEvents(el, ['link-click']);

      if (combo.how === 'click') click(part(el, 'base'));
      else key(el, combo.how);

      expect(recorder.types(), id).toEqual(['link-click']);
      expect(recorder.events[0].detail, id).toEqual({ url: URL });
    });
  }

  it('link-click carries whatever url is currently set', async () => {
    const c = preview({ url: URL, title: 'Article' });
    const el = await mountPreview(c);
    const recorder = captureEvents(el, ['link-click']);

    click(part(el, 'base'));
    (el as any).url = 'https://example.org/other';
    await (el as any).rendered;
    click(part(el, 'base'));

    expect(recorder.events.map(e => e.detail.url))
      .toEqual([URL, 'https://example.org/other']);
  });

  it('link-click bubbles and crosses the shadow boundary', async () => {
    const c = preview({ url: URL, title: 'Article' });
    const el = await mountPreview(c);
    const seen: string[] = [];
    document.addEventListener('link-click', () => seen.push('document'), { once: true });

    click(part(el, 'base'));

    expect(seen, 'a page-level listener never saw link-click').toEqual(['document']);
  });

  // ── There is no link to follow ───────────────────────────────────────────

  it('a preview with no url emits nothing', async () => {
    // `url` defaults to '' and the documented event detail is `{ url: string }`;
    // an empty url is not a destination, so there is nothing to announce.
    const c = preview({ title: 'Unlinked' });
    const el = await mountPreview(c);
    const recorder = captureEvents(el, ['link-click']);

    click(part(el, 'base'));
    key(el, 'Enter');
    key(el, ' ');

    expect(recorder.types()).toEqual([]);
    expect(opened).toEqual([]);
  });

  it('keys that are not activation keys do nothing', async () => {
    const c = preview({ url: URL, title: 'Article' });
    const el = await mountPreview(c);
    const recorder = captureEvents(el, ['link-click']);

    for (const k of ['Tab', 'Escape', 'a', 'ArrowRight']) key(el, k);

    expect(recorder.types()).toEqual([]);
  });
});

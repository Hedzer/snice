/**
 * Smoke slice of the snice-link-preview matrix — the everyday-loop tier.
 *
 * The full cross lives in `tests/matrix/link-preview/`, which
 * vitest.config.ts excludes from the default include. This file sits outside
 * that directory so it stays collected, and buys only the marquee combos:
 *
 *   · the fully-populated card in both variants — every documented part at once;
 *   · the bare card, where every `<if>` in the template takes its empty branch;
 *   · the documented JS-only `title` contract, the one property whose channel
 *     is spelled out in the docs;
 *   · the single documented event, once by pointer and once by keyboard.
 *
 * Structural assertions route through the matrix's own `previewProblems`
 * oracle. BUDGET: well under 1s.
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { mount, unmountAll, captureEvents, click, key, part } from '../matrix-utils';
import {
  preview, attrsOf, propsOf, previewProblems, read, comboId, type PreviewCombo,
} from './link-preview-support';

const URL = 'https://example.com/posts/1';

const mountPreview = (c: PreviewCombo) =>
  mount<HTMLElement>('snice-link-preview', attrsOf(c), '', propsOf(c));

describe('link-preview matrix smoke', () => {
  beforeEach(() => vi.stubGlobal('open', () => null));
  afterEach(() => { vi.unstubAllGlobals(); unmountAll(); });

  const marquee: PreviewCombo[] = [
    preview({
      url: URL, title: 'Article Title', description: 'Brief summary.',
      image: '/images/og.jpg', siteName: 'example.com', favicon: '/icons/favicon.ico',
    }),
    preview({
      url: URL, title: 'Article Title', description: 'Brief summary.',
      image: '/images/og.jpg', siteName: 'example.com', favicon: '/icons/favicon.ico',
      variant: 'horizontal', size: 'small',
    }),
    preview({ url: URL, description: 'No title, no image.', size: 'large' }),
    preview(),
  ];

  for (const c of marquee) {
    it(comboId(c), async () => {
      const el = await mountPreview(c);
      expect(previewProblems(el, c), `combo ${comboId(c)}`).toEqual([]);
    });
  }

  it('a title attribute stays the native tooltip', async () => {
    const el = await mount<HTMLElement>('snice-link-preview', { url: URL, title: 'Tooltip' });
    expect(read(el).titleText).toBe('');
    expect(el.getAttribute('title')).toBe('Tooltip');
  });

  it('click and Enter both emit link-click with the url', async () => {
    const c = preview({ url: URL, title: 'Article' });
    const el = await mountPreview(c);
    const recorder = captureEvents(el, ['link-click']);

    click(part(el, 'base'));
    key(el, 'Enter');

    expect(recorder.types()).toEqual(['link-click', 'link-click']);
    expect(recorder.events[0].detail).toEqual({ url: URL });
  });

  it('a preview with no url emits nothing', async () => {
    const el = await mountPreview(preview({ title: 'Unlinked' }));
    const recorder = captureEvents(el, ['link-click']);
    click(part(el, 'base'));
    expect(recorder.types()).toEqual([]);
  });
});

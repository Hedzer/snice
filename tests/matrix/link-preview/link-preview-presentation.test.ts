/**
 * Matrix slice LINK-PREVIEW / PRESENTATION — the card's documented content
 * surface crossed against both layout axes.
 *
 * Dimensions (docs/ai/components/link-preview.md § Properties):
 *   variant (2) x size (3) x image (2) x title (2) x description (2) = 48
 *   combos, plus a 12-combo footer cross (siteName x favicon x url shape) and
 *   the documented JS-only-`title` contract.
 *
 * Every case is judged by `previewProblems`, the one oracle for this component.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { mount, unmountAll, product } from '../matrix-utils';
import {
  VARIANTS, SIZES, preview, attrsOf, propsOf, comboId, previewProblems, read,
  type PreviewCombo,
} from './link-preview-support';

const IMAGE = '/images/og.jpg';
const TITLE = 'Article Title';
const DESCRIPTION = 'Brief summary of the linked article.';
const URL = 'https://example.com/posts/1';
const SITE = 'example.com';
const FAVICON = '/icons/favicon.ico';

const mountPreview = (c: PreviewCombo) =>
  mount<HTMLElement>('snice-link-preview', attrsOf(c), '', propsOf(c));

describe('link-preview matrix: presentation', () => {
  afterEach(() => unmountAll());

  // ── Layout x content ─────────────────────────────────────────────────────

  for (const combo of product({
    variant: VARIANTS,
    size: SIZES,
    image: [false, true],
    title: [false, true],
    description: [false, true],
  })) {
    const c = preview({
      variant: combo.variant,
      size: combo.size,
      image: combo.image ? IMAGE : '',
      title: combo.title ? TITLE : '',
      description: combo.description ? DESCRIPTION : '',
      url: URL,
      siteName: SITE,
    });

    it(comboId(c), async () => {
      const el = await mountPreview(c);
      expect(previewProblems(el, c), `combo ${comboId(c)}`).toEqual([]);
    });
  }

  // ── The footer: site info ────────────────────────────────────────────────

  for (const combo of product({
    siteName: [false, true],
    favicon: [false, true],
    url: [URL, '', 'not-a-url'],
  })) {
    const c = preview({
      variant: 'vertical',
      size: 'medium',
      title: TITLE,
      description: DESCRIPTION,
      siteName: combo.siteName ? SITE : '',
      favicon: combo.favicon ? FAVICON : '',
      url: combo.url,
    });

    it(comboId(c), async () => {
      const el = await mountPreview(c);
      expect(previewProblems(el, c), `combo ${comboId(c)}`).toEqual([]);
    });
  }

  // ── The documented JS-only title ─────────────────────────────────────────

  it('the title PROPERTY becomes the preview title', async () => {
    const c = preview({ title: TITLE, url: URL });
    const el = await mountPreview(c);
    expect(read(el).titleText).toBe(TITLE);
    expect(previewProblems(el, c)).toEqual([]);
  });

  it('a title ATTRIBUTE is the native tooltip, not the preview title', async () => {
    // The doc is explicit: `title` is JS-only, "a title attribute is the native
    // tooltip, not this". So authoring `title="…"` must leave the card's own
    // title element empty and leave the attribute alone for the browser.
    const el = await mount<HTMLElement>('snice-link-preview', {
      url: URL, title: 'Native tooltip text', description: DESCRIPTION,
    });
    const r = read(el);
    expect(r.titleText, 'a title attribute leaked into the preview title').toBe('');
    expect(el.getAttribute('title'), 'the native tooltip attribute was consumed').toBe('Native tooltip text');
  });

  it('the empty card still renders its documented parts', async () => {
    const c = preview();
    const el = await mountPreview(c);
    expect(previewProblems(el, c)).toEqual([]);
  });

  it('every documented property at once', async () => {
    const c = preview({
      url: URL, title: TITLE, description: DESCRIPTION, image: IMAGE,
      siteName: SITE, favicon: FAVICON, variant: 'horizontal', size: 'large',
    });
    const el = await mountPreview(c);
    expect(previewProblems(el, c)).toEqual([]);
  });
});

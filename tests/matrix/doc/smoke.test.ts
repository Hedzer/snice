/**
 * Smoke slice of the snice-doc matrix — the everyday-loop tier.
 *
 * `tests/matrix` is excluded from the default Vitest include (vitest.config.ts);
 * the full matrix runs only via `npm run test:matrix`. This file is the
 * standing cost the everyday loop DOES pay, so it lives at `smoke.test.ts`
 * where the config keeps it collected.
 *
 * One combo per feature family of docs/ai/components/doc.md: the documented
 * part/toolbar shape, the icon-set surface, readonly editability with its
 * reflection, the placeholder channel, and the document accessors. Every
 * structural assertion routes through the matrix's own oracle
 * (`expectedShape`/`readShape`, `expectedToolbarIcons`/`readToolbarIcons`),
 * so this file cannot drift into asserting something weaker than the suite
 * it stands in for.
 *
 * BUDGET: well under 1s. New feature combinations belong in the matrix.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { expectShape } from '../matrix-utils';
import {
  DEFAULTS, mountDoc, mountDocWithContent, cleanupDocs,
  expectedShape, readShape, expectedAxes, readAxes,
  expectedToolbarIcons, readToolbarIcons, editorOf,
  type DocCombo,
} from './doc-support';

const combo = (over: Partial<DocCombo> = {}): DocCombo => ({
  icons: 'default', readonly: false, placeholder: DEFAULTS.placeholder,
  channel: 'attr', ...over,
});

describe('doc matrix smoke', () => {
  afterEach(() => cleanupDocs());

  it('a bare doc renders the four documented parts and the full toolbar', async () => {
    const c = combo();
    const el = await mountDoc(c);
    expectShape(readShape(el), expectedShape(c), 'smoke/bare shape');
    expectShape(readToolbarIcons(el), expectedToolbarIcons(c), 'smoke/bare icons');
    expect(el.placeholder).toBe('Start typing...');
    expect(el.icons).toBe('default');
  });

  it('the material icon set moves every button onto the icon part', async () => {
    const c = combo({ icons: 'material' });
    const el = await mountDoc(c);
    expectShape(readShape(el), expectedShape(c), 'smoke/material shape');
    expectShape(readToolbarIcons(el), expectedToolbarIcons(c), 'smoke/material icons');
    expect(el.icons).toBe('material');
  });

  it('readonly bars editing and reaches the attribute the stylesheet keys on', async () => {
    // `:host([readonly]) .toolbar { display: none }` cannot see a JS
    // assignment that never reflects — the property channel is the proof.
    const c = combo({ readonly: true, placeholder: 'Cannot edit this', channel: 'prop' });
    const el = await mountDoc(c);
    expectShape(readAxes(el, c), expectedAxes(c), 'smoke/readonly axes');
    expect(el.hasAttribute('readonly')).toBe(true);
    // The editor-side half of the property-channel readonly assignment is a
    // standing finding (MATRIX-doc-1, pinned in structure.test.ts); the
    // authored-attribute channel is the smoke-level proof here.
    const authored = await mountDoc(combo({ readonly: true }));
    expect(String(editorOf(authored)!.contentEditable)).toBe('false');
  });

  it('an authored placeholder reaches the editor', async () => {
    const c = combo({ placeholder: 'Write your story here...' });
    const el = await mountDoc(c);
    expectShape(readShape(el), expectedShape(c), 'smoke/placeholder shape');
    expect(editorOf(el)!.getAttribute('data-placeholder')).toBe('Write your story here...');
  });

  it('the document accessors round-trip the showcase sample', async () => {
    // The established sample-content approach from website/showcases/doc/
    // full.html — local strings only.
    const el = await mountDocWithContent(
      combo(),
      '<h1>Document Title</h1><p>Text with <b>bold</b>.</p>');
    expect(el.getHTML()).toBe('<h1>Document Title</h1><p>Text with <b>bold</b>.</p>');
    expect(el.getText()).toContain('Document Title');
    expect(el.getMarkdown()).toBe('# Document Title\n\nText with **bold**.\n');
    el.clear();
    expect(el.getHTML()).toBe('<p><br></p>');
  });
});

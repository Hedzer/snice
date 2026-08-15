// @vitest-environment node
/**
 * The table showcase tells a reader which control to click. When that
 * instruction names a glyph the component never draws, the reader hunts for a
 * button that does not exist.
 *
 * Field report (Master-Detail section): the note read "Click ▶ to expand a
 * row" while `TableMasterDetail.createToggleButton()` draws the same chevron
 * SVG as `snice-accordion`. This suite pins copy to the icon that actually
 * ships, in both directions — change the icon and the copy has to follow.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');

const fullShowcase = read('website/showcases/table/full.html');
const masterDetail = read('packages/components/src/table/table-master-detail.ts');

/** Glyphs whose shape is a filled/outlined triangle, not a chevron stroke. */
const TRIANGLES = ['▶', '▸', '►', '▷', '▼', '▾'];

function sectionNote(heading: string): string {
  const at = fullShowcase.indexOf(heading);
  expect(at, `showcase is missing the "${heading}" heading`).toBeGreaterThan(-1);
  const note = fullShowcase.slice(at).match(/<p class="note">([\s\S]*?)<\/p>/);
  expect(note, `"${heading}" has no note paragraph`).toBeTruthy();
  return note![1];
}

describe('table showcase copy names the affordance that ships', () => {
  it('draws the master-detail toggle as a chevron', () => {
    // The default icon is an inline SVG path, not a text glyph.
    expect(masterDetail).toContain('<svg class="detail-toggle-icon"');
    for (const glyph of TRIANGLES) {
      expect(masterDetail, `toggle draws ${glyph}`).not.toContain(glyph);
    }
  });

  it('does not tell the reader to click a triangle', () => {
    const note = sectionNote('<h2>Master-Detail (Expandable Rows)</h2>');
    for (const glyph of TRIANGLES) {
      expect(note, `note promises ${glyph}`).not.toContain(glyph);
    }
    expect(note.toLowerCase()).toContain('chevron');
  });

  it('keeps every showcase note free of triangle affordance glyphs', () => {
    const offenders = [...fullShowcase.matchAll(/<p class="note">([\s\S]*?)<\/p>/g)]
      .map((match) => match[1])
      .filter((note) => TRIANGLES.some((glyph) => note.includes(glyph)));

    expect(offenders).toEqual([]);
  });
});

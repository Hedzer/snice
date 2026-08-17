/**
 * Matrix slice DOC / STRUCTURE — parts, toolbar inventory, icon sets,
 * editability, reflection.
 *
 * Dimensions: icons (3 documented sets) x readonly (2) x placeholder
 * (2: documented default, authored) = 12 combos, plus the property-channel
 * reflection pass over the same cross and the webfont-set icon oracle.
 *
 * Documented contract:
 *   · CSS Parts: `base`, `editor`, `toolbar`, `icon`.
 *   · "Simple WYSIWYG document editor with formatting toolbar and content
 *     insertion" — 15 documented toolbar buttons (see doc-support.ts for the
 *     derivation of the inventory).
 *   · Icon sets: `default` ("Text labels and emoji"), `material` (Material
 *     Symbols Outlined), `fontawesome` (Font Awesome 6 solid). "Fonts cascade
 *     from light DOM into shadow DOM" — a PAINT claim owned by the visual
 *     tier; this slice owns which buttons carry the documented `icon` part.
 *   · "contentEditable for native text editing" — the editor is editable
 *     exactly while not readonly.
 *   · `placeholder: string = 'Start typing...'`.
 *   · Reflection (docs/ai/properties.md): authored attributes always present;
 *     property assignments reflect unless equal to the documented default —
 *     `readonly` matters most, because `:host([readonly]) .toolbar` hides
 *     the toolbar through the attribute channel.
 *
 * it.fails policy: no finding is pinned in this file.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { product, expectShape } from '../matrix-utils';
import {
  ICON_SETS, CHANNELS, DEFAULTS, TOOLS,
  mountDoc, cleanupDocs, expectedShape, readShape, expectedAxes, readAxes,
  expectedToolbarIcons, readToolbarIcons, toolbarButtons, editorOf,
  type DocCombo, type IconSet,
} from './doc-support';

const PLACEHOLDERS = [DEFAULTS.placeholder, 'Write your story here...'] as const;

describe('doc matrix: structure', () => {
  afterEach(() => cleanupDocs());

  const combos = product({
    icons: ICON_SETS,
    readonly: [false, true],
    placeholder: PLACEHOLDERS,
  }).map(c => ({ ...c, channel: 'attr' as const }));

  for (const combo of combos) {
    const id = `${combo.icons}/${combo.readonly ? 'readonly' : 'editable'}`
      + `/${combo.placeholder === DEFAULTS.placeholder ? 'default-placeholder' : 'authored-placeholder'}`;

    it(`${id}: the documented shape holds`, async () => {
      const el = await mountDoc(combo as DocCombo);
      expectShape(readShape(el), expectedShape(combo as DocCombo), id);
      expectShape(readToolbarIcons(el), expectedToolbarIcons(combo as DocCombo), id);

      // The documented default-set text labels: B/I/U/S read as their own
      // button text. (Under the webfont sets the glyph lives inside the
      // icon span; which webfont NAME it is, is a paint question the visual
      // tier owns.)
      const byTitle = new Map(toolbarButtons(el).map(button => [button.title, button]));
      if (combo.icons === 'default') {
        for (const tool of TOOLS) {
          if (tool.glyph) {
            expect(byTitle.get(tool.title)?.text, `${id} ${tool.title} glyph`)
              .toBe(tool.glyph);
          }
        }
      }
    });
  }

  // ── The property channel: reflection is what `:host([readonly])` sees ────
  for (const icons of ICON_SETS) {
    for (const channel of CHANNELS) {
      const combo: DocCombo = {
        icons,
        readonly: true,
        placeholder: 'Cannot edit this',
        channel,
      };

      it(`reflection/${channel}/${icons}: readonly reaches the attribute channel`, async () => {
        // A JS `readonly = true` that never reflected would leave the toolbar
        // visible while the property says otherwise.
        const el = await mountDoc(combo);
        expectShape(readAxes(el, combo), expectedAxes(combo), `reflection/${channel}/${icons}`);
      });

      if (channel === 'attr') {
        it(`reflection/attr/${icons}: an authored readonly bars editing`, async () => {
          const el = await mountDoc(combo);
          expect(String(editorOf(el)!.contentEditable)).toBe('false');
        });
      }
    }
  }

  // FINDING MATRIX-doc-1: assigning `readonly = true` through the PROPERTY
  // channel reflects the attribute (`:host([readonly])` hides the toolbar),
  // but the editor stays contentEditable — the imperative DOM built in @ready
  // reads `readonly` once and no watcher updates it. docs/ai/properties.md:
  // declared properties "Trigger re-renders when changed", and the component
  // derives the editor's editability from `readonly`; the assertion stays at
  // the documented behaviour and is pinned, not weakened.
  it.fails(
    'MATRIX-doc-1: a property-channel readonly assignment bars editing',
    async () => {
      const el = await mountDoc({
        icons: 'default', readonly: true, placeholder: DEFAULTS.placeholder, channel: 'prop',
      });
      expect(el.hasAttribute('readonly')).toBe(true);
      expect(String(editorOf(el)!.contentEditable)).toBe('false');
    });

  it('an editable editor is contentEditable="true", exactly the documented editing surface', async () => {
    const el = await mountDoc({ icons: 'default', readonly: false, placeholder: DEFAULTS.placeholder, channel: 'attr' });
    const editor = editorOf(el)!;
    expect(String(editor.contentEditable)).toBe('true');
    expect(editor.tagName).toBe('DIV');
  });

  it('readonly flips the editor to contentEditable="false" without removing it', async () => {
    const el = await mountDoc({ icons: 'default', readonly: true, placeholder: DEFAULTS.placeholder, channel: 'attr' });
    const editor = editorOf(el)!;
    expect(String(editor.contentEditable)).toBe('false');
    // The toolbar stays in the tree under readonly; whether it PAINTS is the
    // `:host([readonly])` CSS rule, asserted in the visual tier.
    expect(readShape(el).hasToolbar).toBe(true);
  });
});

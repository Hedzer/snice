/**
 * snice-color-picker matrix — the documented value contract.
 *
 * Quoted from the doc, and asserted verbatim below:
 *
 *   "Valid six-digit hex, `rgb(r, g, b)`, and `hsl(h, s%, l%)` text
 *    canonicalizes to six-digit hex. RGB channels must be `0..255`;
 *    saturation/lightness must be `0..100`; hue wraps modulo 360."
 *   "Malformed editable text remains visible/live and reports `badInput`; it is
 *    never silently replaced with black."
 *
 * The cross: typed text (28) x `format` (3) = 84 combos. `format` belongs in
 * the cross because the doc makes it the RENDERING of a canonical value, so a
 * component that canonicalized correctly but rendered in the wrong space would
 * pass a format-free test and show the customer the wrong string.
 *
 * Every expected canonical value is computed by the oracles in
 * color-picker-support.ts, which implement the CSS Color conversions the doc
 * names — not the component's own arithmetic.
 */
import { describe, it, afterEach } from 'vitest';
import { cross, expectClean, removeComponent } from '../matrix-kit';
import {
  DEFAULTS, Problems, checkValidity, checkValue, formatted, hslToHex, mountPicker, rgbToHex,
  typeValue, type Format, type Vector,
} from './color-picker-support';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

interface Entry {
  name: string;
  typed: string;
  /** The six-digit hex the doc says this canonicalizes to, or null for malformed. */
  canonical: string | null;
}

const ENTRIES: Entry[] = [
  // ── Six-digit hex ───────────────────────────────────────────────────────
  { name: 'hex/black', typed: '#000000', canonical: '#000000' },
  { name: 'hex/white', typed: '#ffffff', canonical: '#ffffff' },
  { name: 'hex/red', typed: '#ff0000', canonical: '#ff0000' },
  { name: 'hex/mid', typed: '#3b82f6', canonical: '#3b82f6' },
  { name: 'hex/uppercase', typed: '#3B82F6', canonical: '#3B82F6' },
  // "Valid SIX-DIGIT hex" — three-digit shorthand is not the documented form.
  { name: 'hex/three-digit', typed: '#fff', canonical: null },
  { name: 'hex/eight-digit', typed: '#3b82f6ff', canonical: null },
  { name: 'hex/no-hash', typed: '3b82f6', canonical: null },
  { name: 'hex/not-hex', typed: '#gggggg', canonical: null },

  // ── rgb(r, g, b) ────────────────────────────────────────────────────────
  { name: 'rgb/black', typed: 'rgb(0, 0, 0)', canonical: rgbToHex(0, 0, 0) },
  { name: 'rgb/white', typed: 'rgb(255, 255, 255)', canonical: rgbToHex(255, 255, 255) },
  { name: 'rgb/mid', typed: 'rgb(59, 130, 246)', canonical: rgbToHex(59, 130, 246) },
  { name: 'rgb/no-spaces', typed: 'rgb(59,130,246)', canonical: rgbToHex(59, 130, 246) },
  { name: 'rgb/extra-spaces', typed: 'rgb(  59 , 130 ,  246  )', canonical: rgbToHex(59, 130, 246) },
  { name: 'rgb/uppercase', typed: 'RGB(59, 130, 246)', canonical: rgbToHex(59, 130, 246) },
  // "RGB channels must be `0..255`"
  { name: 'rgb/over-255', typed: 'rgb(300, 0, 0)', canonical: null },
  { name: 'rgb/negative', typed: 'rgb(-1, 0, 0)', canonical: null },
  { name: 'rgb/two-channels', typed: 'rgb(1, 2)', canonical: null },
  { name: 'rgb/unclosed', typed: 'rgb(1, 2, 3', canonical: null },

  // ── hsl(h, s%, l%) ──────────────────────────────────────────────────────
  { name: 'hsl/black', typed: 'hsl(0, 0%, 0%)', canonical: hslToHex(0, 0, 0) },
  { name: 'hsl/white', typed: 'hsl(0, 0%, 100%)', canonical: hslToHex(0, 0, 100) },
  { name: 'hsl/blue', typed: 'hsl(217, 91%, 60%)', canonical: hslToHex(217, 91, 60) },
  { name: 'hsl/no-spaces', typed: 'hsl(217,91%,60%)', canonical: hslToHex(217, 91, 60) },
  // "hue wraps modulo 360"
  { name: 'hsl/hue-wraps', typed: 'hsl(577, 91%, 60%)', canonical: hslToHex(577, 91, 60) },
  { name: 'hsl/hue-negative', typed: 'hsl(-143, 91%, 60%)', canonical: hslToHex(-143, 91, 60) },
  // "saturation/lightness must be `0..100`"
  { name: 'hsl/saturation-over-100', typed: 'hsl(0, 120%, 50%)', canonical: null },
  { name: 'hsl/lightness-negative', typed: 'hsl(0, 50%, -1%)', canonical: null },
  { name: 'hsl/missing-percent', typed: 'hsl(0, 50, 50)', canonical: null },

  // ── Neither ─────────────────────────────────────────────────────────────
  { name: 'named-colour', typed: 'rebeccapurple', canonical: null },
  { name: 'gibberish', typed: 'not a colour', canonical: null },
];

describe('color-picker matrix: typed text', () => {
  for (const combo of cross({ entry: ENTRIES, format: ['hex', 'rgb', 'hsl'] as const })) {
    const entry = combo.entry as Entry;
    const format = combo.format as Format;
    const id = `${entry.name}/format=${format}`;

    it(id, async () => {
      const vector: Vector = { ...DEFAULTS, format, name: 'colour' };
      el = await mountPicker(vector);
      const problems = new Problems();

      await typeValue(el, entry.typed);

      // "…canonicalizes to six-digit hex", and malformed text "remains
      // visible/live … never silently replaced with black".
      checkValue(problems, el, vector, {
        value: entry.canonical ?? entry.typed,
        canonical: entry.canonical,
      });

      // "Malformed editable text … reports `badInput`." The FLAG needs an
      // `ElementInternals` this environment does not have (see checkValidity's
      // note); what this tier pins is that malformed text makes the control
      // invalid and gives the customer a reason — and that valid text does not.
      checkValidity(problems, el, { valid: entry.canonical !== null });
      if (entry.canonical === null) {
        problems.check(/colou?r/i.test((el as any).validationMessage),
          `malformed text "${entry.typed}" reports "${(el as any).validationMessage}",`
          + ' which does not tell the customer the colour is the problem');
      }

      expectClean(problems, id);
    });
  }
});

describe('color-picker matrix: format renders the same colour three ways', () => {
  // The same canonical colour, shown in each documented format. A component
  // that canonicalized correctly but rendered in the wrong space would still
  // hold the right `value` — the customer would simply be shown a lie.
  const colours = ['#000000', '#ffffff', '#3b82f6', '#f87171', '#22d3ee', '#7f7f7f'];
  for (const colour of colours) {
    for (const format of ['hex', 'rgb', 'hsl'] as const) {
      it(`${colour} as ${format}`, async () => {
        const vector: Vector = { ...DEFAULTS, format, name: 'colour' };
        el = await mountPicker(vector, { value: colour });
        const problems = new Problems();

        problems.equal((el as any).value, colour, 'the live value');
        checkValue(problems, el, vector, { value: colour, canonical: colour });
        problems.equal((el as any).value, colour,
          'reading the formatted text changed the live value');

        expectClean(problems, `${colour}/${format}`);
      });
    }
  }

  it('a round trip through every format keeps the same colour', async () => {
    // Documented: `format` is a display choice, not a value change. Switching
    // it must not move the colour the control holds.
    const vector: Vector = { ...DEFAULTS, name: 'colour' };
    el = await mountPicker(vector, { value: '#3b82f6' });
    const problems = new Problems();

    for (const format of ['rgb', 'hsl', 'hex'] as const) {
      (el as any).format = format;
      await new Promise(resolve => setTimeout(resolve, 30));
      problems.equal((el as any).value, '#3b82f6', `the value after switching to ${format}`);
      problems.equal((el as any).shadowRoot.querySelector('.color-input').value,
        formatted('#3b82f6', format), `the text shown as ${format}`);
    }

    expectClean(problems, 'format/round-trip');
  });
});

describe('color-picker matrix: the authored value attribute', () => {
  // "`value` is live; `defaultValue` reflects the `value` attribute."
  for (const entry of ENTRIES.filter((_, i) => i % 3 === 0)) {
    it(`value="${entry.typed}"`, async () => {
      const vector: Vector = { ...DEFAULTS, name: 'colour' };
      el = await mountPicker(vector, { value: entry.typed });
      const problems = new Problems();

      problems.equal((el as any).defaultValue, entry.typed,
        'defaultValue reflects the `value` attribute verbatim');
      checkValue(problems, el, vector, {
        value: entry.canonical ?? entry.typed,
        canonical: entry.canonical,
      });

      expectClean(problems, `attribute/${entry.name}`);
    });
  }
});

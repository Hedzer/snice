/**
 * snice-paint — the toolbar, the palette and the documented slots.
 *
 * AXES:
 *   controls      the documented default, each single control alone (6), each
 *                 control removed (6), and the empty list
 *   colors        the documented default palette, a custom palette, one colour
 *   colorSelects  0, 1, 3 extra picker dots
 *   slots         each of the five documented extension points
 *   disabled      on | off
 *
 * The `controls` axis is the interesting one: it is a comma STRING, so every
 * subset is expressible, and each subset decides which parts of the toolbar
 * exist at all.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mountPaint, expectShell, comboId, swatches, colorInputs, sizeSlider, toolButtons,
  buttonTitles, slot, partEl, partEls, sr, classesOf, canvasEl, click, pressControl,
  captureEvents, keysOf, installPaintStack, restorePaintStack,
  CONTROLS, DEFAULT_COLORS, DOC_PARTS, DOC_SLOTS, wait, SETTLE,
  type CanvasMock, type PaintControl,
} from './paint-support';

let canvas: CanvasMock;

beforeEach(() => { canvas = installPaintStack(); });
afterEach(() => {
  document.body.innerHTML = '';
  restorePaintStack();
});

describe('snice-paint matrix: the default shell', () => {
  for (const disabled of [false, true]) {
    it(`disabled=${disabled}: the documented bare markup renders everything`, async () => {
      const el = await mountPaint({ disabled: disabled || undefined });
      expectShell(el, { disabled: disabled || undefined });
    });
  }

  it('each documented part resolves to exactly one node', async () => {
    // `::part(canvas)` must not be ambiguous — and must not accidentally
    // include `canvas-wrap`, which is why the count is read exactly.
    const el = await mountPaint({});
    const counts = DOC_PARTS.map(name => ({ name, count: partEls(el, name).length }));
    expect(counts).toEqual(DOC_PARTS.map(name => ({ name, count: 1 })));
  });

  it('the toolbar offers the six documented controls in order', async () => {
    const el = await mountPaint({});
    expect(swatches(el)).toHaveLength(DEFAULT_COLORS.length);
    expect(sizeSlider(el)).toBeTruthy();
    expect(buttonTitles(el)).toEqual(['Eraser', 'Undo', 'Redo', 'Clear canvas']);
  });
});

describe('snice-paint matrix: the controls list', () => {
  for (const control of CONTROLS) {
    const combo = { controls: control };
    it(`${comboId(combo)}: only "${control}" is offered`, async () => {
      const el = await mountPaint(combo);
      expectShell(el, combo);
    });
  }

  for (const control of CONTROLS) {
    const remaining = CONTROLS.filter(name => name !== control);
    const combo = { controls: remaining.join(',') };
    it(`without "${control}": the other five are offered`, async () => {
      const el = await mountPaint(combo);
      expectShell(el, combo);
    });
  }

  it('an empty controls list offers no controls at all', async () => {
    const el = await mountPaint({ controls: '' });
    expect(swatches(el)).toEqual([]);
    expect(sizeSlider(el)).toBeNull();
    expect(toolButtons(el)).toEqual([]);
    // The canvas is the point of the component; it survives an empty toolbar.
    expect(partEl(el, 'canvas')).toBeTruthy();
  });

  it('an unknown control name is ignored rather than rendered', async () => {
    const el = await mountPaint({ controls: 'colors,nonsense,clear' });
    expect(swatches(el).length).toBeGreaterThan(0);
    expect(buttonTitles(el)).toEqual(['Clear canvas']);
  });

  it('whitespace around a control name does not hide it', async () => {
    // `controls` is authored as an attribute string; `"undo, redo"` is the
    // shape a human writes.
    const el = await mountPaint({ controls: 'undo, redo' });
    expect(buttonTitles(el)).toEqual(['Undo', 'Redo']);
  });

  it('changing controls at runtime re-renders the toolbar', async () => {
    const el = await mountPaint({});
    el.controls = 'undo';
    await wait(SETTLE);
    expect(buttonTitles(el)).toEqual(['Undo']);
    expect(swatches(el)).toEqual([]);
  });
});

describe('snice-paint matrix: the palette', () => {
  it('the documented default palette is eight swatches', async () => {
    const el = await mountPaint({});
    expect(el.colors).toEqual(DEFAULT_COLORS);
    expect(swatches(el)).toHaveLength(8);
  });

  /**
   * FINDING MATRIX-paint-1 (FIXED).
   *
   * `colors` used to write a plain private field no render ever watched. It is
   * now backed by a reactive `@property` list the getter/setter funnels into,
   * so both the property setter and the `colors` ATTRIBUTE (parsed in `@ready`)
   * schedule the repaint that draws the new palette.
   */
  for (const colors of [
    ['#000000'],
    ['#ff0000', '#00ff00', '#0000ff'],
  ]) {
    it(`MATRIX-paint-1 (fixed): a palette of ${colors.length} renders ${colors.length} swatches`, async () => {
      const el = await mountPaint({ colors });
      expect(el.colors).toEqual(colors);
      expect(swatches(el)).toHaveLength(colors.length);
    });
  }

  it('a palette of the documented default length renders that many swatches', async () => {
    const el = await mountPaint({ colors: DEFAULT_COLORS });
    expect(el.colors).toEqual(DEFAULT_COLORS);
    expect(swatches(el)).toHaveLength(DEFAULT_COLORS.length);
  });

  it('MATRIX-paint-1 (fixed): the palette can be replaced through the property setter', async () => {
    const el = await mountPaint({});
    el.colors = ['#111111', '#222222'];
    await wait(SETTLE);
    expect(swatches(el)).toHaveLength(2);
  });

  it('a palette assigned before any other render is picked up by that render', async () => {
    // The guard that MATRIX-paint-1 is about the missing re-render and not
    // about the setter losing the value: force an unrelated render afterwards
    // and the new palette appears.
    const el = await mountPaint({});
    el.colors = ['#111111', '#222222'];
    el.controls = 'colors,undo';
    await wait(SETTLE);
    expect(swatches(el)).toHaveLength(2);
  });

  it('picking a swatch selects that colour and leaves the eraser', async () => {
    const el = await mountPaint({});
    pressControl(el, 'Eraser');
    await wait(SETTLE);

    click(swatches(el)[2]);
    await wait(SETTLE);
    expect(el.color).toBe(DEFAULT_COLORS[2]);
    // Choosing a colour is choosing to paint with it.
    expect(classesOf(canvasEl(el)).has('tool-pen')).toBe(true);
  });

  it('exactly one swatch is marked active while painting', async () => {
    const el = await mountPaint({});
    const active = () => swatches(el).filter(node => node.classList.contains('active'));
    expect(active()).toHaveLength(1);

    click(swatches(el)[4]);
    await wait(SETTLE);
    expect(active()).toHaveLength(1);
    expect(active()[0]).toBe(swatches(el)[4]);
  });

  it('the eraser deactivates the colour selection', async () => {
    const el = await mountPaint({});
    pressControl(el, 'Eraser');
    await wait(SETTLE);
    expect(swatches(el).filter(node => node.classList.contains('active'))).toEqual([]);
  });

  for (const colorSelects of [0, 1, 3]) {
    it(`color-selects=${colorSelects} adds that many picker dots`, async () => {
      const el = await mountPaint({ colorSelects: colorSelects || undefined });
      expect(colorInputs(el)).toHaveLength(colorSelects);
      for (const input of colorInputs(el)) {
        expect(input.type).toBe('color');
        // "Toolbar buttons have title attributes for tooltips" — the picker
        // dots are toolbar controls too.
        expect(input.getAttribute('title')).toBeTruthy();
      }
    });
  }

  it('a custom colour announces color-select with its index', async () => {
    const el = await mountPaint({ colorSelects: 2 });
    const events = captureEvents(el, ['color-select']);
    const input = colorInputs(el)[1];
    input.value = '#abcdef';
    input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    await wait(SETTLE);

    expect(events).toHaveLength(1);
    expect(keysOf(events[0].detail)).toEqual(['color', 'index']);
    expect(events[0].detail).toEqual({ color: '#abcdef', index: 1 });
    expect(el.color).toBe('#abcdef');
  });
});

describe('snice-paint matrix: the size control', () => {
  it('the slider spans the documented min and max', async () => {
    const el = await mountPaint({ minStrokeWidth: 2, maxStrokeWidth: 40, strokeWidth: 8 });
    const slider = sizeSlider(el)!;
    expect(slider.getAttribute('min')).toBe('2');
    expect(slider.getAttribute('max')).toBe('40');
    expect(slider.value).toBe('8');
  });

  it('dragging the slider sets strokeWidth', async () => {
    const el = await mountPaint({});
    const slider = sizeSlider(el)!;
    slider.value = '11';
    slider.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    await wait(SETTLE);
    expect(el.strokeWidth).toBe(11);
  });

  it('the chosen width is the width the stroke is recorded with', async () => {
    const el = await mountPaint({ strokeWidth: 9 });
    const { paintStroke } = await import('./paint-support');
    await paintStroke(el);
    expect(el.getStrokes()[0].width).toBe(9);
  });
});

describe('snice-paint matrix: the documented slots', () => {
  for (const name of DOC_SLOTS) {
    it(`<slot name="${name}"> projects its light-DOM content`, async () => {
      const el = await mountPaint({
        html: `<span slot="${name}" id="mine">mine</span>`,
      });
      const node = slot(el, name)!;
      const assigned = node.assignedNodes({ flatten: true })
        .map(child => (child as HTMLElement).id);
      expect(assigned).toContain('mine');
    });
  }

  it('the colors slot replaces the built-in swatches', async () => {
    // "colors — Replaces built-in color swatches": the projected content is
    // what the user sees, so the built-ins must be fallback content only.
    const el = await mountPaint({ html: '<div slot="colors" id="mine">palette</div>' });
    const node = slot(el, 'colors')!;
    expect(node.assignedNodes({ flatten: true }).length).toBeGreaterThan(0);
    // Fallback content is not rendered while a slot is filled.
    expect(node.assignedElements()[0].id).toBe('mine');
  });

  it('a slotted toolbar keeps the toolbar even with no built-in controls', async () => {
    const el = await mountPaint({
      controls: '',
      html: '<button slot="tools" id="mine">custom</button>',
    });
    expect(partEl(el, 'toolbar')).toBeTruthy();
    expect(slot(el, 'tools')!.assignedElements()[0].id).toBe('mine');
  });
});

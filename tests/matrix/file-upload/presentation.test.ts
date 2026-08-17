/**
 * snice-file-upload matrix — the presentational surface.
 *
 * The cross: `size` (3) x `variant` (2) x description state (3) x `disabled`
 * (2) x `invalid` (2) = 72 combos, with `label`, `required`, `multiple` and
 * `drag-drop` rotated across them.
 *
 * Description state is a dimension of its own because the doc fixes a
 * PRECEDENCE between the two documented text parts — "error replaces helper" —
 * and a precedence cannot be tested one value at a time.
 */
import { describe, it, afterEach } from 'vitest';
import { cross, expectClean, removeComponent } from '../matrix-kit';
import {
  DEFAULTS, Problems, checkDescription, checkDropZone, checkInvalidPresentation, checkLabel,
  checkStructure, mountUpload, type Size, type Variant, type Vector,
} from './file-upload-support';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const DESCRIPTIONS = [
  { name: 'none', helperText: '', errorText: '' },
  { name: 'helper', helperText: 'PNG or JPG, up to 5MB', errorText: '' },
  // Both set: the doc says the error replaces the helper.
  { name: 'error+helper', helperText: 'PNG or JPG, up to 5MB', errorText: 'That file is too big' },
];

const combos = cross({
  size: ['small', 'medium', 'large'] as const,
  variant: ['outlined', 'filled'] as const,
  description: DESCRIPTIONS,
  disabled: [false, true],
  invalid: [false, true],
}).map((combo, index) => {
  const description = combo.description as typeof DESCRIPTIONS[number];
  const label = index % 2 === 0 ? 'Upload File' : '';
  const required = index % 3 === 0;
  const multiple = index % 4 < 2;
  const dragDrop = index % 5 !== 0;
  return {
    ...combo,
    ...description,
    label, required, multiple, dragDrop,
    id: `${combo.id}/[label=${label ? 'yes' : 'no'},required=${required},`
      + `multiple=${multiple},drag-drop=${dragDrop}]`,
  };
});

describe('file-upload matrix: presentation', () => {
  for (const combo of combos) {
    const vector: Vector = {
      ...DEFAULTS,
      size: combo.size as Size,
      variant: combo.variant as Variant,
      helperText: combo.helperText,
      errorText: combo.errorText,
      disabled: combo.disabled,
      invalid: combo.invalid,
      label: combo.label,
      required: combo.required,
      multiple: combo.multiple,
      dragDrop: combo.dragDrop,
    };

    it(combo.id, async () => {
      el = await mountUpload(vector);
      const problems = new Problems();

      checkStructure(problems, el, vector);
      checkLabel(problems, el, vector);
      checkDescription(problems, el, vector);
      checkDropZone(problems, el, vector);
      // Nothing is selected yet, so any invalid styling is `invalid`'s alone —
      // except for a required control, whose empty selection is a real
      // `valueMissing` the doc says must show.
      checkInvalidPresentation(problems, el, vector,
        vector.required && !vector.disabled);

      expectClean(problems, combo.id);
    });
  }
});

describe('file-upload matrix: accept', () => {
  // `accept: string = ''` fronts the native chooser filter, so whatever is
  // written has to arrive on the input verbatim.
  for (const accept of ['', 'image/*', '.pdf', 'image/png,image/jpeg', 'audio/*,video/*']) {
    it(`accept="${accept}"`, async () => {
      el = await mountUpload({ accept });
      const problems = new Problems();
      checkStructure(problems, el, { ...DEFAULTS, accept });
      expectClean(problems, `accept/${accept}`);
    });
  }
});

describe('file-upload matrix: the documented defaults', () => {
  it('<snice-file-upload> is an outlined, medium, single-file drop zone', async () => {
    el = await mountUpload();
    const problems = new Problems();
    const upload = el as any;

    problems.equal(upload.size, DEFAULTS.size, 'default size');
    problems.equal(upload.variant, DEFAULTS.variant, 'default variant');
    problems.equal(upload.accept, DEFAULTS.accept, 'default accept');
    problems.equal(upload.multiple, DEFAULTS.multiple, 'default multiple');
    problems.equal(upload.disabled, DEFAULTS.disabled, 'default disabled');
    problems.equal(upload.required, DEFAULTS.required, 'default required');
    problems.equal(upload.invalid, DEFAULTS.invalid, 'default invalid');
    problems.equal(upload.label, DEFAULTS.label, 'default label');
    problems.equal(upload.helperText, DEFAULTS.helperText, 'default helperText');
    problems.equal(upload.errorText, DEFAULTS.errorText, 'default errorText');
    problems.equal(upload.maxSize, DEFAULTS.maxSize, 'default maxSize');
    problems.equal(upload.maxFiles, DEFAULTS.maxFiles, 'default maxFiles');
    problems.equal(upload.name, DEFAULTS.name, 'default name');
    problems.equal(upload.dragDrop, DEFAULTS.dragDrop, 'default dragDrop');
    problems.equal(upload.showPreview, DEFAULTS.showPreview, 'default showPreview');
    // Documented as a native-compatible control.
    problems.equal(upload.type, 'file', 'type');
    problems.equal(upload.form, null, 'form outside a <form>');

    const vector = { ...DEFAULTS } as Vector;
    checkStructure(problems, el, vector);
    checkLabel(problems, el, vector);
    checkDescription(problems, el, vector);
    checkDropZone(problems, el, vector);

    expectClean(problems, 'defaults');
  });
});

/**
 * The two documented booleans that DEFAULT TO TRUE.
 *
 * `dragDrop` and `showPreview` are the only properties here whose "off" state
 * cannot be spelled by omitting an attribute, because omitting it leaves the
 * default — which is on. The doc's own worked example writes the off state as
 * `<snice-file-upload drag-drop="false">`, a spelling that means `true` under a
 * naive boolean attribute converter (any present attribute is true), so it is
 * asserted here against every spelling a reader might reach for.
 */
describe('file-upload matrix: the booleans that default to true', () => {
  for (const [attribute, property] of [
    ['drag-drop', 'dragDrop'], ['show-preview', 'showPreview'],
  ] as const) {
    it(`${attribute}="false" turns ${property} off`, async () => {
      const host = document.createElement('snice-file-upload');
      host.setAttribute(attribute, 'false');
      document.body.appendChild(host);
      await (host as any).ready;
      const problems = new Problems();
      problems.equal((host as any)[property], false, `${attribute}="false"`);
      host.remove();
      expectClean(problems, `${attribute}=false`);
    });

    it(`${attribute}="true" leaves ${property} on`, async () => {
      const host = document.createElement('snice-file-upload');
      host.setAttribute(attribute, 'true');
      document.body.appendChild(host);
      await (host as any).ready;
      const problems = new Problems();
      problems.equal((host as any)[property], true, `${attribute}="true"`);
      host.remove();
      expectClean(problems, `${attribute}=true`);
    });

    it(`omitting ${attribute} leaves ${property} at its documented default`, async () => {
      el = await mountUpload();
      const problems = new Problems();
      problems.equal((el as any)[property], true, `${property} with no attribute`);
      expectClean(problems, `${attribute}/absent`);
    });

    it(`${property} = false through the property channel turns it off too`, async () => {
      el = await mountUpload({ [property]: false } as Partial<Vector>);
      const problems = new Problems();
      problems.equal((el as any)[property], false, `${property} = false`);
      expectClean(problems, `${property}/property-channel`);
    });
  }

  it('drag-drop off removes the drop invitation from the upload area', async () => {
    el = await mountUpload({ dragDrop: false });
    const problems = new Problems();
    checkDropZone(problems, el, { ...DEFAULTS, dragDrop: false });
    expectClean(problems, 'drag-drop/off');
  });
});

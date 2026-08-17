/**
 * snice-file-upload matrix — the oracle.
 *
 * Source of every expectation: docs/ai/components/file-upload.md and
 * packages/components/src/file-upload/snice-file-upload.types.ts. Nothing here
 * is read off the component's output.
 *
 * The documented surface:
 *
 *   · `size: 'small'|'medium'|'large' = 'medium'`, `variant: 'outlined'|'filled'
 *     = 'outlined'`, `accept = ''`, `multiple = false`, `disabled = false`,
 *     `required = false`, `invalid = false`, `label = ''`,
 *     `helperText` (attr `helper-text`), `errorText` (attr `error-text`),
 *     `maxSize = -1` (attr `max-size`, bytes), `maxFiles = -1` (attr
 *     `max-files`), `name = ''`, `dragDrop = true` (attr `drag-drop`),
 *     `showPreview = true` (attr `show-preview`), read-only `files`
 *   · methods `clear()`, `removeFile(index)`, `focus()`/`blur()`,
 *     `checkValidity()`/`reportValidity()`, `setCustomValidity(message)`
 *   · events `file-upload-change` -> `{ files: File[], fileUpload }`,
 *     `file-upload-error` -> `{ message: string, fileUpload }`
 *   · CSS parts `upload-area`, `input`, `file-item`, `error-text`, `helper-text`
 *   · the validation contract: "Empty `required` selection reports
 *     `valueMissing`"; "A customer selection rejected by `maxSize` or
 *     `maxFiles` remains an actionable `customError` … instead of silently
 *     disappearing as valid"; "Tightening `maxSize` or `maxFiles` revalidates
 *     an existing … selection; relaxing the rule clears the generated error
 *     immediately"; "`setCustomValidity()` supplies an independent application
 *     error. `invalid`/`errorText` are presentation only."
 *
 * SIMULATION BOUNDARY. happy-dom does not implement `ElementInternals`, so the
 * FACE half of the contract — `FormData` entries, form reset, state
 * restoration, disabled fieldsets — cannot be observed here at all; the
 * component falls back to the native `<input type="file">` it renders, and that
 * fallback is what this tier reads validity from. Form participation, the drop
 * zone's real hit area, and the image preview's painted thumbnail belong to
 * tests/live/matrix/file-upload/file-upload-visual.spec.ts.
 */
import { Problems, SETTLE, all, captureEvents, click, mount, sr, text, wait } from '../matrix-kit';
import { exactPart, exactPartIn, exactParts } from '../part-exact';
import '../../../packages/components/src/file-upload/snice-file-upload';

export { Problems, all, captureEvents, click, mount, sr, text, wait, SETTLE };

/**
 * `part="input"` sits beside no prefixed sibling here, but `error-text` and
 * `helper-text` do share a suffix and `file-item` a prefix with nothing —
 * part lookups still read tokens exactly, for the same reason every suite in
 * this tree does. See tests/matrix/part-exact.ts.
 */
export const part = exactPart;
export const parts = exactParts;
export { exactPartIn };

/** The documented defaults, from the properties block of the doc. */
export const DEFAULTS = {
  size: 'medium' as const,
  variant: 'outlined' as const,
  accept: '',
  multiple: false,
  disabled: false,
  required: false,
  invalid: false,
  label: '',
  helperText: '',
  errorText: '',
  maxSize: -1,
  maxFiles: -1,
  name: '',
  dragDrop: true,
  showPreview: true,
};

export type Size = 'small' | 'medium' | 'large';
export type Variant = 'outlined' | 'filled';

export interface Vector {
  size: Size;
  variant: Variant;
  accept: string;
  multiple: boolean;
  disabled: boolean;
  required: boolean;
  invalid: boolean;
  label: string;
  helperText: string;
  errorText: string;
  maxSize: number;
  maxFiles: number;
  name: string;
  dragDrop: boolean;
  showPreview: boolean;
}

/**
 * Mount one combo.
 *
 * Every documented property has an attribute form, and the doc's examples are
 * all attributes. The two booleans that DEFAULT TO TRUE (`drag-drop`,
 * `show-preview`) are mounted here through the property channel; the doc's
 * own `drag-drop="false"` spelling used to mean `true` under a naive boolean
 * converter (MATRIX-file-upload-1, fixed) — it now parses as false and is
 * asserted unpinned in presentation.test.ts.
 */
export async function mountUpload(vector: Partial<Vector> = {}): Promise<HTMLElement> {
  const v = { ...DEFAULTS, ...vector };
  const attrs: Record<string, string | boolean> = {
    size: v.size,
    variant: v.variant,
    'max-size': String(v.maxSize),
    'max-files': String(v.maxFiles),
  };
  if (v.accept) attrs.accept = v.accept;
  if (v.label) attrs.label = v.label;
  if (v.helperText) attrs['helper-text'] = v.helperText;
  if (v.errorText) attrs['error-text'] = v.errorText;
  if (v.name) attrs.name = v.name;
  if (v.multiple) attrs.multiple = true;
  if (v.disabled) attrs.disabled = true;
  if (v.required) attrs.required = true;
  if (v.invalid) attrs.invalid = true;

  const props: Record<string, unknown> = {};
  if (!v.dragDrop) props.dragDrop = false;
  if (!v.showPreview) props.showPreview = false;

  return mount('snice-file-upload', attrs as Record<string, string>, props);
}

// ── Files ───────────────────────────────────────────────────────────────────

/** A `File` of an exact byte length, so `max-size` arithmetic is exact. */
export function makeFile(name: string, bytes: number, type = 'text/plain'): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

export const imageFile = (name = 'photo.png', bytes = 16) => makeFile(name, bytes, 'image/png');

/** The shadow `<input type="file">` the component renders. */
export const fileInput = (el: HTMLElement): HTMLInputElement | null =>
  part(el, 'input') as HTMLInputElement | null;

/**
 * Choose `files` the way the native chooser does: put them on the shadow input
 * and fire its `change`. This is the only path a headless DOM has to the
 * component's selection pipeline — there is no documented setter for `files`
 * ("read-only"), and drag-and-drop needs a real `DragEvent.dataTransfer`.
 */
export async function chooseFiles(el: HTMLElement, files: File[]): Promise<void> {
  const input = fileInput(el);
  if (!input) throw new Error('the upload rendered no file input');
  const transfer = new DataTransfer();
  for (const file of files) transfer.items.add(file);
  input.files = transfer.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  await wait(SETTLE);
}

/** Drop `files` onto the documented drop zone. */
export async function dropFiles(el: HTMLElement, files: File[]): Promise<void> {
  const area = part(el, 'upload-area');
  const transfer = new DataTransfer();
  for (const file of files) transfer.items.add(file);
  const event = new Event('drop', { bubbles: true, cancelable: true }) as any;
  event.dataTransfer = transfer;
  area?.dispatchEvent(event);
  await wait(SETTLE);
}

// ── Reading the rendered upload ─────────────────────────────────────────────

export const fileItems = (el: HTMLElement): HTMLElement[] => parts(el, 'file-item');

export const fileNames = (el: HTMLElement): string[] =>
  fileItems(el).map(item => text(item.querySelector('.file-name')));

export const selectedNames = (el: HTMLElement): string[] =>
  [...((el as any).files ?? [])].map((file: File) => file.name);

// ── The oracle ──────────────────────────────────────────────────────────────

/**
 * The documented structure: a drop zone carrying the size and variant modifiers
 * the stylesheet paints by, and the file input it fronts.
 */
export function checkStructure(problems: Problems, el: HTMLElement, vector: Vector): void {
  const area = part(el, 'upload-area');
  const input = fileInput(el);

  if (!problems.check(!!area, 'no [part="upload-area"]')) return;
  if (!problems.check(!!input, 'no [part="input"]')) return;
  problems.check(area!.contains(input!), 'the file input is not inside the upload area');

  problems.check(area!.classList.contains(`upload-area--${vector.size}`),
    `the upload area does not carry size "${vector.size}" (${area!.className})`);
  // `outlined` is the documented default and the stylesheet's base state; only
  // `filled` adds a modifier.
  problems.equal(area!.classList.contains('upload-area--filled'), vector.variant === 'filled',
    `upload area filled modifier for variant "${vector.variant}"`);
  problems.equal(area!.classList.contains('upload-area--disabled'), vector.disabled,
    'upload area disabled modifier');

  // The input carries the documented native attributes it fronts.
  problems.equal(input!.getAttribute('type'), 'file', 'input type');
  problems.equal(input!.accept, vector.accept, 'input accept');
  problems.equal(input!.multiple, vector.multiple, 'input multiple');
  problems.equal(input!.disabled, vector.disabled, 'input disabled');
  problems.equal(input!.required, vector.required, 'input required');
  problems.equal(input!.name, vector.name, 'input name');
  problems.check(!!input!.getAttribute('aria-label'), 'the input has no accessible name');
}

/**
 * `label`: documented as a string property, rendered only when it has one.
 */
export function checkLabel(problems: Problems, el: HTMLElement, vector: Vector): void {
  const label = sr(el).querySelector('.label');
  if (!vector.label) {
    problems.check(!label, 'a label was rendered for label=""');
    return;
  }
  if (!problems.check(!!label, 'no label rendered')) return;
  problems.equal(text(label), vector.label, 'label text');
  problems.equal(label!.classList.contains('label--required'), vector.required,
    'the label does not mark a required control');
}

/**
 * Helper and error text: documented as two parts, and as a precedence —
 * "error replaces helper". Exactly one description is shown, and it is the
 * error whenever there is one.
 */
export function checkDescription(problems: Problems, el: HTMLElement, vector: Vector): void {
  const error = part(el, 'error-text');
  const helper = part(el, 'helper-text');

  if (vector.errorText) {
    if (!problems.check(!!error, 'no [part="error-text"] for a non-empty errorText')) return;
    problems.equal(text(error), vector.errorText, 'error text');
    problems.equal(error!.getAttribute('role'), 'alert',
      'the error text is not announced as an alert');
    problems.check(!helper, 'both the error text and the helper text are shown');
    problems.equal(fileInput(el)?.getAttribute('aria-describedby'), error!.id,
      'the input does not describe itself with the error text');
    return;
  }

  problems.check(!error, 'an [part="error-text"] was rendered with no errorText');
  if (!problems.check(!!helper, 'no [part="helper-text"]')) return;
  if (vector.helperText) {
    problems.equal(text(helper), vector.helperText, 'helper text');
    problems.equal(fileInput(el)?.getAttribute('aria-describedby'), helper!.id,
      'the input does not describe itself with the helper text');
  }
}

/**
 * `invalid` is documented as PRESENTATION ONLY — it styles the control and sets
 * `aria-invalid`, and it is not a validity state.
 */
export function checkInvalidPresentation(
  problems: Problems, el: HTMLElement, vector: Vector, calculatedError = false,
): void {
  const shown = vector.invalid || calculatedError;
  problems.equal(part(el, 'upload-area')?.classList.contains('upload-area--invalid'), shown,
    'upload area invalid modifier');
  problems.equal(fileInput(el)?.getAttribute('aria-invalid'), String(shown), 'input aria-invalid');
}

/** The selected files, as the doc's three views of one selection. */
export function checkSelection(problems: Problems, el: HTMLElement, expected: File[]): void {
  problems.equal(selectedNames(el), expected.map(file => file.name),
    'the read-only `files` list');
  problems.equal(fileNames(el), expected.map(file => file.name),
    'the rendered [part="file-item"] entries');
  problems.equal(fileItems(el).length, expected.length, 'file item count');
}

/**
 * `show-preview`: documented as a boolean. An image gets a thumbnail; anything
 * else gets the generic icon, whatever the flag says.
 */
export function checkPreviews(problems: Problems, el: HTMLElement, expected: File[],
  vector: Vector): void {
  const items = fileItems(el);
  if (items.length !== expected.length) return;
  expected.forEach((file, i) => {
    const wantPreview = vector.showPreview && file.type.startsWith('image/');
    const img = items[i].querySelector('img.file-preview');
    const icon = items[i].querySelector('.file-icon');
    problems.equal(!!img, wantPreview, `file ${i} (${file.type}) preview thumbnail`);
    problems.equal(!!icon, !wantPreview, `file ${i} (${file.type}) generic icon`);
    if (img) problems.equal(img.getAttribute('alt'), file.name, `file ${i} preview alt text`);
  });
}

/** The documented drop-zone affordance: the copy that invites a drop. */
export function checkDropZone(problems: Problems, el: HTMLElement, vector: Vector): void {
  const copy = text(sr(el).querySelector('.upload-text'));
  if (vector.dragDrop) {
    problems.check(/drag and drop/i.test(copy),
      `drag-drop is on but the upload area says "${copy}"`);
    problems.check(copy.includes(vector.multiple ? 'files' : 'a file'),
      `the drop invitation does not match multiple=${vector.multiple}: "${copy}"`);
  } else {
    problems.equal(copy, '', `drag-drop is off but the upload area still says "${copy}"`);
  }
}

/** The validity the documented contract predicts. */
export function checkValidity(
  problems: Problems, el: HTMLElement,
  expected: { valid: boolean; valueMissing?: boolean; customError?: boolean },
): void {
  const upload = el as any;
  const validity = upload.validity as ValidityState;
  problems.equal(upload.checkValidity(), expected.valid, 'checkValidity()');
  if (expected.valueMissing !== undefined) {
    problems.equal(validity.valueMissing, expected.valueMissing, 'validity.valueMissing');
  }
  if (expected.customError !== undefined) {
    problems.equal(validity.customError, expected.customError, 'validity.customError');
  }
  problems.equal(validity.valid, expected.valid, 'validity.valid');
  if (!expected.valid) {
    problems.check(!!upload.validationMessage,
      'an invalid control reports no validationMessage to show the user');
  }
}

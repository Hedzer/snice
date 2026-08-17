/**
 * snice-file-upload matrix — the documented validation contract.
 *
 * Every claim asserted here is quoted from the doc's own "Validation contract"
 * block:
 *
 *   · "Empty `required` selection reports `valueMissing`."
 *   · "Tightening `maxSize` or `maxFiles` revalidates an existing
 *     programmatic/restored selection; relaxing the rule clears the generated
 *     error immediately."
 *   · "`setCustomValidity()` supplies an independent application error.
 *     `invalid`/`errorText` are presentation only."
 *   · "Calculated errors update the upload surface and input `aria-invalid`,
 *     block validated submission, and clear after a valid replacement or
 *     explicit clear."
 *   · "Disabled controls are omitted and barred."
 *
 * SIMULATION BOUNDARY: happy-dom has no `ElementInternals`, so the component's
 * validity is read from the native `<input type="file">` it renders. That is
 * the same object the documented getters fall back to, and it is what makes
 * `valueMissing` / `customError` observable at all in this tier.
 */
import { describe, it, afterEach } from 'vitest';
import { cross, expectClean, removeComponent } from '../matrix-kit';
import {
  DEFAULTS, Problems, checkInvalidPresentation, checkValidity, chooseFiles, makeFile,
  mountUpload, type Vector,
} from './file-upload-support';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const KB = 1024;
const settle = () => new Promise(resolve => setTimeout(resolve, 30));

describe('file-upload matrix: required', () => {
  // The cross: `required` (2) x `disabled` (2) x selection (2). "Disabled
  // controls are omitted and barred", so a disabled required control with
  // nothing chosen is still valid — being barred is what barred means.
  for (const combo of cross({
    required: [false, true], disabled: [false, true], chooses: [false, true],
  })) {
    it(combo.id, async () => {
      const vector: Vector = {
        ...DEFAULTS, required: combo.required, disabled: combo.disabled, name: 'attachment',
      };
      el = await mountUpload(vector);
      const problems = new Problems();

      if (combo.chooses) {
        // A disabled input refuses a change, so the selection is made before
        // the control is barred — the state the doc calls "an existing
        // programmatic/restored selection".
        if (combo.disabled) {
          (el as any).disabled = false;
          await settle();
          await chooseFiles(el, [makeFile('a.txt', 10)]);
          (el as any).disabled = true;
          await settle();
        } else {
          await chooseFiles(el, [makeFile('a.txt', 10)]);
        }
      }

      const missing = combo.required && !combo.disabled && !combo.chooses;

      // "Disabled controls are omitted and barred." `willValidate` is the
      // component's own getter and says so directly, at every combo.
      problems.equal((el as any).willValidate, !combo.disabled,
        'willValidate for a disabled control');

      // SIMULATION BOUNDARY. The validity FLAGS of a barred control cannot be
      // read here. Without `ElementInternals` the component falls back to the
      // native `<input type="file">` it renders, and happy-dom's ValidityState
      // does not implement the platform rule that a disabled control is barred
      // from constraint validation — it reports `valueMissing` on a disabled
      // required input that a browser reports as valid. That claim is asserted
      // in a real engine instead, in
      // tests/live/matrix/file-upload/file-upload-visual.spec.ts.
      if (!combo.disabled) {
        checkValidity(problems, el, { valid: !missing, valueMissing: missing });
      }
      checkInvalidPresentation(problems, el, vector, missing);

      expectClean(problems, combo.id);
    });
  }
});

describe('file-upload matrix: tightening and relaxing the limits', () => {
  // "Tightening `maxSize` or `maxFiles` revalidates an existing … selection;
  // relaxing the rule clears the generated error immediately."
  for (const rule of ['maxSize', 'maxFiles'] as const) {
    it(`${rule}: tighten then relax`, async () => {
      el = await mountUpload({ multiple: true, name: 'attachment' });
      const problems = new Problems();

      await chooseFiles(el, [makeFile('a.bin', 4 * KB), makeFile('b.bin', 4 * KB)]);
      checkValidity(problems, el, { valid: true });

      // Tighten so the existing selection now breaks the rule.
      (el as any)[rule] = rule === 'maxSize' ? 1 * KB : 1;
      await settle();
      checkValidity(problems, el, { valid: false, customError: true });
      checkInvalidPresentation(problems, el, { ...DEFAULTS, multiple: true } as Vector, true);

      // Relax it again: the generated error goes, "immediately".
      (el as any)[rule] = rule === 'maxSize' ? 16 * KB : 10;
      await settle();
      checkValidity(problems, el, { valid: true, customError: false });
      checkInvalidPresentation(problems, el, { ...DEFAULTS, multiple: true } as Vector, false);

      expectClean(problems, `${rule}/tighten-relax`);
    });
  }

  it('a rejected selection clears after an explicit clear()', async () => {
    // "Calculated errors … clear after a valid replacement or explicit clear."
    el = await mountUpload({ maxSize: 1 * KB, name: 'attachment' });
    const problems = new Problems();

    await chooseFiles(el, [makeFile('huge.bin', 8 * KB)]);
    checkValidity(problems, el, { valid: false, customError: true });

    (el as any).clear();
    await settle();
    checkValidity(problems, el, { valid: true, customError: false });

    expectClean(problems, 'clear-after-rejection');
  });

  it('a rejected selection clears after a valid replacement', async () => {
    el = await mountUpload({ maxSize: 1 * KB, name: 'attachment' });
    const problems = new Problems();

    await chooseFiles(el, [makeFile('huge.bin', 8 * KB)]);
    checkValidity(problems, el, { valid: false, customError: true });

    await chooseFiles(el, [makeFile('small.txt', 10)]);
    checkValidity(problems, el, { valid: true, customError: false });

    expectClean(problems, 'replace-after-rejection');
  });
});

describe('file-upload matrix: setCustomValidity', () => {
  // "`setCustomValidity()` supplies an independent application error … pass
  // `''` to clear it."
  for (const message of ['Upload failed on the server', 'Virus scan pending']) {
    it(`setCustomValidity("${message}")`, async () => {
      el = await mountUpload({ name: 'attachment' });
      const problems = new Problems();

      await chooseFiles(el, [makeFile('a.txt', 10)]);
      checkValidity(problems, el, { valid: true });

      (el as any).setCustomValidity(message);
      await settle();
      checkValidity(problems, el, { valid: false, customError: true });
      problems.equal((el as any).validationMessage, message, 'validationMessage');

      (el as any).setCustomValidity('');
      await settle();
      checkValidity(problems, el, { valid: true, customError: false });
      problems.equal((el as any).validationMessage, '', 'validationMessage after clearing');

      expectClean(problems, `setCustomValidity/${message}`);
    });
  }

  it('an application error survives a new selection until it is cleared', async () => {
    // It is "independent": choosing a different file does not answer the
    // server's complaint.
    el = await mountUpload({ multiple: true, name: 'attachment' });
    const problems = new Problems();

    await chooseFiles(el, [makeFile('a.txt', 10)]);
    (el as any).setCustomValidity('Upload failed on the server');
    await settle();

    await chooseFiles(el, [makeFile('b.txt', 10)]);
    checkValidity(problems, el, { valid: false, customError: true });
    problems.equal((el as any).validationMessage, 'Upload failed on the server',
      'validationMessage after a new selection');

    expectClean(problems, 'setCustomValidity/independent');
  });
});

describe('file-upload matrix: invalid and errorText are presentation only', () => {
  // "…`invalid`/`errorText` are presentation only." So they style and announce,
  // and they never make `checkValidity()` say no.
  for (const combo of cross({
    invalid: [false, true],
    errorText: ['', 'Server said no'],
    chooses: [false, true],
  })) {
    it(combo.id, async () => {
      const vector: Vector = {
        ...DEFAULTS, invalid: combo.invalid, errorText: combo.errorText, name: 'attachment',
      };
      el = await mountUpload(vector);
      const problems = new Problems();

      if (combo.chooses) await chooseFiles(el, [makeFile('a.txt', 10)]);

      // Neither flag is a constraint: the control is valid either way.
      checkValidity(problems, el, { valid: true, customError: false, valueMissing: false });
      checkInvalidPresentation(problems, el, vector, false);

      expectClean(problems, combo.id);
    });
  }
});

describe('file-upload matrix: reportValidity agrees with checkValidity', () => {
  for (const combo of cross({ required: [false, true], chooses: [false, true] })) {
    it(combo.id, async () => {
      el = await mountUpload({ required: combo.required, name: 'attachment' });
      const problems = new Problems();

      if (combo.chooses) await chooseFiles(el, [makeFile('a.txt', 10)]);

      const upload = el as any;
      problems.equal(upload.reportValidity(), upload.checkValidity(),
        'reportValidity() disagreed with checkValidity()');

      expectClean(problems, combo.id);
    });
  }
});

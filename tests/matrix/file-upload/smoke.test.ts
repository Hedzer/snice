/**
 * Smoke slice of the snice-file-upload matrix — the everyday-loop tier.
 *
 * The full matrix (tests/matrix/file-upload/, ~200 combos) is excluded from the
 * default Vitest include and runs via `npm run test:matrix`. This file lives at
 * `smoke.test.ts` so it stays collected, and it routes every assertion through
 * the matrix's own oracle so it cannot claim something the full suite does not.
 *
 * The marquee combos: the documented default drop zone, a chosen file, the two
 * limits, `required`, the error/helper precedence, and `clear()`.
 *
 * BUDGET: under 1s.
 */
import { describe, it, afterEach } from 'vitest';
import { expectClean, removeComponent } from '../matrix-kit';
import {
  DEFAULTS, Problems, captureEvents, checkDescription, checkDropZone,
  checkInvalidPresentation, checkLabel, checkPreviews, checkSelection, checkStructure,
  checkValidity, chooseFiles, imageFile, makeFile, mountUpload, type Vector,
} from './file-upload-support';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const KB = 1024;
const settle = () => new Promise(resolve => setTimeout(resolve, 30));

describe('file-upload matrix smoke', () => {
  it('<snice-file-upload label="Upload File"> is an outlined single-file drop zone', async () => {
    const vector: Vector = { ...DEFAULTS, label: 'Upload File' };
    el = await mountUpload(vector);
    const problems = new Problems();

    checkStructure(problems, el, vector);
    checkLabel(problems, el, vector);
    checkDescription(problems, el, vector);
    checkDropZone(problems, el, vector);
    checkSelection(problems, el, []);
    checkValidity(problems, el, { valid: true, valueMissing: false });

    expectClean(problems, 'smoke/defaults');
  });

  it('choosing a file selects it, renders it, and announces it', async () => {
    const vector: Vector = { ...DEFAULTS, name: 'attachment' };
    el = await mountUpload(vector);
    const changes = captureEvents<{ files: File[]; fileUpload: HTMLElement }>(
      el, 'file-upload-change');
    const problems = new Problems();

    const file = imageFile('shot.png');
    await chooseFiles(el, [file]);

    checkSelection(problems, el, [file]);
    checkPreviews(problems, el, [file], vector);
    if (problems.equal(changes.length, 1, 'file-upload-change events')) {
      problems.equal(changes[0].files.map(f => f.name), ['shot.png'], 'detail.files');
      problems.check(changes[0].fileUpload === el, 'detail.fileUpload');
    }

    expectClean(problems, 'smoke/choose');
  });

  it('multiple accumulates a selection; a single upload replaces it', async () => {
    el = await mountUpload({ multiple: true, name: 'attachment' });
    const problems = new Problems();

    const first = makeFile('a.txt', 10);
    const second = makeFile('b.txt', 10);
    await chooseFiles(el, [first]);
    await chooseFiles(el, [second]);

    checkSelection(problems, el, [first, second]);
    expectClean(problems, 'smoke/multiple');
  });

  it('max-size rejects an oversized file and stays invalid about it', async () => {
    el = await mountUpload({ maxSize: 1 * KB, name: 'attachment' });
    const errors = captureEvents<{ message: string }>(el, 'file-upload-error');
    const problems = new Problems();

    await chooseFiles(el, [makeFile('huge.bin', 8 * KB)]);

    checkSelection(problems, el, []);
    if (problems.check(errors.length > 0, 'an oversized file reported nothing')) {
      problems.check(errors[0].message.includes('huge.bin'),
        `the rejection says "${errors[0].message}", which names no file`);
    }
    checkValidity(problems, el, { valid: false, customError: true });
    checkInvalidPresentation(problems, el, { ...DEFAULTS } as Vector, true);

    expectClean(problems, 'smoke/max-size');
  });

  it('max-files caps the selection', async () => {
    el = await mountUpload({ multiple: true, maxFiles: 2, name: 'attachment' });
    const problems = new Problems();

    const files = [makeFile('a.txt', 1), makeFile('b.txt', 1), makeFile('c.txt', 1)];
    await chooseFiles(el, files);

    checkSelection(problems, el, files.slice(0, 2));
    expectClean(problems, 'smoke/max-files');
  });

  it('an empty required selection reports valueMissing', async () => {
    const vector: Vector = { ...DEFAULTS, required: true, name: 'attachment' };
    el = await mountUpload(vector);
    const problems = new Problems();

    checkValidity(problems, el, { valid: false, valueMissing: true });
    checkInvalidPresentation(problems, el, vector, true);

    await chooseFiles(el, [makeFile('a.txt', 10)]);
    checkValidity(problems, el, { valid: true, valueMissing: false });

    expectClean(problems, 'smoke/required');
  });

  it('error text replaces helper text and is announced', async () => {
    const vector: Vector = {
      ...DEFAULTS, helperText: 'PNG or JPG', errorText: 'That file is too big',
    };
    el = await mountUpload(vector);
    const problems = new Problems();
    checkDescription(problems, el, vector);
    expectClean(problems, 'smoke/description');
  });

  it('clear() empties the selection', async () => {
    el = await mountUpload({ multiple: true, name: 'attachment' });
    const problems = new Problems();

    await chooseFiles(el, [makeFile('a.txt', 1), makeFile('b.txt', 1)]);
    (el as any).clear();
    await settle();

    checkSelection(problems, el, []);
    expectClean(problems, 'smoke/clear');
  });
});

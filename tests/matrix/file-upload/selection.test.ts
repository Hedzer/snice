/**
 * snice-file-upload matrix — choosing files, and the limits that police them.
 *
 * The cross: `multiple` (2) x `max-files` (3) x `max-size` (3) x batch (4) = 72
 * combos. Each mounts a fresh upload, chooses a batch of files through the
 * component's own change pipeline, and asserts the selection, the events, and
 * the validity the documented contract predicts:
 *
 *   · "Multiple files submit as repeated entries under `name`" — so a
 *     `multiple` upload accumulates and a single one replaces;
 *   · "A customer selection rejected by `maxSize` or `maxFiles` remains an
 *     actionable `customError` with a useful filename/count message instead of
 *     silently disappearing as valid";
 *   · `file-upload-error` -> `{ message, fileUpload }` for each rejection;
 *   · `file-upload-change` -> `{ files: File[], fileUpload }` for the result.
 */
import { describe, it, afterEach } from 'vitest';
import { cross, expectClean, removeComponent } from '../matrix-kit';
import {
  DEFAULTS, Problems, captureEvents, checkPreviews, checkSelection, checkValidity, chooseFiles,
  imageFile, makeFile, mountUpload, selectedNames, type Vector,
} from './file-upload-support';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const KB = 1024;

interface Batch { name: string; files: File[] }

const BATCHES: Batch[] = [
  { name: 'one-small', files: [makeFile('a.txt', 10)] },
  { name: 'one-large', files: [makeFile('big.bin', 8 * KB)] },
  {
    name: 'three-small',
    files: [makeFile('a.txt', 10), makeFile('b.txt', 20), makeFile('c.txt', 30)],
  },
  {
    name: 'mixed-sizes',
    files: [makeFile('ok.txt', 10), makeFile('huge.bin', 8 * KB), makeFile('fine.txt', 20)],
  },
];

const combos = cross({
  multiple: [false, true],
  maxFiles: [-1, 1, 2],
  maxSize: [-1, 1 * KB, 16 * KB],
  batch: BATCHES,
});

/**
 * The selection the documented rules produce for one batch on an empty upload.
 *
 *   · `maxSize` rejects each file over the limit, one `file-upload-error` each;
 *   · `maxFiles` caps the count, one `file-upload-error` for the batch;
 *   · a non-`multiple` upload keeps at most one file.
 *
 * Order matters and is fixed by the doc's own phrasing: both limits describe
 * the SELECTION, so a file that fails either is not in it.
 */
function expectedSelection(batch: File[], vector: Vector): {
  files: File[]; oversized: File[]; tooMany: boolean;
} {
  const oversized = vector.maxSize > 0 ? batch.filter(file => file.size > vector.maxSize) : [];
  const tooMany = vector.maxFiles > 0 && batch.length > vector.maxFiles;
  let kept = batch;
  if (vector.maxFiles > 0) kept = kept.slice(0, vector.maxFiles);
  kept = kept.filter(file => !oversized.includes(file));
  if (!vector.multiple) kept = kept.slice(0, 1);
  return { files: kept, oversized, tooMany };
}

describe('file-upload matrix: choosing files', () => {
  for (const combo of combos) {
    const batch = combo.batch as Batch;
    const vector: Vector = {
      ...DEFAULTS,
      multiple: combo.multiple,
      maxFiles: combo.maxFiles,
      maxSize: combo.maxSize,
      name: 'attachment',
    };
    const id = `multiple=${combo.multiple}/max-files=${combo.maxFiles}`
      + `/max-size=${combo.maxSize}/${batch.name}`;

    it(id, async () => {
      el = await mountUpload(vector);
      const changes = captureEvents<{ files: File[]; fileUpload: HTMLElement }>(
        el, 'file-upload-change');
      const errors = captureEvents<{ message: string; fileUpload: HTMLElement }>(
        el, 'file-upload-error');
      const problems = new Problems();

      const want = expectedSelection(batch.files, vector);
      await chooseFiles(el, batch.files);

      checkSelection(problems, el, want.files);
      checkPreviews(problems, el, want.files, vector);

      // One change event per selection, carrying the files that survived.
      if (problems.equal(changes.length, 1, 'file-upload-change events')) {
        problems.equal(changes[0].files.map(file => file.name), want.files.map(file => file.name),
          'file-upload-change detail.files');
        problems.check(changes[0].fileUpload === el, 'file-upload-change detail.fileUpload');
      }

      // A rejection is announced, and nothing else is.
      //
      // The COUNT of `file-upload-error` events is deliberately not pinned:
      // the doc defines the event as `{ message, fileUpload }` and says the
      // rejection must carry "a useful filename/count message", but it never
      // says how many events one rejected batch produces — and it cannot,
      // because `max-files` truncates a batch before `max-size` ever sees the
      // tail, so the number depends on which limit bit first. What IS
      // documented is asserted: something was announced, every announcement is
      // usable, and a clean batch announces nothing.
      const rejected = want.oversized.length > 0 || want.tooMany;
      if (!rejected) {
        problems.equal(errors.length, 0, 'a fully accepted batch reported an error');
      } else if (problems.check(errors.length > 0, 'a rejected batch reported nothing')) {
        for (const [i, error] of errors.entries()) {
          problems.check(!!error.message, `file-upload-error ${i} carries no message`);
          problems.check(error.fileUpload === el, `file-upload-error ${i} detail.fileUpload`);
        }
        // "with a useful filename/count message": every message names either a
        // file the user chose or the limit they crossed.
        const names = batch.files.map(file => file.name);
        for (const [i, error] of errors.entries()) {
          const useful = names.some(name => error.message.includes(name))
            || (vector.maxFiles > 0 && error.message.includes(String(vector.maxFiles)));
          problems.check(useful,
            `file-upload-error ${i} says "${error.message}", which names no file and no limit`);
        }
      }

      // "…remains an actionable `customError` … instead of silently
      // disappearing as valid": a rejection leaves the control invalid.
      checkValidity(problems, el, { valid: !rejected, customError: rejected });

      expectClean(problems, id);
    });
  }
});

describe('file-upload matrix: multiple accumulates, single replaces', () => {
  for (const multiple of [false, true]) {
    it(`multiple=${multiple}: a second choice`, async () => {
      el = await mountUpload({ multiple, name: 'attachment' });
      const problems = new Problems();

      await chooseFiles(el, [makeFile('first.txt', 10)]);
      await chooseFiles(el, [makeFile('second.txt', 10)]);

      // Documented: "Multiple files submit as repeated entries under `name`" —
      // a multiple upload holds a list, a single one holds one file.
      problems.equal(selectedNames(el), multiple ? ['first.txt', 'second.txt'] : ['second.txt'],
        `selection after two choices (multiple=${multiple})`);

      expectClean(problems, `accumulate/${multiple}`);
    });
  }

  it('max-files caps an accumulating selection across several choices', async () => {
    el = await mountUpload({ multiple: true, maxFiles: 3, name: 'attachment' });
    const errors = captureEvents<{ message: string }>(el, 'file-upload-error');
    const problems = new Problems();

    await chooseFiles(el, [makeFile('a.txt', 1), makeFile('b.txt', 1)]);
    problems.equal(selectedNames(el), ['a.txt', 'b.txt'], 'after the first choice');

    await chooseFiles(el, [makeFile('c.txt', 1), makeFile('d.txt', 1)]);
    problems.equal(selectedNames(el), ['a.txt', 'b.txt', 'c.txt'],
      'the fourth file exceeded max-files=3');
    problems.check(errors.length > 0, 'exceeding max-files across choices reported nothing');

    expectClean(problems, 'accumulate/max-files');
  });
});

describe('file-upload matrix: previews', () => {
  // Documented: `showPreview: boolean = true`. An image gets a thumbnail;
  // anything else gets the generic file icon.
  for (const showPreview of [true, false]) {
    for (const files of [
      [imageFile('shot.png')],
      [makeFile('notes.txt', 10)],
      [imageFile('shot.png'), makeFile('notes.txt', 10), imageFile('other.png')],
    ]) {
      const id = `show-preview=${showPreview}/${files.map(f => f.name).join('+')}`;
      it(id, async () => {
        const vector: Vector = { ...DEFAULTS, multiple: true, showPreview };
        el = await mountUpload(vector);
        const problems = new Problems();

        await chooseFiles(el, files);

        checkSelection(problems, el, files);
        checkPreviews(problems, el, files, vector);

        expectClean(problems, id);
      });
    }
  }
});

describe('file-upload matrix: clear and removeFile', () => {
  it('clear() empties the selection without emitting a change', async () => {
    // Documented: `clear()` — "Clear all files". `file-upload-change` is
    // documented for a selection; `clear()` is the app's own action.
    el = await mountUpload({ multiple: true, name: 'attachment' });
    const problems = new Problems();

    await chooseFiles(el, [makeFile('a.txt', 1), makeFile('b.txt', 1)]);
    const changes = captureEvents(el, 'file-upload-change');

    (el as any).clear();
    await new Promise(resolve => setTimeout(resolve, 30));

    checkSelection(problems, el, []);
    problems.equal(changes.length, 0, 'clear() emitted file-upload-change');

    expectClean(problems, 'clear');
  });

  for (const index of [0, 1, 2, -1, 3]) {
    it(`removeFile(${index}) of three`, async () => {
      el = await mountUpload({ multiple: true, name: 'attachment' });
      const problems = new Problems();

      const files = [makeFile('a.txt', 1), makeFile('b.txt', 1), makeFile('c.txt', 1)];
      await chooseFiles(el, files);
      const changes = captureEvents<{ files: File[] }>(el, 'file-upload-change');

      (el as any).removeFile(index);
      await new Promise(resolve => setTimeout(resolve, 30));

      const inRange = index >= 0 && index < files.length;
      const want = inRange ? files.filter((_, i) => i !== index) : files;
      checkSelection(problems, el, want);
      // Removing a file changes the selection, so it announces one — and an
      // index that names no file changes nothing and announces nothing.
      problems.equal(changes.length, inRange ? 1 : 0, 'file-upload-change events');

      expectClean(problems, `removeFile/${index}`);
    });
  }
});

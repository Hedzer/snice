/**
 * snice-file-gallery matrix — intake and the documented limits.
 *
 * `accept`, `max-size` ("bytes, -1 = no limit"), `max-files` ("-1 = no limit")
 * and `canAddFiles()` are the whole admission contract. Every combo asserts the
 * documented outcome: an admitted file appears in `files` and reports
 * `files-change`; a rejected one does not appear and reports `gallery-error`.
 *
 * 36 combos + 2 closed findings.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  FILES, makeFile,
  checkChrome, combo, comboName, expectNoProblems, makeGallery, record,
  typesOf, unmountGalleries, wait,
} from './file-gallery-support';

describe('file-gallery matrix — accept', () => {
  afterEach(() => unmountGalleries());

  const CASES: Array<{ accept: string; file: () => File; admitted: boolean }> = [
    { accept: '', file: FILES.text, admitted: true },
    { accept: '', file: FILES.image, admitted: true },
    { accept: 'image/*', file: FILES.image, admitted: true },
    { accept: 'image/*', file: FILES.text, admitted: false },
    { accept: 'image/png', file: FILES.image, admitted: true },
    { accept: 'image/jpeg', file: FILES.image, admitted: false },
    { accept: '.txt', file: FILES.text, admitted: true },
    { accept: '.txt', file: FILES.image, admitted: false },
    { accept: 'image/*,.txt', file: FILES.text, admitted: true },
    { accept: 'image/*,.txt', file: FILES.image, admitted: true },
    { accept: 'application/pdf', file: FILES.text, admitted: false },
  ];

  for (const shape of CASES) {
    const c = combo({ accept: shape.accept });
    it(`accept="${shape.accept || '(any)'}" ${shape.admitted ? 'admits' : 'rejects'} ${shape.file().name}`, async () => {
      const el = await makeGallery(c);
      const events = record(el);
      el.addFiles([shape.file()]);
      await wait(30);

      expect(el.files, 'admitted files').toHaveLength(shape.admitted ? 1 : 0);
      expect(typesOf(events, 'gallery-error'), 'gallery-error')
        .toHaveLength(shape.admitted ? 0 : 1);
      expectNoProblems(checkChrome(el, c), comboName(c));
    });
  }
});

describe('file-gallery matrix — max-size', () => {
  afterEach(() => unmountGalleries());

  const SIZES = [-1, 100, 200, 4096];
  const FILE_SIZES = [120, 4096];

  for (const maxSize of SIZES) {
    for (const size of FILE_SIZES) {
      const c = combo({ maxSize });
      const admitted = maxSize < 0 || size <= maxSize;
      it(`max-size=${maxSize} ${admitted ? 'admits' : 'rejects'} a ${size}B file`, async () => {
        const el = await makeGallery(c);
        const events = record(el);
        el.addFiles([makeFile('probe.bin', size, 'application/octet-stream')]);
        await wait(30);

        expect(el.files).toHaveLength(admitted ? 1 : 0);
        expect(typesOf(events, 'files-change'), 'files-change is reported either way')
          .toHaveLength(1);
        expect(typesOf(events, 'gallery-error')).toHaveLength(admitted ? 0 : 1);
      });
    }
  }
});

describe('file-gallery matrix — max-files', () => {
  afterEach(() => unmountGalleries());

  for (const maxFiles of [-1, 1, 2, 3]) {
    for (const batch of [1, 2, 4]) {
      const c = combo({ maxFiles });
      const admitted = maxFiles < 0 || batch <= maxFiles;
      it(`max-files=${maxFiles} with a batch of ${batch}`, async () => {
        const el = await makeGallery(c);
        const events = record(el);
        el.addFiles(Array.from({ length: batch }, (_, i) => makeFile(`f${i}.txt`, 10, 'text/plain')));
        await wait(30);

        if (admitted) {
          expect(el.files, 'files admitted').toHaveLength(batch);
          expect(typesOf(events, 'gallery-error')).toHaveLength(0);
        } else {
          // Over the documented limit: the gallery must not end up holding more
          // files than `max-files` allows, and must say why.
          expect(el.files.length, 'files held after an over-limit batch')
            .toBeLessThanOrEqual(maxFiles);
          expect(typesOf(events, 'gallery-error').length, 'gallery-error').toBeGreaterThan(0);
        }
        expect(el.canAddFiles(), 'canAddFiles()')
          .toBe(maxFiles < 0 || el.files.length < maxFiles);
      });
    }
  }

  it('canAddFiles() closes exactly at the limit', async () => {
    const el = await makeGallery(combo({ maxFiles: 2 }));
    expect(el.canAddFiles()).toBe(true);
    el.addFiles([FILES.text()]);
    await wait(20);
    expect(el.canAddFiles()).toBe(true);
    el.addFiles([FILES.image()]);
    await wait(20);
    expect(el.canAddFiles()).toBe(false);
  });

  it('addFileWithPreview honours max-files', async () => {
    const el = await makeGallery(combo({ maxFiles: 1 }));
    el.addFileWithPreview(FILES.image(), 'data:image/png;base64,AA');
    await wait(20);
    const events = record(el);
    el.addFileWithPreview(FILES.image(), 'data:image/png;base64,AA');
    await wait(20);
    expect(el.files).toHaveLength(1);
    expect(typesOf(events, 'gallery-error')).toHaveLength(1);
  });

  it('addFileWithPreview keeps the preview it was handed', async () => {
    const el = await makeGallery(combo());
    el.addFileWithPreview(FILES.image(), 'data:image/png;base64,AA');
    await wait(20);
    expect(el.files[0].preview).toBe('data:image/png;base64,AA');
  });

  // ── Closed findings (fixed; assertions kept) ──────────────────────────────

  it(
    'max-files="0" rejects files, agreeing with canAddFiles() [MATRIX-file-gallery-1 fixed]',
    async () => {
      const el = await makeGallery(combo({ maxFiles: 0 }));
      expect(el.canAddFiles()).toBe(false);
      el.addFiles([FILES.text()]);
      await wait(30);
      expect(el.files, 'files admitted past a limit of zero').toHaveLength(0);
    },
  );

  it(
    'max-size="0" admits nothing bigger than zero bytes [MATRIX-file-gallery-2 fixed]',
    async () => {
      const el = await makeGallery(combo({ maxSize: 0 }));
      el.addFiles([makeFile('probe.bin', 512, 'application/octet-stream')]);
      await wait(30);
      expect(el.files, 'files admitted past a limit of zero bytes').toHaveLength(0);
    },
  );
});

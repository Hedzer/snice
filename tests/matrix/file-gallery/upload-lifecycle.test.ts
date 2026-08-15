/**
 * snice-file-gallery matrix — the upload lifecycle.
 *
 * Uploads travel the documented `file-gallery-upload` request channel; the
 * matrix supplies the responder half (`file-gallery-support.ts`) and scripts it
 * per combo. Asserted here: `auto-upload`, the `uploadStatus` predicates
 * (`isPending`/`isUploading`/`isPaused`/`isCompleted`/`hasError`), the pause /
 * resume / retry / cancel controls and their `*All` forms, the removal methods,
 * and every documented event payload.
 *
 * 40 combos.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  FILES, makeFile,
  actionIn, checkChrome, combo, comboName, expectNoProblems, itemFor, makeGallery,
  planUploads, record, statusOf, typesOf, unmountGalleries, uploadPlan, wait,
} from './file-gallery-support';

const click = (node: Element | null) =>
  node?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));

describe('file-gallery matrix — auto-upload', () => {
  afterEach(() => unmountGalleries());

  for (const autoUpload of [true, false]) {
    for (const mode of ['success', 'failure'] as const) {
      for (const showProgress of [true, false]) {
        const c = combo({ autoUpload, showProgress });
        it(`${comboName(c)}/${mode}`, async () => {
          planUploads({ mode, progress: [0.25, 0.75] });
          const el = await makeGallery(c);
          const events = record(el);
          el.addFiles([FILES.text()]);
          await wait(80);

          const file = el.files[0];
          expect(typesOf(events, 'files-change'), 'files-change on intake').toHaveLength(1);

          if (!autoUpload) {
            expect(el.isPending(file.id), 'auto-upload="false" started an upload').toBe(true);
            expect(uploadPlan.seen, 'the upload channel was used anyway').toHaveLength(0);
            expect(typesOf(events, 'upload-complete')).toHaveLength(0);
            expect(typesOf(events, 'upload-error')).toHaveLength(0);
          } else if (mode === 'success') {
            expect(el.isCompleted(file.id)).toBe(true);
            expect(file.uploadProgress).toBe(100);
            const done = typesOf(events, 'upload-complete');
            expect(done, 'upload-complete').toHaveLength(1);
            expect(done[0].detail.response.success).toBe(true);
            expect(done[0].detail.response.fileId).toBe(file.id);
            expect(done[0].detail.component).toBe(el);
            const progress = typesOf(events, 'upload-progress');
            expect(progress.length, 'upload-progress reports').toBe(2);
            expect(progress.map(event => event.detail.progress)).toEqual([25, 75]);
          } else {
            expect(el.hasError(file.id)).toBe(true);
            const failed = typesOf(events, 'upload-error');
            expect(failed, 'upload-error').toHaveLength(1);
            expect(failed[0].detail.file.id).toBe(file.id);
            expect(failed[0].detail.component).toBe(el);
          }

          expectNoProblems(checkChrome(el, c), `${comboName(c)}/${mode}`);
        });
      }
    }
  }

  it('the upload request carries the documented UploadRequest shape', async () => {
    planUploads({ mode: 'success' });
    const el = await makeGallery(combo({ autoUpload: true }));
    el.addFiles([FILES.text()]);
    await wait(80);
    expect(uploadPlan.seen).toHaveLength(1);
    const request = uploadPlan.seen[0];
    expect(request.fileId).toBe(el.files[0].id);
    expect(request.file.name).toBe('notes.txt');
    expect(typeof request.onProgress).toBe('function');
    expect(request.signal).toBeInstanceOf(AbortSignal);
  });
});

describe('file-gallery matrix — pause, resume, retry, cancel', () => {
  afterEach(() => unmountGalleries());

  for (const allowPause of [true, false]) {
    const c = combo({ autoUpload: true, allowPause });

    it(`${comboName(c)} — pauseUpload() parks an in-flight upload`, async () => {
      planUploads({ mode: 'hang' });
      const el = await makeGallery(c);
      const events = record(el);
      el.addFiles([FILES.text()]);
      await wait(40);
      const id = el.files[0].id;
      expect(el.isUploading(id), 'upload did not start').toBe(true);

      el.pauseUpload(id);
      await wait(30);
      expect(el.isPaused(id)).toBe(true);
      expect(typesOf(events, 'upload-pause'), 'upload-pause').toHaveLength(1);
      expect(statusOf(el, id)).toBe('paused');
      expectNoProblems(checkChrome(el, c), `${comboName(c)} paused`);
    });

    it(`${comboName(c)} — resumeUpload() restarts a paused upload`, async () => {
      planUploads({ mode: 'hang' });
      const el = await makeGallery(c);
      el.addFiles([FILES.text()]);
      await wait(40);
      const id = el.files[0].id;
      el.pauseUpload(id);
      await wait(20);

      planUploads({ mode: 'success' });
      el.resumeUpload(id);
      await wait(80);
      expect(el.isCompleted(id)).toBe(true);
    });

    it(`${comboName(c)} — the pause affordance follows allow-pause`, async () => {
      planUploads({ mode: 'hang' });
      const el = await makeGallery(c);
      el.addFiles([FILES.text()]);
      await wait(40);
      const id = el.files[0].id;
      expect(!!actionIn(el, id, 'pause')).toBe(allowPause);

      el.pauseUpload(id);
      await wait(20);
      expect(!!actionIn(el, id, 'resume')).toBe(allowPause);
    });
  }

  it('retryUpload() re-runs a failed upload and clears the error', async () => {
    planUploads({ mode: 'failure', error: 'nope' });
    const el = await makeGallery(combo({ autoUpload: true }));
    el.addFiles([FILES.text()]);
    await wait(80);
    const id = el.files[0].id;
    expect(el.hasError(id)).toBe(true);
    expect(el.getFile(id)!.error).toBe('nope');

    planUploads({ mode: 'success' });
    el.retryUpload(id);
    await wait(80);
    expect(el.isCompleted(id)).toBe(true);
    expect(el.getFile(id)!.error).toBeUndefined();
    expect(el.getFile(id)!.uploadProgress).toBe(100);
  });

  it('the retry affordance appears only for a failed upload', async () => {
    planUploads({ mode: 'failure' });
    const c = combo({ autoUpload: true });
    const el = await makeGallery(c);
    el.addFiles([FILES.text()]);
    await wait(80);
    const id = el.files[0].id;
    expect(!!actionIn(el, id, 'retry')).toBe(true);

    planUploads({ mode: 'success' });
    click(actionIn(el, id, 'retry'));
    await wait(80);
    expect(el.isCompleted(id)).toBe(true);
    expect(!!actionIn(el, id, 'retry')).toBe(false);
  });

  it('cancelUpload() removes the file from the gallery', async () => {
    planUploads({ mode: 'hang' });
    const el = await makeGallery(combo({ autoUpload: true }));
    const events = record(el);
    el.addFiles([FILES.text()]);
    await wait(40);
    const id = el.files[0].id;

    el.cancelUpload(id);
    await wait(30);
    expect(el.files).toHaveLength(0);
    expect(el.getFile(id)).toBeUndefined();
    expect(typesOf(events, 'file-remove'), 'file-remove').toHaveLength(1);
    expect(itemFor(el, id)).toBeNull();
  });

  it('pauseAll()/resumeAll() move every in-flight upload', async () => {
    planUploads({ mode: 'hang' });
    const el = await makeGallery(combo({ autoUpload: true }));
    el.addFiles([makeFile('a.txt', 10, 'text/plain'), makeFile('b.txt', 10, 'text/plain')]);
    await wait(60);
    expect(el.files.every((file: any) => el.isUploading(file.id))).toBe(true);

    el.pauseAll();
    await wait(30);
    expect(el.files.every((file: any) => el.isPaused(file.id))).toBe(true);

    planUploads({ mode: 'success' });
    el.resumeAll();
    await wait(100);
    expect(el.files.every((file: any) => el.isCompleted(file.id))).toBe(true);
  });

  it('retryAll() re-runs every failed upload and leaves the rest alone', async () => {
    planUploads({ mode: 'failure' });
    const el = await makeGallery(combo({ autoUpload: true }));
    el.addFiles([makeFile('a.txt', 10, 'text/plain'), makeFile('b.txt', 10, 'text/plain')]);
    await wait(100);
    expect(el.files.every((file: any) => el.hasError(file.id))).toBe(true);

    planUploads({ mode: 'success' });
    el.retryAll();
    await wait(120);
    expect(el.files.every((file: any) => el.isCompleted(file.id))).toBe(true);
  });

  it('cancelAll() clears everything that has not finished', async () => {
    planUploads({ mode: 'hang' });
    const el = await makeGallery(combo({ autoUpload: true }));
    el.addFiles([makeFile('a.txt', 10, 'text/plain'), makeFile('b.txt', 10, 'text/plain')]);
    await wait(60);
    el.cancelAll();
    await wait(40);
    expect(el.files).toHaveLength(0);
  });
});

describe('file-gallery matrix — removal', () => {
  afterEach(() => unmountGalleries());

  it('removeFile() reports file-remove and files-change', async () => {
    const c = combo();
    const el = await makeGallery(c);
    el.addFiles([FILES.text(), FILES.image()]);
    await wait(30);
    const events = record(el);
    const id = el.files[0].id;

    el.removeFile(id);
    await wait(30);
    expect(el.files).toHaveLength(1);
    expect(typesOf(events, 'file-remove')[0].detail.file.id).toBe(id);
    expect(typesOf(events, 'files-change')).toHaveLength(1);
    expectNoProblems(checkChrome(el, c), 'after removeFile');
  });

  it('removeFile() with an unknown id changes nothing', async () => {
    const el = await makeGallery(combo());
    el.addFiles([FILES.text()]);
    await wait(30);
    const events = record(el);
    el.removeFile('file-nope');
    await wait(20);
    expect(el.files).toHaveLength(1);
    expect(events).toHaveLength(0);
  });

  it('the delete affordance removes the file it belongs to', async () => {
    const el = await makeGallery(combo());
    el.addFiles([FILES.text(), FILES.image()]);
    await wait(30);
    const id = el.files[0].id;
    click(actionIn(el, id, 'delete'));
    await wait(30);
    expect(el.getFile(id)).toBeUndefined();
    expect(el.files).toHaveLength(1);
  });

  it('clear() empties the gallery and reports files-change', async () => {
    const c = combo();
    const el = await makeGallery(c);
    el.addFiles([FILES.text(), FILES.image()]);
    await wait(30);
    const events = record(el);
    el.clear();
    await wait(30);
    expect(el.files).toHaveLength(0);
    expect(typesOf(events, 'files-change')).toHaveLength(1);
    expectNoProblems(checkChrome(el, c), 'after clear');
  });

  it('clearCompleted() removes only the completed uploads', async () => {
    planUploads({ mode: 'success' });
    const el = await makeGallery(combo({ autoUpload: true }));
    el.addFiles([makeFile('done.txt', 10, 'text/plain')]);
    await wait(80);
    planUploads({ mode: 'hang' });
    el.addFiles([makeFile('busy.txt', 10, 'text/plain')]);
    await wait(60);

    el.clearCompleted();
    await wait(30);
    expect(el.files.map((file: any) => file.file.name)).toEqual(['busy.txt']);
  });

  it('clearErrors() removes only the failed uploads', async () => {
    planUploads({ mode: 'failure' });
    const el = await makeGallery(combo({ autoUpload: true }));
    el.addFiles([makeFile('bad.txt', 10, 'text/plain')]);
    await wait(80);
    el.autoUpload = false;
    el.addFiles([makeFile('idle.txt', 10, 'text/plain')]);
    await wait(30);

    el.clearErrors();
    await wait(30);
    expect(el.files.map((file: any) => file.file.name)).toEqual(['idle.txt']);
  });
});

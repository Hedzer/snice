/**
 * Smoke slice of the snice-file-gallery matrix — the everyday-loop tier.
 *
 * The full matrix (tests/matrix/file-gallery) is excluded from the
 * default Vitest include and runs via `npm run test:matrix`. This file samples
 * one combo per feature family:
 *   · chrome    — parts, view, and the show-* switches;
 *   · intake    — `accept` admits and rejects, reporting `gallery-error`;
 *   · upload    — the `file-gallery-upload` channel drives progress/completion;
 *   · control   — pause parks an in-flight upload;
 *   · removal   — `removeFile` reports `file-remove` and repaints;
 *   · extras    — a string badge is escaped, an `unsafeHTML()` one is not.
 *
 * Every assertion routes through the matrix oracle (`checkChrome`).
 *
 * BUDGET: under 1s. Add combos to the matrix, not here.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { unsafeHTML } from 'snice';
import {
  FILES,
  checkChrome, combo, expectNoProblems, itemFor, makeGallery, planUploads,
  record, statusOf, text, typesOf, unmountGalleries, wait,
} from './file-gallery-support';

describe('file-gallery matrix smoke', () => {
  afterEach(() => unmountGalleries());

  it('chrome: a list view with no dropzone and an add button', async () => {
    const c = combo({ view: 'list', showDropzone: false, showAddButton: true });
    const el = await makeGallery(c);
    el.addFiles([FILES.text()]);
    await wait(30);
    expectNoProblems(checkChrome(el, c), 'list/no-dropzone/add-button');
  });

  it('intake: accept admits its type and rejects the rest', async () => {
    const c = combo({ accept: 'image/*' });
    const el = await makeGallery(c);
    const events = record(el);
    el.addFiles([FILES.image()]);
    el.addFiles([FILES.text()]);
    await wait(40);
    expect(el.files).toHaveLength(1);
    expect(typesOf(events, 'gallery-error')).toHaveLength(1);
  });

  it('upload: the file-gallery-upload channel drives progress and completion', async () => {
    planUploads({ mode: 'success', progress: [0.4] });
    const el = await makeGallery(combo({ autoUpload: true }));
    const events = record(el);
    el.addFiles([FILES.text()]);
    await wait(80);
    expect(el.isCompleted(el.files[0].id)).toBe(true);
    expect(typesOf(events, 'upload-progress')[0].detail.progress).toBe(40);
    expect(typesOf(events, 'upload-complete')).toHaveLength(1);
  });

  it('control: pauseUpload parks an in-flight upload', async () => {
    planUploads({ mode: 'hang' });
    const el = await makeGallery(combo({ autoUpload: true }));
    el.addFiles([FILES.text()]);
    await wait(40);
    const id = el.files[0].id;
    el.pauseUpload(id);
    await wait(30);
    expect(el.isPaused(id)).toBe(true);
    expect(statusOf(el, id)).toBe('paused');
  });

  it('removal: removeFile reports file-remove and repaints', async () => {
    const c = combo();
    const el = await makeGallery(c);
    el.addFiles([FILES.text(), FILES.image()]);
    await wait(30);
    const events = record(el);
    const id = el.files[0].id;
    el.removeFile(id);
    await wait(30);
    expect(typesOf(events, 'file-remove')).toHaveLength(1);
    expect(itemFor(el, id)).toBeNull();
    expectNoProblems(checkChrome(el, c), 'after removeFile');
  });

  it('extras: a string badge is escaped, an unsafeHTML() badge is not', async () => {
    const el = await makeGallery(combo());
    el.addFiles([FILES.image(), FILES.image()]);
    await wait(30);
    const [first, second] = el.files;
    el.setFileBadge(first.id, '<b>raw</b>');
    el.setFileBadge(second.id, unsafeHTML('<b class="trusted">rich</b>'));
    await wait(30);

    const escaped = itemFor(el, first.id)!.querySelector('.gallery-item-badge')!;
    expect(escaped.querySelector('b')).toBeNull();
    expect(text(escaped)).toBe('<b>raw</b>');
    expect(itemFor(el, second.id)!.querySelector('.trusted')).not.toBeNull();
  });
});

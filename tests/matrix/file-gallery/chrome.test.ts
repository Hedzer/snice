/**
 * snice-file-gallery matrix — chrome.
 *
 * Crosses the documented visibility switches against the two views and an
 * empty/populated model: `view` x `show-dropzone` x `show-header` x
 * `show-add-button` x files. The oracle (`checkChrome`) asserts the documented
 * parts (`base`, `dropzone`, `gallery`), that the rendered tiles are the `files`
 * model in order, and that the per-file affordances follow `allow-delete`,
 * `allow-pause` and `show-progress`.
 *
 * 32 + 16 + 6 combos.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  FILES,
  checkChrome, combo, comboName, expectNoProblems, items, makeGallery,
  names, one, text, unmountGalleries, wait,
} from './file-gallery-support';

describe('file-gallery matrix — chrome switches', () => {
  afterEach(() => unmountGalleries());

  for (const view of ['grid', 'list'] as const) {
    for (const showDropzone of [true, false]) {
      for (const showHeader of [true, false]) {
        for (const showAddButton of [false, true]) {
          for (const populated of [false, true]) {
            const c = combo({ view, showDropzone, showHeader, showAddButton });
            it(`${comboName(c)}/${populated ? 'files' : 'empty'}`, async () => {
              const el = await makeGallery(c);
              if (populated) {
                el.addFiles([FILES.text(), FILES.image()]);
                await wait(30);
              }
              expectNoProblems(checkChrome(el, c), comboName(c));
              expect(items(el)).toHaveLength(populated ? 2 : 0);
            });
          }
        }
      }
    }
  }
});

describe('file-gallery matrix — per-file affordances', () => {
  afterEach(() => unmountGalleries());

  for (const allowDelete of [true, false]) {
    for (const allowPause of [true, false]) {
      for (const showProgress of [true, false]) {
        for (const view of ['grid', 'list'] as const) {
          const c = combo({ allowDelete, allowPause, showProgress, view });
          it(comboName(c), async () => {
            const el = await makeGallery(c);
            el.addFiles([FILES.text()]);
            await wait(30);
            expectNoProblems(checkChrome(el, c), comboName(c));
          });
        }
      }
    }
  }
});

describe('file-gallery matrix — intake surface', () => {
  afterEach(() => unmountGalleries());

  for (const disabled of [false, true]) {
    for (const multiple of [true, false]) {
      const c = combo({ disabled, multiple, accept: 'image/*' });
      it(comboName(c), async () => {
        const el = await makeGallery(c);
        expectNoProblems(checkChrome(el, c), comboName(c));
      });
    }
  }

  it('the dropzone states the accepted types', async () => {
    const c = combo({ accept: 'image/png,.txt' });
    const el = await makeGallery(c);
    expect(text(one(el, '.drop-zone') as HTMLElement)).toContain('image/png, .txt');
  });

  it('the dropzone states the size limit when there is one', async () => {
    const limited = await makeGallery(combo({ maxSize: 2 * 1024 * 1024 }));
    expect(text(one(limited, '.drop-zone') as HTMLElement)).toContain('2.0 MB');

    const unlimited = await makeGallery(combo({ maxSize: -1 }));
    expect(text(one(unlimited, '.drop-zone') as HTMLElement)).not.toContain('Max size');
  });

  it('a file tile names the file and its size', async () => {
    const el = await makeGallery(combo());
    el.addFiles([FILES.text()]);
    await wait(30);
    expect(names(el)).toEqual(['notes.txt']);
    expect(text(items(el)[0])).toContain('120.0 B');
  });
});

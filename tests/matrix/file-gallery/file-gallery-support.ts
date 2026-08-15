/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-file-gallery — matrix oracle
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Derived from `docs/ai/components/file-gallery.md` and
 * `snice-file-gallery.types.ts`:
 *
 *   · chrome — `view` (grid|list), `show-dropzone`, `show-header`,
 *     `show-add-button`, `show-progress`, `allow-pause`, `allow-delete`;
 *   · intake — `accept`, `multiple`, `disabled`, `max-size` ("bytes, -1 = no
 *     limit"), `max-files` ("-1 = no limit"), `auto-upload`;
 *   · model  — `files: GalleryFile[]` (read-only getter), `getFile`,
 *     `isPending`/`isUploading`/`isPaused`/`isCompleted`/`hasError`,
 *     `canAddFiles()`;
 *   · control— `addFiles`, `addFileWithPreview`, `removeFile`, `clear`,
 *     `clearCompleted`, `clearErrors`, `pauseUpload`/`resumeUpload`/
 *     `retryUpload`/`cancelUpload` and their `*All` forms;
 *   · extras — `addCustomAction`/`removeCustomAction`/`clearCustomActions`,
 *     `setFileBadge`/`removeFileBadge`;
 *   · events — `files-change`, `upload-progress`, `upload-complete`,
 *     `upload-error`, `upload-pause`, `file-remove`, `custom-action-click`,
 *     `gallery-error`;
 *   · CSS parts `base`, `dropzone`, `gallery`;
 *   · uploads travel the documented `file-gallery-upload` request channel:
 *     `UploadRequest { file, fileId, onProgress?, signal? }` ->
 *     `UploadResponse { success, fileId, url?, error? }`.
 */
import { controller, respond } from 'snice';
import { mount, one, all, part, text, wait, expectNoProblems } from '../matrix-utils';
import type {
  GalleryFile, UploadRequest, UploadResponse,
} from '../../../packages/components/src/file-gallery/snice-file-gallery.types';
import '../../../packages/components/src/file-gallery/snice-file-gallery';

export { wait, expectNoProblems, text, one, all };

// ── The upload responder ────────────────────────────────────────────────────

/**
 * How the next upload should behave. The gallery is documented as generic over
 * its upload transport — "Uses `@request/@respond` pattern
 * (`file-gallery-upload`)" — so the matrix supplies the controller half and
 * scripts it per combo instead of stubbing the component's internals.
 */
export interface UploadPlan {
  mode: 'success' | 'failure' | 'hang';
  /** Progress fractions to report through `onProgress` before settling. */
  progress?: number[];
  url?: string;
  error?: string;
  /** Delay before settling, so a test can observe the `uploading` state. */
  delayMs?: number;
}

export const uploadPlan: { current: UploadPlan; seen: UploadRequest[] } = {
  current: { mode: 'success' },
  seen: [],
};

export function planUploads(plan: UploadPlan): void {
  uploadPlan.current = plan;
  uploadPlan.seen = [];
}

const RESPONDER_TAG = 'file-gallery-matrix-uploader';

if (!(globalThis as any).__fileGalleryMatrixResponder) {
  (globalThis as any).__fileGalleryMatrixResponder = true;

  @controller(RESPONDER_TAG)
  class FileGalleryMatrixUploader {
    element!: HTMLElement;
    async attach() {}
    async detach() {}

    @respond('file-gallery-upload')
    async upload(request: UploadRequest): Promise<UploadResponse> {
      uploadPlan.seen.push(request);
      const plan = uploadPlan.current;

      for (const fraction of plan.progress ?? []) {
        request.onProgress?.(fraction);
        await wait(0);
      }

      if (plan.mode === 'hang') {
        // Settle only when the gallery aborts — the documented `signal` half of
        // UploadRequest, and the path `pauseUpload()`/`cancelUpload()` take.
        return await new Promise<UploadResponse>((_resolve, reject) => {
          const abort = () => {
            const error = new Error('aborted');
            error.name = 'AbortError';
            reject(error);
          };
          if (request.signal?.aborted) abort();
          else request.signal?.addEventListener('abort', abort);
        });
      }

      if (plan.delayMs) await wait(plan.delayMs);

      return plan.mode === 'success'
        ? { success: true, fileId: request.fileId, url: plan.url ?? `https://example.test/${request.fileId}` }
        : { success: false, fileId: request.fileId, error: plan.error ?? 'Upload failed' };
    }
  }
  void FileGalleryMatrixUploader;
}

// ── Fixtures ────────────────────────────────────────────────────────────────

export function makeFile(name: string, size: number, type: string): File {
  return new File([new Blob(['x'.repeat(size)], { type })], name, { type });
}

export const FILES = {
  text: () => makeFile('notes.txt', 120, 'text/plain'),
  image: () => makeFile('photo.png', 240, 'image/png'),
  large: () => makeFile('huge.bin', 4096, 'application/octet-stream'),
} as const;

// ── Combos ──────────────────────────────────────────────────────────────────

export interface GalleryCombo {
  view: 'grid' | 'list';
  showDropzone: boolean;
  showHeader: boolean;
  showAddButton: boolean;
  showProgress: boolean;
  allowPause: boolean;
  allowDelete: boolean;
  autoUpload: boolean;
  multiple: boolean;
  disabled: boolean;
  accept: string;
  maxSize: number;
  maxFiles: number;
}

export function combo(over: Partial<GalleryCombo> = {}): GalleryCombo {
  return {
    view: 'grid',
    showDropzone: true,
    showHeader: true,
    showAddButton: false,
    showProgress: true,
    allowPause: true,
    allowDelete: true,
    autoUpload: false,
    multiple: true,
    disabled: false,
    accept: '',
    maxSize: -1,
    maxFiles: -1,
    ...over,
  };
}

export function comboName(c: GalleryCombo): string {
  const flags = [
    ...(c.showDropzone ? ['dropzone'] : []),
    ...(c.showHeader ? ['header'] : []),
    ...(c.showAddButton ? ['add-button'] : []),
    ...(c.showProgress ? ['progress'] : []),
    ...(c.allowPause ? ['pause'] : []),
    ...(c.allowDelete ? ['delete'] : []),
    ...(c.autoUpload ? ['auto-upload'] : []),
    ...(c.disabled ? ['disabled'] : []),
  ];
  const limits = [
    c.accept ? `accept=${c.accept}` : '',
    c.maxSize >= 0 ? `max-size=${c.maxSize}` : '',
    c.maxFiles >= 0 ? `max-files=${c.maxFiles}` : '',
  ].filter(Boolean).join(' ');
  return `${c.view}/[${flags.join(',') || 'bare'}]${limits ? ` ${limits}` : ''}`;
}

/**
 * Mount a gallery inside a host carrying the upload responder, so the
 * documented `file-gallery-upload` channel is answered exactly as an
 * application's controller would answer it.
 */
export async function makeGallery(c: GalleryCombo): Promise<any> {
  const host = document.createElement('div');
  host.setAttribute('controller', RESPONDER_TAG);
  document.body.appendChild(host);
  await wait(10);

  const el = document.createElement('snice-file-gallery') as any;
  el.setAttribute('view', c.view);
  if (c.accept) el.setAttribute('accept', c.accept);
  if (c.maxSize >= 0) el.setAttribute('max-size', String(c.maxSize));
  if (c.maxFiles >= 0) el.setAttribute('max-files', String(c.maxFiles));
  if (!c.showDropzone) el.setAttribute('show-dropzone', 'false');
  if (!c.showHeader) el.setAttribute('show-header', 'false');
  if (c.showAddButton) el.setAttribute('show-add-button', 'true');
  if (!c.showProgress) el.setAttribute('show-progress', 'false');
  if (!c.allowPause) el.setAttribute('allow-pause', 'false');
  if (!c.allowDelete) el.setAttribute('allow-delete', 'false');
  if (!c.autoUpload) el.setAttribute('auto-upload', 'false');
  if (!c.multiple) el.setAttribute('multiple', 'false');
  if (c.disabled) el.setAttribute('disabled', 'true');
  host.appendChild(el);
  await el.ready;
  await wait(20);
  return el;
}

// ── Reading the rendered gallery ────────────────────────────────────────────

export function items(el: HTMLElement): HTMLElement[] {
  return all<HTMLElement>(el, '.gallery-item[data-file-id]');
}

export function itemFor(el: HTMLElement, fileId: string): HTMLElement | null {
  return one<HTMLElement>(el, `.gallery-item[data-file-id="${fileId}"]`);
}

export function actionIn(el: HTMLElement, fileId: string, action: string): HTMLElement | null {
  return itemFor(el, fileId)?.querySelector<HTMLElement>(`[data-action="${action}"]`) ?? null;
}

export function names(el: HTMLElement): string[] {
  return items(el).map(item => text(item.querySelector('.gallery-item-name')));
}

export function addButtons(el: HTMLElement): HTMLElement[] {
  return all<HTMLElement>(el, '.gallery-item--add-button');
}

export function statusOf(el: HTMLElement, fileId: string): string {
  const item = itemFor(el, fileId);
  if (!item) return '∅ not rendered';
  const found = (item.getAttribute('class') ?? '').split(/\s+/)
    .find(name => name.startsWith('gallery-item--'));
  return found ? found.replace('gallery-item--', '') : '∅ no status class';
}

/**
 * The oracle every chrome combo runs through: the documented parts exist or
 * not, exactly as the show-* switches say, and the file list on screen is the
 * `files` model.
 */
export function checkChrome(el: HTMLElement, c: GalleryCombo): string[] {
  const problems: string[] = [];
  const model = (el as any).files as GalleryFile[];

  if (!part(el, 'base')) problems.push('part="base" missing');

  const dropzone = part(el, 'dropzone');
  if (c.showDropzone && !dropzone) problems.push('show-dropzone but no part="dropzone"');
  if (!c.showDropzone && dropzone) problems.push('show-dropzone="false" but part="dropzone" rendered');

  const gallery = part(el, 'gallery');
  if (!gallery) {
    problems.push('part="gallery" missing');
    return problems;
  }
  // `view` is documented as grid|list; the rendered gallery must say which.
  if (!gallery.classList.contains(`gallery--${c.view}`)) {
    problems.push(`part="gallery" does not carry the "${c.view}" view (class "${gallery.className}")`);
  }

  const header = one(el, '.gallery-header');
  if (c.showHeader && !header) problems.push('show-header but no header rendered');
  if (!c.showHeader && header) problems.push('show-header="false" but a header rendered');

  // One rendered item per file in the model, in model order.
  const rendered = items(el).map(item => item.dataset.fileId);
  const wanted = model.map(file => file.id);
  if (rendered.join(',') !== wanted.join(',')) {
    problems.push(`rendered files [${rendered.join(',')}] != model [${wanted.join(',')}]`);
  }
  for (const file of model) {
    const item = itemFor(el, file.id);
    if (!item) continue;
    if (!text(item).includes(file.file.name)) {
      problems.push(`item ${file.id} does not show its name "${file.file.name}"`);
    }
    if (!item.classList.contains(`gallery-item--${file.uploadStatus}`)) {
      problems.push(`item ${file.id} does not show status "${file.uploadStatus}"`);
    }
    // allow-delete governs the per-file remove affordance.
    const remove = item.querySelector('[data-action="delete"]');
    if (c.allowDelete && !remove) problems.push(`item ${file.id} has no delete action`);
    if (!c.allowDelete && remove) problems.push(`item ${file.id} offers delete with allow-delete="false"`);
    // allow-pause governs pause/resume, and only while there is something to pause.
    const pause = item.querySelector('[data-action="pause"]');
    const resume = item.querySelector('[data-action="resume"]');
    const wantPause = c.allowPause && file.uploadStatus === 'uploading';
    const wantResume = c.allowPause && file.uploadStatus === 'paused';
    if (!!pause !== wantPause) problems.push(`item ${file.id} pause action ${pause ? 'shown' : 'absent'}, expected ${wantPause ? 'shown' : 'absent'}`);
    if (!!resume !== wantResume) problems.push(`item ${file.id} resume action ${resume ? 'shown' : 'absent'}, expected ${wantResume ? 'shown' : 'absent'}`);
    // A failed upload can always be retried — retryUpload is documented with no
    // switch guarding it.
    const retry = item.querySelector('[data-action="retry"]');
    if (!!retry !== (file.uploadStatus === 'error')) {
      problems.push(`item ${file.id} retry action ${retry ? 'shown' : 'absent'} for status "${file.uploadStatus}"`);
    }
    // show-progress governs the progress readout of an in-flight upload.
    const progress = item.querySelector('.gallery-item-progress');
    const wantProgress = c.showProgress && file.uploadStatus === 'uploading';
    if (!!progress !== wantProgress) {
      problems.push(`item ${file.id} progress bar ${progress ? 'shown' : 'absent'}, expected ${wantProgress ? 'shown' : 'absent'}`);
    }
  }

  // show-add-button adds exactly one "Add files" tile, on top of any custom
  // actions (which render as tiles of their own).
  const customCount = ((el as any).customActions as unknown[]).length;
  const tiles = addButtons(el).length;
  const wantTiles = (c.showAddButton ? 1 : 0) + customCount;
  if (tiles !== wantTiles) {
    problems.push(`${tiles} add/action tiles, expected ${wantTiles}`);
  }

  // The native input carries the documented intake contract.
  const input = one<HTMLInputElement>(el, 'input[type="file"]');
  if (!input) {
    problems.push('no file input rendered');
  } else {
    if ((input.getAttribute('accept') ?? '') !== c.accept) {
      problems.push(`input accept="${input.getAttribute('accept')}", expected "${c.accept}"`);
    }
    if (input.multiple !== c.multiple) {
      problems.push(`input multiple=${input.multiple}, expected ${c.multiple}`);
    }
    if (input.disabled !== c.disabled) {
      problems.push(`input disabled=${input.disabled}, expected ${c.disabled}`);
    }
  }

  return problems;
}

// ── Event capture ───────────────────────────────────────────────────────────

export const GALLERY_EVENTS = [
  'files-change', 'upload-progress', 'upload-complete', 'upload-error',
  'upload-pause', 'file-remove', 'custom-action-click', 'gallery-error',
] as const;

export interface Recorded { type: string; detail: any }

export function record(el: HTMLElement): Recorded[] {
  const seen: Recorded[] = [];
  for (const type of GALLERY_EVENTS) {
    el.addEventListener(type, (event: Event) => {
      seen.push({ type, detail: (event as CustomEvent).detail });
    });
  }
  return seen;
}

export function typesOf(events: Recorded[], type: string): Recorded[] {
  return events.filter(event => event.type === type);
}

/** Tear down the responder hosts `makeGallery` created. */
export function unmountGalleries(): void {
  document.body.innerHTML = '';
}

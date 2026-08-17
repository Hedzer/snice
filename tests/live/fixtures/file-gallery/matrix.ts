/**
 * snice-file-gallery visual-matrix fixture driver.
 *
 * Lives in a module rather than an inline `<script>` because the upload
 * transport the gallery documents — "Uses `@request/@respond` pattern
 * (`file-gallery-upload`)" — is supplied by a DECORATED controller class, and
 * decorators need the SWC transform the dev server applies to `.ts`.
 *
 * The responder is the application half of that contract, scripted per combo:
 * a combo that wants a file stuck at `uploading` asks for `hang` and the
 * responder never settles until the gallery aborts it; a combo that wants
 * `error` asks for `failure`. Nothing here reaches into the component — every
 * state on screen is produced through the documented channel, exactly as a
 * customer's own controller would produce it.
 */
import { controller, respond } from '/packages/core/src/index';
import '/packages/components/src/file-gallery/snice-file-gallery.ts';

const RESPONDER = 'file-gallery-visual-uploader';

type Mode = 'success' | 'failure' | 'hang';

const plan: { mode: Mode; progress: number[] } = { mode: 'success', progress: [] };

@controller(RESPONDER)
class FileGalleryVisualUploader {
  element!: HTMLElement;
  async attach() {}
  async detach() {}

  @respond('file-gallery-upload')
  async upload(request: any): Promise<any> {
    for (const fraction of plan.progress) {
      request.onProgress?.(fraction);
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    if (plan.mode === 'hang') {
      // Settle only when the gallery aborts — the documented `signal` half of
      // UploadRequest, and the path pauseUpload()/cancelUpload() take.
      return new Promise((_resolve, reject) => {
        const abort = () => {
          const error = new Error('aborted');
          error.name = 'AbortError';
          reject(error);
        };
        if (request.signal?.aborted) abort();
        else request.signal?.addEventListener('abort', abort);
      });
    }
    return plan.mode === 'success'
      ? { success: true, fileId: request.fileId, url: `https://example.test/${request.fileId}` }
      : { success: false, fileId: request.fileId, error: 'Upload failed' };
  }
}
void FileGalleryVisualUploader;

const stage = document.getElementById('stage') as HTMLElement;

function nextFrame(): Promise<void> {
  return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

/**
 * The gallery renders on a microtask and animates its progress bar over
 * `--snice-transition-fast` (150ms). Every measurement here is a resting one,
 * so both must be over first.
 */
async function settle(): Promise<void> {
  await nextFrame();
  await new Promise(resolve => setTimeout(resolve, 220));
  await nextFrame();
}

function makeFile(name: string, size: number, type: string): File {
  return new File([new Blob(['x'.repeat(size)], { type })], name, { type });
}

const NAMES = [
  'notes.txt', 'photo.png', 'report.pdf', 'archive.zip',
  'clip.mp4', 'sheet.csv', 'diagram.svg', 'backup.bin',
];

export interface Combo {
  view?: 'grid' | 'list';
  files?: number;
  /** Which documented upload status every file should be resting in. */
  status?: 'none' | 'pending' | 'uploading' | 'paused' | 'completed' | 'error';
  showDropzone?: boolean;
  showHeader?: boolean;
  showAddButton?: boolean;
  showProgress?: boolean;
  allowPause?: boolean;
  allowDelete?: boolean;
  disabled?: boolean;
  maxFiles?: number;
  customActions?: string[];
}

let current: HTMLElement | null = null;

const api = {
  /**
   * Mount one combo. Chrome switches cross the ATTRIBUTE channel, in the
   * hyphenated forms the doc's own examples use; the file set and the upload
   * status are produced through `addFiles()` and the documented upload
   * controls, never by writing internal state.
   */
  async mount(combo: Combo) {
    api.unmount();
    const status = combo.status ?? (combo.files ? 'pending' : 'none');
    plan.mode = status === 'error' ? 'failure'
      : status === 'uploading' || status === 'paused' ? 'hang'
        : 'success';
    plan.progress = status === 'uploading' || status === 'paused' ? [0.45] : [];

    const wrapper = document.createElement('div');
    wrapper.setAttribute('controller', RESPONDER);
    wrapper.id = 'wrapper';
    stage.appendChild(wrapper);
    await new Promise(resolve => setTimeout(resolve, 10));

    const el = document.createElement('snice-file-gallery') as any;
    el.id = 'subject';
    el.setAttribute('view', combo.view ?? 'grid');
    if (combo.showDropzone === false) el.setAttribute('show-dropzone', 'false');
    if (combo.showHeader === false) el.setAttribute('show-header', 'false');
    if (combo.showAddButton) el.setAttribute('show-add-button', 'true');
    if (combo.showProgress === false) el.setAttribute('show-progress', 'false');
    if (combo.allowPause === false) el.setAttribute('allow-pause', 'false');
    if (combo.allowDelete === false) el.setAttribute('allow-delete', 'false');
    if (combo.disabled) el.setAttribute('disabled', 'true');
    if (combo.maxFiles !== undefined) el.setAttribute('max-files', String(combo.maxFiles));
    // `pending` is the only status reachable with auto-upload on, because the
    // gallery starts uploading the moment a file lands.
    if (status === 'pending' || status === 'none') el.setAttribute('auto-upload', 'false');
    wrapper.appendChild(el);
    await el.ready;
    await settle();

    for (const text of combo.customActions ?? []) el.addCustomAction('★', text);

    const count = combo.files ?? 0;
    if (count > 0) {
      el.addFiles(Array.from({ length: count }, (_, i) =>
        makeFile(NAMES[i % NAMES.length], 400 + i * 100, 'application/octet-stream')));
      await settle();
    }
    if (status === 'paused') {
      el.pauseAll();
      await settle();
    }

    current = el;
    return {
      files: el.files.length,
      statuses: el.files.map((file: any) => file.uploadStatus),
    };
  },

  /** Click a per-file action the way a pointer would, and report the result. */
  async act(index: number, action: string) {
    const el = current as any;
    const item = el.shadowRoot.querySelectorAll('.gallery-item[data-file-id]')[index];
    (item?.querySelector(`[data-action="${action}"]`) as HTMLElement | null)?.click();
    await settle();
    return { statuses: el.files.map((file: any) => file.uploadStatus), files: el.files.length };
  },

  unmount() {
    stage.innerHTML = '';
    current = null;
  },

  get el() { return current; },
  settle,
};

(window as any).matrix = api;
document.documentElement.dataset.matrixReady = 'true';

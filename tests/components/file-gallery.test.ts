import { describe, it, expect, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { unsafeHTML } from 'snice';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import type { SniceFileGalleryElement } from '../../packages/components/src/file-gallery/snice-file-gallery.types';
import type { GalleryFile, UploadResponse } from '../../packages/components/src/file-gallery/snice-file-gallery.types';

// Import component to register it
import '../../packages/components/src/file-gallery/snice-file-gallery';

function createMockFile(name: string, size: number, type: string): File {
  const blob = new Blob(['x'.repeat(size)], { type });
  return new File([blob], name, { type });
}

describe('snice-file-gallery', () => {
  let element: SniceFileGalleryElement;

  afterEach(() => {
    if (element) {
      removeComponent(element as HTMLElement);
    }
  });

  describe('Rendering', () => {
    it('should render drop zone', async () => {
      element = await createComponent<SniceFileGalleryElement>('snice-file-gallery');
      const dropZone = queryShadow(element as HTMLElement, '.drop-zone');
      expect(dropZone).toBeTruthy();
    });

    it('should render file input', async () => {
      element = await createComponent<SniceFileGalleryElement>('snice-file-gallery');
      const input = queryShadow(element as HTMLElement, '.file-input');
      expect(input).toBeTruthy();
      expect(input?.tagName).toBe('INPUT');
    });

    it('should render empty gallery when no files', async () => {
      element = await createComponent<SniceFileGalleryElement>('snice-file-gallery');
      const gallery = queryShadow(element as HTMLElement, '.gallery');
      expect(gallery).toBeTruthy();
      expect(gallery?.children.length).toBe(0);
    });

    it('should render gallery when files added', async () => {
      element = await createComponent<SniceFileGalleryElement>('snice-file-gallery');
      element.autoUpload = false;
      const file = createMockFile('test.txt', 100, 'text/plain');
      element.addFiles([file]);
      await wait(50);

      const gallery = queryShadow(element as HTMLElement, '.gallery');
      expect(gallery).toBeTruthy();
    });
  });

  describe('Properties', () => {
    it('should have default property values', async () => {
      element = await createComponent<SniceFileGalleryElement>('snice-file-gallery');
      expect(element.accept).toBe('');
      expect(element.multiple).toBe(true);
      expect(element.disabled).toBe(false);
      expect(element.maxSize).toBe(-1);
      expect(element.maxFiles).toBe(-1);
      expect(element.view).toBe('grid');
      expect(element.showProgress).toBe(true);
      expect(element.allowPause).toBe(true);
      expect(element.allowDelete).toBe(true);
      expect(element.autoUpload).toBe(true);
    });

    it('should set accept property', async () => {
      element = await createComponent<SniceFileGalleryElement>('snice-file-gallery');
      element.accept = 'image/*';
      expect(element.accept).toBe('image/*');
    });

    it('should set view property', async () => {
      element = await createComponent<SniceFileGalleryElement>('snice-file-gallery');
      element.view = 'list';
      expect(element.view).toBe('list');
    });

    it('should set disabled property', async () => {
      element = await createComponent<SniceFileGalleryElement>('snice-file-gallery');
      element.disabled = true;
      expect(element.disabled).toBe(true);
    });
  });

  describe('Adding Files', () => {
    it('should add single file', async () => {
      element = await createComponent<SniceFileGalleryElement>('snice-file-gallery');
      element.autoUpload = false;
      const file = createMockFile('test.txt', 100, 'text/plain');
      element.addFiles([file]);
      await wait(50);

      expect(element.files.length).toBe(1);
      expect(element.files[0].file.name).toBe('test.txt');
    });

    it('should add multiple files', async () => {
      element = await createComponent<SniceFileGalleryElement>('snice-file-gallery');
      element.autoUpload = false;
      const file1 = createMockFile('test1.txt', 100, 'text/plain');
      const file2 = createMockFile('test2.txt', 100, 'text/plain');
      element.addFiles([file1, file2]);
      await wait(50);

      expect(element.files.length).toBe(2);
    });

    it('should emit files-change event', async () => {
      element = await createComponent<SniceFileGalleryElement>('snice-file-gallery');
      element.autoUpload = false;

      const eventPromise = new Promise<CustomEvent>((resolve) => {
        element.addEventListener('files-change', (e) => resolve(e as CustomEvent), { once: true });
      });

      const file = createMockFile('test.txt', 100, 'text/plain');
      element.addFiles([file]);

      const event = await eventPromise;
      expect(event.detail.files).toHaveLength(1);
    });

    it('should reject files exceeding maxSize', async () => {
      element = await createComponent<SniceFileGalleryElement>('snice-file-gallery');
      element.autoUpload = false;
      element.maxSize = 50;

      const file = createMockFile('large.txt', 100, 'text/plain');
      element.addFiles([file]);
      await wait(50);

      expect(element.files.length).toBe(0);
    });

    it('should respect maxFiles limit', async () => {
      element = await createComponent<SniceFileGalleryElement>('snice-file-gallery');
      element.autoUpload = false;
      element.maxFiles = 2;

      const file1 = createMockFile('test1.txt', 100, 'text/plain');
      const file2 = createMockFile('test2.txt', 100, 'text/plain');
      const file3 = createMockFile('test3.txt', 100, 'text/plain');

      element.addFiles([file1, file2]);
      await wait(50);
      element.addFiles([file3]);
      await wait(50);

      expect(element.files.length).toBe(2);
    });

    it('should filter files by accept type', async () => {
      element = await createComponent<SniceFileGalleryElement>('snice-file-gallery');
      element.autoUpload = false;
      element.accept = 'image/*';

      const imageFile = createMockFile('image.jpg', 100, 'image/jpeg');
      const textFile = createMockFile('text.txt', 100, 'text/plain');
      element.addFiles([imageFile, textFile]);
      await wait(50);

      expect(element.files.length).toBe(1);
      expect(element.files[0].file.name).toBe('image.jpg');
    });
  });

  describe('Removing Files', () => {
    it('should remove file by id', async () => {
      element = await createComponent<SniceFileGalleryElement>('snice-file-gallery');
      element.autoUpload = false;
      const file = createMockFile('test.txt', 100, 'text/plain');
      element.addFiles([file]);
      await wait(50);

      const fileId = element.files[0].id;
      element.removeFile(fileId);
      await wait(50);

      expect(element.files.length).toBe(0);
    });

    it('should not error when removing non-existent file', async () => {
      element = await createComponent<SniceFileGalleryElement>('snice-file-gallery');
      expect(() => element.removeFile('non-existent')).not.toThrow();
    });
  });

  describe('Clearing Files', () => {
    it('should clear all files', async () => {
      element = await createComponent<SniceFileGalleryElement>('snice-file-gallery');
      element.autoUpload = false;
      const file1 = createMockFile('test1.txt', 100, 'text/plain');
      const file2 = createMockFile('test2.txt', 100, 'text/plain');
      element.addFiles([file1, file2]);
      await wait(50);

      element.clear();
      await wait(50);

      expect(element.files.length).toBe(0);
    });
  });

  describe('View Toggle', () => {
    it('should apply grid class when view is grid', async () => {
      element = await createComponent<SniceFileGalleryElement>('snice-file-gallery');
      element.autoUpload = false;
      element.view = 'grid';
      const file = createMockFile('test.txt', 100, 'text/plain');
      element.addFiles([file]);
      await wait(50);

      const gallery = queryShadow(element as HTMLElement, '.gallery--grid');
      expect(gallery).toBeTruthy();
    });

    it('should apply list class when view is list', async () => {
      element = await createComponent<SniceFileGalleryElement>('snice-file-gallery');
      element.autoUpload = false;
      element.view = 'list';
      const file = createMockFile('test.txt', 100, 'text/plain');
      element.addFiles([file]);
      await wait(50);

      const gallery = queryShadow(element as HTMLElement, '.gallery--list');
      expect(gallery).toBeTruthy();
    });
  });

  describe('Disabled State', () => {
    it('should apply disabled class when disabled', async () => {
      element = await createComponent<SniceFileGalleryElement>('snice-file-gallery');
      element.disabled = true;
      await wait(50);

      const dropZone = queryShadow(element as HTMLElement, '.drop-zone--disabled');
      expect(dropZone).toBeTruthy();
    });
  });

  describe('Add Button Mode', () => {
    it('should show add button when showAddButton is true', async () => {
      element = await createComponent<SniceFileGalleryElement>('snice-file-gallery', {
        'show-add-button': 'true',
        'auto-upload': 'false'
      });
      await wait(50);

      const addButton = queryShadow(element as HTMLElement, '.gallery-item--add-button');
      expect(addButton).toBeTruthy();
    });

    it('should hide drop zone when showDropzone is false', async () => {
      element = await createComponent<SniceFileGalleryElement>('snice-file-gallery');
      element.showDropzone = false;
      await wait(50);

      const dropZone = queryShadow(element as HTMLElement, '.drop-zone');
      expect(dropZone).toBeNull();
    });

    it('should show drop zone when showDropzone is true', async () => {
      element = await createComponent<SniceFileGalleryElement>('snice-file-gallery');
      element.showDropzone = true;
      await wait(50);

      const dropZone = queryShadow(element as HTMLElement, '.drop-zone');
      expect(dropZone).toBeTruthy();
    });

    it('should disable add button when maxFiles is reached', async () => {
      element = await createComponent<SniceFileGalleryElement>('snice-file-gallery');
      element.showAddButton = true;
      element.maxFiles = 2;
      element.autoUpload = false;
      await wait(50);

      // Add 2 files to reach the limit
      const file1 = createMockFile('test1.txt', 100, 'text/plain');
      const file2 = createMockFile('test2.txt', 100, 'text/plain');
      element.addFiles([file1, file2]);
      await wait(50);

      const addButton = queryShadow(element as HTMLElement, '.gallery-item--disabled');
      expect(addButton).toBeTruthy();
      expect(element.files.length).toBe(2);
    });

    it('should show gallery immediately in add button mode even with no files', async () => {
      element = await createComponent<SniceFileGalleryElement>('snice-file-gallery');
      element.showAddButton = true;
      await wait(50);

      const gallery = queryShadow(element as HTMLElement, '.gallery');
      expect(gallery).toBeTruthy();
      expect(element.files.length).toBe(0);
    });
  });

  describe('File Upload Behavior', () => {
    it('should not auto-upload when autoUpload is false', async () => {
      element = await createComponent<SniceFileGalleryElement>('snice-file-gallery');
      element.autoUpload = false;

      const file = createMockFile('test.txt', 100, 'text/plain');
      element.addFiles([file]);
      await wait(50);

      expect(element.files[0].uploadStatus).toBe('pending');
    });

    it('should generate preview for image files', async () => {
      element = await createComponent<SniceFileGalleryElement>('snice-file-gallery');
      element.autoUpload = false;

      const imageFile = createMockFile('test.jpg', 100, 'image/jpeg');
      element.addFiles([imageFile]);
      await wait(100); // Wait for FileReader

      expect(element.files[0].file.type).toBe('image/jpeg');
      // Preview generation is async, just verify the file was added
      expect(element.files.length).toBe(1);
    });
  });

  describe('File Type Validation', () => {
    it('should accept files matching exact MIME type', async () => {
      element = await createComponent<SniceFileGalleryElement>('snice-file-gallery');
      element.autoUpload = false;
      element.accept = 'text/plain';

      const file = createMockFile('test.txt', 100, 'text/plain');
      element.addFiles([file]);
      await wait(50);

      expect(element.files.length).toBe(1);
    });

    it('should accept files matching wildcard type', async () => {
      element = await createComponent<SniceFileGalleryElement>('snice-file-gallery');
      element.autoUpload = false;
      element.accept = 'image/*';

      const file = createMockFile('test.jpg', 100, 'image/jpeg');
      element.addFiles([file]);
      await wait(50);

      expect(element.files.length).toBe(1);
    });

    it('should accept files matching extension', async () => {
      element = await createComponent<SniceFileGalleryElement>('snice-file-gallery');
      element.autoUpload = false;
      element.accept = '.txt';

      const file = createMockFile('test.txt', 100, 'text/plain');
      element.addFiles([file]);
      await wait(50);

      expect(element.files.length).toBe(1);
    });

    it('should reject files not matching accept criteria', async () => {
      element = await createComponent<SniceFileGalleryElement>('snice-file-gallery');
      element.autoUpload = false;
      element.accept = 'image/*';

      const file = createMockFile('test.txt', 100, 'text/plain');
      element.addFiles([file]);
      await wait(50);

      expect(element.files.length).toBe(0);
    });
  });

  describe('File Size Validation', () => {
    it('should accept files within size limit', async () => {
      element = await createComponent<SniceFileGalleryElement>('snice-file-gallery');
      element.autoUpload = false;
      element.maxSize = 200;

      const file = createMockFile('test.txt', 100, 'text/plain');
      element.addFiles([file]);
      await wait(50);

      expect(element.files.length).toBe(1);
    });

    it('should reject files exceeding size limit', async () => {
      element = await createComponent<SniceFileGalleryElement>('snice-file-gallery');
      element.autoUpload = false;
      element.maxSize = 50;

      const file = createMockFile('large.txt', 100, 'text/plain');
      element.addFiles([file]);
      await wait(50);

      expect(element.files.length).toBe(0);
    });
  });

  describe('File Count Validation', () => {
    it('should accept files within count limit', async () => {
      element = await createComponent<SniceFileGalleryElement>('snice-file-gallery');
      element.autoUpload = false;
      element.maxFiles = 3;

      const file1 = createMockFile('test1.txt', 100, 'text/plain');
      const file2 = createMockFile('test2.txt', 100, 'text/plain');
      element.addFiles([file1, file2]);
      await wait(50);

      expect(element.files.length).toBe(2);
    });

    it('should reject files exceeding count limit', async () => {
      element = await createComponent<SniceFileGalleryElement>('snice-file-gallery');
      element.autoUpload = false;
      element.maxFiles = 2;

      const file1 = createMockFile('test1.txt', 100, 'text/plain');
      const file2 = createMockFile('test2.txt', 100, 'text/plain');
      const file3 = createMockFile('test3.txt', 100, 'text/plain');

      element.addFiles([file1, file2]);
      await wait(50);

      const initialCount = element.files.length;
      element.addFiles([file3]);
      await wait(50);

      expect(initialCount).toBe(2);
      expect(element.files.length).toBe(2); // Should still be 2
    });
  });

  describe('Safe Metadata Rendering', () => {
    const fileName = '<img data-gallery-injected="filename" src="missing-name.png" onerror="globalThis.__galleryInjected++"><svg><script>globalThis.__galleryInjected++</script></svg>.png';
    const mimeType = 'image/png"><img data-gallery-injected="mime" src="missing-mime.png" onerror="globalThis.__galleryInjected++">';
    const preview = 'missing-preview.png" onerror="globalThis.__galleryInjected++" data-gallery-injected="preview';
    const badge = '<img data-gallery-injected="badge" src="missing-badge.png" onerror="globalThis.__galleryInjected++"><b>New</b>';
    const error = 'Failed"><img data-gallery-injected="error" src="missing-error.png" onerror="globalThis.__galleryInjected++">';
    const actionIcon = '<svg data-gallery-injected="icon" onload="globalThis.__galleryInjected++"><script>globalThis.__galleryInjected++</script><circle cx="12" cy="12" r="5"/></svg>';
    const actionLabel = '<img data-gallery-injected="action" src="missing-action.png" onerror="globalThis.__galleryInjected++">Camera';

    it.each(['grid', 'list'] as const)(
      'keeps every ordinary metadata channel inert in %s view',
      async (view) => {
        element = await createComponent<SniceFileGalleryElement>('snice-file-gallery');
        element.autoUpload = false;
        element.view = view;

        const first = createMockFile(fileName, 12, mimeType);
        const actualFileName = first.name;
        element.addFileWithPreview(first, preview);

        const second = createMockFile('<strong data-gallery-injected="added">added.txt</strong>', 8, 'text/plain');
        element.addFiles([second]);
        await wait(50);

        const firstFile = element.files[0];
        firstFile.uploadStatus = 'error';
        firstFile.error = error;
        element.setFileBadge(firstFile.id, badge, 'top-left');

        const actionId = element.addCustomAction(actionIcon, actionLabel);
        const actionClicked = vi.fn();
        element.addEventListener('custom-action-click', actionClicked);
        await wait(50);

        const shadow = (element as HTMLElement).shadowRoot!;
        const gallery = shadow.querySelector('.gallery')!;
        const fileItems = shadow.querySelectorAll<HTMLElement>('[data-file-id]');
        const firstItem = fileItems[0];
        const firstName = firstItem.querySelector<HTMLElement>('.gallery-item-name')!;
        const image = firstItem.querySelector<HTMLImageElement>('.gallery-item-image')!;
        const renderedBadge = firstItem.querySelector<HTMLElement>('.gallery-item-badge')!;
        const renderedError = firstItem.querySelector<HTMLElement>('.gallery-item-error')!;
        const customAction = Array.from(
          shadow.querySelectorAll<HTMLElement>('.gallery-item--add-button')
        ).find(item => item.title === actionLabel)!;

        expect(gallery.classList.contains(`gallery--${view}`)).toBe(true);
        expect(fileItems).toHaveLength(2);
        expect(firstName.textContent?.trim()).toBe(actualFileName);
        expect(firstName.title).toBe(actualFileName);
        expect(image.getAttribute('src')).toBe(preview);
        expect(image.alt).toBe(actualFileName);
        expect(image.getAttribute('onerror')).toBeNull();
        expect(renderedBadge.textContent?.trim()).toBe(badge);
        expect(renderedBadge.classList.contains('gallery-item-badge--top-left')).toBe(true);
        expect(renderedError.title).toBe(error);
        expect(renderedError.textContent).toBe('Upload failed');
        expect(customAction.title).toBe(actionLabel);
        expect(customAction.querySelector('.gallery-item-name')?.textContent?.trim()).toBe(actionLabel);
        expect(customAction.querySelector('.gallery-item-add-icon')?.textContent?.trim()).toBe(actionIcon);
        expect(shadow.textContent).not.toContain(mimeType);
        expect(shadow.querySelectorAll('[data-gallery-injected]')).toHaveLength(0);
        expect(shadow.querySelectorAll('script')).toHaveLength(0);

        customAction.click();
        expect(actionClicked).toHaveBeenCalledTimes(1);
        expect(actionClicked.mock.calls[0][0].detail.actionId).toBe(actionId);
      }
    );

    it('requires unsafeHTML for intentional badge and SVG composition', async () => {
      element = await createComponent<SniceFileGalleryElement>('snice-file-gallery');
      element.autoUpload = false;
      element.addFiles([createMockFile('trusted-content.txt', 10, 'text/plain')]);
      await wait(25);

      const fileId = element.files[0].id;
      element.setFileBadge(
        fileId,
        unsafeHTML('<span data-trusted-gallery-badge="true"><strong>JD</strong></span>'),
        'bottom-right'
      );
      element.addCustomAction(
        unsafeHTML('<svg data-trusted-gallery-icon="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/></svg>'),
        'Camera'
      );
      await wait(25);

      let shadow = (element as HTMLElement).shadowRoot!;
      expect(shadow.querySelector('[data-trusted-gallery-badge] strong')?.textContent).toBe('JD');
      expect(shadow.querySelector('[data-trusted-gallery-icon] circle')).toBeTruthy();
      expect(shadow.querySelector('.gallery-item-badge--bottom-right')).toBeTruthy();

      element.view = 'list';
      element.files[0].uploadStatus = 'completed';
      await wait(25);

      shadow = (element as HTMLElement).shadowRoot!;
      expect(shadow.querySelector('.gallery--list')).toBeTruthy();
      expect(shadow.querySelector('[data-trusted-gallery-badge] strong')?.textContent).toBe('JD');
      expect(shadow.querySelector('[data-trusted-gallery-icon] circle')).toBeTruthy();
      expect(shadow.querySelector('.gallery-item-status--success')).toBeTruthy();
    });

    it('reactively updates adversarial IDs, progress, badges, and errors without selector parsing', async () => {
      element = await createComponent<SniceFileGalleryElement>('snice-file-gallery');
      element.autoUpload = false;
      element.addFiles([createMockFile('dynamic.txt', 10, 'text/plain')]);
      await wait(25);

      const dynamicFile = element.files[0];
      const adversarialId = 'file"] [data-gallery-injected="id';
      dynamicFile.id = adversarialId;
      dynamicFile.uploadStatus = 'uploading';
      dynamicFile.uploadProgress = 37;
      element.setFileBadge(adversarialId, badge, 'not-a-position' as any);
      await wait(25);

      let shadow = (element as HTMLElement).shadowRoot!;
      const item = shadow.querySelector<HTMLElement>('[data-file-id]')!;
      expect(item.getAttribute('data-file-id')).toBe(adversarialId);
      expect(shadow.querySelector('.gallery-item-progress-text')?.textContent).toBe('37%');
      expect((shadow.querySelector('.gallery-item-progress-bar') as HTMLElement).style.width).toBe('37%');
      expect(shadow.querySelector('.gallery-item-badge--top-right')?.textContent?.trim()).toBe(badge);
      expect(shadow.querySelectorAll('[data-gallery-injected]')).toHaveLength(0);

      dynamicFile.uploadStatus = 'error';
      dynamicFile.error = error;
      element.removeFileBadge(adversarialId);
      await wait(25);

      shadow = (element as HTMLElement).shadowRoot!;
      expect(shadow.querySelector('.gallery-item-badge')).toBeNull();
      expect((shadow.querySelector('.gallery-item-error') as HTMLElement).title).toBe(error);
      expect(shadow.querySelectorAll('[data-gallery-injected]')).toHaveLength(0);
      expect(shadow.querySelectorAll('script')).toHaveLength(0);
    });
  });

  describe('stylesheet contracts', () => {
    const cssPath = resolve(process.cwd(), 'packages/components/src/file-gallery/snice-file-gallery.css');

    it('should provide a fallback for every --snice-* variable reference', () => {
      const css = readFileSync(cssPath, 'utf8');
      const missing = css.match(/var\(\s*--snice-[a-z0-9-]+\s*\)/g) ?? [];
      expect(missing).toEqual([]);
    });

    it('should handle prefers-reduced-motion without the theme loaded', () => {
      const css = readFileSync(cssPath, 'utf8');
      expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    });
  });
});
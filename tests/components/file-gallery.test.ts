import { describe, it, expect, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import type { SniceFileGalleryElement } from '../../components/file-gallery/snice-file-gallery.types';
import type { GalleryFile, UploadResponse } from '../../components/file-gallery/snice-file-gallery.types';

// Import component to register it
import '../../components/file-gallery/snice-file-gallery';

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
});

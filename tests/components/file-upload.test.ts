import { describe, it, expect, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../components/file-upload/snice-file-upload';
import type { SniceFileUploadElement } from '../../components/file-upload/snice-file-upload.types';

describe('snice-file-upload', () => {
  let fileUpload: SniceFileUploadElement;

  afterEach(() => {
    if (fileUpload) {
      removeComponent(fileUpload as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render file upload element', async () => {
      fileUpload = await createComponent<SniceFileUploadElement>('snice-file-upload');
      expect(fileUpload).toBeTruthy();
      expect(fileUpload.tagName).toBe('SNICE-FILE-UPLOAD');
    });

    it('should have default properties', async () => {
      fileUpload = await createComponent<SniceFileUploadElement>('snice-file-upload');
      expect(fileUpload.size).toBe('medium');
      expect(fileUpload.variant).toBe('outlined');
      expect(fileUpload.accept).toBe('');
      expect(fileUpload.multiple).toBe(false);
      expect(fileUpload.disabled).toBe(false);
      expect(fileUpload.required).toBe(false);
      expect(fileUpload.invalid).toBe(false);
      expect(fileUpload.dragDrop).toBe(true);
      expect(fileUpload.showPreview).toBe(true);
    });

    it('should render internal file input', async () => {
      fileUpload = await createComponent<SniceFileUploadElement>('snice-file-upload');
      await wait(50);

      const inputEl = queryShadow(fileUpload as HTMLElement, '.file-input');
      expect(inputEl).toBeTruthy();
      expect(inputEl?.tagName).toBe('INPUT');
    });

    it('should render upload area', async () => {
      fileUpload = await createComponent<SniceFileUploadElement>('snice-file-upload');
      await wait(50);

      const uploadArea = queryShadow(fileUpload as HTMLElement, '.upload-area');
      expect(uploadArea).toBeTruthy();
    });
  });

  describe('sizes', () => {
    const sizes = ['small', 'medium', 'large'];

    sizes.forEach(size => {
      it(`should apply ${size} size class`, async () => {
        fileUpload = await createComponent<SniceFileUploadElement>('snice-file-upload', {
          size
        });
        await wait(50);

        const uploadArea = queryShadow(fileUpload as HTMLElement, '.upload-area');
        expect(uploadArea?.classList.contains(`upload-area--${size}`)).toBe(true);
      });
    });
  });

  describe('variants', () => {
    const variants = ['outlined', 'filled'];

    variants.forEach(variant => {
      it(`should apply ${variant} variant class`, async () => {
        fileUpload = await createComponent<SniceFileUploadElement>('snice-file-upload', {
          variant
        });
        await wait(50);

        const uploadArea = queryShadow(fileUpload as HTMLElement, '.upload-area');
        if (variant === 'filled') {
          expect(uploadArea?.classList.contains('upload-area--filled')).toBe(true);
        } else {
          expect(uploadArea?.classList.contains('upload-area--filled')).toBe(false);
        }
      });
    });
  });

  describe('label', () => {
    it('should render label when provided', async () => {
      fileUpload = await createComponent<SniceFileUploadElement>('snice-file-upload', {
        label: 'Upload Files'
      });
      await wait(50);

      const labelEl = queryShadow(fileUpload as HTMLElement, '.label');
      expect(labelEl).toBeTruthy();
      expect(labelEl?.textContent).toContain('Upload Files');
    });

    it('should show required indicator', async () => {
      fileUpload = await createComponent<SniceFileUploadElement>('snice-file-upload', {
        label: 'Documents',
        required: true
      });
      await wait(50);

      const labelEl = queryShadow(fileUpload as HTMLElement, '.label');
      expect(labelEl?.classList.contains('label--required')).toBe(true);
    });
  });

  describe('helper and error text', () => {
    it('should show helper text', async () => {
      fileUpload = await createComponent<SniceFileUploadElement>('snice-file-upload', {
        'helper-text': 'Maximum 5MB'
      });
      await wait(50);

      const helperEl = queryShadow(fileUpload as HTMLElement, '.helper-text');
      expect(helperEl?.textContent).toContain('Maximum 5MB');
    });

    it('should show error text', async () => {
      fileUpload = await createComponent<SniceFileUploadElement>('snice-file-upload', {
        'error-text': 'File is required'
      });
      await wait(50);

      const errorEl = queryShadow(fileUpload as HTMLElement, '.error-text');
      expect(errorEl?.textContent).toContain('File is required');
    });
  });

  describe('states', () => {
    it('should apply disabled state', async () => {
      fileUpload = await createComponent<SniceFileUploadElement>('snice-file-upload', {
        disabled: true
      });
      await wait(50);

      const uploadArea = queryShadow(fileUpload as HTMLElement, '.upload-area');
      expect(uploadArea?.classList.contains('upload-area--disabled')).toBe(true);

      const inputEl = queryShadow(fileUpload as HTMLElement, '.file-input') as HTMLInputElement;
      expect(inputEl?.disabled).toBe(true);
    });

    it('should apply invalid class', async () => {
      fileUpload = await createComponent<SniceFileUploadElement>('snice-file-upload', {
        invalid: true
      });
      await wait(50);

      const uploadArea = queryShadow(fileUpload as HTMLElement, '.upload-area');
      expect(uploadArea?.classList.contains('upload-area--invalid')).toBe(true);
    });
  });

  describe('file type', () => {
    it('should set accept attribute', async () => {
      fileUpload = await createComponent<SniceFileUploadElement>('snice-file-upload', {
        accept: 'image/*'
      });
      await wait(50);

      const inputEl = queryShadow(fileUpload as HTMLElement, '.file-input') as HTMLInputElement;
      expect(inputEl?.accept).toBe('image/*');
    });

    it('should support multiple file types', async () => {
      fileUpload = await createComponent<SniceFileUploadElement>('snice-file-upload', {
        accept: '.pdf,.doc,.docx'
      });
      await wait(50);

      const inputEl = queryShadow(fileUpload as HTMLElement, '.file-input') as HTMLInputElement;
      expect(inputEl?.accept).toBe('.pdf,.doc,.docx');
    });
  });

  describe('multiple files', () => {
    it('should support multiple files', async () => {
      fileUpload = await createComponent<SniceFileUploadElement>('snice-file-upload', {
        multiple: true
      });
      await wait(50);

      const inputEl = queryShadow(fileUpload as HTMLElement, '.file-input') as HTMLInputElement;
      expect(inputEl?.multiple).toBe(true);
    });

    it('should not support multiple files by default', async () => {
      fileUpload = await createComponent<SniceFileUploadElement>('snice-file-upload');
      await wait(50);

      const inputEl = queryShadow(fileUpload as HTMLElement, '.file-input') as HTMLInputElement;
      expect(inputEl?.multiple).toBe(false);
    });
  });

  describe('drag and drop', () => {
    it('should enable drag-drop by default', async () => {
      fileUpload = await createComponent<SniceFileUploadElement>('snice-file-upload');
      expect(fileUpload.dragDrop).toBe(true);
    });

    it('should allow disabling drag-drop', async () => {
      fileUpload = await createComponent<SniceFileUploadElement>('snice-file-upload', {
        'drag-drop': false
      });
      expect(fileUpload.dragDrop).toBe(false);
    });
  });

  describe('API methods', () => {
    it('should support clear method', async () => {
      fileUpload = await createComponent<SniceFileUploadElement>('snice-file-upload');
      await wait(50);

      expect(() => fileUpload.clear()).not.toThrow();
    });

    it('should support removeFile method', async () => {
      fileUpload = await createComponent<SniceFileUploadElement>('snice-file-upload');
      await wait(50);

      expect(() => fileUpload.removeFile(0)).not.toThrow();
    });
  });

  describe('max size', () => {
    it('should accept max-size property', async () => {
      fileUpload = await createComponent<SniceFileUploadElement>('snice-file-upload', {
        'max-size': 5242880 // 5MB
      });
      expect(fileUpload.maxSize).toBe(5242880);
    });
  });

  describe('max files', () => {
    it('should accept max-files property', async () => {
      fileUpload = await createComponent<SniceFileUploadElement>('snice-file-upload', {
        'max-files': 5
      });
      expect(fileUpload.maxFiles).toBe(5);
    });
  });

  describe('show preview', () => {
    it('should show preview by default', async () => {
      fileUpload = await createComponent<SniceFileUploadElement>('snice-file-upload');
      expect(fileUpload.showPreview).toBe(true);
    });

    it('should allow disabling preview', async () => {
      fileUpload = await createComponent<SniceFileUploadElement>('snice-file-upload', {
        'show-preview': false
      });
      expect(fileUpload.showPreview).toBe(false);
    });
  });
});

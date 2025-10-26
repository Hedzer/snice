import { element, property, query, watch, dispatch, ready, render, styles, html, css } from 'snice';
import cssContent from './snice-file-upload.css?inline';
import type { FileUploadSize, FileUploadVariant, SniceFileUploadElement } from './snice-file-upload.types';

@element('snice-file-upload', { formAssociated: true })
export class SniceFileUpload extends HTMLElement implements SniceFileUploadElement {
  internals!: ElementInternals;

  constructor() {
    super();
    if (typeof this.attachInternals == 'function') {
      this.internals = this.attachInternals();
    }
  }

  @property({  })
  size: FileUploadSize = 'medium';

  @property({  })
  variant: FileUploadVariant = 'outlined';

  @property({  })
  accept = '';

  @property({ type: Boolean,  })
  multiple = false;

  @property({ type: Boolean,  })
  disabled = false;

  @property({ type: Boolean,  })
  required = false;

  @property({ type: Boolean,  })
  invalid = false;

  @property({  })
  label = '';

  @property({ attribute: 'helper-text',  })
  helperText = '';

  @property({ attribute: 'error-text',  })
  errorText = '';

  @property({ type: Number, attribute: 'max-size',  })
  maxSize = -1; // in bytes

  @property({ type: Number, attribute: 'max-files',  })
  maxFiles = -1;

  @property({  })
  name = '';

  @property({ type: Boolean, attribute: 'drag-drop',  })
  dragDrop = true;

  @property({ type: Boolean, attribute: 'show-preview',  })
  showPreview = true;

  @query('.file-input')
  input?: HTMLInputElement;

  @query('.upload-area')
  uploadArea?: HTMLElement;

  private isDragOver = false;
  private selectedFiles: File[] = [];

  get files(): FileList | null {
    return this.input?.files || null;
  }

  @render()
  render() {
    const wrapperClasses = ['file-upload-wrapper'].filter(Boolean).join(' ');
    const uploadAreaClasses = [
      'upload-area',
      `upload-area--${this.size}`,
      this.variant === 'filled' ? 'upload-area--filled' : '',
      this.disabled ? 'upload-area--disabled' : '',
      this.isDragOver ? 'upload-area--drag-over' : '',
      this.invalid ? 'upload-area--invalid' : ''
    ].filter(Boolean).join(' ');
    const labelClasses = ['label', this.required ? 'label--required' : ''].filter(Boolean).join(' ');
    const iconClasses = ['upload-icon', `upload-icon--${this.size}`].filter(Boolean).join(' ');
    const buttonClasses = ['upload-button', `upload-button--${this.size}`].filter(Boolean).join(' ');

    return html/*html*/`
      <div class="${wrapperClasses}">
        <if ${this.label}>
          <label class="${labelClasses}">
            ${this.label}
          </label>
        </if>

        <div
          class="${uploadAreaClasses}"
          part="upload-area"
          @click=${this.handleAreaClick}
          @dragover=${this.handleDragOver}
          @dragleave=${this.handleDragLeave}
          @drop=${this.handleDrop}
        >
          <div class="${iconClasses}">📁</div>
          <div class="upload-text">
            <if ${this.dragDrop}>
              Drag and drop ${this.multiple ? 'files' : 'a file'} here or
            </if>
          </div>
          <button
            class="${buttonClasses}"
            type="button"
            ?disabled="${this.disabled}"
            @click="${this.handleButtonClick}"
          >
            Choose ${this.multiple ? 'Files' : 'File'}
          </button>

          <input
            class="file-input"
            type="file"
            accept="${this.accept}"
            ?multiple="${this.multiple}"
            ?disabled="${this.disabled}"
            ?required="${this.required}"
            name="${this.name || ''}"
            @change=${this.handleFileChange}
            part="input"
          />
        </div>

        <if ${this.selectedFiles.length > 0}>
          <div class="file-list">
            ${this.selectedFiles.map((file, index) => this.renderFileItem(file, index))}
          </div>
        </if>

        <case ${this.errorText ? 'error' : this.helperText ? 'helper' : 'empty'}>
          <when value="error">
            <span class="error-text" part="error-text">${this.errorText}</span>
          </when>
          <when value="helper">
            <span class="helper-text" part="helper-text">${this.helperText}</span>
          </when>
          <default>
            <span class="helper-text" part="helper-text">&nbsp;</span>
          </default>
        </case>
      </div>
    `;
  }

  private renderFileItem(file: File, index: number) {
    const isImage = file.type.startsWith('image/');
    const fileUrl = isImage && this.showPreview ? URL.createObjectURL(file) : '';
    const formattedSize = this.formatFileSize(file.size);

    return html/*html*/`
      <div class="file-item" part="file-item">
        <if ${isImage && this.showPreview}>
          <img class="file-preview" src="${fileUrl}" alt="${file.name}" />
        </if>
        <if ${!isImage || !this.showPreview}>
          <div class="file-icon">📄</div>
        </if>

        <div class="file-info">
          <div class="file-name">${file.name}</div>
          <div class="file-size">${formattedSize}</div>
        </div>

        <button
          class="file-remove"
          type="button"
          @click=${() => this.handleRemoveFile(index)}
          aria-label="Remove ${file.name}"
        >
          ✕
        </button>
      </div>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  @ready()
  init() {
    if (this.internals) {
      this.updateFormValue();
    }
  }

  private handleAreaClick(e: MouseEvent) {
    if (this.disabled) return;
    // Only trigger if clicking the area itself, not the button
    if ((e.target as HTMLElement).classList.contains('upload-area')) {
      this.input?.click();
    }
  }

  private handleButtonClick(e: Event) {
    e.stopPropagation();
    if (!this.disabled) {
      this.input?.click();
    }
  }

  private handleDragOver(e: DragEvent) {
    if (!this.dragDrop || this.disabled) return;
    e.preventDefault();
    e.stopPropagation();
    this.isDragOver = true;
  }

  private handleDragLeave(e: DragEvent) {
    if (!this.dragDrop || this.disabled) return;
    e.preventDefault();
    e.stopPropagation();
    this.isDragOver = false;
  }

  private handleDrop(e: DragEvent) {
    if (!this.dragDrop || this.disabled) return;
    e.preventDefault();
    e.stopPropagation();
    this.isDragOver = false;

    const files = Array.from(e.dataTransfer?.files || []);
    this.processFiles(files);
  }

  private handleFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    this.processFiles(files);
  }

  private processFiles(files: File[]) {
    let validFiles = files;

    // Apply max files limit
    if (this.maxFiles > 0) {
      const available = this.maxFiles - this.selectedFiles.length;
      validFiles = validFiles.slice(0, available);
    }

    // Validate file size
    if (this.maxSize > 0) {
      validFiles = validFiles.filter(file => {
        if (file.size > this.maxSize) {
          this.dispatchErrorEvent(`File "${file.name}" exceeds maximum size`);
          return false;
        }
        return true;
      });
    }

    if (this.multiple) {
      this.selectedFiles = [...this.selectedFiles, ...validFiles];
    } else {
      this.selectedFiles = validFiles.slice(0, 1);
    }

    this.updateFormValue();
    this.dispatchChangeEvent();
  }

  private handleRemoveFile(index: number) {
    this.removeFile(index);
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  private updateFormValue() {
    if (!this.internals) return;

    const dataTransfer = new DataTransfer();
    this.selectedFiles.forEach(file => {
      dataTransfer.items.add(file);
    });

    this.internals.setFormValue(dataTransfer.files.length > 0 ? dataTransfer.files as any : null);
  }

  @watch('disabled')
  handleDisabledChange() {
    if (this.input) {
      this.input.disabled = this.disabled;
    }
  }

  @dispatch('@snice/file-upload-change', { bubbles: true, composed: true })
  private dispatchChangeEvent() {
    return { files: this.selectedFiles, fileUpload: this };
  }

  @dispatch('@snice/file-upload-error', { bubbles: true, composed: true })
  private dispatchErrorEvent(message: string) {
    return { message, fileUpload: this };
  }

  // Public API
  clear() {
    this.selectedFiles = [];
    if (this.input) {
      this.input.value = '';
    }
    this.updateFormValue();
  }

  removeFile(index: number) {
    if (index >= 0 && index < this.selectedFiles.length) {
      this.selectedFiles.splice(index, 1);
      this.updateFormValue();
      this.dispatchChangeEvent();
    }
  }
}

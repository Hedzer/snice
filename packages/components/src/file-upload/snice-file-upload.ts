import { element, property, state, query, watch, dispatch, ready, reconnect, dispose, render, styles, html, css } from 'snice';
import cssContent from './snice-file-upload.css?inline';
import type { FileUploadSize, FileUploadVariant, SniceFileUploadElement } from './snice-file-upload.types';
import { FormLabelAssociation } from '../form-label-association';
import { applyElementInternalsValidity, findFormOwner, hasValidityError } from '../form-control-validity';

@element('snice-file-upload', { formAssociated: true, delegatesFocus: true })
export class SniceFileUpload extends HTMLElement implements SniceFileUploadElement {
  internals!: ElementInternals;
  private customValidationMessage = '';
  private selectionValidationMessage = '';
  private readonly descriptionId = `snice-file-upload-desc-${Math.random().toString(36).slice(2, 10)}`;
  private readonly labelAssociation: FormLabelAssociation;

  @state()
  private formDisabled = false;

  @state()
  private constraintInvalid = false;

  constructor() {
    super();
    if (typeof this.attachInternals == 'function') {
      this.internals = this.attachInternals();
    }
    this.labelAssociation = new FormLabelAssociation(
      this,
      () => this.internals,
      () => this.interactionDisabled ? undefined : this.input,
      () => this.label || 'File upload'
    );
  }

  formAssociatedCallback() {
    this.syncFormState();
  }

  formResetCallback() {
    this.selectionValidationMessage = '';
    this.replaceFiles([], false);
  }

  formDisabledCallback(disabled: boolean) {
    this.formDisabled = disabled;
    this.syncValidity();
  }

  formStateRestoreCallback(state: File | string | FormData | null) {
    this.selectionValidationMessage = '';
    if (state instanceof File) {
      this.replaceFiles([state], false);
      return;
    }
    if (state instanceof FormData) {
      const files = Array.from(state.values()).filter((value): value is File => value instanceof File);
      this.replaceFiles(files, false);
      return;
    }
    this.replaceFiles([], false);
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

  @property({ type: Boolean, attribute: false })
  private isDragOver = false;
  @property({ type: Array, attribute: false })
  private selectedFiles: File[] = [];

  private get interactionDisabled(): boolean {
    return this.disabled || this.formDisabled;
  }

  /**
   * The current live file selection. Files cannot be authored as a reset default.
   * @public
   */
  get files(): FileList | null {
    return this.input?.files || null;
  }

  @render()
  render() {
    const displayedInvalid = this.invalid || this.constraintInvalid;
    const wrapperClasses = ['file-upload-wrapper'].filter(Boolean).join(' ');
    const uploadAreaClasses = [
      'upload-area',
      `upload-area--${this.size}`,
      this.variant === 'filled' ? 'upload-area--filled' : '',
      this.interactionDisabled ? 'upload-area--disabled' : '',
      this.isDragOver ? 'upload-area--drag-over' : '',
      displayedInvalid ? 'upload-area--invalid' : ''
    ].filter(Boolean).join(' ');
    const labelClasses = ['label', this.required ? 'label--required' : ''].filter(Boolean).join(' ');
    const iconClasses = ['upload-icon', `upload-icon--${this.size}`].filter(Boolean).join(' ');
    const buttonClasses = ['upload-button', `upload-button--${this.size}`].filter(Boolean).join(' ');

    return html/*html*/`
      <div class="${wrapperClasses}">
        <if ${this.label}>
          <label class="${labelClasses}" @click=${() => this.focus()}>
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
          <div class="${iconClasses}">📎</div>
          <div class="upload-text">
            <if ${this.dragDrop}>
              Drag and drop ${this.multiple ? 'files' : 'a file'} here or
            </if>
          </div>
          <button
            class="${buttonClasses}"
            type="button"
            ?disabled="${this.interactionDisabled}"
            @click="${this.handleButtonClick}"
          >
            Choose ${this.multiple ? 'Files' : 'File'}
          </button>

          <input
            class="file-input"
            type="file"
            accept="${this.accept}"
            ?multiple="${this.multiple}"
            ?disabled="${this.interactionDisabled}"
            ?required="${this.required}"
            name="${this.name || ''}"
            aria-label="${this.labelAssociation.accessibleName}"
            aria-describedby="${(this.errorText || this.helperText) ? this.descriptionId : ''}"
            aria-invalid="${displayedInvalid ? 'true' : 'false'}"
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
            <span id="${this.descriptionId}" class="error-text" part="error-text" role="alert">${this.errorText}</span>
          </when>
          <when value="helper">
            <span id="${this.descriptionId}" class="helper-text" part="helper-text">${this.helperText}</span>
          </when>
          <default>
            <span class="helper-text" part="helper-text">&nbsp;</span>
          </default>
        </case>
      </div>
    `;
  }

  // Cache of blob URLs per File so re-renders reuse the same URL and we can
  // revoke on removal/disconnect. Without this, every re-render creates a
  // fresh URL and never revokes the old ones.
  private previewUrls = new WeakMap<File, string>();

  private getPreviewUrl(file: File): string {
    let url = this.previewUrls.get(file);
    if (!url) {
      url = URL.createObjectURL(file);
      this.previewUrls.set(file, url);
    }
    return url;
  }

  private revokePreviewUrl(file: File) {
    const url = this.previewUrls.get(file);
    if (url) {
      URL.revokeObjectURL(url);
      this.previewUrls.delete(file);
    }
  }

  private renderFileItem(file: File, index: number) {
    const isImage = file.type.startsWith('image/');
    const fileUrl = isImage && this.showPreview ? this.getPreviewUrl(file) : '';
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
          .disabled=${this.interactionDisabled}
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
    this.syncFormState();
    this.labelAssociation.connect();
  }

  @reconnect()
  private onReconnect() {
    this.labelAssociation.connect();
  }

  private handleAreaClick(e: MouseEvent) {
    if (this.interactionDisabled) return;
    // Only trigger if clicking the area itself, not the button
    if ((e.target as HTMLElement).classList.contains('upload-area')) {
      this.input?.click();
    }
  }

  private handleButtonClick(e: Event) {
    e.stopPropagation();
    if (!this.interactionDisabled) {
      this.input?.click();
    }
  }

  private handleDragOver(e: DragEvent) {
    if (!this.dragDrop || this.interactionDisabled) return;
    e.preventDefault();
    e.stopPropagation();
    this.isDragOver = true;
  }

  private handleDragLeave(e: DragEvent) {
    if (!this.dragDrop || this.interactionDisabled) return;
    e.preventDefault();
    e.stopPropagation();
    this.isDragOver = false;
  }

  private handleDrop(e: DragEvent) {
    if (!this.dragDrop || this.interactionDisabled) return;
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
    // A single-file chooser replaces its prior selection. Only a multiple
    // chooser accumulates files when applying maxFiles.
    const existingCount = this.multiple ? this.selectedFiles.length : 0;
    const exceedsCount = this.maxFiles > 0 && existingCount + files.length > this.maxFiles;
    const oversizedFiles = this.maxSize > 0 ? files.filter(file => file.size > this.maxSize) : [];

    this.selectionValidationMessage = oversizedFiles.length > 0
      ? oversizedFiles.length === 1
        ? `File "${oversizedFiles[0].name}" exceeds the maximum size.`
        : `${oversizedFiles.length} files exceed the maximum size.`
      : exceedsCount
        ? `Select no more than ${this.maxFiles} files.`
        : '';

    // Apply max files limit
    if (this.maxFiles > 0) {
      const available = Math.max(0, this.maxFiles - existingCount);
      validFiles = validFiles.slice(0, available);
      if (exceedsCount) this.dispatchErrorEvent(`Select no more than ${this.maxFiles} files`);
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

    const nextFiles = this.multiple
      ? [...this.selectedFiles, ...validFiles]
      : validFiles.slice(0, 1);
    this.replaceFiles(nextFiles, true);
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

    if (this.selectedFiles.length === 0) {
      this.internals.setFormValue(null, '');
      return;
    }

    if (!this.name) {
      const state = new FormData();
      for (const file of this.selectedFiles) state.append('file', file);
      this.internals.setFormValue(null, state);
      return;
    }

    if (!this.multiple && this.selectedFiles.length === 1) {
      const [file] = this.selectedFiles;
      this.internals.setFormValue(file, file);
      return;
    }

    const formData = new FormData();
    for (const file of this.selectedFiles) formData.append(this.name, file);
    this.internals.setFormValue(formData, formData);
  }

  private syncFormState() {
    this.updateFormValue();
    this.syncValidity();
  }

  private syncValidity() {
    if (this.input) {
      this.input.required = this.required;
      this.input.disabled = this.interactionDisabled;
    }

    const barred = this.interactionDisabled;
    const valueMissing = !barred && this.required && this.selectedFiles.length === 0;
    const oversized = !barred && this.maxSize > 0 &&
      this.selectedFiles.some(file => file.size > this.maxSize);
    const tooMany = !barred && this.maxFiles > 0 && this.selectedFiles.length > this.maxFiles;
    const generatedError = oversized || tooMany;
    const flags: ValidityStateFlags = barred ? {} : {
      customError: Boolean(this.customValidationMessage) || Boolean(this.selectionValidationMessage) || generatedError,
      valueMissing
    };
    const hasError = hasValidityError(flags);
    const message = this.customValidationMessage ||
      this.selectionValidationMessage ||
      (valueMissing ? 'Please select a file.' : '') ||
      (oversized ? 'One or more files exceed the maximum size.' : '') ||
      (tooMany ? 'Too many files are selected.' : '');
    this.constraintInvalid = hasError;
    const displayedInvalid = this.invalid || hasError;

    this.input?.setCustomValidity(hasError ? message : '');
    this.input?.setAttribute('aria-invalid', String(displayedInvalid));
    this.uploadArea?.classList.toggle('upload-area--invalid', displayedInvalid);
    applyElementInternalsValidity(this.internals, flags, message, this.input);
  }

  private replaceFiles(files: File[], emit: boolean) {
    const nextFiles = this.multiple ? [...files] : files.slice(0, 1);
    for (const file of this.selectedFiles) {
      if (!nextFiles.includes(file)) this.revokePreviewUrl(file);
    }
    this.selectedFiles = nextFiles;

    if (this.input) {
      const transfer = new DataTransfer();
      for (const file of nextFiles) transfer.items.add(file);
      this.input.files = transfer.files;
      if (nextFiles.length === 0) this.input.value = '';
    }

    this.syncFormState();
    if (emit) this.dispatchChangeEvent();
  }

  @watch('disabled', 'formDisabled')
  handleDisabledChange() {
    if (this.input) {
      this.input.disabled = this.interactionDisabled;
    }
    this.syncValidity();
  }

  @watch('name', 'multiple')
  handleFormConfigurationChange() {
    this.syncFormState();
  }

  @watch('required', 'maxSize', 'maxFiles')
  handleValidationConfigurationChange() {
    this.selectionValidationMessage = '';
    this.syncValidity();
  }

  @watch('invalid')
  handleInvalidChange() {
    const displayedInvalid = this.invalid || this.constraintInvalid;
    this.input?.setAttribute('aria-invalid', String(displayedInvalid));
    this.uploadArea?.classList.toggle('upload-area--invalid', displayedInvalid);
  }

  @dispatch('file-upload-change', { bubbles: true, composed: true })
  private dispatchChangeEvent() {
    return { files: this.selectedFiles, fileUpload: this };
  }

  @dispatch('file-upload-error', { bubbles: true, composed: true })
  private dispatchErrorEvent(message: string) {
    return { message, fileUpload: this };
  }

  // Public API
  clear() {
    this.selectionValidationMessage = '';
    this.replaceFiles([], false);
  }

  removeFile(index: number) {
    if (index >= 0 && index < this.selectedFiles.length) {
      this.selectionValidationMessage = '';
      this.replaceFiles(this.selectedFiles.filter((_, current) => current !== index), true);
    }
  }

  focus() {
    if (!this.interactionDisabled) this.input?.focus();
  }

  blur() {
    this.input?.blur();
  }

  /** Native-compatible control type. @public */
  get type(): 'file' {
    return 'file';
  }

  /** Owning form, including association through a `form` attribute. @public */
  get form(): HTMLFormElement | null {
    return findFormOwner(this, this.internals);
  }

  /** Current constraint-validation state. @public */
  get validity(): ValidityState {
    return this.internals?.validity ?? this.input!.validity;
  }

  /** Current validation message. @public */
  get validationMessage(): string {
    return this.internals?.validationMessage ?? this.input?.validationMessage ?? '';
  }

  /** Whether this upload currently participates in constraint validation. @public */
  get willValidate(): boolean {
    if (this.interactionDisabled) return false;
    return this.internals?.willValidate ?? this.input?.willValidate ?? false;
  }

  /** Labels associated with the host. @public */
  get labels(): NodeList | null {
    return this.labelAssociation.labels;
  }

  checkValidity(): boolean {
    this.syncValidity();
    return this.internals?.checkValidity() ?? this.input?.checkValidity() ?? true;
  }

  reportValidity(): boolean {
    this.syncValidity();
    return this.internals?.reportValidity() ?? this.input?.reportValidity() ?? true;
  }

  setCustomValidity(message: string): void {
    this.customValidationMessage = String(message);
    this.syncValidity();
  }

  @dispose()
  private cleanupPreviews() {
    for (const file of this.selectedFiles) this.revokePreviewUrl(file);
    this.labelAssociation.disconnect();
  }
}

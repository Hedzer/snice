import { element, property, query, dispatch, ready, dispose, render, styles, html, css, request } from 'snice';
import cssContent from './snice-file-gallery.css?inline';
import type {
  FileGalleryView,
  GalleryFile,
  CustomAction,
  UploadRequest,
  UploadResponse,
  SniceFileGalleryElement
} from './snice-file-gallery.types';

@element('snice-file-gallery')
export class SniceFileGallery extends HTMLElement implements SniceFileGalleryElement {
  @property()
  accept = '';

  @property({ type: Boolean })
  multiple = true;

  @property({ type: Boolean })
  disabled = false;

  @property({ type: Number, attribute: 'max-size' })
  maxSize = -1; // in bytes, -1 for unlimited

  @property({ type: Number, attribute: 'max-files' })
  maxFiles = -1; // -1 for unlimited

  @property()
  view: FileGalleryView = 'grid';

  @property({ type: Boolean, attribute: 'show-progress' })
  showProgress = true;

  @property({ type: Boolean, attribute: 'allow-pause' })
  allowPause = true;

  @property({ type: Boolean, attribute: 'allow-delete' })
  allowDelete = true;

  @property({ type: Boolean, attribute: 'auto-upload' })
  autoUpload = true;

  @property({ type: Boolean, attribute: 'show-add-button' })
  showAddButton = false;

  @property({ type: Boolean, attribute: 'hide-add-button' })
  hideAddButton = false;

  @query('.file-input')
  input?: HTMLInputElement;

  @query('.drop-zone')
  dropZone?: HTMLElement;

  private galleryFiles: GalleryFile[] = [];
  private galleryCustomActions: CustomAction[] = [];
  private isDragOver = false;
  private uploadAbortControllers = new Map<string, AbortController>();

  // DOM references
  private container?: HTMLElement;
  private galleryContainer?: HTMLElement;
  private galleryHeader?: HTMLElement;

  @request('file-gallery-upload')
  async *uploadFile(request: UploadRequest): any {
    const response: UploadResponse = await (yield request);
    return response;
  }

  get files(): GalleryFile[] {
    return [...this.galleryFiles];
  }

  get customActions(): CustomAction[] {
    return [...this.galleryCustomActions];
  }

  getFile(fileId: string): GalleryFile | undefined {
    return this.galleryFiles.find(f => f.id === fileId);
  }

  getCustomAction(actionId: string): CustomAction | undefined {
    return this.galleryCustomActions.find(a => a.id === actionId);
  }

  isPending(fileId: string): boolean {
    const file = this.getFile(fileId);
    return file?.uploadStatus === 'pending';
  }

  isUploading(fileId: string): boolean {
    const file = this.getFile(fileId);
    return file?.uploadStatus === 'uploading';
  }

  isPaused(fileId: string): boolean {
    const file = this.getFile(fileId);
    return file?.uploadStatus === 'paused';
  }

  isCompleted(fileId: string): boolean {
    const file = this.getFile(fileId);
    return file?.uploadStatus === 'completed';
  }

  hasError(fileId: string): boolean {
    const file = this.getFile(fileId);
    return file?.uploadStatus === 'error';
  }

  canAddFiles(): boolean {
    return this.maxFiles < 0 || this.galleryFiles.length < this.maxFiles;
  }

  @ready()
  setupComponent() {
    // Use microtask to ensure render has completed
    queueMicrotask(() => {
      this.galleryContainer = this.shadowRoot?.querySelector('.gallery') as HTMLElement;
      this.galleryHeader = this.shadowRoot?.querySelector('.gallery-header') as HTMLElement;
      this.dropZone = this.shadowRoot?.querySelector('.drop-zone') as HTMLElement;

      // Always render initial gallery to show add button or files
      this.updateGalleryDOM();
    });
  }

  private updateGalleryDOM() {
    if (!this.galleryContainer) return;

    this.galleryContainer.innerHTML = '';

    // Add file items
    for (const file of this.galleryFiles) {
      const elem = this.createFileItem(file);
      this.galleryContainer.appendChild(elem);
    }

    // Add "add files" button if in that mode (unless explicitly hidden)
    if (this.showAddButton && !this.hideAddButton) {
      const addBtn = this.createAddButton();
      this.galleryContainer.appendChild(addBtn);
    }

    // Add custom action buttons
    for (const action of this.galleryCustomActions) {
      const elem = this.createCustomAction(action);
      this.galleryContainer.appendChild(elem);
    }

    // Update header
    this.updateHeaderDOM();
  }

  private updateHeaderDOM() {
    if (!this.galleryHeader) return;

    if (this.galleryFiles.length === 0) {
      this.galleryHeader.innerHTML = '';
      return;
    }

    this.galleryHeader.innerHTML = `
      <div class="gallery-title">${this.galleryFiles.length} file${this.galleryFiles.length !== 1 ? 's' : ''}</div>
      <div class="gallery-actions">
        <button class="gallery-action-button" data-action="toggle-view" title="Toggle view">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            ${this.view === 'grid' ? `
              <rect x="3" y="3" width="7" height="7" stroke-width="2"/>
              <rect x="14" y="3" width="7" height="7" stroke-width="2"/>
              <rect x="3" y="14" width="7" height="7" stroke-width="2"/>
              <rect x="14" y="14" width="7" height="7" stroke-width="2"/>
            ` : `
              <line x1="8" y1="6" x2="21" y2="6" stroke-width="2" stroke-linecap="round"/>
              <line x1="8" y1="12" x2="21" y2="12" stroke-width="2" stroke-linecap="round"/>
              <line x1="8" y1="18" x2="21" y2="18" stroke-width="2" stroke-linecap="round"/>
              <line x1="3" y1="6" x2="3.01" y2="6" stroke-width="2" stroke-linecap="round"/>
              <line x1="3" y1="12" x2="3.01" y2="12" stroke-width="2" stroke-linecap="round"/>
              <line x1="3" y1="18" x2="3.01" y2="18" stroke-width="2" stroke-linecap="round"/>
            `}
          </svg>
        </button>
        ${this.allowDelete ? `
          <button class="gallery-action-button" data-action="clear-all" title="Clear all">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="3 6 5 6 21 6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        ` : ''}
      </div>
    `;

    // Attach event listeners
    const toggleBtn = this.galleryHeader.querySelector('[data-action="toggle-view"]');
    toggleBtn?.addEventListener('click', () => this.handleViewToggle());

    const clearBtn = this.galleryHeader.querySelector('[data-action="clear-all"]');
    clearBtn?.addEventListener('click', () => this.handleClearAll());
  }

  private updateFileItemDOM(fileId: string) {
    if (!this.galleryContainer) return;

    const file = this.galleryFiles.find(f => f.id === fileId);
    if (!file) return;

    const existingElem = this.galleryContainer.querySelector(`[data-file-id="${fileId}"]`);
    if (!existingElem) return;

    const newElem = this.createFileItem(file);
    existingElem.replaceWith(newElem);
  }

  private createFileItem(file: GalleryFile): HTMLElement {
    const item = document.createElement('div');
    item.className = `gallery-item gallery-item--${file.uploadStatus}`;
    item.setAttribute('data-file-id', file.id);

    const isImage = file.file.type.startsWith('image/');
    const canPause = this.allowPause && file.uploadStatus === 'uploading';
    const canResume = this.allowPause && file.uploadStatus === 'paused';
    const canRetry = file.uploadStatus === 'error';

    item.innerHTML = `
      <div class="gallery-item-preview">
        ${isImage && file.preview ? `
          <img src="${file.preview}" alt="${file.file.name}" class="gallery-item-image" />
        ` : `
          <div class="gallery-item-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <polyline points="13 2 13 9 20 9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        `}
        ${file.badge ? `
          <div class="gallery-item-badge gallery-item-badge--${file.badgePosition || 'top-right'}">
            ${file.badge}
          </div>
        ` : ''}
        ${this.showProgress && file.uploadStatus === 'uploading' ? `
          <div class="gallery-item-progress">
            <div class="gallery-item-progress-bar" style="width: ${file.uploadProgress}%"></div>
          </div>
        ` : ''}
        ${file.uploadStatus === 'completed' ? `
          <div class="gallery-item-status gallery-item-status--success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="20 6 9 17 4 12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        ` : ''}
        ${file.uploadStatus === 'error' ? `
          <div class="gallery-item-status gallery-item-status--error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="12" y1="8" x2="12" y2="12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="12" y1="16" x2="12.01" y2="16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        ` : ''}
      </div>
      <div class="gallery-item-info">
        <div class="gallery-item-name" title="${file.file.name}">
          ${file.file.name}
        </div>
        <div class="gallery-item-meta">
          <span class="gallery-item-size">${this.formatFileSize(file.file.size)}</span>
          ${file.uploadStatus === 'uploading' && this.showProgress ? `
            <span class="gallery-item-progress-text">${file.uploadProgress}%</span>
          ` : ''}
          ${file.uploadStatus === 'error' && file.error ? `
            <span class="gallery-item-error" title="${file.error}">Upload failed</span>
          ` : ''}
        </div>
      </div>
      <div class="gallery-item-actions">
        ${canPause ? `
          <button class="gallery-item-action" data-action="pause" title="Pause upload">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="6" y="4" width="4" height="16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <rect x="14" y="4" width="4" height="16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        ` : ''}
        ${canResume ? `
          <button class="gallery-item-action" data-action="resume" title="Resume upload">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        ` : ''}
        ${canRetry ? `
          <button class="gallery-item-action" data-action="retry" title="Retry upload">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="23 4 23 10 17 10" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        ` : ''}
        ${this.allowDelete ? `
          <button class="gallery-item-action gallery-item-action--delete" data-action="delete" title="Remove file">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="6" y1="6" x2="18" y2="18" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        ` : ''}
      </div>
    `;

    // Attach event listeners
    const pauseBtn = item.querySelector('[data-action="pause"]');
    pauseBtn?.addEventListener('click', () => this.pauseUpload(file.id));

    const resumeBtn = item.querySelector('[data-action="resume"]');
    resumeBtn?.addEventListener('click', () => this.resumeUpload(file.id));

    const retryBtn = item.querySelector('[data-action="retry"]');
    retryBtn?.addEventListener('click', () => this.retryUpload(file.id));

    const deleteBtn = item.querySelector('[data-action="delete"]');
    deleteBtn?.addEventListener('click', () => this.removeFile(file.id));

    return item;
  }

  private createAddButton(): HTMLElement {
    const canAdd = this.maxFiles < 0 || this.galleryFiles.length < this.maxFiles;
    const item = document.createElement('div');
    item.className = `gallery-item gallery-item--add-button ${canAdd ? '' : 'gallery-item--disabled'}`;
    item.title = canAdd ? 'Add files' : 'Maximum files reached';

    item.innerHTML = `
      <div class="gallery-item-preview">
        <div class="gallery-item-placeholder gallery-item-add-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="12" y1="5" x2="12" y2="19" stroke-width="2" stroke-linecap="round"/>
            <line x1="5" y1="12" x2="19" y2="12" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
      </div>
      <div class="gallery-item-info">
        <div class="gallery-item-name">Add files</div>
      </div>
    `;

    if (canAdd) {
      item.addEventListener('click', () => this.handleDropZoneClick());
    }

    return item;
  }

  private createCustomAction(action: CustomAction): HTMLElement {
    const item = document.createElement('div');
    item.className = 'gallery-item gallery-item--add-button';
    item.title = action.text;

    const iconContent = action.icon
      .replace(/<svg[^>]*>/, '')
      .replace(/<\/svg>$/, '')
      .trim();

    item.innerHTML = `
      <div class="gallery-item-preview">
        <div class="gallery-item-placeholder gallery-item-add-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            ${iconContent}
          </svg>
        </div>
      </div>
      <div class="gallery-item-info">
        <div class="gallery-item-name">${action.text}</div>
      </div>
    `;

    item.addEventListener('click', () => this.handleCustomActionClick(action.id));

    return item;
  }

  @render()
  renderContent() {
    const dropZoneClasses = [
      'drop-zone',
      this.disabled ? 'drop-zone--disabled' : '',
      this.isDragOver ? 'drop-zone--drag-over' : '',
      this.galleryFiles.length > 0 ? 'drop-zone--has-files' : ''
    ].filter(Boolean).join(' ');

    return html`
      <div class="file-gallery">
        <input
          type="file"
          class="file-input"
          accept="${this.accept}"
          ?multiple=${this.multiple}
          ?disabled=${this.disabled}
          @change=${this.handleFileSelect}
        />

        <if ${!this.showAddButton}>
          <div
            class="${dropZoneClasses}"
            @click=${() => this.handleDropZoneClick()}
            @dragenter=${this.handleDragEnter}
            @dragleave=${this.handleDragLeave}
            @dragover=${this.handleDragOver}
            @drop=${this.handleDrop}
          >
            <div class="drop-zone-content">
              <svg class="drop-zone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <div class="drop-zone-text">
                <span class="drop-zone-primary">Click to upload</span>
                <span class="drop-zone-secondary">or drag and drop</span>
              </div>
              <if ${this.accept}>
                <div class="drop-zone-hint">Accepted: ${this.formatAcceptTypes()}</div>
              </if>
              <if ${this.maxSize > 0}>
                <div class="drop-zone-hint">Max size: ${this.formatFileSize(this.maxSize)}</div>
              </if>
            </div>
          </div>
        </if>

        <div class="gallery-header">
        </div>

        <div class="gallery gallery--${this.view}">
        </div>
      </div>
    `;
  }


  @styles()
  componentStyles() {
    return css`${cssContent}`;
  }

  private handleDropZoneClick() {
    if (this.disabled) return;

    // Query input if not already available
    if (!this.input) {
      this.input = this.shadowRoot?.querySelector('.file-input') as HTMLInputElement;
    }

    this.input?.click();
  }

  private handleFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.addFiles(input.files);
      input.value = ''; // Reset input
    }
  }

  private handleDragEnter(e: DragEvent) {
    e.preventDefault();
    if (!this.disabled && this.dropZone) {
      this.isDragOver = true;
      this.dropZone.classList.add('drop-zone--drag-over');
    }
  }

  private handleDragLeave(e: DragEvent) {
    e.preventDefault();
    const rect = this.dropZone?.getBoundingClientRect();
    if (rect && (
      e.clientX <= rect.left ||
      e.clientX >= rect.right ||
      e.clientY <= rect.top ||
      e.clientY >= rect.bottom
    )) {
      this.isDragOver = false;
      if (this.dropZone) {
        this.dropZone.classList.remove('drop-zone--drag-over');
      }
    }
  }

  private handleDragOver(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = this.disabled ? 'none' : 'copy';
    }
  }

  private handleDrop(e: DragEvent) {
    e.preventDefault();
    this.isDragOver = false;
    if (this.dropZone) {
      this.dropZone.classList.remove('drop-zone--drag-over');
    }

    if (!this.disabled && e.dataTransfer?.files) {
      this.addFiles(e.dataTransfer.files);
    }
  }

  private handleViewToggle() {
    this.view = this.view === 'grid' ? 'list' : 'grid';
    if (this.galleryContainer) {
      this.galleryContainer.className = `gallery gallery--${this.view}`;
    }
    this.updateHeaderDOM();
  }

  private handleClearAll() {
    if (confirm('Remove all files?')) {
      this.clear();
    }
  }

  addFiles(files: FileList | File[]): void {
    const fileArray = Array.from(files);

    // Check max files limit
    if (this.maxFiles > 0 && this.galleryFiles.length + fileArray.length > this.maxFiles) {
      this.emitError(`Maximum ${this.maxFiles} file${this.maxFiles !== 1 ? 's' : ''} allowed`);
      return;
    }

    // Validate and add files
    for (const file of fileArray) {
      // Check file size
      if (this.maxSize > 0 && file.size > this.maxSize) {
        this.emitError(`File "${file.name}" exceeds maximum size of ${this.formatFileSize(this.maxSize)}`);
        continue;
      }

      // Check file type
      if (this.accept && !this.isAcceptedType(file)) {
        this.emitError(`File type "${file.type}" not accepted`);
        continue;
      }

      const galleryFile: GalleryFile = {
        id: this.generateFileId(),
        file,
        uploadProgress: 0,
        uploadStatus: 'pending'
      };

      // Generate preview for images
      if (file.type.startsWith('image/')) {
        this.generatePreview(galleryFile);
      }

      this.galleryFiles.push(galleryFile);

      if (this.autoUpload) {
        this.startUpload(galleryFile);
      }
    }

    this.updateGalleryDOM();
    this.emitFilesChange();
  }

  addFileWithPreview(file: File, previewDataUrl: string): void {
    // Check max files limit
    if (this.maxFiles > 0 && this.galleryFiles.length >= this.maxFiles) {
      this.emitError(`Maximum ${this.maxFiles} file${this.maxFiles !== 1 ? 's' : ''} allowed`);
      return;
    }

    // Check file size
    if (this.maxSize > 0 && file.size > this.maxSize) {
      this.emitError(`File "${file.name}" exceeds maximum size of ${this.formatFileSize(this.maxSize)}`);
      return;
    }

    // Check file type
    if (this.accept && !this.isAcceptedType(file)) {
      this.emitError(`File type "${file.type}" not accepted`);
      return;
    }

    const galleryFile: GalleryFile = {
      id: this.generateFileId(),
      file,
      preview: previewDataUrl,
      uploadProgress: 0,
      uploadStatus: 'pending'
    };

    this.galleryFiles.push(galleryFile);

    if (this.autoUpload) {
      this.startUpload(galleryFile);
    }

    this.updateGalleryDOM();
    this.emitFilesChange();
  }

  removeFile(fileId: string): void {
    const index = this.galleryFiles.findIndex(f => f.id === fileId);
    if (index === -1) return;

    const file = this.galleryFiles[index];

    // Cancel upload if in progress
    if (file.uploadStatus === 'uploading' || file.uploadStatus === 'paused') {
      this.uploadAbortControllers.get(fileId)?.abort();
      this.uploadAbortControllers.delete(fileId);
    }

    // Revoke preview URL
    if (file.preview) {
      URL.revokeObjectURL(file.preview);
    }

    this.galleryFiles.splice(index, 1);
    this.updateGalleryDOM();
    this.emitFilesChange();
    this.emitFileRemove(file);
  }

  pauseUpload(fileId: string): void {
    const file = this.galleryFiles.find(f => f.id === fileId);
    if (!file || file.uploadStatus !== 'uploading') return;

    this.uploadAbortControllers.get(fileId)?.abort();
    this.uploadAbortControllers.delete(fileId);

    file.uploadStatus = 'paused';
    this.updateFileItemDOM(fileId);
    this.emitUploadPause(file);
  }

  resumeUpload(fileId: string): void {
    const file = this.galleryFiles.find(f => f.id === fileId);
    if (!file || file.uploadStatus !== 'paused') return;

    this.startUpload(file);
  }

  retryUpload(fileId: string): void {
    const file = this.galleryFiles.find(f => f.id === fileId);
    if (!file || file.uploadStatus !== 'error') return;

    file.uploadProgress = 0;
    file.error = undefined;
    this.startUpload(file);
  }

  clear(): void {
    // Cancel all uploads
    for (const controller of this.uploadAbortControllers.values()) {
      controller.abort();
    }
    this.uploadAbortControllers.clear();

    // Revoke all preview URLs
    for (const file of this.galleryFiles) {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    }

    this.galleryFiles = [];
    this.updateGalleryDOM();
    this.emitFilesChange();
  }

  addCustomAction(icon: string, text: string): string {
    const id = `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.galleryCustomActions.push({ id, icon, text });
    this.updateGalleryDOM();
    return id;
  }

  removeCustomAction(actionId: string): void {
    const index = this.galleryCustomActions.findIndex(a => a.id === actionId);
    if (index !== -1) {
      this.galleryCustomActions.splice(index, 1);
      this.updateGalleryDOM();
    }
  }

  clearCustomActions(): void {
    this.galleryCustomActions = [];
    this.updateGalleryDOM();
  }

  clearCompleted(): void {
    const completed = this.galleryFiles.filter(f => f.uploadStatus === 'completed');
    for (const file of completed) {
      this.removeFile(file.id);
    }
  }

  clearErrors(): void {
    const errors = this.galleryFiles.filter(f => f.uploadStatus === 'error');
    for (const file of errors) {
      this.removeFile(file.id);
    }
  }

  pauseAll(): void {
    for (const file of this.galleryFiles) {
      if (file.uploadStatus === 'uploading') {
        this.pauseUpload(file.id);
      }
    }
  }

  resumeAll(): void {
    for (const file of this.galleryFiles) {
      if (file.uploadStatus === 'paused') {
        this.resumeUpload(file.id);
      }
    }
  }

  retryAll(): void {
    for (const file of this.galleryFiles) {
      if (file.uploadStatus === 'error') {
        this.retryUpload(file.id);
      }
    }
  }

  cancelUpload(fileId: string): void {
    const controller = this.uploadAbortControllers.get(fileId);
    if (controller) {
      controller.abort();
      this.uploadAbortControllers.delete(fileId);
    }
    this.removeFile(fileId);
  }

  cancelAll(): void {
    const uploading = this.galleryFiles.filter(f =>
      f.uploadStatus === 'uploading' || f.uploadStatus === 'paused' || f.uploadStatus === 'pending'
    );
    for (const file of uploading) {
      this.cancelUpload(file.id);
    }
  }

  openFilePicker(): void {
    this.handleDropZoneClick();
  }

  setFileBadge(fileId: string, badge: string, position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' = 'top-right'): void {
    const file = this.galleryFiles.find(f => f.id === fileId);
    if (file) {
      file.badge = badge;
      file.badgePosition = position;
      this.updateFileItemDOM(fileId);
    }
  }

  removeFileBadge(fileId: string): void {
    const file = this.galleryFiles.find(f => f.id === fileId);
    if (file) {
      file.badge = undefined;
      file.badgePosition = undefined;
      this.updateFileItemDOM(fileId);
    }
  }

  private handleCustomActionClick(actionId: string): void {
    this.dispatchEvent(new CustomEvent('@snice/custom-action-click', {
      detail: { actionId, component: this },
      bubbles: true,
      composed: true
    }));
  }

  private async startUpload(galleryFile: GalleryFile): Promise<void> {
    const controller = new AbortController();
    this.uploadAbortControllers.set(galleryFile.id, controller);

    galleryFile.uploadStatus = 'uploading';
    galleryFile.uploadProgress = 0;
    galleryFile.error = undefined;
    this.updateFileItemDOM(galleryFile.id);

    try {
      const response = await this.uploadFile({
        file: galleryFile.file,
        fileId: galleryFile.id,
        onProgress: (progress) => {
          galleryFile.uploadProgress = Math.round(progress * 100);
          this.updateFileItemDOM(galleryFile.id);
          this.emitUploadProgress(galleryFile);
        },
        signal: controller.signal
      });

      if (response.success) {
        galleryFile.uploadStatus = 'completed';
        galleryFile.uploadProgress = 100;
        this.emitUploadComplete(galleryFile, response);
      } else {
        throw new Error(response.error || 'Upload failed');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Upload was paused, don't treat as error
        return;
      }

      galleryFile.uploadStatus = 'error';
      galleryFile.error = error.message || 'Upload failed';
      this.emitUploadError(galleryFile, error);
    } finally {
      this.uploadAbortControllers.delete(galleryFile.id);
      this.updateFileItemDOM(galleryFile.id);
    }
  }

  private generatePreview(galleryFile: GalleryFile): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      galleryFile.preview = e.target?.result as string;
      this.updateFileItemDOM(galleryFile.id);
    };
    reader.readAsDataURL(galleryFile.file);
  }

  private generateFileId(): string {
    return `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private isAcceptedType(file: File): boolean {
    if (!this.accept) return true;
    if (!file || !file.name) return false;

    const acceptTypes = this.accept.split(',').map(t => t.trim()).filter(Boolean);

    for (const acceptType of acceptTypes) {
      // Exact MIME type match
      if (acceptType === file.type) return true;

      // Wildcard match (e.g., image/*)
      if (acceptType.endsWith('/*')) {
        const baseType = acceptType.split('/')[0];
        if (file.type && file.type.startsWith(baseType + '/')) return true;
      }

      // Extension match (e.g., .jpg)
      if (acceptType.startsWith('.')) {
        if (file.name.toLowerCase().endsWith(acceptType.toLowerCase())) return true;
      }
    }

    return false;
  }

  private formatAcceptTypes(): string {
    if (!this.accept) return '';
    return this.accept.split(',').map(t => t.trim()).join(', ');
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    if (bytes < 0) return '';

    const units = ['B', 'KB', 'MB', 'GB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
  }

  @dispatch('@snice/files-change')
  private emitFilesChange() {
    return { files: this.files, component: this };
  }

  @dispatch('@snice/file-remove')
  private emitFileRemove(file: GalleryFile) {
    return { file, component: this };
  }

  @dispatch('@snice/upload-progress')
  private emitUploadProgress(file: GalleryFile) {
    return { file, progress: file.uploadProgress, component: this };
  }

  @dispatch('@snice/upload-complete')
  private emitUploadComplete(file: GalleryFile, response: UploadResponse) {
    return { file, response, component: this };
  }

  @dispatch('@snice/upload-error')
  private emitUploadError(file: GalleryFile, error: Error) {
    return { file, error: error.message, component: this };
  }

  @dispatch('@snice/upload-pause')
  private emitUploadPause(file: GalleryFile) {
    return { file, component: this };
  }

  @dispatch('@snice/error')
  private emitError(message: string) {
    return { message, component: this };
  }

  @dispose()
  cleanup() {
    // Cancel all uploads
    for (const controller of this.uploadAbortControllers.values()) {
      controller.abort();
    }

    // Revoke all preview URLs
    for (const file of this.galleryFiles) {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    }
  }
}

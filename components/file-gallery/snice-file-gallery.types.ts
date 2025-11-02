export type FileGalleryView = 'grid' | 'list';

export interface CustomAction {
  id: string;
  icon: string;
  text: string;
}

export interface GalleryFile {
  id: string;
  file: File;
  preview?: string;
  uploadProgress: number;
  uploadStatus: 'pending' | 'uploading' | 'paused' | 'completed' | 'error';
  error?: string;
  badge?: string; // Custom badge text or HTML to display on preview
  badgePosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export interface UploadRequest {
  file: File;
  fileId: string;
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
}

export interface UploadResponse {
  success: boolean;
  fileId: string;
  url?: string;
  error?: string;
}

export interface SniceFileGalleryElement extends HTMLElement {
  accept: string;
  multiple: boolean;
  disabled: boolean;
  maxSize: number;
  maxFiles: number;
  view: FileGalleryView;
  showProgress: boolean;
  allowPause: boolean;
  allowDelete: boolean;
  autoUpload: boolean;
  showAddButton: boolean;
  hideAddButton: boolean;

  // Getters
  files: GalleryFile[];
  customActions: CustomAction[];
  getFile(fileId: string): GalleryFile | undefined;
  getCustomAction(actionId: string): CustomAction | undefined;
  isPending(fileId: string): boolean;
  isUploading(fileId: string): boolean;
  isPaused(fileId: string): boolean;
  isCompleted(fileId: string): boolean;
  hasError(fileId: string): boolean;
  canAddFiles(): boolean;

  // File management
  addFiles(files: FileList | File[]): void;
  addFileWithPreview(file: File, previewDataUrl: string): void;
  removeFile(fileId: string): void;
  clear(): void;
  clearCompleted(): void;
  clearErrors(): void;

  // Upload control
  pauseUpload(fileId: string): void;
  resumeUpload(fileId: string): void;
  retryUpload(fileId: string): void;
  pauseAll(): void;
  resumeAll(): void;
  retryAll(): void;
  cancelUpload(fileId: string): void;
  cancelAll(): void;

  // Custom actions
  addCustomAction(icon: string, text: string): string;
  removeCustomAction(actionId: string): void;
  clearCustomActions(): void;

  // Utility
  openFilePicker(): void;
  setFileBadge(fileId: string, badge: string, position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'): void;
  removeFileBadge(fileId: string): void;
}

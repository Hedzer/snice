export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface ToastOptions {
  type?: ToastType;
  duration?: number;  // ms, 0 for no auto-dismiss
  position?: ToastPosition;
  closable?: boolean;
  icon?: boolean;
  id?: string;
}

export interface SniceToastElement extends HTMLElement {
  type: ToastType;
  message: string;
  closable: boolean;
  icon: boolean;
  hide(): void;
}

export interface SniceToastContainerElement extends HTMLElement {
  position: ToastPosition;
  show(message: string, options?: ToastOptions): string;
  hide(id: string): void;
  clear(): void;
}

export interface ToastEventDetail {
  message: string;
  options?: ToastOptions;
}

export interface ToastResponseEventDetail {
  toastId: string;
}
// GENERATED FILE — DO NOT EDIT.
// Source: components/toast/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the Toast component
 */
export interface ToastProps extends SniceBaseProps {
  type?: any;
  message?: any;
  closable?: any;
  icon?: any;
  onCloseToast?: (event: any) => void;
}

/**
 * Toast - React adapter for snice-toast
 *
 * This is an auto-generated React wrapper for the Snice toast component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/toast/snice-toast';
 * import { Toast } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Toast />;
 * }
 * ```
 */
export const Toast: SniceReactComponent<ToastProps, SniceComponentRef> = createReactAdapter<ToastProps, false>({
  tagName: 'snice-toast',
  properties: ["type","message","closable","icon"],
  events: {"close-toast":"onCloseToast"},
  formAssociated: false
});

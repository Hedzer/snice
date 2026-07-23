// GENERATED FILE — DO NOT EDIT.
// Source: components/toast/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the ToastContainer component
 */
export interface ToastContainerProps extends SniceBaseProps {
  position?: any;

}

/**
 * ToastContainer - React adapter for snice-toast-container
 *
 * This is an auto-generated React wrapper for the Snice toast-container component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/toast/snice-toast-container';
 * import { ToastContainer } from 'snice/react';
 *
 * function MyComponent() {
 *   return <ToastContainer />;
 * }
 * ```
 */
export const ToastContainer: SniceReactComponent<ToastContainerProps, SniceComponentRef> = createReactAdapter<ToastContainerProps, false>({
  tagName: 'snice-toast-container',
  properties: ["position"],
  events: {},
  formAssociated: false
});

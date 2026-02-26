import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Modal component
 */
export interface ModalProps extends SniceBaseProps {
  open?: any;
  size?: any;
  noBackdropDismiss?: any;
  noEscapeDismiss?: any;
  noFocusTrap?: any;
  noCloseButton?: any;
  noHeader?: any;
  noFooter?: any;
  label?: any;

}

/**
 * Modal - React adapter for snice-modal
 *
 * This is an auto-generated React wrapper for the Snice modal component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/modal';
 * import { Modal } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Modal />;
 * }
 * ```
 */
export const Modal = createReactAdapter<ModalProps>({
  tagName: 'snice-modal',
  properties: ["open","size","noBackdropDismiss","noEscapeDismiss","noFocusTrap","noCloseButton","noHeader","noFooter","label"],
  events: {},
  formAssociated: false
});

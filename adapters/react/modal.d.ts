import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
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
    topLayer?: any;
    container?: any;
    label?: any;
    onModalOpen?: (event: any) => void;
    onModalClose?: (event: any) => void;
}
/**
 * Modal - React adapter for snice-modal
 *
 * This is an auto-generated React wrapper for the Snice modal component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/modal/snice-modal';
 * import { Modal } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Modal />;
 * }
 * ```
 */
export declare const Modal: SniceReactComponent<ModalProps, SniceComponentRef>;
//# sourceMappingURL=modal.d.ts.map
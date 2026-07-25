import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the LayoutMasterDetail component
 */
export interface LayoutMasterDetailProps extends SniceBaseProps {
    selected?: any;
    contained?: any;
    onDetailClosed?: (event: any) => void;
}
/**
 * LayoutMasterDetail - React adapter for snice-layout-master-detail
 *
 * This is an auto-generated React wrapper for the Snice layout-master-detail component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/layout/snice-layout-master-detail';
 * import { LayoutMasterDetail } from 'snice/react';
 *
 * function MyComponent() {
 *   return <LayoutMasterDetail />;
 * }
 * ```
 */
export declare const LayoutMasterDetail: SniceReactComponent<LayoutMasterDetailProps, SniceComponentRef>;
//# sourceMappingURL=layout-master-detail.d.ts.map
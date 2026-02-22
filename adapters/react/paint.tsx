import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Paint component
 */
export interface PaintProps extends SniceBaseProps {
  colors?: any;
  color?: any;
  strokeWidth?: any;
  minStrokeWidth?: any;
  maxStrokeWidth?: any;
  controls?: any;
  backgroundColor?: any;
  disabled?: any;
  onPaintStart?: (e: CustomEvent) => void;
  onPaintEnd?: (e: CustomEvent) => void;
  onPaintClear?: (e: CustomEvent) => void;
  onPaintUndo?: (e: CustomEvent) => void;
  onPaintRedo?: (e: CustomEvent) => void;
}

/**
 * Paint - React adapter for snice-paint
 *
 * This is an auto-generated React wrapper for the Snice paint component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/paint';
 * import { Paint } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Paint />;
 * }
 * ```
 */
export const Paint = createReactAdapter<PaintProps>({
  tagName: 'snice-paint',
  properties: ["colors","color","strokeWidth","minStrokeWidth","maxStrokeWidth","controls","backgroundColor","disabled"],
  events: {
    'paint-start': 'onPaintStart',
    'paint-end': 'onPaintEnd',
    'paint-clear': 'onPaintClear',
    'paint-undo': 'onPaintUndo',
    'paint-redo': 'onPaintRedo'
  },
  formAssociated: false
});

// GENERATED FILE — DO NOT EDIT.
// Source: components/paint/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Paint component
 */
export interface PaintProps extends SniceBaseProps {
  color?: any;
  strokeWidth?: any;
  minStrokeWidth?: any;
  maxStrokeWidth?: any;
  controls?: any;
  backgroundColor?: any;
  colorSelects?: any;
  disabled?: any;
  _tool?: any;
  onColorSelect?: (event: any) => void;
  onPaintStart?: (event: any) => void;
  onPaintEnd?: (event: any) => void;
  onPaintClear?: (event: any) => void;
  onPaintUndo?: (event: any) => void;
  onPaintRedo?: (event: any) => void;
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
  properties: ["color","strokeWidth","minStrokeWidth","maxStrokeWidth","controls","backgroundColor","colorSelects","disabled","_tool"],
  events: {"color-select":"onColorSelect","paint-start":"onPaintStart","paint-end":"onPaintEnd","paint-clear":"onPaintClear","paint-undo":"onPaintUndo","paint-redo":"onPaintRedo"},
  formAssociated: false
});

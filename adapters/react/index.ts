/**
 * Snice React Adapters
 *
 * This package provides React adapters for all Snice web components,
 * allowing seamless integration with React 17, 18, and 19.
 *
 * @example
 * ```tsx
 * import { Button, Input } from 'snice/react';
 * // or from standalone builds:
 * import Button from './standalone/button/react';
 *
 * function MyComponent() {
 *   const [value, setValue] = useState('');
 *
 *   return (
 *     <div>
 *       <Input
 *         value={value}
 *         onChange={(e) => setValue(e.detail.value)}
 *         placeholder="Enter text..."
 *       />
 *       <Button variant="primary" onClick={() => alert('Clicked!')}>
 *         Submit
 *       </Button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @module snice/react
 */

export { createReactAdapter, useSniceFormValue } from './wrapper';
export type { AdapterConfig, SniceComponentProps } from './wrapper';
export type {
  SniceBaseProps,
  SniceFormProps,
  SniceComponentRef,
  SniceFormRef,
  SniceCustomEvent
} from './types';
export {
  kebabToCamel,
  camelToKebab,
  extractComponentMetadata,
  isFormAssociated,
  waitForComponentDefinition
} from './utils';

// Component adapters will be generated and exported here
// This is a placeholder for the generated adapters

// Auto-generated component exports
export * from './components';

/**
 * Snice React Adapters
 *
 * This package provides React adapters for all Snice web components,
 * allowing seamless integration with React 17, 18, and 19.
 *
 * @example
 * ```tsx
 * import { Button, Input } from 'snice/react';
 * // or from CDN builds:
 * import Button from './cdn/button/react';
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
export { SniceProvider, useSniceContext, useNavigate, useParams, useRoute } from './SniceProvider';
export { SniceRouter, Route } from './SniceRouter';
export { useRequestHandler } from './useRequestHandler';
export { createReactAdapter, useSniceFormValue } from './wrapper';
export { kebabToCamel, camelToKebab, extractComponentMetadata, isFormAssociated, waitForComponentDefinition } from './utils';
// Auto-generated component exports
export * from './components';
//# sourceMappingURL=index.js.map
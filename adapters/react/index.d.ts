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
export type { SniceReactContext, SniceProviderProps, Placard } from './SniceProvider';
export { SniceRouter, Route } from './SniceRouter';
export type { SniceRouterProps, RouteProps } from './SniceRouter';
export { useRequestHandler } from './useRequestHandler';
export { createReactAdapter, useSniceFormValue } from './wrapper';
export type { AdapterConfig, SniceComponentProps } from './wrapper';
export type { SniceBaseProps, SniceFormProps, SniceComponentRef, SniceFormRef, SniceCustomEvent } from './types';
export { kebabToCamel, camelToKebab, extractComponentMetadata, isFormAssociated, waitForComponentDefinition } from './utils';
export * from './components';
//# sourceMappingURL=index.d.ts.map
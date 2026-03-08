import { createReactAdapter } from './wrapper';
/**
 * TagInput - React adapter for snice-tag-input
 *
 * This is an auto-generated React wrapper for the Snice tag-input component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/tag-input';
 * import { TagInput } from 'snice/react';
 *
 * function MyComponent() {
 *   return <TagInput />;
 * }
 * ```
 */
export const TagInput = createReactAdapter({
    tagName: 'snice-tag-input',
    properties: ["value", "suggestions", "maxTags", "allowDuplicates", "placeholder", "disabled", "readonly", "label", "name"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=tag-input.js.map
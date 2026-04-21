// GENERATED FILE — DO NOT EDIT.
// Source: components/tag-input/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
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
    properties: ["value", "suggestions", "maxTags", "allowDuplicates", "placeholder", "disabled", "readonly", "label", "name", "inputValue", "filteredSuggestions", "showSuggestions", "highlightedIndex"],
    events: { "tag-add": "onTagAdd", "tag-remove": "onTagRemove", "tag-change": "onTagChange" },
    formAssociated: false
});
//# sourceMappingURL=tag-input.js.map
// GENERATED FILE — DO NOT EDIT.
// Source: components/tag-input/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
import type { SniceFormProps } from './types';

/**
 * Props for the TagInput component
 */
export interface TagInputProps extends SniceFormProps {
  value?: any;
  suggestions?: any;
  maxTags?: any;
  allowDuplicates?: any;
  placeholder?: any;
  disabled?: any;
  readonly?: any;
  label?: any;
  name?: any;
  onTagAdd?: (event: any) => void;
  onTagRemove?: (event: any) => void;
  onTagChange?: (event: any) => void;
}

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
export const TagInput = createReactAdapter<TagInputProps>({
  tagName: 'snice-tag-input',
  properties: ["value","suggestions","maxTags","allowDuplicates","placeholder","disabled","readonly","label","name"],
  events: {"tag-add":"onTagAdd","tag-remove":"onTagRemove","tag-change":"onTagChange"},
  formAssociated: true
});

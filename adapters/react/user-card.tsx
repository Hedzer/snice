// GENERATED FILE — DO NOT EDIT.
// Source: components/user-card/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the UserCard component
 */
export interface UserCardProps extends SniceBaseProps {
  name?: any;
  avatar?: any;
  role?: any;
  company?: any;
  email?: any;
  phone?: any;
  location?: any;
  social?: any;
  status?: any;
  variant?: any;
  onSocialClick?: (event: any) => void;
  onActionClick?: (event: any) => void;
}

/**
 * UserCard - React adapter for snice-user-card
 *
 * This is an auto-generated React wrapper for the Snice user-card component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/user-card/snice-user-card';
 * import { UserCard } from 'snice/react';
 *
 * function MyComponent() {
 *   return <UserCard />;
 * }
 * ```
 */
export const UserCard: SniceReactComponent<UserCardProps, SniceComponentRef> = createReactAdapter<UserCardProps, false>({
  tagName: 'snice-user-card',
  properties: ["name","avatar","role","company","email","phone","location","social","status","variant"],
  events: {"social-click":"onSocialClick","action-click":"onActionClick"},
  formAssociated: false
});

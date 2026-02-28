import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

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

}

/**
 * UserCard - React adapter for snice-user-card
 *
 * This is an auto-generated React wrapper for the Snice user-card component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/user-card';
 * import { UserCard } from 'snice/react';
 *
 * function MyComponent() {
 *   return <UserCard />;
 * }
 * ```
 */
export const UserCard = createReactAdapter<UserCardProps>({
  tagName: 'snice-user-card',
  properties: ["name","avatar","role","company","email","phone","location","social","status","variant"],
  events: {},
  formAssociated: false
});

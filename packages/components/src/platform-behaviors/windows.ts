import type { PlatformBehaviorCleanup } from './types';

export const platform = 'windows' as const;

export function attach(_root: Document | Element): PlatformBehaviorCleanup {
  return () => {};
}

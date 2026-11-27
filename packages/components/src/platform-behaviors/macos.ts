import type { PlatformBehaviorCleanup } from './types';

export const platform = 'macos' as const;

export function attach(_root: Document | Element): PlatformBehaviorCleanup {
  return () => {};
}

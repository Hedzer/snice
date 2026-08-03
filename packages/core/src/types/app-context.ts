import type { DaemonMap } from './daemon';

/**
 * Application context visible to the framework.
 *
 * Snice only assigns meaning to `daemons`. Other application state remains
 * deliberately unknown until an application extends this interface or narrows
 * it to its own context type.
 *
 * Applications can extend this interface to add their own context properties:
 *
 * @example
 * ```typescript
 * interface MyAppContext extends AppContext {
 *   theme: MyThemeService;
 *   analytics: AnalyticsService;
 *   customProperty: string;
 * }
 * ```
 *
 * The context is typically passed to:
 * - Route guards for access control decisions
 * - Page components via the @context decorator
 * - Placard functions for dynamic metadata
 */
export interface AppContext {
  /**
   * Explicitly constructed daemon instances addressable by elements and
   * controllers through the communication decorators.
   */
  readonly daemons?: DaemonMap;

  [key: string]: unknown;
}

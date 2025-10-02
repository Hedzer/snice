/**
 * Application context interface for cross-cutting concerns.
 *
 * This interface defines common application-wide state and services
 * that components, pages, and guards may need to access. All properties
 * are optional, allowing applications to implement only what they need.
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
   * Theme management and styling context.
   * Typically handles dark/light mode, custom themes, and design tokens.
   *
   * @example
   * ```typescript
   * theme: {
   *   current: 'dark',
   *   setTheme: (theme: string) => void,
   *   isDarkMode: () => boolean
   * }
   * ```
   */
  theme?: any;

  /**
   * Internationalization and localization context.
   * Handles language switching, translations, and regional formatting.
   *
   * @example
   * ```typescript
   * locale: {
   *   current: 'en-US',
   *   setLocale: (locale: string) => void,
   *   t: (key: string) => string
   * }
   * ```
   */
  locale?: any;

  /**
   * Authentication and authorization context.
   * Contains user information, roles, permissions, and auth state.
   *
   * @example
   * ```typescript
   * principal: {
   *   user: { id: 1, name: 'John', role: 'admin' },
   *   isAuthenticated: () => boolean,
   *   hasRole: (role: string) => boolean
   * }
   * ```
   */
  principal?: any;

  /**
   * Application configuration and settings.
   * Runtime configuration, feature flags, API endpoints, etc.
   *
   * @example
   * ```typescript
   * config: {
   *   apiUrl: 'https://api.example.com',
   *   featureFlags: { newUI: true },
   *   get: (key: string) => any
   * }
   * ```
   */
  config?: any;
}
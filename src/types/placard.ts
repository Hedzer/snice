import { Guard } from './guard';

/**
 * Placard interface for page metadata that layouts can consume.
 * Provides rich metadata about pages including navigation structure,
 * help information, and dynamic visibility controls.
 */
export interface Placard<T = any> {
  /**
   * Unique identifier for this placard.
   * Used for referencing in breadcrumbs and parent-child relationships.
   * Should be kebab-case, e.g., 'user-settings', 'admin-dashboard'
   */
  name: string;

  /**
   * Display name shown in navigation and breadcrumbs.
   * Should be concise and descriptive.
   */
  title: string;

  /**
   * Longer description of the page's purpose.
   * Used in tooltips, search results, or help text.
   */
  description?: string;

  /**
   * Visual icon representing the page.
   * Can be emoji, icon font class, or SVG path.
   */
  icon?: string;

  /**
   * Brief help text shown on hover.
   * Explains what the page does or when to use it.
   */
  tooltip?: string;

  /**
   * Additional keywords for search functionality.
   * Helps users discover pages through alternate terms.
   * @example ['settings', 'preferences', 'config', 'options']
   */
  searchTerms?: string[];

  /**
   * Keyboard shortcuts to navigate to this page.
   * Uses standard key notation.
   * @example ['ctrl+d', 'cmd+d', 'alt+shift+d']
   */
  hotkeys?: string[];

  /**
   * Link to detailed documentation or help for this page.
   */
  helpUrl?: string;

  /**
   * Explicitly defined breadcrumb path using placard names.
   * If not provided, breadcrumbs are auto-resolved using parent hierarchy.
   * @example ['dashboard', 'settings', 'advanced-settings']
   */
  breadcrumbs?: string[];

  /**
   * Logical grouping for navigation organization.
   * Pages with the same group are displayed together.
   * @example 'admin', 'reports', 'settings'
   */
  group?: string;

  /**
   * References another placard's name to create hierarchy.
   * Used for nested navigation and breadcrumb construction.
   * @example 'users' // Child of the 'users' page
   */
  parent?: string;

  /**
   * Numeric sort order within the group or parent.
   * Lower numbers appear first.
   */
  order?: number;

  /**
   * Whether to display this page in navigation menus.
   * Defaults to true if not specified.
   */
  show?: boolean;

  /**
   * Guard functions that determine if the page should appear in navigation.
   * Reuses the same guard system as route protection.
   * @example [isAuthenticated, hasAdminRole]
   */
  visibleOn?: Guard<T> | Guard<T>[];

  /**
   * Arbitrary metadata for custom layout needs.
   * Domain-specific or framework-specific data.
   * @example { category: 'reporting', experimental: true, requiredFeatures: ['analytics'] }
   */
  attributes?: Record<string, any>;
}
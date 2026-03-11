import { type ReactNode, type ReactElement, type ComponentType } from 'react';
import type { Placard } from './SniceProvider';
export interface RouteProps {
    path: string;
    /** React component OR Snice element tag name (string) */
    page: ComponentType<any> | string;
    /** Single guard function */
    guard?: (context: Record<string, any>, params: Record<string, string>) => boolean | Promise<boolean>;
    /** Multiple guards (AND logic) */
    guards?: Array<(context: Record<string, any>, params: Record<string, string>) => boolean | Promise<boolean>>;
    /** Redirect path if guard rejects */
    guardRedirect?: string;
    /** Layout override. Component, string (Snice tag), or false (no layout) */
    layout?: ComponentType<{
        children: ReactNode;
    }> | string | false;
    /** Page metadata for layouts */
    placard?: Placard;
}
/**
 * Route definition component. Child of <SniceRouter>.
 * Does not render anything — SniceRouter reads its props.
 */
export declare function Route(_props: RouteProps): ReactElement | null;
export interface SniceRouterProps {
    /** URL strategy */
    mode: 'hash' | 'history';
    /** Application context passed to guards, pages, layouts */
    context?: Record<string, any>;
    /** Default layout component or Snice tag name */
    layout?: ComponentType<{
        children: ReactNode;
    }> | string;
    /** Loading component shown during async guards. Component, string (Snice tag), or JSX. */
    loading?: ComponentType | string | ReactNode;
    /** Fallback when no route matches. Component, string (Snice tag), or JSX. */
    fallback?: ComponentType | string | ReactNode;
    children: ReactNode;
}
/**
 * Root provider component. Manages URL state, route matching,
 * guard execution, layout selection, and context propagation.
 */
export declare function SniceRouter({ mode, context, layout: defaultLayout, loading, fallback, children, }: SniceRouterProps): import("react/jsx-runtime").JSX.Element;

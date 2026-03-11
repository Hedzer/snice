import { type ReactNode } from 'react';
/**
 * Placard interface — matches src/types/placard.ts
 * Re-declared here to avoid importing from the vanilla Snice source
 * (React package should be independently importable)
 */
export interface Placard {
    name: string;
    title: string;
    description?: string;
    icon?: string;
    tooltip?: string;
    searchTerms?: string[];
    hotkeys?: string[];
    helpUrl?: string;
    breadcrumbs?: string[];
    group?: string;
    parent?: string;
    order?: number;
    show?: boolean;
    visibleOn?: any;
    attributes?: Record<string, any>;
}
/**
 * Mirrors Snice's @context shape exactly.
 */
export interface SniceReactContext {
    /** User-defined app state */
    application: Record<string, any>;
    /** Navigation state */
    navigation: {
        route: string;
        params: Record<string, string>;
        placards: Placard[];
    };
    /** Programmatic navigation */
    navigate: (path: string) => void;
    /** Optional context-aware fetcher */
    fetch?: typeof globalThis.fetch;
}
export interface SniceProviderProps {
    /** Application context object (user state, theme, config, etc.) */
    context?: Record<string, any>;
    /** Navigation function — provided by SniceRouter, or your own */
    navigate?: (path: string) => void;
    /** Current route pattern */
    route?: string;
    /** Current route params */
    params?: Record<string, string>;
    /** Registered placards */
    placards?: Placard[];
    /** Optional fetch function */
    fetch?: typeof globalThis.fetch;
    children: ReactNode;
}
/**
 * Context provider for Snice React integration.
 * Usable standalone without SniceRouter for simpler apps.
 */
export declare function SniceProvider({ context, navigate, route, params, placards, fetch: fetchFn, children, }: SniceProviderProps): import("react/jsx-runtime").JSX.Element;
/**
 * Returns the full merged Snice context.
 * Mirrors the shape returned by Snice's @context decorator.
 */
export declare function useSniceContext(): SniceReactContext;
/** Convenience: returns just the navigate function */
export declare function useNavigate(): (path: string) => void;
/** Convenience: returns current route params */
export declare function useParams(): Record<string, string>;
/** Convenience: returns current matched route pattern */
export declare function useRoute(): string;

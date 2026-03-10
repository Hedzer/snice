import { createContext, useContext, useMemo, type ReactNode } from 'react';

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

const SniceCtx = createContext<SniceReactContext | null>(null);

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
export function SniceProvider({
  context = {},
  navigate = () => {},
  route = '',
  params = {},
  placards = [],
  fetch: fetchFn,
  children,
}: SniceProviderProps) {
  const value = useMemo<SniceReactContext>(
    () => ({
      application: context,
      navigation: { route, params, placards },
      navigate,
      ...(fetchFn ? { fetch: fetchFn } : {}),
    }),
    [context, navigate, route, params, placards, fetchFn],
  );

  return <SniceCtx.Provider value={value}>{children}</SniceCtx.Provider>;
}

/**
 * Returns the full merged Snice context.
 * Mirrors the shape returned by Snice's @context decorator.
 */
export function useSniceContext(): SniceReactContext {
  const ctx = useContext(SniceCtx);
  if (!ctx) {
    throw new Error('useSniceContext must be used within a <SniceProvider> or <SniceRouter>');
  }
  return ctx;
}

/** Convenience: returns just the navigate function */
export function useNavigate(): (path: string) => void {
  return useSniceContext().navigate;
}

/** Convenience: returns current route params */
export function useParams(): Record<string, string> {
  return useSniceContext().navigation.params;
}

/** Convenience: returns current matched route pattern */
export function useRoute(): string {
  return useSniceContext().navigation.route;
}


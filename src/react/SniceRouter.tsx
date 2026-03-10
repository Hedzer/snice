import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
  type ReactElement,
  type ComponentType,
  Children,
  isValidElement,
  createElement,
} from 'react';
import { SniceProvider } from './SniceProvider';
import { matchRoutes, type RouteConfig } from './matchRoute';
import type { Placard } from './SniceProvider';

// ─── Route component (declarative config) ───

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
  layout?: ComponentType<{ children: ReactNode }> | string | false;
  /** Page metadata for layouts */
  placard?: Placard;
}

/**
 * Route definition component. Child of <SniceRouter>.
 * Does not render anything — SniceRouter reads its props.
 */
export function Route(_props: RouteProps): ReactElement | null {
  return null;
}

// ─── SniceRouter ───

export interface SniceRouterProps {
  /** URL strategy */
  mode: 'hash' | 'history';
  /** Application context passed to guards, pages, layouts */
  context?: Record<string, any>;
  /** Default layout component or Snice tag name */
  layout?: ComponentType<{ children: ReactNode }> | string;
  /** Loading component shown during async guards. Component, string (Snice tag), or JSX. */
  loading?: ComponentType | string | ReactNode;
  /** Fallback when no route matches. Component, string (Snice tag), or JSX. */
  fallback?: ComponentType | string | ReactNode;
  children: ReactNode;
}

interface ParsedRoute {
  path: string;
  page: ComponentType<any> | string;
  guards: Array<(ctx: Record<string, any>, params: Record<string, string>) => boolean | Promise<boolean>>;
  guardRedirect?: string;
  layout?: ComponentType<{ children: ReactNode }> | string | false;
  placard?: Placard;
}

function getPath(mode: 'hash' | 'history'): string {
  if (mode === 'hash') {
    return window.location.hash.slice(1) || '/';
  }
  return window.location.pathname;
}

function DefaultLoading() {
  return createElement('div', {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      minHeight: '200px',
    },
  }, createElement('div', {
    style: {
      width: '32px',
      height: '32px',
      border: '3px solid rgba(128,128,128,0.3)',
      borderTopColor: 'rgba(128,128,128,0.8)',
      borderRadius: '50%',
      animation: 'snice-spin 0.6s linear infinite',
    },
  }));
}

/** Render a page/layout/loading/fallback prop that can be component, string tag, or JSX */
function renderFlexible(
  value: ComponentType<any> | string | ReactNode | undefined,
  props?: Record<string, any>,
): ReactNode {
  if (value === undefined || value === null) return null;

  // String = Snice web component tag name
  if (typeof value === 'string') {
    return createElement(value, props);
  }

  // Function = React component
  if (typeof value === 'function') {
    return createElement(value as ComponentType<any>, props);
  }

  // Already JSX/ReactNode
  return value;
}

/**
 * Root provider component. Manages URL state, route matching,
 * guard execution, layout selection, and context propagation.
 */
export function SniceRouter({
  mode,
  context = {},
  layout: defaultLayout,
  loading,
  fallback,
  children,
}: SniceRouterProps) {
  const [currentPath, setCurrentPath] = useState(() => getPath(mode));
  const [guardState, setGuardState] = useState<'idle' | 'checking' | 'passed' | 'failed'>('idle');
  const contextRef = useRef(context);
  contextRef.current = context;

  // Parse Route children into config
  const parsedRoutes = useMemo<ParsedRoute[]>(() => {
    const result: ParsedRoute[] = [];
    Children.forEach(children, (child) => {
      if (!isValidElement(child) || child.type !== Route) return;
      const props = child.props as RouteProps;
      const guards: ParsedRoute['guards'] = [];
      if (props.guard) guards.push(props.guard);
      if (props.guards) guards.push(...props.guards);
      result.push({
        path: props.path,
        page: props.page,
        guards,
        guardRedirect: props.guardRedirect,
        layout: props.layout,
        placard: props.placard,
      });
    });
    return result;
  }, [children]);

  // Collect placards
  const placards = useMemo<Placard[]>(() => {
    return parsedRoutes
      .filter((r) => r.placard)
      .map((r) => r.placard!);
  }, [parsedRoutes]);

  // Build route configs for matching
  const routeConfigs = useMemo<RouteConfig[]>(
    () => parsedRoutes.map((r, i) => ({ path: r.path, index: i })),
    [parsedRoutes],
  );

  // Navigate function
  const navigate = useCallback(
    (path: string) => {
      if (mode === 'hash') {
        window.location.hash = path;
      } else {
        window.history.pushState(null, '', path);
        setCurrentPath(path);
      }
    },
    [mode],
  );

  // Listen for URL changes
  useEffect(() => {
    const handler = () => setCurrentPath(getPath(mode));
    const event = mode === 'hash' ? 'hashchange' : 'popstate';
    window.addEventListener(event, handler);
    return () => window.removeEventListener(event, handler);
  }, [mode]);

  // Match current path
  const match = useMemo(
    () => matchRoutes(routeConfigs, currentPath),
    [routeConfigs, currentPath],
  );

  const matchedRoute = match ? parsedRoutes[match.index] : null;
  const params = match?.params ?? {};

  // Run guards
  useEffect(() => {
    if (!matchedRoute) {
      setGuardState('idle');
      return;
    }

    if (matchedRoute.guards.length === 0) {
      setGuardState('passed');
      return;
    }

    let cancelled = false;
    setGuardState('checking');

    (async () => {
      try {
        for (const guard of matchedRoute.guards) {
          const result = await guard(contextRef.current, params);
          if (cancelled) return;
          if (!result) {
            setGuardState('failed');
            if (matchedRoute.guardRedirect) {
              navigate(matchedRoute.guardRedirect);
            }
            return;
          }
        }
        if (!cancelled) setGuardState('passed');
      } catch {
        if (!cancelled) {
          setGuardState('failed');
          if (matchedRoute.guardRedirect) {
            navigate(matchedRoute.guardRedirect);
          }
        }
      }
    })();

    return () => { cancelled = true; };
  }, [matchedRoute, currentPath]); // eslint-disable-line react-hooks/exhaustive-deps

  // Determine what to render
  let content: ReactNode;

  if (!matchedRoute) {
    // No route match → fallback
    content = renderFlexible(fallback) ?? createElement('div', null, '404 — Page not found');
  } else if (guardState === 'checking') {
    // Async guards running → show loading
    content = renderFlexible(loading) ?? createElement(DefaultLoading);
  } else if (guardState === 'failed') {
    // Guard rejected (redirect may have fired) — render nothing
    content = null;
  } else {
    // Guard passed or no guards → render page
    content = renderFlexible(matchedRoute.page, params);
  }

  // Apply layout
  const layoutCandidate = matchedRoute?.layout !== undefined ? matchedRoute.layout : defaultLayout;
  const layoutToUse = layoutCandidate === false ? undefined : layoutCandidate;
  if (layoutToUse && content !== null) {
    content = renderFlexible(
      layoutToUse as ComponentType<{ children: ReactNode }> | string,
      { children: content },
    );
  }

  return (
    <SniceProvider
      context={context}
      navigate={navigate}
      route={match?.path ?? ''}
      params={params}
      placards={placards}
    >
      {content}
    </SniceProvider>
  );
}

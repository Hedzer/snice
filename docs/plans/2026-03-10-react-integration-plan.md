# Snice React Integration (Full Parity) — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let React developers build full Snice-powered apps using only hooks and JSX — routing, guards, layouts, context — without decorators or custom element classes.

**Architecture:** React-native implementations of Snice's router, context, guards, and layouts in `src/react/`. Purpose-built for React's rendering model while mirroring Snice's API contracts. Source builds to `dist/react/`, copies to `adapters/react/`. Consumers import from `snice/react`.

**Tech Stack:** React 18+, TypeScript, Rollup, Vitest, pica-route (same route matching as vanilla Snice)

**Design doc:** `docs/plans/2026-03-10-react-integration-design.md`

---

## Prerequisite: Async Guard Support in Vanilla Snice

Before building the React router, the vanilla `Guard` type and `checkGuards` must support `Promise<boolean>`. This ensures shared guards work in both systems.

### Task 1: Update Guard Type to Support Async

**Files:**
- Modify: `src/types/guard.ts`

**Step 1: Update the Guard type**

Change `src/types/guard.ts` to:

```typescript
import { RouteParams } from './route-params';

/**
 * Guard function type for route protection and visibility control.
 * Guards determine if navigation to a route should proceed.
 * Can return a boolean synchronously or a Promise<boolean> for async checks.
 *
 * @template T - The context type passed to the guard function
 * @param context - The application context object
 * @param params - Route parameters extracted from the URL
 * @returns boolean or Promise<boolean> - true to allow, false to deny
 */
export type Guard<T = any> = (context: T, params: RouteParams) => boolean | Promise<boolean>;
```

**Step 2: Commit**

```bash
git add src/types/guard.ts
git commit -m "feat: support async guards in Guard type"
```

### Task 2: Make Vanilla Router's checkGuards Async

**Files:**
- Modify: `src/router.ts`

**Step 1: Make checkGuards async**

In `src/router.ts`, change `checkGuards` (currently at ~line 242):

```typescript
async function checkGuards(guards: Guard<any> | Guard<any>[] | undefined, params: RouteParams, target: Element): Promise<boolean> {
  const hasGuards = !!guards;
  if (!hasGuards) {
    return true;
  }

  const guardsArray = Array.isArray(guards) ? guards : [guards];
  for (const guard of guardsArray) {
    const allowed = await guard(context, params);
    if (!allowed) {
      renderForbiddenPage(target);
      return false;
    }
  }
  return true;
}
```

**Step 2: Add `await` to all checkGuards call sites**

The function is already called in async contexts (`navigate` is async), but the calls need `await`:

- Line ~294 in `resolveRoute`: Change to make resolveRoute async. Currently `const guardsAllowed = checkGuards(...)` — needs `await`.
- Line ~435 in `navigate` (home path): `if (!checkGuards(...))` → `if (!(await checkGuards(...)))`

Change `resolveRoute` signature to async:

```typescript
async function resolveRoute(path: string, target: Element): Promise<{ result: RouteResult; element?: HTMLElement; transition?: Transition; layout?: string | false; routeParams?: RouteParams }> {
```

And in its body:
```typescript
const guardsAllowed = await checkGuards(route.guards, params as RouteParams, target);
```

In `navigate`, the home path guard check:
```typescript
if (!(await checkGuards(homeRoute?.guards, {}, target))) return;
```

And the `resolveRoute` call already has `const routeResult = resolveRoute(...)` — just needs `await`:
```typescript
const routeResult = await resolveRoute(path, target);
```

**Step 3: Run existing router tests**

Run: `npm run build:test && npx vitest run tests/router.test.ts`
Expected: All existing tests still pass (sync guards still work since `await true === true`)

**Step 4: Commit**

```bash
git add src/router.ts
git commit -m "feat: make router checkGuards async for async guard support"
```

### Task 3: Add Async Guard Tests for Vanilla Router

**Files:**
- Modify: `tests/router.test.ts`

**Step 1: Add async guard tests**

Add these tests to the existing router test file, in the guards describe block:

```typescript
it('should support async guards that resolve to true', async () => {
  const elName = uniqueName('async-guard-pass');
  const asyncGuard: Guard<any> = async (ctx, params) => {
    await new Promise(r => setTimeout(r, 10));
    return true;
  };

  @page({ tag: elName, routes: ['/async-pass'], guards: [asyncGuard] })
  class AsyncPassPage extends HTMLElement {
    @render()
    renderContent() {
      return html`<div>async pass</div>`;
    }
  }

  await router.navigate('/async-pass');
  const el = target.querySelector(elName);
  expect(el).toBeTruthy();
});

it('should support async guards that resolve to false', async () => {
  const elName = uniqueName('async-guard-fail');
  const asyncGuard: Guard<any> = async (ctx, params) => {
    await new Promise(r => setTimeout(r, 10));
    return false;
  };

  @page({ tag: elName, routes: ['/async-fail'], guards: [asyncGuard] })
  class AsyncFailPage extends HTMLElement {
    @render()
    renderContent() {
      return html`<div>async fail</div>`;
    }
  }

  await router.navigate('/async-fail');
  const el = target.querySelector(elName);
  expect(el).toBeFalsy();
});

it('should support mixed sync and async guards', async () => {
  const elName = uniqueName('mixed-guard');
  const syncGuard: Guard<any> = (ctx, params) => true;
  const asyncGuard: Guard<any> = async (ctx, params) => {
    await new Promise(r => setTimeout(r, 10));
    return true;
  };

  @page({ tag: elName, routes: ['/mixed-guard'], guards: [syncGuard, asyncGuard] })
  class MixedGuardPage extends HTMLElement {
    @render()
    renderContent() {
      return html`<div>mixed guard</div>`;
    }
  }

  await router.navigate('/mixed-guard');
  const el = target.querySelector(elName);
  expect(el).toBeTruthy();
});
```

**Step 2: Run tests**

Run: `npm run build:test && npx vitest run tests/router.test.ts`
Expected: All tests pass including new async guard tests

**Step 3: Commit**

```bash
git add tests/router.test.ts
git commit -m "test: add async guard tests for vanilla router"
```

---

## React Integration

### Task 4: SniceProvider and useSniceContext

The context provider is the foundation — other components depend on it. It provides the merged context shape that mirrors Snice's `@context` decorator.

**Files:**
- Create: `src/react/SniceProvider.tsx`
- Create: `tests/react/snice-provider.test.ts`

**Step 1: Write the test file**

Create `tests/react/snice-provider.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { SniceProvider, useSniceContext, useNavigate, useParams, useRoute } from '../../src/react/SniceProvider';

describe('SniceProvider exports', () => {
  it('should export SniceProvider component', () => {
    expect(typeof SniceProvider).toBe('function');
  });

  it('should export useSniceContext hook', () => {
    expect(typeof useSniceContext).toBe('function');
  });

  it('should export useNavigate hook', () => {
    expect(typeof useNavigate).toBe('function');
  });

  it('should export useParams hook', () => {
    expect(typeof useParams).toBe('function');
  });

  it('should export useRoute hook', () => {
    expect(typeof useRoute).toBe('function');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/react/snice-provider.test.ts`
Expected: FAIL — module not found

**Step 3: Write the SniceProvider**

Create `src/react/SniceProvider.tsx`:

```tsx
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Placard } from '../types/placard';

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

// Export the raw context for SniceRouter to use as its provider
export { SniceCtx as SniceContextInternal };
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/react/snice-provider.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/react/SniceProvider.tsx tests/react/snice-provider.test.ts
git commit -m "feat: add SniceProvider and context hooks"
```

### Task 5: Route Matching Utility

Extract route matching into a shared utility so the React router uses the exact same `pica-route` matching as vanilla Snice.

**Files:**
- Create: `src/react/matchRoute.ts`
- Create: `tests/react/match-route.test.ts`

**Step 1: Write the test**

Create `tests/react/match-route.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { matchRoutes, type RouteConfig } from '../../src/react/matchRoute';

describe('matchRoutes', () => {
  const routes: RouteConfig[] = [
    { path: '/users/:id', index: 0 },
    { path: '/users', index: 1 },
    { path: '/', index: 2 },
  ];

  it('should match exact paths', () => {
    const result = matchRoutes(routes, '/users');
    expect(result).not.toBeNull();
    expect(result!.index).toBe(1);
    expect(result!.params).toEqual({});
  });

  it('should match parameterized paths', () => {
    const result = matchRoutes(routes, '/users/42');
    expect(result).not.toBeNull();
    expect(result!.index).toBe(0);
    expect(result!.params).toEqual({ id: '42' });
  });

  it('should match root path', () => {
    const result = matchRoutes(routes, '/');
    expect(result).not.toBeNull();
    expect(result!.index).toBe(2);
  });

  it('should return null for unmatched paths', () => {
    const result = matchRoutes(routes, '/nonexistent');
    expect(result).toBeNull();
  });

  it('should match longest route first (most specific)', () => {
    const result = matchRoutes(routes, '/users/42');
    expect(result!.index).toBe(0); // /users/:id wins over /users
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/react/match-route.test.ts`
Expected: FAIL — module not found

**Step 3: Write matchRoute.ts**

Create `src/react/matchRoute.ts`:

```typescript
import { Route, type RouteParams } from 'pica-route';

export interface RouteConfig {
  path: string;
  index: number;
}

export interface MatchResult {
  index: number;
  params: RouteParams;
  path: string;
}

/**
 * Match a URL path against an array of route configs.
 * Uses pica-route — same matching as vanilla Snice's Router.
 * Routes are sorted by specificity (longest spec first).
 */
export function matchRoutes(routes: RouteConfig[], pathname: string): MatchResult | null {
  // Sort by specificity (longest path first), same as vanilla Router
  const sorted = [...routes].sort((a, b) => b.path.length - a.path.length);

  for (const route of sorted) {
    const matcher = new Route(route.path);
    const params = matcher.match(pathname);
    if (params !== false) {
      return {
        index: route.index,
        params: params as RouteParams,
        path: route.path,
      };
    }
  }

  return null;
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/react/match-route.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/react/matchRoute.ts tests/react/match-route.test.ts
git commit -m "feat: add route matching utility for React router"
```

### Task 6: SniceRouter and Route Components

The core router: URL state management, route matching, guard execution, layout selection, context propagation.

**Files:**
- Create: `src/react/SniceRouter.tsx`
- Create: `tests/react/snice-router.test.ts`

**Step 1: Write the test**

Create `tests/react/snice-router.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { SniceRouter, Route } from '../../src/react/SniceRouter';

describe('SniceRouter exports', () => {
  it('should export SniceRouter component', () => {
    expect(typeof SniceRouter).toBe('function');
  });

  it('should export Route component', () => {
    expect(typeof Route).toBe('function');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/react/snice-router.test.ts`
Expected: FAIL — module not found

**Step 3: Write SniceRouter.tsx**

Create `src/react/SniceRouter.tsx`:

```tsx
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
import { SniceProvider, type SniceReactContext } from './SniceProvider';
import { matchRoutes, type RouteConfig } from './matchRoute';
import type { Placard } from '../types/placard';

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
  if (!value) return null;

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
  const layoutToUse = matchedRoute?.layout !== undefined ? matchedRoute.layout : defaultLayout;
  if (layoutToUse && layoutToUse !== false && content !== null) {
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
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/react/snice-router.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/react/SniceRouter.tsx tests/react/snice-router.test.ts
git commit -m "feat: add SniceRouter and Route components"
```

### Task 7: React Barrel Export

Create the barrel `src/react/index.ts` that re-exports everything.

**Files:**
- Create: `src/react/index.ts`

**Step 1: Create the barrel file**

Create `src/react/index.ts`:

```typescript
// Context
export {
  SniceProvider,
  useSniceContext,
  useNavigate,
  useParams,
  useRoute,
  type SniceReactContext,
  type SniceProviderProps,
} from './SniceProvider';

// Router
export {
  SniceRouter,
  Route,
  type SniceRouterProps,
  type RouteProps,
} from './SniceRouter';

// Request handler
export {
  useRequestHandler,
  type UseRequestRoute,
  type UseRequestRouteMap,
  type UseRequestHandlerOptions,
} from './useRequestHandler';
```

**Step 2: Commit**

```bash
git add src/react/index.ts
git commit -m "feat: add React barrel export"
```

### Task 8: Rollup Build Configuration

Add rollup entries so all React modules build to `dist/react/` and copy to `adapters/react/`.

**Files:**
- Modify: `rollup.config.js`

**Step 1: Update rollup config**

Replace the existing single-file React hooks build entry with a multi-file build:

```javascript
// React integration (source in src/react/, built to dist/react/, copied to adapters/react/)
{
  input: {
    'index': 'src/react/index.ts',
    'SniceProvider': 'src/react/SniceProvider.tsx',
    'SniceRouter': 'src/react/SniceRouter.tsx',
    'matchRoute': 'src/react/matchRoute.ts',
    'useRequestHandler': 'src/react/useRequestHandler.ts',
  },
  external: ['react', 'pica-route'],
  output: {
    dir: 'dist/react',
    format: 'es',
    banner,
    sourcemap: true,
    entryFileNames: '[name].js',
  },
  plugins: [
    resolve(),
    typescript({
      tsconfig: './tsconfig.src.json',
      declaration: true,
      declarationDir: './dist/react',
      rootDir: './src/react',
    }),
    {
      name: 'copy-react-hooks',
      writeBundle() {
        const src = 'dist/react';
        const dest = 'adapters/react';
        if (fs.existsSync(src)) {
          // Only copy built JS, .d.ts, and map files — not .tsx source
          for (const file of fs.readdirSync(src)) {
            if (file.endsWith('.js') || file.endsWith('.d.ts') || file.endsWith('.js.map') || file.endsWith('.d.ts.map')) {
              fs.copyFileSync(path.join(src, file), path.join(dest, file));
            }
          }
        }
      }
    }
  ]
},
```

**Step 2: Build and verify**

Run: `npm run build:core`
Expected: Build succeeds, `dist/react/` contains index.js, SniceProvider.js, SniceRouter.js, matchRoute.js, useRequestHandler.js + .d.ts files. Same files copied to `adapters/react/`.

**Step 3: Commit**

```bash
git add rollup.config.js
git commit -m "feat: update rollup config for full React integration build"
```

### Task 9: Integration Test — Full Router Flow

Test the full router flow end-to-end without a browser (vitest + happy-dom).

**Files:**
- Create: `tests/react/snice-router-integration.test.ts`

**Step 1: Write integration tests**

Create `tests/react/snice-router-integration.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { SniceRouter, Route } from '../../src/react/SniceRouter';
import { SniceProvider, useSniceContext, useNavigate, useParams, useRoute } from '../../src/react/SniceProvider';

describe('SniceRouter integration', () => {
  it('should export all public API', () => {
    expect(typeof SniceRouter).toBe('function');
    expect(typeof Route).toBe('function');
    expect(typeof SniceProvider).toBe('function');
    expect(typeof useSniceContext).toBe('function');
    expect(typeof useNavigate).toBe('function');
    expect(typeof useParams).toBe('function');
    expect(typeof useRoute).toBe('function');
  });

  it('Route component should return null (config-only)', () => {
    const result = Route({
      path: '/test',
      page: () => null,
    });
    expect(result).toBeNull();
  });
});
```

**Step 2: Run test**

Run: `npx vitest run tests/react/snice-router-integration.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add tests/react/snice-router-integration.test.ts
git commit -m "test: add React router integration tests"
```

### Task 10: Update Package.json Exports

Ensure `snice/react` resolves to the barrel and individual modules are importable.

**Files:**
- Modify: `package.json`

**Step 1: Verify existing exports**

Check the current `"./react"` and `"./react/*"` exports in package.json. They should already point to `adapters/react/`:

```json
"./react": {
  "types": "./adapters/react/index.d.ts",
  "import": "./adapters/react/index.js"
},
"./react/*": {
  "types": "./adapters/react/*.d.ts",
  "import": "./adapters/react/*.js"
}
```

These should already work with the new barrel export. Verify by checking that the built files exist after `npm run build:core`.

**Step 2: Commit (only if changes needed)**

```bash
git add package.json
git commit -m "chore: update package.json exports for React integration"
```

### Task 11: Documentation

**Files:**
- Create or modify: `docs/ai/react-integration.md`
- Modify: `docs/ai/patterns.md` (add React router section)

**Step 1: Create `docs/ai/react-integration.md`**

```markdown
# React Integration

Source: `src/react/` → Build: `dist/react/` → Published: `adapters/react/`
Import: `import { SniceRouter, Route, useSniceContext } from 'snice/react'`

## Components

| Export | Type | Purpose |
|---|---|---|
| `<SniceRouter>` | Component | Root provider. URL state, route matching, guards, layouts, context. |
| `<Route>` | Component | Route definition. Child of `<SniceRouter>`. |
| `<SniceProvider>` | Component | Context provider (standalone, no router needed). |

## Hooks

| Export | Returns | Purpose |
|---|---|---|
| `useSniceContext()` | `SniceReactContext` | Full merged context (`application`, `navigation`, `navigate`, `params`, `route`) |
| `useNavigate()` | `(path) => void` | Programmatic navigation |
| `useParams()` | `Record<string, string>` | Current route params |
| `useRoute()` | `string` | Current matched route pattern |
| `useRequestHandler()` | `void` | Handle @request channels from Snice elements |

## SniceRouter Props

- `mode`: `"hash"` | `"history"` — URL strategy
- `context`: `object` — App context passed to guards, pages, layouts
- `layout`: `Component | string` — Default layout
- `loading`: `Component | string | JSX` — Shown during async guards
- `fallback`: `Component | string | JSX` — No route match

## Route Props

- `path`: Route pattern (e.g., `/users/:id`)
- `page`: React component OR Snice tag name (string)
- `guard`: `(ctx, params) => boolean | Promise<boolean>`
- `guards`: Array of guard functions (AND logic)
- `guardRedirect`: Redirect path on guard failure
- `layout`: Override layout. `false` = no layout
- `placard`: Page metadata for layouts

## Guards

Same signature for both Snice and React:
`(context, params) => boolean | Promise<boolean>`

Async guards show the `loading` component until resolved.

## Context Shape

```typescript
interface SniceReactContext {
  application: Record<string, any>;  // User-defined app state
  navigation: { route: string; params: Record<string, string>; placards: Placard[] };
  navigate: (path: string) => void;
  fetch?: typeof globalThis.fetch;
}
```
```

**Step 2: Update `docs/ai/patterns.md`**

Add a section at the end for React Router usage:

```markdown
## React Router

```tsx
import { SniceRouter, Route, useSniceContext } from 'snice/react';

function App() {
  return (
    <SniceRouter mode="hash" context={{ user, theme: 'dark' }} layout={AppShell}>
      <Route path="/" page={HomePage} />
      <Route path="/settings" page={SettingsPage} guard={authGuard} guardRedirect="/login" />
      <Route path="/legacy" page="legacy-dashboard" />
      <Route path="/login" page={LoginPage} layout={false} />
    </SniceRouter>
  );
}

// Layout
function AppShell({ children }) {
  const ctx = useSniceContext();
  return <div className="shell"><nav>...</nav><main>{children}</main></div>;
}

// Guard (shared with vanilla Snice)
const authGuard = (ctx, params) => !!ctx.principal;
```
```

**Step 3: Commit**

```bash
git add docs/ai/react-integration.md docs/ai/patterns.md
git commit -m "docs: add React integration documentation"
```

### Task 12: Human-Facing Documentation

**Files:**
- Create: `docs/react-integration.md`

**Step 1: Write docs/react-integration.md**

Write the human-friendly version with full examples, matching the design doc's content. Use the design doc at `docs/plans/2026-03-10-react-integration-design.md` as the source. Include:
- Installation/import instructions
- SniceRouter + Route full API
- Guards (sync + async) with examples
- Layouts (React + Snice tag)
- Mixed pages example
- Context hooks
- Comparison with vanilla Snice

**Step 2: Commit**

```bash
git add docs/react-integration.md
git commit -m "docs: add human-friendly React integration guide"
```

### Task 13: Final Build + Test Verification

**Step 1: Full build**

Run: `npm run build:core`
Expected: All builds succeed including React integration

**Step 2: Run all tests**

Run: `npm run build:test && npx vitest run`
Expected: All tests pass

**Step 3: Verify exports**

Run: `ls dist/react/ && ls adapters/react/index.js adapters/react/SniceRouter.js adapters/react/SniceProvider.js`
Expected: All files present

**Step 4: Final commit if needed**

```bash
git add -A
git commit -m "chore: final build verification for React integration"
```

---

## Task Summary

| Task | Description | Dependencies |
|------|-------------|--------------|
| 1 | Update Guard type for async | None |
| 2 | Make vanilla checkGuards async | Task 1 |
| 3 | Async guard tests for vanilla router | Task 2 |
| 4 | SniceProvider + context hooks | None |
| 5 | Route matching utility | None |
| 6 | SniceRouter + Route components | Tasks 4, 5 |
| 7 | React barrel export | Tasks 4, 5, 6 |
| 8 | Rollup build configuration | Task 7 |
| 9 | Integration tests | Tasks 6, 7 |
| 10 | Package.json exports | Task 8 |
| 11 | AI documentation | Task 6 |
| 12 | Human documentation | Task 6 |
| 13 | Final build + test verification | All |

**Parallelizable:** Tasks 1-3 (async guards) can be done independently from Tasks 4-5 (provider + matching). Tasks 11-12 (docs) can be done in parallel.

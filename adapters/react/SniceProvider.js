/*!
 * snice v7.8.0
 * A decorator-driven web component library with routing, controllers, daemons, and 130+ UI components. For better coding-agent results, run npx snice init-ai.
 * (c) 2024
 * Released under the MIT License.
 *
 * GENERATED FILE — DO NOT EDIT. Source: src/. Rebuild: npm run build:core
 */
import { jsx } from 'react/jsx-runtime';
import { createContext, useMemo, useContext } from 'react';

const SniceCtx = createContext(null);
/**
 * Context provider for Snice React integration.
 * Usable standalone without SniceRouter for simpler apps.
 */
function SniceProvider({ context = {}, navigate = () => { }, route = '', params = {}, placards = [], fetch: fetchFn, children, }) {
    const value = useMemo(() => ({
        application: context,
        navigation: { route, params, placards },
        navigate,
        ...(fetchFn ? { fetch: fetchFn } : {}),
    }), [context, navigate, route, params, placards, fetchFn]);
    return jsx(SniceCtx.Provider, { value: value, children: children });
}
/**
 * Returns the full merged Snice context.
 * Mirrors the shape returned by Snice's @context decorator.
 */
function useSniceContext() {
    const ctx = useContext(SniceCtx);
    if (!ctx) {
        throw new Error('useSniceContext must be used within a <SniceProvider> or <SniceRouter>');
    }
    return ctx;
}
/** Convenience: returns just the navigate function */
function useNavigate() {
    return useSniceContext().navigate;
}
/** Convenience: returns current route params */
function useParams() {
    return useSniceContext().navigation.params;
}
/** Convenience: returns current matched route pattern */
function useRoute() {
    return useSniceContext().navigation.route;
}

export { SniceProvider, useNavigate, useParams, useRoute, useSniceContext };
//# sourceMappingURL=SniceProvider.js.map

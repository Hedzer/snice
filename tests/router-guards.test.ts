import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Router, Guard } from './test-imports';

describe('Router Guards', () => {
  let container: HTMLElement;
  let router: ReturnType<typeof Router>;

  beforeEach(() => {
    // Create a container for our test
    container = document.createElement('div');
    container.id = 'app';
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Clean up after each test
    document.body.removeChild(container);
    // Clear custom elements registry would be nice but not possible
    // so we use unique names for each test
  });

  it('should allow navigation when guard returns true', async () => {
    const uniqueName = `allowed-page-${Date.now()}`;
    
    interface AppContext {
      isAuthenticated: boolean;
    }
    
    const guard: Guard<AppContext> = (ctx, _params) => ctx.isAuthenticated;
    
    router = Router({
      target: '#app',
      type: 'hash',
      context: { isAuthenticated: true }
    });
    
    const { page, initialize, navigate } = router;
    
    @page({ 
      tag: uniqueName, 
      routes: ['/protected'],
      guards: guard
    })
    class ProtectedPage extends HTMLElement {
      html() {
        return '<h1>Protected Content</h1>';
      }
    }
    
    initialize();
    await navigate('/protected');
    
    const pageElement = container.querySelector(uniqueName);
    expect(pageElement).toBeTruthy();
    expect(pageElement?.shadowRoot?.innerHTML).toContain('Protected Content');
  });

  it('should deny navigation when guard returns false', async () => {
    const uniqueName = `denied-page-${Date.now()}`;
    
    interface AppContext {
      isAuthenticated: boolean;
    }
    
    const guard: Guard<AppContext> = (ctx, _params) => ctx.isAuthenticated;
    
    router = Router({
      target: '#app',
      type: 'hash',
      context: { isAuthenticated: false }
    });
    
    const { page, initialize, navigate } = router;
    
    @page({ 
      tag: uniqueName, 
      routes: ['/protected'],
      guards: guard
    })
    class ProtectedPage extends HTMLElement {
      html() {
        return '<h1>Protected Content</h1>';
      }
    }
    
    initialize();
    await navigate('/protected');
    
    const pageElement = container.querySelector(uniqueName);
    expect(pageElement).toBeFalsy();
    // Should show default 403
    expect(container.innerHTML).toContain('403');
    expect(container.innerHTML).toContain('Unauthorized');
  });

  it('should support guards with context checks', async () => {
    const uniqueName = `context-page-${Date.now()}`;

    interface AppContext {
      userId: number;
      permissions: string[];
    }

    const permissionGuard: Guard<AppContext> = (ctx, _params) => {
      // Guards now execute synchronously
      return ctx.userId === 123 && ctx.permissions.includes('view-protected');
    };

    router = Router({
      target: '#app',
      type: 'hash',
      context: { userId: 123, permissions: ['view-protected'] }
    });

    const { page, initialize, navigate } = router;

    @page({
      tag: uniqueName,
      routes: ['/context-protected'],
      guards: permissionGuard
    })
    class ContextProtectedPage extends HTMLElement {
      html() {
        return '<h1>Context Protected</h1>';
      }
    }

    initialize();
    await navigate('/context-protected');

    const pageElement = container.querySelector(uniqueName);
    expect(pageElement).toBeTruthy();
    expect(pageElement?.shadowRoot?.innerHTML).toContain('Context Protected');
  });

  it('should support multiple guards (all must pass)', async () => {
    const uniqueName = `multi-guard-page-${Date.now()}`;
    
    interface AppContext {
      isAuthenticated: boolean;
      hasPermission: boolean;
      isActive: boolean;
    }
    
    const isAuthenticated: Guard<AppContext> = (ctx, _params) => ctx.isAuthenticated;
    const hasPermission: Guard<AppContext> = (ctx, _params) => ctx.hasPermission;
    const isActive: Guard<AppContext> = (ctx, _params) => ctx.isActive;
    
    router = Router({
      target: '#app',
      type: 'hash',
      context: { 
        isAuthenticated: true,
        hasPermission: true,
        isActive: true
      }
    });
    
    const { page, initialize, navigate } = router;
    
    @page({ 
      tag: uniqueName, 
      routes: ['/multi-protected'],
      guards: [isAuthenticated, hasPermission, isActive]
    })
    class MultiProtectedPage extends HTMLElement {
      html() {
        return '<h1>Multi Protected</h1>';
      }
    }
    
    initialize();
    await navigate('/multi-protected');
    
    const pageElement = container.querySelector(uniqueName);
    expect(pageElement).toBeTruthy();
    expect(pageElement?.shadowRoot?.innerHTML).toContain('Multi Protected');
  });

  it('should deny if any guard in array fails', async () => {
    const uniqueName = `multi-deny-page-${Date.now()}`;
    
    interface AppContext {
      isAuthenticated: boolean;
      hasPermission: boolean;
      isActive: boolean;
    }
    
    const isAuthenticated: Guard<AppContext> = (ctx, _params) => ctx.isAuthenticated;
    const hasPermission: Guard<AppContext> = (ctx, _params) => ctx.hasPermission;
    const isActive: Guard<AppContext> = (ctx, _params) => ctx.isActive;
    
    router = Router({
      target: '#app',
      type: 'hash',
      context: { 
        isAuthenticated: true,
        hasPermission: false, // This one fails
        isActive: true
      }
    });
    
    const { page, initialize, navigate } = router;
    
    @page({ 
      tag: uniqueName, 
      routes: ['/multi-protected'],
      guards: [isAuthenticated, hasPermission, isActive]
    })
    class MultiProtectedPage extends HTMLElement {
      html() {
        return '<h1>Multi Protected</h1>';
      }
    }
    
    initialize();
    await navigate('/multi-protected');
    
    const pageElement = container.querySelector(uniqueName);
    expect(pageElement).toBeFalsy();
    expect(container.innerHTML).toContain('403');
  });

  it('should use custom 403 page when provided', async () => {
    const protectedName = `protected-403-${Date.now()}`;
    const forbiddenName = `forbidden-403-${Date.now()}`;
    
    interface AppContext {
      canAccess: boolean;
    }
    
    const guard: Guard<AppContext> = (ctx, _params) => ctx.canAccess;
    
    router = Router({
      target: '#app',
      type: 'hash',
      context: { canAccess: false }
    });
    
    const { page, initialize, navigate } = router;
    
    @page({ 
      tag: forbiddenName, 
      routes: ['/403']
    })
    class ForbiddenPage extends HTMLElement {
      html() {
        return '<h1>Access Denied</h1><p>You do not have permission to view this page.</p>';
      }
    }
    
    @page({ 
      tag: protectedName, 
      routes: ['/protected'],
      guards: guard
    })
    class ProtectedPage extends HTMLElement {
      html() {
        return '<h1>Protected</h1>';
      }
    }
    
    initialize();
    await navigate('/protected');
    
    const forbiddenElement = container.querySelector(forbiddenName);
    expect(forbiddenElement).toBeTruthy();
    expect(forbiddenElement?.shadowRoot?.innerHTML).toContain('Access Denied');
    expect(forbiddenElement?.shadowRoot?.innerHTML).toContain('You do not have permission');
  });

  it('should work without context', async () => {
    const uniqueName = `no-context-page-${Date.now()}`;
    
    // Guard that doesn't use context or params
    const alwaysAllowGuard: Guard = (ctx, _params) => true;
    
    router = Router({
      target: '#app',
      type: 'hash'
      // No context provided
    });
    
    const { page, initialize, navigate } = router;
    
    @page({ 
      tag: uniqueName, 
      routes: ['/always-allowed'],
      guards: alwaysAllowGuard
    })
    class AlwaysAllowedPage extends HTMLElement {
      html() {
        return '<h1>Always Allowed</h1>';
      }
    }
    
    initialize();
    await navigate('/always-allowed');
    
    const pageElement = container.querySelector(uniqueName);
    expect(pageElement).toBeTruthy();
  });

  it('should check guards on home route', async () => {
    const homeName = `home-guard-${Date.now()}`;
    
    interface AppContext {
      homeAccess: boolean;
    }
    
    const homeGuard: Guard<AppContext> = (ctx, _params) => ctx.homeAccess;
    
    router = Router({
      target: '#app',
      type: 'hash',
      context: { homeAccess: false }
    });
    
    const { page, initialize, navigate } = router;
    
    @page({ 
      tag: homeName, 
      routes: ['/'],
      guards: homeGuard
    })
    class HomePage extends HTMLElement {
      html() {
        return '<h1>Home</h1>';
      }
    }
    
    initialize();
    await navigate('/');
    
    const homeElement = container.querySelector(homeName);
    expect(homeElement).toBeFalsy();
    expect(container.innerHTML).toContain('403');
  });
});
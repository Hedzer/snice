import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Router, Guard } from './test-imports';

describe('Router Guards with Params', () => {
  let container: HTMLElement;
  let router: ReturnType<typeof Router>;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'app';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should pass route params to guards', async () => {
    const uniqueName = `params-page-${Date.now()}`;
    
    interface AppContext {
      currentUser: { id: number; ownedItems: number[] };
    }
    
    // Guard that checks if user owns the item
    const ownsItem: Guard<AppContext> = (ctx, params) => {
      const itemId = parseInt(params.itemId);
      return ctx.currentUser.ownedItems.includes(itemId);
    };
    
    router = Router({
      target: '#app',
      type: 'hash',
      context: { 
        currentUser: { 
          id: 1, 
          ownedItems: [100, 200, 300] 
        }
      }
    });
    
    const { page, initialize, navigate } = router;
    
    @page({ 
      tag: uniqueName, 
      routes: ['/items/:itemId'],
      guards: ownsItem
    })
    class ItemPage extends HTMLElement {
      html() {
        return '<h1>Item Page</h1>';
      }
    }
    
    initialize();
    
    // Should allow - user owns item 200
    await navigate('/items/200');
    let pageElement = container.querySelector(uniqueName);
    expect(pageElement).toBeTruthy();
    
    // Should deny - user doesn't own item 999
    await navigate('/items/999');
    expect(container.innerHTML).toContain('403');
    expect(container.innerHTML).toContain('Unauthorized');
  });

  it('should pass multiple params to guards', async () => {
    const uniqueName = `multi-params-${Date.now()}`;
    
    interface AppContext {
      currentUser: { 
        id: number; 
        organizations: { [key: string]: string[] };
      };
    }
    
    // Guard that checks organization and project access
    const hasProjectAccess: Guard<AppContext> = (ctx, params) => {
      const { orgId, projectId } = params;
      const orgProjects = ctx.currentUser.organizations[orgId];
      return orgProjects ? orgProjects.includes(projectId) : false;
    };
    
    router = Router({
      target: '#app',
      type: 'hash',
      context: { 
        currentUser: { 
          id: 1,
          organizations: {
            'acme': ['project1', 'project2'],
            'globex': ['project3']
          }
        }
      }
    });
    
    const { page, initialize, navigate } = router;
    
    @page({ 
      tag: uniqueName, 
      routes: ['/orgs/:orgId/projects/:projectId'],
      guards: hasProjectAccess
    })
    class ProjectPage extends HTMLElement {
      html() {
        return '<h1>Project Page</h1>';
      }
    }
    
    initialize();
    
    // Should allow - user has access to acme/project1
    await navigate('/orgs/acme/projects/project1');
    let pageElement = container.querySelector(uniqueName);
    expect(pageElement).toBeTruthy();
    
    // Should deny - user doesn't have access to acme/project3
    await navigate('/orgs/acme/projects/project3');
    expect(container.innerHTML).toContain('403');
  });

  it('should work with guards using params and context', async () => {
    const uniqueName = `sync-params-${Date.now()}`;

    interface AppContext {
      permissions: Record<string, boolean>;
    }

    // Mock permission checks stored in context
    const mockPermissions: Record<string, boolean> = {
      '123': true,
      '456': false,
      '789': true
    };

    // Synchronous guard that checks permission using params
    const canViewDocument: Guard<AppContext> = (ctx, params) => {
      // Guards now execute synchronously, use context for data
      return ctx.permissions[params.docId] || false;
    };

    router = Router({
      target: '#app',
      type: 'hash',
      context: {
        permissions: mockPermissions
      }
    });

    const { page, initialize, navigate } = router;

    @page({
      tag: uniqueName,
      routes: ['/documents/:docId'],
      guards: canViewDocument
    })
    class DocumentPage extends HTMLElement {
      html() {
        return '<h1>Document Page</h1>';
      }
    }

    initialize();

    // Should allow - context has permission for doc 123
    await navigate('/documents/123');
    let pageElement = container.querySelector(uniqueName);
    expect(pageElement).toBeTruthy();

    // Should deny - context has no permission for doc 456
    await navigate('/documents/456');
    expect(container.innerHTML).toContain('403');
  });
});
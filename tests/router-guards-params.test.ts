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

  it('should work with async guards using params', async () => {
    const uniqueName = `async-params-${Date.now()}`;
    
    interface AppContext {
      apiEndpoint: string;
    }
    
    // Mock API responses
    const mockResponses: Record<string, boolean> = {
      '123': true,
      '456': false,
      '789': true
    };
    
    // Async guard that checks permission via API
    const canViewDocument: Guard<AppContext> = async (ctx, params) => {
      // Simulate API call using params
      await new Promise(resolve => setTimeout(resolve, 10));
      return mockResponses[params.docId] || false;
    };
    
    router = Router({
      target: '#app',
      type: 'hash',
      context: { 
        apiEndpoint: '/api'
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
    
    // Should allow - mock API returns true for doc 123
    await navigate('/documents/123');
    let pageElement = container.querySelector(uniqueName);
    expect(pageElement).toBeTruthy();
    
    // Should deny - mock API returns false for doc 456
    await navigate('/documents/456');
    expect(container.innerHTML).toContain('403');
  });
});
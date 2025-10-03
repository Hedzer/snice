import { describe, test, expect, beforeEach, vi } from 'vitest';
import { Router } from '../src/router';
import { Placard } from '../src/types/placard';

describe('Placards', () => {
  let container: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    container.id = 'app';
    document.body.appendChild(container);
  });

  describe('Placard Collection', () => {
    test('collects static placards during initialize', async () => {
      const router = Router({
        target: '#app',
        type: 'hash'
      });

      const staticPlacard = {
        name: 'dashboard',
        title: 'Dashboard',
        description: 'Main dashboard page'
      };

      router.page({
        tag: 'dashboard-page',
        routes: ['/dashboard'],
        placard: staticPlacard
      })(class extends HTMLElement {});

      router.initialize();

      // Verify placard was collected by testing layout update
      const layoutUpdateSpy = vi.fn();

      class TestLayout extends HTMLElement {
        update(appContext: any, placards: Placard[], currentRoute: string, routeParams: any) {
          layoutUpdateSpy(appContext, placards, currentRoute, routeParams);
        }
      }

      customElements.define('test-layout', TestLayout);

      const layoutRouter = Router({
        target: '#app',
        type: 'hash',
        layout: 'test-layout'
      });

      layoutRouter.page({
        tag: 'test-page',
        routes: ['/test'],
        placard: staticPlacard
      })(class extends HTMLElement {});

      layoutRouter.initialize();
      await layoutRouter.navigate('/test');

      expect(layoutUpdateSpy).toHaveBeenCalled();
      const [, placards] = layoutUpdateSpy.mock.calls[0];

      // Placards are now synchronous
      expect(placards).toHaveLength(1);
      expect(placards[0]).toEqual(staticPlacard);
    });

    test('collects dynamic placards during initialize', async () => {
      const router = Router({
        target: '#app',
        type: 'hash'
      });

      const dynamicPlacard = (context: any) => ({
        name: 'user-profile',
        title: `Profile - ${context.currentUser || 'Guest'}`,
        description: 'User profile page'
      });

      router.page({
        tag: 'profile-page',
        routes: ['/profile'],
        placard: dynamicPlacard
      })(class extends HTMLElement {});

      const layoutUpdateSpy = vi.fn();

      class DynamicTestLayout extends HTMLElement {
        update(appContext: any, placards: Placard[], currentRoute: string, routeParams: any) {
          layoutUpdateSpy(appContext, placards, currentRoute, routeParams);
        }
      }

      customElements.define('dynamic-test-layout', DynamicTestLayout);

      const layoutRouter = Router({
        target: '#app',
        type: 'hash',
        layout: 'dynamic-test-layout',
        context: { currentUser: 'John' }
      });

      layoutRouter.page({
        tag: 'dynamic-test-page',
        routes: ['/dynamic-test'],
        placard: dynamicPlacard
      })(class extends HTMLElement {});

      layoutRouter.initialize();
      await layoutRouter.navigate('/dynamic-test');

      expect(layoutUpdateSpy).toHaveBeenCalled();
      const [, placards] = layoutUpdateSpy.mock.calls[0];

      // Placards are now synchronous
      expect(placards).toHaveLength(1);
      expect(placards[0]).toEqual({
        name: 'user-profile',
        title: 'Profile - John',
        description: 'User profile page'
      });
    });

    test('handles pages without placards', async () => {
      const layoutUpdateSpy = vi.fn();

      class EmptyLayout extends HTMLElement {
        update(appContext: any, placards: Placard[], currentRoute: string, routeParams: any) {
          layoutUpdateSpy(appContext, placards, currentRoute, routeParams);
        }
      }

      customElements.define('empty-layout', EmptyLayout);

      const router = Router({
        target: '#app',
        type: 'hash',
        layout: 'empty-layout'
      });

      // Page without placard
      router.page({
        tag: 'no-placard-page',
        routes: ['/no-placard']
      })(class extends HTMLElement {});

      router.initialize();
      await router.navigate('/no-placard');

      expect(layoutUpdateSpy).toHaveBeenCalled();
      const [, placards] = layoutUpdateSpy.mock.calls[0];

      expect(placards).toHaveLength(0);
    });
  });

  describe('Layout Update Calls', () => {
    test('calls layout update method when layout is created', async () => {
      const updateSpy = vi.fn();

      class TestLayoutUpdate extends HTMLElement {
        update(appContext: any, placards: Placard[], currentRoute: string, routeParams: any) {
          updateSpy(appContext, placards, currentRoute, routeParams);
        }
      }

      customElements.define('test-layout-update', TestLayoutUpdate);

      const router = Router({
        target: '#app',
        type: 'hash',
        layout: 'test-layout-update'
      });

      const testPlacard = {
        name: 'test',
        title: 'Test Page'
      };

      router.page({
        tag: 'update-test-page',
        routes: ['/update-test'],
        placard: testPlacard
      })(class extends HTMLElement {});

      router.initialize();
      await router.navigate('/update-test');

      expect(updateSpy).toHaveBeenCalled();
      const [appContext, placards, currentRoute, routeParams] = updateSpy.mock.calls[updateSpy.mock.calls.length - 1];

      expect(currentRoute).toBe('/update-test');
      expect(routeParams).toEqual({});
      expect(placards).toHaveLength(1);

      // Placards are now synchronous
      expect(placards[0]).toEqual(testPlacard);
    });

    test('calls layout update method on route changes', async () => {
      const updateSpy = vi.fn();

      class RouteChangeLayout extends HTMLElement {
        update(appContext: any, placards: Placard[], currentRoute: string, routeParams: any) {
          updateSpy(appContext, placards, currentRoute, routeParams);
        }
      }

      customElements.define('route-change-layout', RouteChangeLayout);

      const router = Router({
        target: '#app',
        type: 'hash',
        layout: 'route-change-layout'
      });

      router.page({
        tag: 'page-one',
        routes: ['/one'],
        placard: { name: 'one', title: 'Page One' }
      })(class extends HTMLElement {});

      router.page({
        tag: 'page-two',
        routes: ['/two'],
        placard: { name: 'two', title: 'Page Two' }
      })(class extends HTMLElement {});

      router.initialize();

      // First navigation
      await router.navigate('/one');
      expect(updateSpy).toHaveBeenCalled();
      let lastCall = updateSpy.mock.calls[updateSpy.mock.calls.length - 1];
      expect(lastCall[2]).toBe('/one');

      const callCountAfterFirst = updateSpy.mock.calls.length;

      // Second navigation
      await router.navigate('/two');
      expect(updateSpy.mock.calls.length).toBeGreaterThan(callCountAfterFirst);
      lastCall = updateSpy.mock.calls[updateSpy.mock.calls.length - 1];
      expect(lastCall[2]).toBe('/two');
    });

    test('does not call update if layout does not implement method', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      class NoUpdateLayout extends HTMLElement {
        // No update method
      }

      customElements.define('no-update-layout', NoUpdateLayout);

      const router = Router({
        target: '#app',
        type: 'hash',
        layout: 'no-update-layout'
      });

      router.page({
        tag: 'no-update-page',
        routes: ['/no-update']
      })(class extends HTMLElement {});

      router.initialize();
      await router.navigate('/no-update');

      // Should not throw or log errors
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Route Parameters', () => {
    test('passes route parameters to layout update', async () => {
      const updateSpy = vi.fn();

      class ParamsLayout extends HTMLElement {
        update(appContext: any, placards: Placard[], currentRoute: string, routeParams: any) {
          updateSpy(appContext, placards, currentRoute, routeParams);
        }
      }

      customElements.define('params-layout', ParamsLayout);

      const router = Router({
        target: '#app',
        type: 'hash',
        layout: 'params-layout'
      });

      router.page({
        tag: 'params-page',
        routes: ['/users/:userId/posts/:postId'],
        placard: { name: 'post', title: 'User Post' }
      })(class extends HTMLElement {});

      router.initialize();
      await router.navigate('/users/123/posts/456');

      expect(updateSpy).toHaveBeenCalled();
      const [, , currentRoute, routeParams] = updateSpy.mock.calls[updateSpy.mock.calls.length - 1];

      expect(currentRoute).toBe('/users/123/posts/456');
      expect(routeParams).toEqual({
        userId: '123',
        postId: '456'
      });
    });

    test('passes empty route parameters for non-parameterized routes', async () => {
      const updateSpy = vi.fn();

      class SimpleLayout extends HTMLElement {
        update(appContext: any, placards: Placard[], currentRoute: string, routeParams: any) {
          updateSpy(appContext, placards, currentRoute, routeParams);
        }
      }

      customElements.define('simple-layout', SimpleLayout);

      const router = Router({
        target: '#app',
        type: 'hash',
        layout: 'simple-layout'
      });

      router.page({
        tag: 'simple-page',
        routes: ['/dashboard']
      })(class extends HTMLElement {});

      router.initialize();
      await router.navigate('/dashboard');

      expect(updateSpy).toHaveBeenCalled();
      const [, , , routeParams] = updateSpy.mock.calls[updateSpy.mock.calls.length - 1];

      expect(routeParams).toEqual({});
    });
  });

  describe('Placard Resolution', () => {
    test('resolves placard functions synchronously', async () => {
      const updateSpy = vi.fn();

      class AsyncLayout extends HTMLElement {
        update(appContext: any, placards: Placard[], currentRoute: string, routeParams: any) {
          updateSpy(appContext, placards, currentRoute, routeParams);
        }
      }

      customElements.define('async-layout', AsyncLayout);

      const router = Router({
        target: '#app',
        type: 'hash',
        layout: 'async-layout',
        context: { fetchedData: 'async-result' }
      });

      const dynamicPlacard = (context: any) => {
        return {
          name: 'dynamic-page',
          title: `Dynamic: ${context.fetchedData}`,
          description: 'Dynamic placard'
        };
      };

      router.page({
        tag: 'dynamic-page',
        routes: ['/dynamic'],
        placard: dynamicPlacard
      })(class extends HTMLElement {});

      router.initialize();
      await router.navigate('/dynamic');

      expect(updateSpy).toHaveBeenCalled();
      const [, placards] = updateSpy.mock.calls[updateSpy.mock.calls.length - 1];

      // Placards are resolved synchronously
      expect(placards).toHaveLength(1);
      expect(placards[0]).toEqual({
        name: 'dynamic-page',
        title: 'Dynamic: async-result',
        description: 'Dynamic placard'
      });
    });

    test('handles mixed static and dynamic placards', async () => {
      const updateSpy = vi.fn();

      class MixedLayout extends HTMLElement {
        update(appContext: any, placards: Placard[], currentRoute: string, routeParams: any) {
          updateSpy(appContext, placards, currentRoute, routeParams);
        }
      }

      customElements.define('mixed-layout', MixedLayout);

      const router = Router({
        target: '#app',
        type: 'hash',
        layout: 'mixed-layout',
        context: { user: 'Alice' }
      });

      // Static placard
      router.page({
        tag: 'static-page',
        routes: ['/static'],
        placard: { name: 'static', title: 'Static Page' }
      })(class extends HTMLElement {});

      // Dynamic placard
      router.page({
        tag: 'dynamic-page',
        routes: ['/dynamic'],
        placard: (ctx: any) => ({ name: 'dynamic', title: `Hello ${ctx.user}` })
      })(class extends HTMLElement {});

      router.initialize();
      await router.navigate('/static');

      expect(updateSpy).toHaveBeenCalled();
      const [, placards] = updateSpy.mock.calls[updateSpy.mock.calls.length - 1];

      expect(placards).toHaveLength(2);

      // Placards are now synchronously resolved
      expect(placards).toContainEqual({ name: 'static', title: 'Static Page' });
      expect(placards).toContainEqual({ name: 'dynamic', title: 'Hello Alice' });
    });
  });
});
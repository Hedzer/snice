import { describe, it, expect } from 'vitest';
import { matchRoutes, type RouteConfig } from '../../packages/react/src/matchRoute';

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

  it('prefers a static route over a param route regardless of pattern length', () => {
    // /post/:identifier is a LONGER string than /post/new, but /post/new is
    // more specific and must win for that exact path.
    const rs: RouteConfig[] = [
      { path: '/post/:identifier', index: 0 },
      { path: '/post/new', index: 1 },
    ];
    expect(matchRoutes(rs, '/post/new')!.index).toBe(1);
    expect(matchRoutes(rs, '/post/42')!.index).toBe(0); // param still catches others
  });

  it('ranks a wildcard/splat route last even when its pattern is longer', () => {
    const rs: RouteConfig[] = [
      { path: '/files/*catchall', index: 0 },
      { path: '/files/x', index: 1 },
    ];
    expect(matchRoutes(rs, '/files/x')!.index).toBe(1);   // static beats splat
    expect(matchRoutes(rs, '/files/a/b')!.index).toBe(0); // splat catches the rest
  });

  it('resolves a realistic mixed table by specificity, independent of registration order', () => {
    // Deliberately registered worst-first to prove order doesn't matter.
    const rs: RouteConfig[] = [
      { path: '/:section', index: 0 },          // dynamic, 1 segment
      { path: '/blog/*rest', index: 1 },        // wildcard
      { path: '/blog/:slug', index: 2 },        // dynamic, 2 segments
      { path: '/blog/archive', index: 3 },      // static, 2 segments
    ];
    expect(matchRoutes(rs, '/blog/archive')!.index).toBe(3); // static wins
    expect(matchRoutes(rs, '/blog/hello')!.index).toBe(2);   // dynamic beats wildcard
    expect(matchRoutes(rs, '/blog/a/b/c')!.index).toBe(1);   // only wildcard matches
    expect(matchRoutes(rs, '/about')!.index).toBe(0);        // single dynamic segment
  });

  it('keeps registration order as the tie-break for equally specific routes', () => {
    const rs: RouteConfig[] = [
      { path: '/:a/:b', index: 0 },
      { path: '/:c/:d', index: 1 },
    ];
    // Same specificity → first registered wins (stable sort).
    expect(matchRoutes(rs, '/x/y')!.index).toBe(0);
  });

  it('uses optional order before registration order when specificity ties', () => {
    const rs: RouteConfig[] = [
      { path: '/:a/:b', index: 0, order: 10 },
      { path: '/:c/:d', index: 1, order: -10 },
    ];
    expect(matchRoutes(rs, '/x/y')!.index).toBe(1);
  });

  it('rejects a non-finite route order', () => {
    expect(() => matchRoutes([
      { path: '/broken', index: 0, order: Number.NaN },
    ], '/broken')).toThrow('must be a finite number');
  });

  describe('full resolution matrix (a realistic app route table)', () => {
    // A table that exercises every collision the scorer must resolve.
    const table: RouteConfig[] = [
      { path: '/', index: 0 },
      { path: '/users', index: 1 },
      { path: '/users/new', index: 2 },
      { path: '/users/:id', index: 3 },
      { path: '/users/:id/edit', index: 4 },
      { path: '/users/:id/posts/:postId', index: 5 },
      { path: '/about', index: 6 },
      { path: '/files/*path', index: 7 },
      { path: '/:catchAll', index: 8 }, // single dynamic segment
    ];

    // [url, expected index, expected params]
    const matrix: Array<[string, number, Record<string, string>]> = [
      ['/', 0, {}],
      ['/users', 1, {}],                                  // static beats /:catchAll
      ['/users/new', 2, {}],                              // static beats /users/:id
      ['/users/42', 3, { id: '42' }],                     // /users/new doesn't match
      ['/users/42/edit', 4, { id: '42' }],
      ['/users/42/posts/99', 5, { id: '42', postId: '99' }],
      ['/about', 6, {}],                                  // static beats /:catchAll
      ['/files/a/b/c', 7, { path: 'a/b/c' }],             // only the splat matches
      ['/anything-else', 8, { catchAll: 'anything-else' }], // single dynamic segment
    ];

    it.each(matrix)('resolves %s → index %i', (url, index, params) => {
      const result = matchRoutes(table, url);
      expect(result).not.toBeNull();
      expect(result!.index).toBe(index);
      expect(result!.params).toEqual(params);
    });

    it('returns the SAME resolution no matter what order routes were registered', () => {
      const shuffles = [
        [...table],
        [...table].reverse(),
        // rotate
        [...table.slice(4), ...table.slice(0, 4)],
      ];
      for (const [url, index] of matrix) {
        for (const order of shuffles) {
          expect(matchRoutes(order, url)!.index).toBe(index);
        }
      }
    });
  });

  describe('known shadowing bugs stay fixed', () => {
    const cases: Array<[string, string, string, string]> = [
      // [staticPath, paramPath, urlHittingStatic, urlHittingParam]
      ['/post/new', '/post/:id', '/post/new', '/post/42'],
      ['/users/me', '/users/:id', '/users/me', '/users/7'],
      ['/settings/billing', '/settings/:tab', '/settings/billing', '/settings/general'],
    ];
    it.each(cases)('%s is reachable alongside %s', (staticPath, paramPath, hitStatic, hitParam) => {
      const rs: RouteConfig[] = [
        { path: paramPath, index: 0 },  // param registered first (worst case)
        { path: staticPath, index: 1 },
      ];
      expect(matchRoutes(rs, hitStatic)!.index).toBe(1); // static reachable
      expect(matchRoutes(rs, hitParam)!.index).toBe(0);  // param still works
    });
  });
});

// vite.config.ts
import { defineConfig } from 'vite';
import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import swc from 'unplugin-swc';

function componentRebuilder() {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let building = false;
  return {
    name: 'component-rebuilder',
    configureServer(server: any) {
      server.watcher.on('change', (changedPath: string) => {
        if (!(changedPath.includes('/packages/components/src/') || changedPath.includes('/packages/core/src/') || changedPath.includes('/packages/react/src/')) ||
            changedPath.includes('node_modules') || changedPath.includes('/dist/') || changedPath.includes('/website/public/')) return;
        if (!changedPath.match(/\.(ts|css)$/)) return;
        if (changedPath.endsWith('.stories.ts')) return;

        if (timer) clearTimeout(timer);
        timer = setTimeout(async () => {
          if (building) return;
          building = true;
          const file = changedPath.split('/').pop();

          // Extract component name from .../packages/components/src/<name>/...
          const compMatch = changedPath.match(/\/packages\/components\/src\/([^/]+)\//);

          if (compMatch && compMatch[1] !== 'theme') {
            // Single component change — incremental rebuild
            const compName = compMatch[1];
            console.log(`\n  ${file} changed — rebuilding ${compName}...`);
            try {
              execSync(`node tooling/build/rebuild-single-component.mjs ${compName}`, { stdio: 'inherit' });
              console.log(`  ✓ ${compName} rebuilt`);
            } catch (e) {
              console.error(`  ✗ ${compName} rebuild failed`);
            }
          } else {
            // Core, React, or theme change — full rebuild
            console.log(`\n  ${file} changed — full rebuild...`);
            try {
              execSync('npm run build:distribution && npm run build:cdn && npm run build:website', { stdio: 'inherit' });
              console.log('  ✓ Full rebuild complete');
            } catch (e) {
              console.error('  ✗ Full rebuild failed');
            }
          }
          building = false;
        }, 2000);
      });
    },
  };
}

function cacheHeaders() {
  return {
    name: 'cache-headers',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        res.setHeader('Cache-Control', 'no-store');
        next();
      });
    },
  };
}

function servePublicIndex() {
  return {
    name: 'serve-public-index',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.url === '/' || req.url === '/index.html') {
          try {
            const html = readFileSync(join(server.config.publicDir, 'index.html'), 'utf-8');
            server.transformIndexHtml(req.url, html).then((transformed: string) => {
              res.setHeader('Content-Type', 'text/html');
              res.end(transformed);
            }).catch(() => {
              res.setHeader('Content-Type', 'text/html');
              res.end(html);
            });
          } catch {
            next();
          }
          return;
        }
        next();
      });
    },
  };
}

/** Keep long-standing component demo URLs working after moving their sources. */
function legacyShowcaseRoutes() {
  return {
    name: 'legacy-showcase-routes',
    configureServer(server: any) {
      server.middlewares.use((req: any, _res: any, next: any) => {
        const url = req.url?.split('?', 1)[0] ?? '';
        const match = url.match(/^\/components\/([^/]+)\/([^/]+\.html)$/);
        if (!match) return next();

        const [, component, requestedFile] = match;
        // The long-standing live-test/customer URLs use both demo.html and
        // full-showcase.html for the same standalone showcase document.
        const legacyDemo = join(server.config.root, 'website', 'showcases', component, 'demo.html');
        const file = requestedFile === 'demo.html' && existsSync(legacyDemo)
          ? 'demo.html'
          : requestedFile === 'demo.html' || requestedFile === 'full-showcase.html'
            ? 'full.html'
            : requestedFile;
        const source = join(server.config.root, 'website', 'showcases', component, file);
        if (existsSync(source)) req.url = `/website/showcases/${component}/${file}`;
        next();
      });

      server.middlewares.use((req: any, _res: any, next: any) => {
        const url = req.url?.split('?', 1)[0] ?? '';
        const match = url.match(/^\/components\/([^/]+)\/(.+\.(?:ts|css))$/);
        if (!match) return next();
        const [, component, file] = match;
        const source = join(server.config.root, 'packages', 'components', 'src', component, file);
        if (existsSync(source)) req.url = `/packages/components/src/${component}/${file}`;
        next();
      });
    },
  };
}

function showcaseRebuilder() {
  return {
    name: 'showcase-rebuilder',
    configureServer(server) {
      server.watcher.on('change', (changedPath) => {
        const normalizedPath = changedPath.replaceAll('\\', '/');
        // Only source showcase edits trigger regeneration. The generated
        // website/public/showcases compatibility tree is also watched by Vite;
        // reacting to it recursively launches competing rebuilds.
        if (!normalizedPath.includes('/website/showcases/')) return;

        console.log(`\n  Showcase source changed: ${normalizedPath.split('/').pop()}`);
        try {
          execSync('node tooling/website/build-showcases.js', { stdio: 'inherit' });
        } catch {}
      });
    },
    buildStart() {
      try {
        execSync('node tooling/website/build-showcases.js', { stdio: 'inherit' });
      } catch {}
    },
  };
}

export default defineConfig({
  publicDir: process.env.SNICE_TEST_PUBLIC_DIR || 'website/public',
  plugins: [
    swc.vite({
      jsc: {
        parser: {
          syntax: 'typescript',
          decorators: true,
        },
        target: 'es2022',
        transform: {
          decoratorMetadata: false,
          decoratorVersion: '2022-03',
          useDefineForClassFields: false,
        },
      },
    }),
    legacyShowcaseRoutes(),
    servePublicIndex(),
    cacheHeaders(),
    showcaseRebuilder(),
    componentRebuilder(),
  ],
  server: {
    port: 5566,
    strictPort: true,
    // Coverage reports are generated inside the repository during the full
    // suite. They are not application inputs and must not reload browser-test
    // pages while independent validation gates run concurrently.
    watch: {
      ignored: [
        '**/coverage/**',
        ...(process.env.SNICE_TEST_PUBLIC_DIR
          ? ['**/website/public/**', '**/dist/site/**']
          : []),
      ],
    },
  },
  optimizeDeps: {
    exclude: ['snice', 'snice/router'],
    entries: ['website/public/**/*.html', 'website/showcases/**/*.html'],
  },
});

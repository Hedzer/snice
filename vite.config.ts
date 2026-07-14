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
        if (!(changedPath.includes('/components/') || changedPath.includes('/src/')) ||
            changedPath.includes('node_modules') || changedPath.includes('/dist/') || changedPath.includes('/website/public/')) return;
        if (!changedPath.match(/\.(ts|css)$/)) return;
        if (changedPath.endsWith('.stories.ts')) return;

        if (timer) clearTimeout(timer);
        timer = setTimeout(async () => {
          if (building) return;
          building = true;
          const file = changedPath.split('/').pop();

          // Extract component name from path like .../components/<name>/...
          const compMatch = changedPath.match(/\/components\/([^/]+)\//);

          if (compMatch && compMatch[1] !== 'theme') {
            // Single component change — incremental rebuild
            const compName = compMatch[1];
            console.log(`\n  ${file} changed — rebuilding ${compName}...`);
            try {
              execSync(`node scripts/rebuild-single-component.mjs ${compName}`, { stdio: 'inherit' });
              console.log(`  ✓ ${compName} rebuilt`);
            } catch (e) {
              console.error(`  ✗ ${compName} rebuild failed`);
            }
          } else {
            // src/ or theme change — full rebuild
            console.log(`\n  ${file} changed — full rebuild...`);
            try {
              execSync('npm run build:core && npm run build:cdn && node tooling/website/build-website.js', { stdio: 'inherit' });
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
            const html = readFileSync(join(server.config.root, 'website', 'public', 'index.html'), 'utf-8');
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
        const file = requestedFile === 'full-showcase.html' ? 'full.html' : requestedFile;
        const source = join(server.config.root, 'website', 'showcases', component, file);
        if (existsSync(source)) req.url = `/website/showcases/${component}/${file}`;
        next();
      });
    },
  };
}

function showcaseRebuilder() {
  return {
    name: 'showcase-rebuilder',
    configureServer(server) {
      server.watcher.on('change', (path) => {
        if (path.includes('showcases/') && !path.endsWith('components.html')) {
          console.log(`\n  Showcase fragment changed: ${path.split('/').pop()}`);
          try {
            execSync('node tooling/website/build-showcases.js', { stdio: 'inherit' });
          } catch {}
        }
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
  publicDir: 'website/public',
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
  },
  optimizeDeps: {
    exclude: ['snice', 'snice/router'],
    entries: ['website/public/**/*.html', 'website/showcases/**/*.html'],
  },
});

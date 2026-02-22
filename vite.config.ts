// vite.config.ts
import { defineConfig } from 'vite';
import { execSync } from 'child_process';
import swc from 'unplugin-swc';

function componentRebuilder() {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let building = false;
  return {
    name: 'component-rebuilder',
    configureServer(server: any) {
      server.watcher.on('change', (path: string) => {
        if (!(path.includes('/components/') || path.includes('/src/')) ||
            path.includes('node_modules') || path.includes('/dist/') || path.includes('/public/')) return;
        if (!path.match(/\.(ts|css)$/)) return;

        if (timer) clearTimeout(timer);
        timer = setTimeout(async () => {
          if (building) return;
          building = true;
          const file = path.split('/').pop();
          console.log(`\n  Component source changed: ${file} — rebuilding...`);
          try {
            execSync('npm run build:core && npm run build:cdn && node scripts/build-website.js', { stdio: 'inherit' });
            console.log('  ✓ Component rebuild complete');
          } catch (e) {
            console.error('  ✗ Component rebuild failed');
          }
          building = false;
        }, 2000);
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
            execSync('node public/build-showcases.js', { stdio: 'inherit' });
          } catch {}
        }
      });
    },
    buildStart() {
      try {
        execSync('node public/build-showcases.js', { stdio: 'inherit' });
      } catch {}
    },
  };
}

export default defineConfig({
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
    showcaseRebuilder(),
    componentRebuilder(),
  ],
  server: {
    port: 5566,
    strictPort: true,
  },
  optimizeDeps: {
    exclude: ['snice', 'snice/router'],
    entries: ['public/**/*.html'],
  },
});

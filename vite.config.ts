// vite.config.ts
import { defineConfig } from 'vite';
import { execSync } from 'child_process';
import swc from 'unplugin-swc';

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

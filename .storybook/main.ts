import type { StorybookConfig } from '@storybook/html-vite';
import swc from 'unplugin-swc';

const config: StorybookConfig = {
  framework: '@storybook/html-vite',
  stories: ['../components/**/snice-*.stories.ts'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  staticDirs: [
    { from: '../dist/components', to: '/snice-components' },
    { from: '../components/theme', to: '/snice-components/theme' },
    { from: '../public', to: '/public' },
  ],
  async viteFinal(cfg) {
    cfg.plugins = cfg.plugins || [];
    // Drop Snice dev-only plugins that aren't relevant in Storybook:
    // - component-rebuilder watches components/**/*.ts and runs `npm run build:core`,
    //   which would recompile Storybook story files via rollup and fail on `import type`.
    // - showcase-rebuilder rebuilds public/components.html from fragments (not needed here).
    // - serve-public-index / cache-headers are for the main dev server's root page.
    const dropNames = new Set([
      'component-rebuilder',
      'showcase-rebuilder',
      'serve-public-index',
      'cache-headers',
    ]);
    cfg.plugins = cfg.plugins.filter((p: any) => {
      if (!p) return false;
      if (Array.isArray(p)) return true;
      return !dropNames.has(p.name);
    });
    cfg.plugins.push(
      swc.vite({
        jsc: {
          parser: { syntax: 'typescript', decorators: true },
          target: 'es2022',
          transform: {
            decoratorMetadata: false,
            decoratorVersion: '2022-03',
            useDefineForClassFields: false,
          },
        },
      }),
    );
    cfg.optimizeDeps = cfg.optimizeDeps || {};
    cfg.optimizeDeps.exclude = [
      ...(cfg.optimizeDeps.exclude || []),
      'snice',
      'snice/symbols',
      'snice/transitions',
      'snice/router',
    ];
    return cfg;
  },
};

export default config;

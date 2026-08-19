import type { StorybookConfig } from '@storybook/html-vite';
import swc from 'unplugin-swc';

const config: StorybookConfig = {
  framework: '@storybook/html-vite',
  stories: ['../packages/components/src/**/snice-*.stories.ts'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  staticDirs: [
    { from: '../dist/components', to: '/snice-components' },
    { from: '../packages/components/src/theme', to: '/snice-components/theme' },
    { from: '../website/public', to: '/public' },
  ],
  async viteFinal(cfg) {
    cfg.plugins = cfg.plugins || [];
    // Drop Snice dev-only plugins that aren't relevant in Storybook:
    // - component-rebuilder watches packages/components/src/**/*.ts,
    //   which would recompile Storybook story files via rollup and fail on `import type`.
    // - showcase-rebuilder rebuilds website/public/components.html (not needed here).
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
    // Storybook's own `server` config replaces the root vite.config.ts one,
    // so the watch ignores do not carry over. `.local` is gitignored local
    // evidence (gauntlet corpora, model weights) — tens of thousands of
    // directories that are not Storybook inputs and would exhaust the
    // inotify quota.
    cfg.server = cfg.server || {};
    cfg.server.watch = {
      ...(cfg.server.watch || {}),
      ignored: [
        '**/coverage/**',
        '**/.local/**',
        ...((cfg.server.watch as any)?.ignored ?? []),
      ],
    };
    return cfg;
  },
};

export default config;

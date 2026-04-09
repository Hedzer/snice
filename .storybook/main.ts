import type { StorybookConfig } from '@storybook/web-components-vite';
import swc from 'unplugin-swc';

const config: StorybookConfig = {
  framework: '@storybook/web-components-vite',
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

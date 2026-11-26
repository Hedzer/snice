import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const packageJson = require('./package.json');

const banner = `/*!
 * ${packageJson.name} v${packageJson.version}
 * ${packageJson.description}
 * (c) 2024
 * Released under the ${packageJson.license} License.
 *
 * GENERATED FILE — DO NOT EDIT. Source: packages/plugin/src/. Rebuild: npm run build:plugin
 */`;

function failOnPluginCircularDependency(warning, warn) {
  if (warning.code === 'CIRCULAR_DEPENDENCY') {
    throw new Error(`Plugin build circular dependency: ${warning.message}`);
  }
  warn(warning);
}

// Stage-1 clean bootstrap build: emits dist/plugin/{vite,rollup}.js before
// rollup.config.js dogfoods dist/plugin/rollup.js on dist/components/.
export default {
  input: {
    vite: 'packages/plugin/src/vite.ts',
    rollup: 'packages/plugin/src/rollup.ts',
  },
  external: (id) =>
    id.startsWith('node:') ||
    id === 'vite' ||
    id === 'rollup' ||
    id === '@babel/parser' ||
    id === 'magic-string',
  onwarn: failOnPluginCircularDependency,
  output: {
    dir: 'dist/plugin',
    format: 'es',
    banner,
    sourcemap: true,
    sourcemapPathTransform: (sourcePath) =>
      sourcePath.replace(/packages\/packages\/plugin\/src/g, 'packages/plugin/src'),
    entryFileNames: '[name].js',
    chunkFileNames: '_chunks/[name].js',
  },
  plugins: [
    resolve(),
    typescript({
      tsconfig: './packages/plugin/tsconfig.json',
      declaration: true,
    }),
  ],
};

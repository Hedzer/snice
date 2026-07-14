import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const packageJson = require('./package.json');

const banner = `/*!
 * ${packageJson.name} v${packageJson.version} - Testing Build
 * ${packageJson.description}
 * (c) 2024
 * Released under the ${packageJson.license} License.
 */`;

// Rollup resolves these paths relative to the package-local tsconfig before
// applying the transform. Preserve the historical published map paths even
// though the source now lives under packages/core/.
const legacySourceMapPath = (sourcePath) => sourcePath
  .replace(/packages\/core\/packages\/core\/src/g, 'src')
  .replace(/packages\/core\/src/g, 'src')
  .replace(/^(\.\.\/node_modules\/)/, '../../$1');

export default {
  input: 'packages/core/src/testing.ts',
  external: [],
  output: {
    file: 'dist/testing.esm.js',
    format: 'es',
    banner,
    sourcemap: true,
    sourcemapPathTransform: legacySourceMapPath
  },
  plugins: [
    resolve(),
    typescript({
      tsconfig: './packages/core/tsconfig.json',
      declaration: true,
      declarationDir: './dist/types'
    })
  ]
};

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

export default {
  input: 'src/testing.ts',
  external: [],
  output: {
    file: 'dist/testing.esm.js',
    format: 'es',
    banner,
    sourcemap: true
  },
  plugins: [
    resolve(),
    typescript({
      tsconfig: './tsconfig.src.json',
      declaration: true,
      declarationDir: './dist/types',
      rootDir: './src'
    })
  ]
};
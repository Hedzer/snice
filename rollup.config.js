import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const packageJson = require('./package.json');

const banner = `/*!
 * ${packageJson.name} v${packageJson.version}
 * ${packageJson.description}
 * (c) 2024
 * Released under the ${packageJson.license} License.
 */`;


const baseConfig = {
  input: 'src/index.ts',
  external: [],
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

const createSubmoduleConfig = (name) => ({
  input: `src/${name}.ts`,
  external: [],
  plugins: [
    resolve(),
    typescript({
      tsconfig: './tsconfig.src.json',
      declaration: true,
      declarationDir: './dist/types',
      rootDir: './src'
    })
  ]
});

export default [
  // ESM build
  {
    ...baseConfig,
    output: {
      file: 'dist/index.esm.js',
      format: 'es',
      banner,
      sourcemap: true
    },
    plugins: [
      ...baseConfig.plugins
    ]
  },

  // ESM minified
  {
    ...baseConfig,
    output: {
      file: 'dist/index.esm.min.js',
      format: 'es',
      banner,
      sourcemap: true
    },
    plugins: [
      ...baseConfig.plugins,
      terser({
        output: {
          comments: /^!/
        }
      })
    ]
  },

  // CommonJS build
  {
    ...baseConfig,
    output: {
      file: 'dist/index.cjs',
      format: 'cjs',
      banner,
      sourcemap: true,
      exports: 'named'
    },
    plugins: [
      resolve(),
      typescript({
        tsconfig: './tsconfig.src.json',
        declaration: false
      })
    ]
  },

  // CommonJS minified
  {
    ...baseConfig,
    output: {
      file: 'dist/index.cjs.min',
      format: 'cjs',
      banner,
      sourcemap: true,
      exports: 'named'
    },
    plugins: [
      resolve(),
      typescript({
        tsconfig: './tsconfig.src.json',
        declaration: false
      }),
      terser({
        output: {
          comments: /^!/
        }
      })
    ]
  },

  // IIFE build for browsers
  {
    ...baseConfig,
    output: {
      file: 'dist/index.iife.js',
      format: 'iife',
      name: 'Snice',
      banner,
      sourcemap: true,
      exports: 'named'
    },
    plugins: [
      resolve(),
      typescript({
        tsconfig: './tsconfig.src.json',
        declaration: false
      })
    ]
  },

  // IIFE minified
  {
    ...baseConfig,
    output: {
      file: 'dist/index.iife.min.js',
      format: 'iife',
      name: 'Snice',
      banner,
      sourcemap: true,
      exports: 'named'
    },
    plugins: [
      resolve(),
      typescript({
        tsconfig: './tsconfig.src.json',
        declaration: false
      }),
      terser({
        output: {
          comments: /^!/
        }
      })
    ]
  },

  // Symbols ESM build
  {
    ...createSubmoduleConfig('symbols'),
    output: {
      file: 'dist/symbols.esm.js',
      format: 'es',
      banner,
      sourcemap: true
    }
  },

  // Symbols CommonJS build
  {
    ...createSubmoduleConfig('symbols'),
    output: {
      file: 'dist/symbols.cjs',
      format: 'cjs',
      banner,
      sourcemap: true,
      exports: 'named'
    },
    plugins: [
      resolve(),
      typescript({
        tsconfig: './tsconfig.src.json',
        declaration: false
      })
    ]
  },

  // Transitions ESM build
  {
    ...createSubmoduleConfig('transitions'),
    output: {
      file: 'dist/transitions.esm.js',
      format: 'es',
      banner,
      sourcemap: true
    }
  },

  // Transitions CommonJS build
  {
    ...createSubmoduleConfig('transitions'),
    output: {
      file: 'dist/transitions.cjs',
      format: 'cjs',
      banner,
      sourcemap: true,
      exports: 'named'
    },
    plugins: [
      resolve(),
      typescript({
        tsconfig: './tsconfig.src.json',
        declaration: false
      })
    ]
  }
];
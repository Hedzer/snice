import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import CleanCSS from 'clean-css';
import { getWipComponents } from './tooling/shared/wip-components.js';

const require = createRequire(import.meta.url);
const packageJson = require('./package.json');
const coreSource = 'packages/core/src';
const componentSource = 'packages/components/src';

// Source files moved internally, but published maps retain their established
// logical paths so downstream tooling sees no artifact-level change.
const legacySourceMapPath = (sourcePath) => sourcePath
  .replace(/packages\/core\/packages\/core\/src/g, 'src')
  .replace(/packages\/packages\/components\/src/g, '../components')
  .replace(/packages\/packages\/react\/src/g, 'src/react')
  .replace(/packages\/core\/src/g, 'src')
  .replace(/packages\/components\/src/g, 'components')
  .replace(/packages\/react\/src/g, 'src/react');

const banner = `/*!
 * ${packageJson.name} v${packageJson.version}
 * ${packageJson.description}
 * (c) 2024
 * Released under the ${packageJson.license} License.
 *
 * GENERATED FILE — DO NOT EDIT. Source: src/. Rebuild: npm run build:core
 */`;

function failOnCoreCircularDependency(warning, warn) {
  if (warning.code === 'CIRCULAR_DEPENDENCY') {
    throw new Error(`Core build circular dependency: ${warning.message}`);
  }

  warn(warning);
}

const baseConfig = {
  input: `${coreSource}/index.ts`,
  external: [],
  onwarn: failOnCoreCircularDependency,
  plugins: [
    resolve(),
    typescript({
      tsconfig: './packages/core/tsconfig.json',
      declaration: true
    })
  ]
};

const createSubmoduleConfig = (name) => ({
  input: `${coreSource}/${name}.ts`,
  external: [],
  onwarn: failOnCoreCircularDependency,
  plugins: [
    resolve(),
    typescript({
      tsconfig: './packages/core/tsconfig.json',
      declaration: true
    })
  ]
});

// Function to recursively find all TypeScript files in components directory
function findComponentFiles(dir, isRoot = true) {
  const files = [];
  const items = fs.readdirSync(dir);
  const wip = isRoot ? getWipComponents() : new Set();

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (isRoot && wip.has(item)) continue;
      files.push(...findComponentFiles(fullPath, false));
    } else if (item.endsWith('.ts') &&
               !item.endsWith('.d.ts') &&
               !item.endsWith('.types.ts') &&
               !item.endsWith('.stories.ts') &&
               !item.includes('demo') &&
               !item.includes('controller')) {
      files.push(fullPath);
    }
  }

  return files;
}


// Get all component files
const componentFiles = findComponentFiles(componentSource);

export default [
  // ESM build
  {
    ...baseConfig,
    output: {
      file: 'dist/index.esm.js',
      format: 'es',
      banner,
      sourcemap: true,
      sourcemapPathTransform: legacySourceMapPath
    },
    plugins: [
      ...baseConfig.plugins
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
      sourcemapPathTransform: legacySourceMapPath,
      exports: 'named'
    },
    plugins: [
      resolve(),
      typescript({
        tsconfig: './packages/core/tsconfig.json',
        declaration: false
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
      sourcemapPathTransform: legacySourceMapPath,
      exports: 'named'
    },
    plugins: [
      resolve(),
      typescript({
        tsconfig: './packages/core/tsconfig.json',
        declaration: false
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
      sourcemap: true,
      sourcemapPathTransform: legacySourceMapPath
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
      sourcemapPathTransform: legacySourceMapPath,
      exports: 'named'
    },
    plugins: [
      resolve(),
      typescript({
        tsconfig: './packages/core/tsconfig.json',
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
      sourcemap: true,
      sourcemapPathTransform: legacySourceMapPath
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
      sourcemapPathTransform: legacySourceMapPath,
      exports: 'named'
    },
    plugins: [
      resolve(),
      typescript({
        tsconfig: './packages/core/tsconfig.json',
        declaration: false
      })
    ]
  },

  // React integration (source in packages/react/src/, built to dist/react/)
  {
    input: {
      'index': 'packages/react/src/index.ts',
      'SniceProvider': 'packages/react/src/SniceProvider.tsx',
      'SniceRouter': 'packages/react/src/SniceRouter.tsx',
      'matchRoute': 'packages/react/src/matchRoute.ts',
      'useRequestHandler': 'packages/react/src/useRequestHandler.ts',
    },
    external: ['react', 'react/jsx-runtime', 'pica-route'],
    output: {
      dir: 'dist/react',
      format: 'es',
      banner,
      sourcemap: true,
      sourcemapPathTransform: legacySourceMapPath,
      entryFileNames: '[name].js',
    },
    plugins: [
      resolve(),
      typescript({
        tsconfig: './packages/react/tsconfig.json',
        declaration: true,
        jsx: 'react-jsx',
      }),
      {
        name: 'copy-react-hooks',
        writeBundle() {
          const src = 'dist/react';
          const dest = 'adapters/react';
          if (fs.existsSync(src)) {
            for (const file of fs.readdirSync(src)) {
              // Never copy index.* — the barrel is owned by adapters/react/index.ts
              // (re-exports the hooks AND every component adapter via `export * from
              // './components'`) and is compiled by `build:react`'s tsc. dist/react/index.*
              // is the bundle of packages/react/src/index.ts, which only has the router/provider
              // hooks; copying it would strip all component adapters from the barrel.
              if (file.startsWith('index.')) continue;
              if (file.endsWith('.js') || file.endsWith('.d.ts') || file.endsWith('.js.map') || file.endsWith('.d.ts.map')) {
                fs.copyFileSync(path.join(src, file), path.join(dest, file));
              }
            }
          }
        }
      }
    ]
  },

  // Component builds - single config with multiple inputs preserving folder structure
  {
    input: componentFiles.reduce((acc, file) => {
      const relativePath = path.relative(componentSource, file);
      const entryName = relativePath.replace('.ts', '');
      acc[entryName] = file;
      return acc;
    }, {}),
    external: ['snice', 'snice/symbols', 'snice/transitions', 'tslib'],
    output: {
      dir: 'dist/components',
      format: 'es',
      sourcemap: true,
      sourcemapPathTransform: legacySourceMapPath,
      entryFileNames: '[name].js',
      preserveModules: false
    },
    plugins: [
      resolve(),
      // Plugin to handle CSS imports
      {
        name: 'css-loader',
        resolveId(id, importer) {
          if (id.endsWith('.css?inline')) {
            // Resolve the CSS path relative to the importing file
            const cssPath = id.replace('?inline', '');
            if (importer) {
              const importerDir = path.dirname(importer);
              const resolvedCssPath = path.resolve(importerDir, cssPath);
              return resolvedCssPath + '?inline';
            }
            return id;
          }
          return null;
        },
        load(id) {
          if (id.endsWith('.css?inline')) {
            const cssPath = id.replace('?inline', '');

            try {
              if (fs.existsSync(cssPath)) {
                const cssContent = fs.readFileSync(cssPath, 'utf-8');
                // Minify CSS using clean-css
                const minified = new CleanCSS({
                  level: 2 // Advanced optimizations
                }).minify(cssContent).styles;
                return `export default ${JSON.stringify(minified)};`;
              }
            } catch (error) {
              // Silently handle any errors
            }

            // Return empty string for missing CSS files
            return `export default '';`;
          }
          return null;
        }
      },
      // Plugin to copy theme.css for CDN builds
      {
        name: 'copy-theme',
        generateBundle() {
          const themeSrc = `${componentSource}/theme/theme.css`;
          const themeDest = 'dist/components/theme';

          if (fs.existsSync(themeSrc)) {
            if (!fs.existsSync(themeDest)) {
              fs.mkdirSync(themeDest, { recursive: true });
            }
            fs.copyFileSync(themeSrc, path.join(themeDest, 'theme.css'));
          }
        }
      },
      // Plugin to copy code-block grammar JSON files
      {
        name: 'copy-grammars',
        generateBundle() {
          const grammarSrc = `${componentSource}/code-block/grammars`;
          const grammarDest = 'dist/components/code-block/grammars';

          if (fs.existsSync(grammarSrc)) {
            if (!fs.existsSync(grammarDest)) {
              fs.mkdirSync(grammarDest, { recursive: true });
            }
            const files = fs.readdirSync(grammarSrc);
            for (const file of files) {
              if (file.endsWith('.json')) {
                fs.copyFileSync(
                  path.join(grammarSrc, file),
                  path.join(grammarDest, file)
                );
              }
            }
          }
        }
      },
      // Plugin to copy QR reader static assets
      {
        name: 'copy-qr-reader-assets',
        generateBundle() {
          const qrReaderSrc = `${componentSource}/qr-reader`;
          const qrReaderDest = 'dist/components/qr-reader';

          if (!fs.existsSync(qrReaderSrc)) {
            return;
          }

          if (!fs.existsSync(qrReaderDest)) {
            fs.mkdirSync(qrReaderDest, { recursive: true });
          }

          // Copy .mjs and .wasm files from qr-reader directory
          const files = fs.readdirSync(qrReaderSrc);
          for (const file of files) {
            if (file.endsWith('.mjs') || file.endsWith('.wasm')) {
              fs.copyFileSync(
                path.join(qrReaderSrc, file),
                path.join(qrReaderDest, file)
              );
            }
          }
        }
      },
      // Plugin to copy PDF viewer static assets (vendored pdf.js)
      {
        name: 'copy-pdf-viewer-assets',
        generateBundle() {
          const pdfViewerSrc = `${componentSource}/pdf-viewer`;
          const pdfViewerDest = 'dist/components/pdf-viewer';

          if (!fs.existsSync(pdfViewerSrc)) {
            return;
          }

          if (!fs.existsSync(pdfViewerDest)) {
            fs.mkdirSync(pdfViewerDest, { recursive: true });
          }

          // Copy .mjs files from pdf-viewer directory (pdf.min.mjs, pdf.worker.min.mjs)
          const files = fs.readdirSync(pdfViewerSrc);
          for (const file of files) {
            if (file.endsWith('.mjs')) {
              fs.copyFileSync(
                path.join(pdfViewerSrc, file),
                path.join(pdfViewerDest, file)
              );
            }
          }
        }
      },
      typescript({
        tsconfig: './packages/components/tsconfig.json',
        declaration: false,
        declarationMap: false
      })
    ]
  }
];

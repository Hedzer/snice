import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import CleanCSS from 'clean-css';

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
      declarationDir: './dist',
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
      declarationDir: './dist',
      rootDir: './src'
    })
  ]
});

// Function to recursively find all TypeScript files in components directory
function findComponentFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...findComponentFiles(fullPath));
    } else if (item.endsWith('.ts') &&
               !item.endsWith('.d.ts') &&
               !item.endsWith('.types.ts') &&
               !item.includes('demo') &&
               !item.includes('controller')) {
      files.push(fullPath);
    }
  }

  return files;
}


// Get all component files
const componentFiles = findComponentFiles('components');

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
  },

  // Component builds - single config with multiple inputs preserving folder structure
  {
    input: componentFiles.reduce((acc, file) => {
      const relativePath = path.relative('components', file);
      const entryName = relativePath.replace('.ts', '');
      acc[entryName] = file;
      return acc;
    }, {}),
    external: ['snice', 'snice/symbols', 'snice/transitions', 'tslib'],
    output: {
      dir: 'dist/components',
      format: 'es',
      sourcemap: true,
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
          const themeSrc = 'components/theme/theme.css';
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
          const grammarSrc = 'components/code-block/grammars';
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
          const qrReaderSrc = 'components/qr-reader';
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
      typescript({
        tsconfig: './components/tsconfig.json',
        declaration: false,
        declarationMap: false
      })
    ]
  }
];
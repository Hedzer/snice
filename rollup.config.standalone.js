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

/**
 * Create a standalone build configuration for a single component
 * @param {string} componentName - Name of the component (e.g., 'button')
 * @param {object} options - Build options
 * @returns {Array} Array of Rollup configurations
 */
export function createStandaloneBuild(componentName, options = {}) {
  const {
    minify = true,
    withTheme = false,
    formats = ['esm', 'umd', 'iife']
  } = options;

  // Use pre-compiled JS from dist/components (avoids TypeScript parsing issues)
  const componentPath = `dist/components/${componentName}/snice-${componentName}.js`;

  if (!fs.existsSync(componentPath)) {
    throw new Error(`Component not found: ${componentPath}. Run build:core first.`);
  }

  const outputDir = `dist/standalone/${componentName}`;

  // Convert component name to valid JS identifier (camelCase)
  const jsIdentifier = 'Snice' + componentName
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  // Create base config with all dependencies bundled (no externals)
  const baseConfig = {
    input: componentPath,
    external: [], // Bundle everything - no externals
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false,
        extensions: ['.js', '.ts']
      }),
      // Plugin to handle CSS imports
      {
        name: 'css-loader',
        resolveId(id, importer) {
          if (id.endsWith('.css?inline')) {
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
                  level: 2
                }).minify(cssContent).styles;
                return `export default ${JSON.stringify(minified)};`;
              }
            } catch (error) {
              console.warn(`Warning: Could not load CSS file: ${cssPath}`);
            }

            return `export default '';`;
          }
          return null;
        }
      },
      // Plugin to handle Snice core imports - bundle them from dist/
      {
        name: 'resolve-snice',
        resolveId(id) {
          if (id === 'snice') {
            return path.resolve('dist/index.esm.js');
          }
          if (id === 'snice/symbols') {
            return path.resolve('dist/symbols.esm.js');
          }
          if (id === 'snice/transitions') {
            return path.resolve('dist/transitions.esm.js');
          }
          return null;
        }
      }
    ]
  };

  const configs = [];

  // ESM build
  if (formats.includes('esm')) {
    configs.push({
      ...baseConfig,
      output: {
        file: `${outputDir}/snice-${componentName}.esm.js`,
        format: 'es',
        banner,
        sourcemap: true
      }
    });

    // ESM minified
    if (minify) {
      configs.push({
        ...baseConfig,
        output: {
          file: `${outputDir}/snice-${componentName}.esm.min.js`,
          format: 'es',
          banner,
          sourcemap: true,
          plugins: [terser()]
        }
      });
    }
  }

  // UMD build
  if (formats.includes('umd')) {
    configs.push({
      ...baseConfig,
      output: {
        file: `${outputDir}/snice-${componentName}.umd.js`,
        format: 'umd',
        name: jsIdentifier,
        banner,
        sourcemap: true
      }
    });

    // UMD minified
    if (minify) {
      configs.push({
        ...baseConfig,
        output: {
          file: `${outputDir}/snice-${componentName}.umd.min.js`,
          format: 'umd',
          name: jsIdentifier,
          banner,
          sourcemap: true,
          plugins: [terser()]
        }
      });
    }
  }

  // IIFE build (for direct browser usage)
  if (formats.includes('iife')) {
    configs.push({
      ...baseConfig,
      output: {
        file: `${outputDir}/snice-${componentName}.js`,
        format: 'iife',
        name: jsIdentifier,
        banner,
        sourcemap: true
      }
    });

    // IIFE minified
    if (minify) {
      configs.push({
        ...baseConfig,
        output: {
          file: `${outputDir}/snice-${componentName}.min.js`,
          format: 'iife',
          name: jsIdentifier,
          banner,
          sourcemap: true,
          plugins: [terser()]
        }
      });
    }
  }

  // Add plugin to copy theme if requested
  if (withTheme) {
    configs.forEach(config => {
      config.plugins.push({
        name: 'copy-theme',
        generateBundle() {
          const themeSrc = 'components/theme/theme.css';
          const themeDest = `${outputDir}/theme.css`;

          if (fs.existsSync(themeSrc)) {
            const themeDir = path.dirname(themeDest);
            if (!fs.existsSync(themeDir)) {
              fs.mkdirSync(themeDir, { recursive: true });
            }
            fs.copyFileSync(themeSrc, themeDest);
          }
        }
      });
    });
  }

  // Add plugin to generate README for the standalone component
  configs[0].plugins.push({
    name: 'generate-readme',
    generateBundle() {
      const readableComponentName = componentName.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
      const readme = `# Snice ${readableComponentName} - Standalone Build

This is a standalone build of the Snice ${componentName} component. It includes the full Snice runtime and can be used in any web project without installing the full Snice package.

## Installation

### Direct Download
Download the file you need:
- \`snice-${componentName}.esm.js\` - ES Module (recommended for modern bundlers)
- \`snice-${componentName}.umd.js\` - Universal Module Definition (works in all environments)
- \`snice-${componentName}.min.js\` - Minified IIFE (for direct browser usage)

### Usage

#### ES Module
\`\`\`javascript
import './snice-${componentName}.esm.js';

// Component is now registered and ready to use
document.body.innerHTML = '<snice-${componentName}></snice-${componentName}>';
\`\`\`

#### Browser (IIFE)
\`\`\`html
<script src="snice-${componentName}.min.js"></script>
<snice-${componentName}></snice-${componentName}>
\`\`\`

#### UMD (Node.js or browser)
\`\`\`javascript
const ${jsIdentifier} = require('./snice-${componentName}.umd.js');
\`\`\`

## Size
- Unminified: ~50-100KB (includes Snice runtime)
- Minified: ~20-40KB
- Gzipped: ~10-20KB

## Theme
${withTheme ? 'This build includes the theme.css file. Link it in your HTML:' : 'For proper styling, link the Snice theme CSS:'}
\`\`\`html
<link rel="stylesheet" href="${withTheme ? './theme.css' : 'https://unpkg.com/snice/dist/components/theme/theme.css'}">
\`\`\`

## Documentation
For full component documentation, visit: https://snice.dev/components/${componentName}

## License
${packageJson.license}
`;

      const readmePath = `${outputDir}/README.md`;
      const readmeDir = path.dirname(readmePath);
      if (!fs.existsSync(readmeDir)) {
        fs.mkdirSync(readmeDir, { recursive: true });
      }
      fs.writeFileSync(readmePath, readme);
    }
  });

  return configs;
}

// Default export for building all components
export default function buildAllStandalone() {
  const componentsDir = 'components';
  const components = [];

  // Find all components
  const items = fs.readdirSync(componentsDir);
  for (const item of items) {
    const componentDir = path.join(componentsDir, item);
    const stat = fs.statSync(componentDir);

    if (stat.isDirectory() && item !== 'theme') {
      const tsFile = path.join(componentDir, `snice-${item}.ts`);
      if (fs.existsSync(tsFile)) {
        components.push(item);
      }
    }
  }

  console.log(`Building standalone versions for ${components.length} components...`);

  // Build all components
  return components.flatMap(componentName =>
    createStandaloneBuild(componentName, {
      minify: true,
      withTheme: false,
      formats: ['esm', 'iife']
    })
  );
}

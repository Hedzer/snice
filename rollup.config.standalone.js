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
 * Components that need child components bundled with them
 * Maps parent component to array of child component names
 */
const COMPONENT_CHILDREN = {
  'accordion': ['accordion-item'],
  'tabs': ['tab', 'tab-panel'],
  'breadcrumbs': ['crumb'],
  'select': ['option'],
  'toast': ['toast-container'],
  // Note: These components define children inline or differently, no separate files:
  // 'menu': ['menu-item'],
  // 'tree': ['tree-item'],
  // 'list': ['list-item'],
  // 'nav': ['nav-item'],
  // 'stepper': ['step'],
  // 'timeline': ['timeline-item'],
};

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
    formats = ['esm', 'umd', 'iife'],
    useSharedRuntime = false
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

  // Get child components that need to be bundled
  const childComponents = COMPONENT_CHILDREN[componentName] || [];

  // Build list of all component paths to bundle
  const allComponentPaths = [componentPath];
  for (const childName of childComponents) {
    const childPath = `dist/components/${componentName}/snice-${childName}.js`;
    if (fs.existsSync(childPath)) {
      allComponentPaths.push(childPath);
    } else {
      console.warn(`Warning: Child component not found: ${childPath}`);
    }
  }

  // Create virtual entry point ID for multi-component bundles
  const virtualEntryId = `\0virtual:${componentName}-bundle`;

  // Create base config with all dependencies bundled (no externals)
  const baseConfig = {
    input: allComponentPaths.length > 1 ? virtualEntryId : componentPath,
    external: useSharedRuntime ? ['snice-runtime'] : [], // Use shared runtime or bundle everything
    plugins: [
      // Virtual entry plugin for multi-component bundles
      {
        name: 'virtual-entry',
        resolveId(id) {
          if (id === virtualEntryId) return id;
          return null;
        },
        load(id) {
          if (id === virtualEntryId) {
            // Create a virtual entry that imports all components
            const imports = allComponentPaths.map((p, i) =>
              `import '${path.resolve(p)}';`
            ).join('\n');
            return imports + `\n// Bundle entry for ${componentName} with children: ${childComponents.join(', ')}`;
          }
          return null;
        }
      },
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
${childComponents.length > 0 ? `
## Bundled Components
This standalone build includes the following child components:
${childComponents.map(c => `- \`snice-${c}\``).join('\n')}
` : ''}
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

/**
 * Build a shared runtime that can be used by lightweight standalone components
 * This allows multiple components to share the same Snice runtime, reducing total bundle size
 */
export function buildSharedRuntime() {
  const outputDir = 'dist/standalone/runtime';

  return [
    // ESM build
    {
      input: 'dist/index.esm.js',
      output: {
        file: `${outputDir}/snice-runtime.esm.js`,
        format: 'es',
        banner,
        sourcemap: true
      },
      plugins: [
        resolve({ browser: true, preferBuiltins: false }),
        {
          name: 'generate-runtime-readme',
          generateBundle() {
            const readme = `# Snice Runtime - Shared Build

This is the shared Snice runtime that can be used with lightweight standalone component builds.

## Usage

When using multiple Snice components on the same page, you can reduce total bundle size by:
1. Loading the shared runtime once
2. Using the lightweight builds of individual components

### Example

\`\`\`html
<!-- Load shared runtime once -->
<script src="snice-runtime.min.js"></script>

<!-- Load lightweight component builds (much smaller without bundled runtime) -->
<script src="snice-button.light.min.js"></script>
<script src="snice-input.light.min.js"></script>
<script src="snice-modal.light.min.js"></script>
\`\`\`

### With ES Modules

\`\`\`javascript
// Import runtime once
import 'snice/runtime';

// Import lightweight components
import 'snice/standalone/button/snice-button.light.esm.js';
import 'snice/standalone/input/snice-input.light.esm.js';
\`\`\`

## Size
- Runtime: ~30-40KB minified, ~10-15KB gzipped
- Lightweight components: ~2-10KB each (vs ~30-50KB with bundled runtime)

## When to use
- Use shared runtime when loading 3+ components on the same page
- Use standalone builds (with bundled runtime) for single-component usage

## License
${packageJson.license}
`;
            if (!fs.existsSync(outputDir)) {
              fs.mkdirSync(outputDir, { recursive: true });
            }
            fs.writeFileSync(`${outputDir}/README.md`, readme);
          }
        }
      ]
    },
    // ESM minified
    {
      input: 'dist/index.esm.js',
      output: {
        file: `${outputDir}/snice-runtime.esm.min.js`,
        format: 'es',
        banner,
        sourcemap: true,
        plugins: [terser()]
      },
      plugins: [resolve({ browser: true, preferBuiltins: false })]
    },
    // IIFE build
    {
      input: 'dist/index.esm.js',
      output: {
        file: `${outputDir}/snice-runtime.js`,
        format: 'iife',
        name: 'Snice',
        banner,
        sourcemap: true
      },
      plugins: [resolve({ browser: true, preferBuiltins: false })]
    },
    // IIFE minified
    {
      input: 'dist/index.esm.js',
      output: {
        file: `${outputDir}/snice-runtime.min.js`,
        format: 'iife',
        name: 'Snice',
        banner,
        sourcemap: true,
        plugins: [terser()]
      },
      plugins: [resolve({ browser: true, preferBuiltins: false })]
    }
  ];
}

/**
 * Build all standalone components with shared runtime support
 * Creates both full standalone builds and lightweight builds that use shared runtime
 */
export function buildAllWithSharedRuntime() {
  const configs = [];

  // First, build the shared runtime
  configs.push(...buildSharedRuntime());

  // Then build all standalone components (full builds)
  configs.push(...buildAllStandalone());

  return configs;
}

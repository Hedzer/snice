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
  'menu': ['menu-item', 'menu-divider'],
  // Note: These components define children inline or differently, no separate files:
  // 'tree': ['tree-item'],
  // 'list': ['list-item'],
  // 'nav': ['nav-item'],
  // 'stepper': ['step'],
  // 'timeline': ['timeline-item'],
};

/**
 * Create a standalone build configuration for a single component.
 * All standalone builds use the shared runtime (external snice imports).
 * @param {string} componentName - Name of the component (e.g., 'button')
 * @param {object} options - Build options
 * @returns {Array} Array of Rollup configurations
 */
export function createStandaloneBuild(componentName, options = {}) {
  const {
    minify = true,
    withTheme = false,
    formats = ['iife'],
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

  // All standalone builds use the shared runtime (external snice imports)
  const baseConfig = {
    input: allComponentPaths.length > 1 ? virtualEntryId : componentPath,
    external: ['snice', 'snice/symbols', 'snice/transitions'],
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
      // Plugin to mark Snice core imports as external (resolved via shared runtime)
      {
        name: 'resolve-snice',
        resolveId(id) {
          if (id === 'snice' || id === 'snice/symbols' || id === 'snice/transitions') {
            return false;
          }
          return null;
        }
      }
    ]
  };

  const configs = [];

  const sharedGlobals = { 'snice': 'Snice', 'snice/symbols': 'Snice', 'snice/transitions': 'Snice' };

  // IIFE build (for direct browser usage)
  if (formats.includes('iife')) {
    configs.push({
      ...baseConfig,
      output: {
        file: `${outputDir}/snice-${componentName}.js`,
        format: 'iife',
        name: jsIdentifier,
        banner,
        sourcemap: true,
        globals: sharedGlobals
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
          globals: sharedGlobals,
          plugins: [terser()]
        }
      });
    }
  }

  // Add runtime check plugin to IIFE builds — warns if snice-runtime.min.js wasn't loaded first
  const runtimeCheckBanner = `if(typeof globalThis.Snice==="undefined"){console.warn("[snice] snice-runtime.min.js must be loaded before snice-${componentName}.min.js");}`;
  configs.forEach(config => {
    if (config.output.format === 'iife') {
      const existingBanner = config.output.banner || '';
      config.output.banner = existingBanner + '\n' + runtimeCheckBanner;
    }
  });

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

Standalone build of the Snice ${componentName} component. Requires the Snice runtime (\`snice-runtime.min.js\`) to be loaded first.

## Usage

\`\`\`html
<script src="snice-runtime.min.js"></script>
<script src="snice-${componentName}.min.js"></script>
<snice-${componentName}></snice-${componentName}>
\`\`\`

## Size
- Component: ~2-10KB minified
- Runtime (shared): ~30-40KB minified
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

/**
 * Discover all available components in the components directory
 * @returns {string[]} Array of component names
 */
function discoverComponents() {
  const componentsDir = 'components';
  const components = [];

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

  return components;
}


/**
 * Build a shared runtime that can be used by lightweight standalone components
 * This allows multiple components to share the same Snice runtime, reducing total bundle size
 */
export function buildSharedRuntime() {
  const outputDir = 'dist/standalone/runtime';

  // Virtual entry that re-exports everything from all snice modules
  // so window.Snice has all exports (index + symbols + transitions)
  const runtimeEntryId = '\0virtual:snice-runtime';
  const runtimeEntryPlugin = {
    name: 'runtime-entry',
    resolveId(id) {
      if (id === runtimeEntryId) return id;
      return null;
    },
    load(id) {
      if (id === runtimeEntryId) {
        // Re-export everything from the main entry
        // Import symbols/transitions for side effects (their exports are covered by index)
        return [
          `export * from '${path.resolve('dist/index.esm.js')}';`,
          `import '${path.resolve('dist/symbols.esm.js')}';`,
          `import '${path.resolve('dist/transitions.esm.js')}';`
        ].join('\n');
      }
      return null;
    }
  };

  const readmePlugin = {
    name: 'generate-runtime-readme',
    generateBundle() {
      const readme = `# Snice Runtime

The shared Snice runtime used by standalone component builds.

## Usage

Load the runtime once, then load any standalone components:

\`\`\`html
<!-- Load runtime once -->
<script src="snice-runtime.min.js"></script>

<!-- Load standalone components -->
<script src="snice-button.min.js"></script>
<script src="snice-input.min.js"></script>
<script src="snice-modal.min.js"></script>
\`\`\`

### With ES Modules

\`\`\`javascript
import 'snice/standalone/runtime/snice-runtime.esm.js';
import 'snice/standalone/button/snice-button.esm.js';
import 'snice/standalone/input/snice-input.esm.js';
\`\`\`

## Size
- Runtime: ~30-40KB minified, ~10-15KB gzipped
- Components: ~2-10KB each

## License
${packageJson.license}
`;
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      fs.writeFileSync(`${outputDir}/README.md`, readme);
    }
  };

  return [
    // ESM build
    {
      input: runtimeEntryId,
      output: {
        file: `${outputDir}/snice-runtime.esm.js`,
        format: 'es',
        banner,
        sourcemap: true
      },
      plugins: [
        runtimeEntryPlugin,
        resolve({ browser: true, preferBuiltins: false }),
        readmePlugin
      ]
    },
    // ESM minified
    {
      input: runtimeEntryId,
      output: {
        file: `${outputDir}/snice-runtime.esm.min.js`,
        format: 'es',
        banner,
        sourcemap: true,
        plugins: [terser()]
      },
      plugins: [runtimeEntryPlugin, resolve({ browser: true, preferBuiltins: false })]
    },
    // IIFE build
    {
      input: runtimeEntryId,
      output: {
        file: `${outputDir}/snice-runtime.js`,
        format: 'iife',
        name: 'Snice',
        banner,
        sourcemap: true
      },
      plugins: [runtimeEntryPlugin, resolve({ browser: true, preferBuiltins: false })]
    },
    // IIFE minified
    {
      input: runtimeEntryId,
      output: {
        file: `${outputDir}/snice-runtime.min.js`,
        format: 'iife',
        name: 'Snice',
        banner,
        sourcemap: true,
        plugins: [terser()]
      },
      plugins: [runtimeEntryPlugin, resolve({ browser: true, preferBuiltins: false })]
    }
  ];
}

/**
 * Build shared runtime + all standalone components
 */
export function buildAll() {
  const configs = [];

  // Build the shared runtime
  configs.push(...buildSharedRuntime());

  // Build all standalone components (using shared runtime)
  const components = discoverComponents();
  console.log(`Building standalone versions for ${components.length} components...`);
  for (const name of components) {
    configs.push(...createStandaloneBuild(name, {
      minify: true,
    }));
  }

  return configs;
}

// Default export produces runtime + all components
export default buildAll;

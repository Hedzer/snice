#!/usr/bin/env node

/**
 * Generate React adapter tests for all Snice components
 *
 * This script scans components and generates comprehensive test files
 * for each component's React adapter.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Component metadata for test generation
const componentTestConfig = {
  // Form components
  input: {
    isForm: true,
    valueType: 'string',
    properties: ['type', 'placeholder', 'minlength', 'maxlength', 'readonly'],
    events: ['onInput', 'onChange', 'onFocus', 'onBlur'],
    variants: ['outlined', 'filled', 'underlined'],
    sizes: ['small', 'medium', 'large']
  },
  textarea: {
    isForm: true,
    valueType: 'string',
    properties: ['placeholder', 'rows', 'maxlength', 'readonly', 'resize'],
    events: ['onInput', 'onChange', 'onFocus', 'onBlur'],
    variants: ['outlined', 'filled', 'underlined'],
    sizes: ['small', 'medium', 'large']
  },
  checkbox: {
    isForm: true,
    valueType: 'boolean',
    properties: ['checked', 'indeterminate'],
    events: ['onChange'],
    sizes: ['small', 'medium', 'large']
  },
  radio: {
    isForm: true,
    valueType: 'string',
    properties: ['checked'],
    events: ['onChange'],
    sizes: ['small', 'medium', 'large']
  },
  select: {
    isForm: true,
    valueType: 'string',
    properties: ['placeholder', 'multiple'],
    events: ['onChange'],
    variants: ['outlined', 'filled', 'underlined'],
    sizes: ['small', 'medium', 'large']
  },
  switch: {
    isForm: true,
    valueType: 'boolean',
    properties: ['checked'],
    events: ['onChange'],
    sizes: ['small', 'medium', 'large']
  },
  slider: {
    isForm: true,
    valueType: 'number',
    properties: ['min', 'max', 'step'],
    events: ['onChange', 'onInput'],
    sizes: ['small', 'medium', 'large']
  },

  // UI components
  button: {
    properties: ['disabled', 'loading'],
    events: ['onClick'],
    variants: ['default', 'primary', 'secondary', 'danger', 'text', 'outline'],
    sizes: ['small', 'medium', 'large']
  },
  card: {
    properties: ['clickable', 'disabled'],
    events: ['onClick'],
    variants: ['default', 'outlined', 'elevated', 'flat']
  },
  alert: {
    properties: ['dismissible', 'icon'],
    events: ['onDismiss'],
    variants: ['info', 'success', 'warning', 'error'],
    sizes: ['small', 'medium', 'large']
  },
  badge: {
    properties: ['content', 'max', 'dot'],
    variants: ['default', 'primary', 'secondary', 'success', 'warning', 'error'],
    sizes: ['small', 'medium', 'large']
  },
  chip: {
    properties: ['closable', 'clickable'],
    events: ['onClick', 'onClose'],
    variants: ['filled', 'outlined'],
    sizes: ['small', 'medium', 'large']
  },
  modal: {
    properties: ['open', 'closeOnEscape', 'closeOnOutsideClick'],
    events: ['onClose', 'onOpen']
  },
  drawer: {
    properties: ['open', 'position'],
    events: ['onClose', 'onOpen']
  },
  tooltip: {
    properties: ['content', 'position'],
    events: []
  },
  progress: {
    properties: ['value', 'max', 'indeterminate'],
    variants: ['linear', 'circular'],
    sizes: ['small', 'medium', 'large']
  },
  spinner: {
    properties: [],
    sizes: ['small', 'medium', 'large']
  },

  // Data visualization components
  funnel: {
    properties: ['variant', 'orientation', 'showLabels', 'showValues', 'showPercentages', 'animation'],
    events: ['onFunnelClick', 'onFunnelHover'],
    variants: ['default', 'gradient']
  },
  treemap: {
    properties: ['showLabels', 'showValues', 'colorScheme', 'padding', 'animation'],
    events: ['onTreemapClick', 'onTreemapHover', 'onTreemapDrill']
  },
  sankey: {
    properties: ['nodeWidth', 'nodePadding', 'alignment', 'showLabels', 'showValues', 'animation'],
    events: ['onSankeyNodeClick', 'onSankeyLinkClick', 'onSankeyHover']
  },
  'network-graph': {
    properties: ['layout', 'chargeStrength', 'linkDistance', 'zoomEnabled', 'dragEnabled', 'showLabels', 'animation'],
    events: ['onNodeClick', 'onEdgeClick', 'onNodeDrag', 'onGraphZoom']
  },
  candlestick: {
    properties: ['showVolume', 'showGrid', 'showCrosshair', 'bullishColor', 'bearishColor', 'timeFormat', 'yAxisFormat', 'zoomEnabled', 'animation'],
    events: ['onCandleClick', 'onCandleHover', 'onCrosshairMove']
  },
  'camera-annotate': {
    properties: ['mode', 'autoRotateColors', 'showLabelsPanel'],
    events: ['onCapture', 'onAnnotate', 'onAnnotationChange']
  },
  'time-range-picker': {
    isForm: true,
    valueType: 'string',
    properties: ['granularity', 'startTime', 'endTime', 'disabledRanges', 'format', 'multiple', 'readonly'],
    events: ['onChange', 'onTimeRangeSelect', 'onTimeRangeComplete']
  },
  book: {
    properties: ['currentPage', 'mode', 'coverImage', 'title', 'author'],
    events: ['onPageTurn', 'onPageFlipStart', 'onPageFlipEnd']
  },
  comments: {
    properties: ['currentUser', 'allowReplies', 'allowLikes', 'maxDepth'],
    events: ['onCommentAdd', 'onCommentReply', 'onCommentDelete', 'onCommentLike']
  },
  'pricing-table': {
    properties: ['variant', 'annual'],
    events: ['onPlanSelect']
  },
  'key-value': {
    isForm: true,
    properties: ['label', 'autoExpand', 'rows', 'showDescription', 'keyPlaceholder', 'valuePlaceholder', 'disabled', 'readonly', 'name', 'mode', 'showCopy'],
    events: ['onKvAdd', 'onKvRemove', 'onKvChange', 'onKvCopy'],
    variants: ['default', 'compact']
  },
  'action-bar': {
    properties: ['open', 'position', 'noAnimation', 'noEscapeDismiss'],
    events: ['onActionBarOpen', 'onActionBarClose'],
    variants: ['default', 'pill'],
    sizes: ['small', 'medium']
  }
};

/**
 * Extract component name from file path
 */
function getComponentClassName(componentName) {
  return componentName
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/**
 * Generate test file content for a component
 */
function generateTestFile(componentName, config = {}) {
  const className = getComponentClassName(componentName);
  const {
    isForm = false,
    valueType = 'string',
    properties = [],
    events = [],
    variants = [],
    sizes = []
  } = config;

  const hasVariants = variants.length > 0;
  const hasSizes = sizes.length > 0;
  const hasProperties = properties.length > 0;
  const hasEvents = events.length > 0;

  // Build properties array for test
  const propertiesArray = properties.map(prop => {
    let value;
    if (prop === 'disabled' || prop === 'required' || prop === 'readonly' || prop === 'loading') {
      value = true;
    } else if (prop === 'placeholder') {
      value = "'Test placeholder'";
    } else if (prop === 'type') {
      value = "'text'";
    } else if (prop === 'min' || prop === 'max' || prop === 'step') {
      value = 10;
    } else if (prop.includes('length')) {
      value = 100;
    } else if (prop === 'rows') {
      value = 5;
    } else if (prop === 'resize') {
      value = "'vertical'";
    } else if (prop === 'position') {
      value = "'top'";
    } else {
      value = "'test'";
    }
    return `{ name: '${prop}', value: ${value} }`;
  }).join(',\n      ');

  // Build events array for test
  const eventsArray = events.map(event => {
    return `{ name: '${event}' }`;
  }).join(',\n      ');

  return `/**
 * React adapter tests for ${className}
 * Auto-generated by scripts/generate-react-tests.js
 */

import { describe } from 'vitest';
import { testComponent } from '../test-helpers';

// Import the React adapter
// Note: Run 'npm run build:react' to generate adapters before testing
let ${className}: any;

try {
  const module = await import('../../../adapters/react/${componentName}');
  ${className} = module.${className};
} catch (error) {
  console.warn('React adapter for ${componentName} not built yet. Run: npm run build:react');
  ${className} = null;
}

describe('React Adapter: ${className}', () => {
  if (!${className}) {
    it.skip('${className} adapter not built', () => {});
    return;
  }

  testComponent({
    name: '${className}',
    Component: ${className},${hasProperties ? `
    properties: [
      ${propertiesArray}
    ],` : ''}${hasEvents ? `
    events: [
      ${eventsArray}
    ],` : ''}${hasVariants ? `
    variants: ${JSON.stringify(variants)},` : ''}${hasSizes ? `
    sizes: ${JSON.stringify(sizes)},` : ''}${isForm ? `
    isForm: true,
    formOptions: {
      valueType: '${valueType}',
      defaultValue: ${valueType === 'string' ? "'test'" : valueType === 'number' ? '0' : 'false'}
    },` : ''}
    defaultProps: {}
  });
});
`;
}

/**
 * Generate test files for all components
 */
function generateTests() {
  const componentsDir = path.join(projectRoot, 'components');
  const testsDir = path.join(projectRoot, 'tests', 'react-adapters', 'components');

  if (!fs.existsSync(componentsDir)) {
    console.error('❌ Components directory not found');
    process.exit(1);
  }

  // Create tests directory
  if (!fs.existsSync(testsDir)) {
    fs.mkdirSync(testsDir, { recursive: true });
  }

  console.log('🔍 Scanning components directory...\n');

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

  console.log(`✨ Found ${components.length} components\n`);
  console.log('📝 Generating test files...\n');

  let generated = 0;
  let skipped = 0;

  for (const componentName of components) {
    const config = componentTestConfig[componentName] || {};
    const testContent = generateTestFile(componentName, config);
    const testPath = path.join(testsDir, `${componentName}.test.tsx`);

    fs.writeFileSync(testPath, testContent);
    console.log(`  Created: ${componentName}.test.tsx`);
    generated++;
  }

  console.log(`\n✅ Test generation complete!\n`);
  console.log(`Generated ${generated} test files`);
  console.log(`\nRun tests with: npm test tests/react-adapters\n`);
}

// Run the generator
generateTests();

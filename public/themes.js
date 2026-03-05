import { PRESETS } from './theme/presets.js';

// ── State ──
let activePresetName = localStorage.getItem('snice-theme-preset-name') || 'default';
let customOverrides = {};
let activeVariant = localStorage.getItem('snice-theme-variant') || 'flat';

// ── Theme Variant (Flat / Material / Glass) ──
function applyVariant(variant) {
  activeVariant = variant;
  document.documentElement.setAttribute('data-theme-variant', variant);
  localStorage.setItem('snice-theme-variant', variant);
  updateVariantUI();
}

function updateVariantUI() {
  // Update radio buttons
  const radios = $$('input[name="theme-variant"]');
  radios.forEach(r => {
    r.checked = r.value === activeVariant;
    // Update parent label styling
    const label = r.closest('.variant-option');
    if (label) {
      label.style.borderColor = r.checked ? 'var(--snice-color-primary)' : 'var(--snice-color-border)';
      label.style.background = r.checked ? 'color-mix(in srgb, var(--snice-color-primary) 8%, transparent)' : '';
    }
  });
  
  // Show/hide glass warning
  const glassWarning = $('#glass-warning');
  if (glassWarning) {
    const supportsBackdrop = CSS.supports('backdrop-filter', 'blur(12px)');
    glassWarning.style.display = (activeVariant === 'glass' && !supportsBackdrop) ? 'block' : 'none';
  }
}

function initVariantSelector() {
  // Apply saved variant on load
  applyVariant(activeVariant);
  
  // Listen for changes
  const radios = $$('input[name="theme-variant"]');
  radios.forEach(r => {
    r.addEventListener('change', () => {
      if (r.checked) applyVariant(r.value);
    });
  });
}

// ── DOM helpers ──
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

// ── Variable definitions from theme.css ──
// Each group: { title, vars: [{ name, label, type, default, min?, max?, step?, options? }] }
const BUILDER_GROUPS = [
  {
    title: 'Semantic Colors',
    id: 'semantic-colors',
    vars: [
      { name: '--snice-color-primary', label: 'Primary', type: 'color', default: '#2563eb' },
      { name: '--snice-color-primary-hover', label: 'Primary Hover', type: 'color', default: '#1d4ed8' },
      { name: '--snice-color-success', label: 'Success', type: 'color', default: '#16a34a' },
      { name: '--snice-color-success-hover', label: 'Success Hover', type: 'color', default: '#15803d' },
      { name: '--snice-color-warning', label: 'Warning', type: 'color', default: '#ca8a04' },
      { name: '--snice-color-warning-hover', label: 'Warning Hover', type: 'color', default: '#a16207' },
      { name: '--snice-color-danger', label: 'Danger', type: 'color', default: '#dc2626' },
      { name: '--snice-color-danger-hover', label: 'Danger Hover', type: 'color', default: '#b91c1c' },
      { name: '--snice-color-neutral', label: 'Neutral', type: 'color', default: '#525252' },
    ],
  },
  {
    title: 'Background & Surface',
    id: 'surface-colors',
    vars: [
      { name: '--snice-color-background', label: 'Background', type: 'color', default: '#ffffff' },
      { name: '--snice-color-background-secondary', label: 'BG Secondary', type: 'color', default: '#fafafa' },
      { name: '--snice-color-background-tertiary', label: 'BG Tertiary', type: 'color', default: '#f5f5f5' },
      { name: '--snice-color-background-element', label: 'Element BG', type: 'color', default: '#f8f7f5' },
      { name: '--snice-color-background-input', label: 'Input BG', type: 'color', default: '#ffffff' },
      { name: '--snice-color-background-hover', label: 'Hover BG', type: 'color', default: '#f5f5f5' },
    ],
  },
  {
    title: 'Text Colors',
    id: 'text-colors',
    vars: [
      { name: '--snice-color-text', label: 'Text', type: 'color', default: '#171717' },
      { name: '--snice-color-text-secondary', label: 'Secondary', type: 'color', default: '#525252' },
      { name: '--snice-color-text-tertiary', label: 'Tertiary', type: 'color', default: '#737373' },
      { name: '--snice-color-text-inverse', label: 'Inverse', type: 'color', default: '#fafafa' },
      { name: '--snice-color-text-disabled', label: 'Disabled', type: 'color', default: '#a3a3a3' },
    ],
  },
  {
    title: 'Border Colors',
    id: 'border-colors',
    vars: [
      { name: '--snice-color-border', label: 'Border', type: 'color', default: '#d4d4d4' },
      { name: '--snice-color-border-hover', label: 'Border Hover', type: 'color', default: '#a3a3a3' },
      { name: '--snice-color-border-focus', label: 'Border Focus', type: 'color', default: '#3b82f6' },
    ],
  },
  {
    title: 'Color Primitives — Gray',
    id: 'gray-primitives',
    collapsed: true,
    vars: [50,100,200,300,400,500,600,700,800,900,950].map(s => ({
      name: `--snice-color-gray-${s}`, label: `Gray ${s}`, type: 'hsl-primitive',
      default: getComputedPrimitiveDefault('gray', s),
    })),
  },
  {
    title: 'Color Primitives — Blue',
    id: 'blue-primitives',
    collapsed: true,
    vars: [50,100,200,300,400,500,600,700,800,900,950].map(s => ({
      name: `--snice-color-blue-${s}`, label: `Blue ${s}`, type: 'hsl-primitive',
      default: getComputedPrimitiveDefault('blue', s),
    })),
  },
  {
    title: 'Color Primitives — Green',
    id: 'green-primitives',
    collapsed: true,
    vars: [50,100,200,300,400,500,600,700,800,900,950].map(s => ({
      name: `--snice-color-green-${s}`, label: `Green ${s}`, type: 'hsl-primitive',
      default: getComputedPrimitiveDefault('green', s),
    })),
  },
  {
    title: 'Color Primitives — Red',
    id: 'red-primitives',
    collapsed: true,
    vars: [50,100,200,300,400,500,600,700,800,900,950].map(s => ({
      name: `--snice-color-red-${s}`, label: `Red ${s}`, type: 'hsl-primitive',
      default: getComputedPrimitiveDefault('red', s),
    })),
  },
  {
    title: 'Color Primitives — Yellow',
    id: 'yellow-primitives',
    collapsed: true,
    vars: [50,100,200,300,400,500,600,700,800,900,950].map(s => ({
      name: `--snice-color-yellow-${s}`, label: `Yellow ${s}`, type: 'hsl-primitive',
      default: getComputedPrimitiveDefault('yellow', s),
    })),
  },
  {
    title: 'Typography',
    id: 'typography',
    vars: [
      { name: '--snice-font-family', label: 'Font Family', type: 'text', default: '', placeholder: 'e.g. Inter, system-ui, sans-serif' },
      { name: '--snice-font-family-mono', label: 'Mono Font', type: 'text', default: '', placeholder: 'e.g. JetBrains Mono, monospace' },
      { name: '--snice-font-size-2xs', label: 'Size 2XS', type: 'size', default: '0.625rem', min: 0.4, max: 1, step: 0.025 },
      { name: '--snice-font-size-xs', label: 'Size XS', type: 'size', default: '0.75rem', min: 0.5, max: 1.2, step: 0.025 },
      { name: '--snice-font-size-sm', label: 'Size SM', type: 'size', default: '0.875rem', min: 0.6, max: 1.4, step: 0.025 },
      { name: '--snice-font-size-md', label: 'Size MD', type: 'size', default: '1rem', min: 0.7, max: 1.6, step: 0.025 },
      { name: '--snice-font-size-lg', label: 'Size LG', type: 'size', default: '1.125rem', min: 0.8, max: 2, step: 0.025 },
      { name: '--snice-font-size-xl', label: 'Size XL', type: 'size', default: '1.25rem', min: 1, max: 2.5, step: 0.025 },
      { name: '--snice-font-size-2xl', label: 'Size 2XL', type: 'size', default: '1.5rem', min: 1, max: 3, step: 0.05 },
      { name: '--snice-font-size-3xl', label: 'Size 3XL', type: 'size', default: '1.875rem', min: 1.2, max: 4, step: 0.05 },
      { name: '--snice-line-height-dense', label: 'Line Dense', type: 'number', default: '1.25', min: 1, max: 2, step: 0.05 },
      { name: '--snice-line-height-normal', label: 'Line Normal', type: 'number', default: '1.5', min: 1, max: 2.5, step: 0.05 },
      { name: '--snice-line-height-loose', label: 'Line Loose', type: 'number', default: '1.75', min: 1.2, max: 3, step: 0.05 },
    ],
  },
  {
    title: 'Spacing',
    id: 'spacing',
    vars: [
      { name: '--snice-spacing-3xs', label: '3XS', type: 'size', default: '0.125rem', min: 0, max: 0.5, step: 0.0625 },
      { name: '--snice-spacing-2xs', label: '2XS', type: 'size', default: '0.25rem', min: 0, max: 1, step: 0.0625 },
      { name: '--snice-spacing-xs', label: 'XS', type: 'size', default: '0.5rem', min: 0, max: 1.5, step: 0.0625 },
      { name: '--snice-spacing-sm', label: 'SM', type: 'size', default: '0.75rem', min: 0, max: 2, step: 0.0625 },
      { name: '--snice-spacing-md', label: 'MD', type: 'size', default: '1rem', min: 0, max: 3, step: 0.0625 },
      { name: '--snice-spacing-lg', label: 'LG', type: 'size', default: '1.5rem', min: 0, max: 4, step: 0.125 },
      { name: '--snice-spacing-xl', label: 'XL', type: 'size', default: '2rem', min: 0, max: 6, step: 0.125 },
      { name: '--snice-spacing-2xl', label: '2XL', type: 'size', default: '3rem', min: 0, max: 8, step: 0.25 },
      { name: '--snice-spacing-3xl', label: '3XL', type: 'size', default: '4rem', min: 0, max: 10, step: 0.25 },
    ],
  },
  {
    title: 'Border Radius',
    id: 'radius',
    vars: [
      { name: '--snice-border-radius-sm', label: 'SM', type: 'size', default: '0.125rem', min: 0, max: 1, step: 0.0625 },
      { name: '--snice-border-radius-md', label: 'MD', type: 'size', default: '0.25rem', min: 0, max: 2, step: 0.0625 },
      { name: '--snice-border-radius-lg', label: 'LG', type: 'size', default: '0.5rem', min: 0, max: 3, step: 0.0625 },
      { name: '--snice-border-radius-xl', label: 'XL', type: 'size', default: '1rem', min: 0, max: 4, step: 0.125 },
    ],
    presets: {
      label: 'Quick',
      options: [
        { name: 'Sharp', values: { '--snice-border-radius-sm': '1px', '--snice-border-radius-md': '2px', '--snice-border-radius-lg': '3px', '--snice-border-radius-xl': '4px' } },
        { name: 'Soft', values: { '--snice-border-radius-sm': '2px', '--snice-border-radius-md': '4px', '--snice-border-radius-lg': '6px', '--snice-border-radius-xl': '8px' } },
        { name: 'Round', values: { '--snice-border-radius-sm': '4px', '--snice-border-radius-md': '8px', '--snice-border-radius-lg': '12px', '--snice-border-radius-xl': '16px' } },
        { name: 'Pill', values: { '--snice-border-radius-sm': '8px', '--snice-border-radius-md': '16px', '--snice-border-radius-lg': '24px', '--snice-border-radius-xl': '9999px' } },
      ],
    },
  },
  {
    title: 'Shadows',
    id: 'shadows',
    vars: [],
    presets: {
      label: 'Intensity',
      options: [
        { name: 'None', values: { '--snice-shadow-xs':'none','--snice-shadow-sm':'none','--snice-shadow-md':'none','--snice-shadow-lg':'none','--snice-shadow-xl':'none' } },
        { name: 'Subtle', values: { '--snice-shadow-xs':'0 1px 2px 0 hsl(0 0% 0%/0.03)','--snice-shadow-sm':'0 1px 3px 0 hsl(0 0% 0%/0.04)','--snice-shadow-md':'0 2px 6px 0 hsl(0 0% 0%/0.04)','--snice-shadow-lg':'0 4px 12px -2px hsl(0 0% 0%/0.04)','--snice-shadow-xl':'0 8px 20px -4px hsl(0 0% 0%/0.05)' } },
        { name: 'Medium', values: { '--snice-shadow-xs':'0 1px 3px 0 hsl(0 0% 0%/0.06),0 1px 2px 0 hsl(0 0% 0%/0.08)','--snice-shadow-sm':'0 2px 6px 0 hsl(0 0% 0%/0.06),0 2px 4px -1px hsl(0 0% 0%/0.08)','--snice-shadow-md':'0 4px 12px 0 hsl(0 0% 0%/0.08),0 2px 8px -2px hsl(0 0% 0%/0.08)','--snice-shadow-lg':'0 10px 24px -3px hsl(0 0% 0%/0.08),0 4px 12px -4px hsl(0 0% 0%/0.08)','--snice-shadow-xl':'0 20px 32px -5px hsl(0 0% 0%/0.1),0 8px 16px -6px hsl(0 0% 0%/0.1)' } },
        { name: 'Dramatic', values: { '--snice-shadow-xs':'0 1px 4px 0 hsl(0 0% 0%/0.1),0 1px 3px 0 hsl(0 0% 0%/0.12)','--snice-shadow-sm':'0 3px 8px 0 hsl(0 0% 0%/0.12),0 2px 4px -1px hsl(0 0% 0%/0.14)','--snice-shadow-md':'0 6px 16px 0 hsl(0 0% 0%/0.14),0 3px 10px -2px hsl(0 0% 0%/0.14)','--snice-shadow-lg':'0 14px 28px -4px hsl(0 0% 0%/0.16),0 6px 14px -4px hsl(0 0% 0%/0.14)','--snice-shadow-xl':'0 24px 40px -6px hsl(0 0% 0%/0.18),0 10px 20px -6px hsl(0 0% 0%/0.16)' } },
      ],
    },
  },
  {
    title: 'Transitions',
    id: 'transitions',
    vars: [
      { name: '--snice-transition-fast', label: 'Fast', type: 'ms', default: '150ms', min: 0, max: 500, step: 10 },
      { name: '--snice-transition-medium', label: 'Medium', type: 'ms', default: '250ms', min: 0, max: 800, step: 10 },
      { name: '--snice-transition-slow', label: 'Slow', type: 'ms', default: '350ms', min: 0, max: 1000, step: 10 },
    ],
  },
  {
    title: 'Focus',
    id: 'focus',
    vars: [
      { name: '--snice-focus-ring-width', label: 'Ring Width', type: 'px', default: '2px', min: 0, max: 6, step: 1 },
      { name: '--snice-focus-ring-offset', label: 'Ring Offset', type: 'px', default: '2px', min: 0, max: 6, step: 1 },
      { name: '--snice-focus-ring-color', label: 'Ring Color', type: 'color', default: '#3b82f680' },
    ],
  },
];

function getComputedPrimitiveDefault(family, shade) {
  // Return a hex approximation — actual colors come from computed styles at runtime
  const map = {
    gray: { 50:'#fafafa',100:'#f5f5f5',200:'#e5e5e5',300:'#d4d4d4',400:'#a3a3a3',500:'#737373',600:'#525252',700:'#404040',800:'#262626',900:'#171717',950:'#0a0a0a' },
    blue: { 50:'#eff6ff',100:'#dbeafe',200:'#bfdbfe',300:'#93c5fd',400:'#60a5fa',500:'#3b82f6',600:'#2563eb',700:'#1d4ed8',800:'#1e40af',900:'#1e3a8a',950:'#172554' },
    green: { 50:'#f0fdf4',100:'#dcfce7',200:'#bbf7d0',300:'#86efac',400:'#4ade80',500:'#22c55e',600:'#16a34a',700:'#15803d',800:'#166534',900:'#14532d',950:'#052e16' },
    red: { 50:'#fef2f2',100:'#fee2e2',200:'#fecaca',300:'#fca5a5',400:'#f87171',500:'#ef4444',600:'#dc2626',700:'#b91c1c',800:'#991b1b',900:'#7f1d1d',950:'#450a0a' },
    yellow: { 50:'#fefce8',100:'#fef9c3',200:'#fef08a',300:'#fde047',400:'#facc15',500:'#eab308',600:'#ca8a04',700:'#a16207',800:'#854d0e',900:'#713f12',950:'#422006' },
  };
  return map[family]?.[shade] || '#888888';
}

// ── Style injection ──
function injectStyle(id, cssText) {
  let el = document.getElementById(id);
  if (!el) { el = document.createElement('style'); el.id = id; document.head.appendChild(el); }
  el.textContent = cssText;
}
function removeStyle(id) { const el = document.getElementById(id); if (el) el.remove(); }

// ── Parse CSS text into variable map ──
function parseCSSVars(cssText) {
  const vars = {};
  const re = /--([\w-]+)\s*:\s*([^;]+)/g;
  let m;
  while ((m = re.exec(cssText)) !== null) {
    vars['--' + m[1]] = m[2].trim();
  }
  return vars;
}

// ── Apply preset ──
function applyPreset(name) {
  const preset = PRESETS.find(p => p.name === name);
  if (!preset) return;
  activePresetName = name;
  // Always include both light and dark CSS — the [data-theme="dark"] selector
  // ensures dark overrides only apply when dark mode is active.
  // Boost dark selector to [data-theme="dark"]:root (0,2,0) to beat
  // theme.css's @media { :root:not([data-theme="light"]) } (0,2,0) via source order.
  const darkCss = preset.cssDark ? '\n' + preset.cssDark.replace('[data-theme="dark"]', '[data-theme="dark"]:root') : '';
  const css = (preset.css || '') + darkCss;
  if (css.trim()) { injectStyle('snice-theme-preset', css); localStorage.setItem('snice-theme-preset', css); }
  else { removeStyle('snice-theme-preset'); localStorage.removeItem('snice-theme-preset'); }
  localStorage.setItem('snice-theme-preset-name', name);

  // Clear custom overrides — preset CSS handles its own values;
  // customOverrides only tracks explicit user changes from the builder
  customOverrides = {};
  removeStyle('snice-theme-custom');
  localStorage.removeItem('snice-theme-custom');

  updatePresetCards();
  updateThemeDot();
  updateExport();
  renderBuilderControls();
}

// ── Theme dot indicator ──
function updateThemeDot() {
  const dot = document.getElementById('theme-dot');
  if (!dot) return;
  const hasCustom = Object.keys(customOverrides).length > 0;
  if ((activePresetName && activePresetName !== 'default') || hasCustom) {
    dot.hidden = false;
    const label = hasCustom ? 'Custom theme' : activePresetName.charAt(0).toUpperCase() + activePresetName.slice(1) + ' theme';
    dot.title = label;
    dot.style.background = 'var(--snice-color-primary)';
  } else {
    dot.hidden = true;
  }
}

// ── Apply custom overrides ──
function applyCustom(overrides) {
  customOverrides = overrides;
  const entries = Object.entries(overrides).filter(([, v]) => v !== null && v !== undefined && v !== '');
  if (entries.length === 0) { removeStyle('snice-theme-custom'); localStorage.removeItem('snice-theme-custom'); updateThemeDot(); return; }
  const vars = entries.map(([k, v]) => `  ${k}: ${v};`).join('\n');
  // :root:root (specificity 0,2,0) beats [data-theme="dark"] (0,1,0) and ties with
  // @media :root:not([data-theme="light"]) (0,2,0) but wins via later source order
  const css = `:root:root {\n${vars}\n}`;
  injectStyle('snice-theme-custom', css);
  localStorage.setItem('snice-theme-custom', css);
  updateThemeDot();
  updateExport();
}

// ── Reset ──
function resetTheme() {
  activePresetName = 'default';
  customOverrides = {};
  activeVariant = 'flat';
  removeStyle('snice-theme-preset');
  removeStyle('snice-theme-custom');
  localStorage.removeItem('snice-theme-preset');
  localStorage.removeItem('snice-theme-preset-name');
  localStorage.removeItem('snice-theme-custom');
  localStorage.removeItem('snice-theme-variant');
  applyVariant('flat');
  updatePresetCards();
  updateThemeDot();
  updateExport();
  // Re-render builder to reset all controls
  renderBuilderControls();
}

// ── Export CSS ──
function buildCSSOutput() {
  const hasPreset = activePresetName !== 'default';
  const hasCustom = Object.keys(customOverrides).some(k => {
    const v = customOverrides[k];
    return v !== null && v !== undefined && v !== '';
  });

  if (!hasPreset && !hasCustom) return '/* Default theme — no overrides */';

  // Read ALL computed CSS custom properties for a complete export
  const computed = getComputedStyle(document.documentElement);
  const allVars = {};

  for (const group of BUILDER_GROUPS) {
    for (const v of group.vars) {
      // Custom override takes priority, then read computed value
      if (customOverrides[v.name]) {
        allVars[v.name] = customOverrides[v.name];
      } else {
        const val = computed.getPropertyValue(v.name).trim();
        if (val) allVars[v.name] = val;
      }
    }
    // Also capture preset button values (shadows, radius presets, etc.)
    if (group.presets) {
      for (const opt of group.presets.options) {
        for (const [k] of Object.entries(opt.values)) {
          if (!allVars[k]) {
            if (customOverrides[k]) {
              allVars[k] = customOverrides[k];
            } else {
              const val = computed.getPropertyValue(k).trim();
              if (val) allVars[k] = val;
            }
          }
        }
      }
    }
  }

  const parts = [];
  if (hasPreset) parts.push(`/* Based on: ${activePresetName} */`);

  // Separate dark-mode overrides from preset
  const presetDarkVars = {};
  if (hasPreset) {
    const preset = PRESETS.find(p => p.name === activePresetName);
    if (preset?.cssDark) Object.assign(presetDarkVars, parseCSSVars(preset.cssDark));
  }

  const rootEntries = Object.entries(allVars).filter(([, v]) => v);
  if (rootEntries.length > 0) {
    parts.push(':root {\n' + rootEntries.map(([k, v]) => `  ${k}: ${v};`).join('\n') + '\n}');
  }

  const darkEntries = Object.entries(presetDarkVars);
  if (darkEntries.length > 0) {
    parts.push('[data-theme="dark"] {\n' + darkEntries.map(([k, v]) => `  ${k}: ${v};`).join('\n') + '\n}');
  }

  return parts.join('\n\n');
}

function updateExport() {
  const codeBlock = $('#export-code');
  if (codeBlock) codeBlock.textContent = buildCSSOutput();
}

function downloadCSS() {
  const css = buildCSSOutput();
  const blob = new Blob([css], { type: 'text/css' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'snice-theme.css';
  a.click();
  URL.revokeObjectURL(url);
}

// ── Preset cards ──
function renderPresetCards() {
  const grid = $('#preset-grid');
  if (!grid) return;
  grid.innerHTML = PRESETS.map(p => `
    <button class="preset-card${p.name === activePresetName ? ' active' : ''}" data-preset="${p.name}">
      <div class="preset-swatches">
        ${p.swatches.map(c => `<span class="preset-swatch" style="background:${c}"></span>`).join('')}
      </div>
      <div class="preset-name">${p.label}</div>
      <div class="preset-desc">${p.description}</div>
    </button>
  `).join('');
  grid.addEventListener('click', (e) => {
    const card = e.target.closest('.preset-card');
    if (card) applyPreset(card.dataset.preset);
  });
}

function updatePresetCards() {
  $$('.preset-card').forEach(card => {
    card.classList.toggle('active', card.dataset.preset === activePresetName);
  });
}

// ── Dynamic builder rendering ──
let _builderInitializing = false;
function renderBuilderControls() {
  const container = $('#builder-controls');
  if (!container) return;
  _builderInitializing = true;
  container.innerHTML = '';

  for (const group of BUILDER_GROUPS) {
    const section = document.createElement('div');
    section.className = 'builder-group';

    // Collapsible header
    const header = document.createElement('button');
    header.className = 'builder-section-header' + (group.collapsed ? ' collapsed' : '');
    header.innerHTML = `<span class="builder-section-arrow">&#9662;</span> ${group.title}`;
    header.addEventListener('click', () => {
      header.classList.toggle('collapsed');
      body.hidden = header.classList.contains('collapsed');
    });
    section.appendChild(header);

    const body = document.createElement('div');
    body.className = 'builder-section-body';
    body.hidden = !!group.collapsed;

    // Preset buttons if any
    if (group.presets) {
      const row = document.createElement('div');
      row.className = 'builder-btn-row';
      for (const opt of group.presets.options) {
        const btn = document.createElement('button');
        btn.className = 'builder-btn';
        btn.textContent = opt.name;
        btn.addEventListener('click', () => {
          Object.assign(customOverrides, opt.values);
          applyCustom(customOverrides);
          row.querySelectorAll('.builder-btn').forEach(b => b.classList.toggle('active', b === btn));
        });
        row.appendChild(btn);
      }
      body.appendChild(row);
    }

    // Variable controls
    for (const v of group.vars) {
      const row = document.createElement('div');
      row.className = 'builder-var-row';

      const label = document.createElement('span');
      label.className = 'builder-var-label';
      label.textContent = v.label;
      label.title = v.name;
      row.appendChild(label);

      if (v.type === 'color' || v.type === 'hsl-primitive') {
        const currentVal = customOverrides[v.name] || '';
        let displayHex = v.default;
        if (currentVal) {
          displayHex = v.type === 'hsl-primitive' ? hslStringToHex(currentVal) : cssColorToHex(currentVal);
        } else {
          // Read computed style to reflect preset/theme values in the builder
          const computed = getComputedStyle(document.documentElement).getPropertyValue(v.name).trim();
          if (computed) {
            displayHex = v.type === 'hsl-primitive' ? hslStringToHex(computed) : cssColorToHex(computed);
          }
        }
        const picker = document.createElement('snice-color-picker');
        picker.setAttribute('value', displayHex);
        picker.setAttribute('size', 'small');
        picker.setAttribute('show-input', 'false');
        picker.dataset.var = v.name;
        picker.dataset.type = v.type;
        picker.addEventListener('color-picker-change', (e) => {
          if (_builderInitializing) return;
          const hex = e.detail?.value ?? picker.value;
          if (v.type === 'hsl-primitive') {
            // Convert hex to HSL triple
            const hsl = hexToHSL(hex);
            customOverrides[v.name] = `${hsl.h} ${hsl.s}% ${hsl.l}%`;
          } else {
            customOverrides[v.name] = hex;
          }
          applyCustom(customOverrides);
        });
        row.appendChild(picker);
      } else if (v.type === 'size' || v.type === 'px' || v.type === 'ms' || v.type === 'number') {
        const wrap = document.createElement('div');
        wrap.className = 'builder-var-slider';
        const currentVal = customOverrides[v.name];
        let currentNum;
        if (currentVal) {
          currentNum = parseFloat(currentVal);
        } else {
          const computed = getComputedStyle(document.documentElement).getPropertyValue(v.name).trim();
          currentNum = computed ? parseFloat(computed) : parseFloat(v.default);
        }
        const slider = document.createElement('snice-slider');
        slider.setAttribute('min', String(v.min ?? 0));
        slider.setAttribute('max', String(v.max ?? 10));
        slider.setAttribute('step', String(v.step ?? 0.1));
        slider.setAttribute('value', String(currentNum));
        slider.setAttribute('show-value', '');
        const suffix = v.type === 'size' ? 'rem' : v.type === 'px' ? 'px' : v.type === 'ms' ? 'ms' : '';
        slider.addEventListener('slider-change', (e) => {
          if (_builderInitializing) return;
          const val = parseFloat(e.detail?.value ?? slider.value);
          customOverrides[v.name] = val + suffix;
          applyCustom(customOverrides);
        });
        wrap.appendChild(slider);
        row.appendChild(wrap);
      } else if (v.type === 'text') {
        const input = document.createElement('snice-input');
        input.setAttribute('size', 'small');
        input.setAttribute('placeholder', v.placeholder || '');
        const textVal = customOverrides[v.name] || getComputedStyle(document.documentElement).getPropertyValue(v.name).trim();
        if (textVal) input.setAttribute('value', textVal);
        input.addEventListener('input-change', (e) => {
          if (_builderInitializing) return;
          const val = (e.detail?.value ?? input.value).trim();
          if (val) { customOverrides[v.name] = val; } else { delete customOverrides[v.name]; }
          applyCustom(customOverrides);
        });
        row.appendChild(input);
      }

      body.appendChild(row);
    }

    section.appendChild(body);
    container.appendChild(section);
  }
  // Allow initial slider/picker events to fire without populating customOverrides
  requestAnimationFrame(() => { _builderInitializing = false; });
}

// ── HSL string to Hex (for displaying preset primitives in pickers) ──
function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => { const k = (n + h / 30) % 12; return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1); };
  const toHex = x => Math.round(x * 255).toString(16).padStart(2, '0');
  return '#' + toHex(f(0)) + toHex(f(8)) + toHex(f(4));
}

function hslStringToHex(hslStr) {
  // Parse "200 20% 98%" or "hsl(200 20% 98%)" format
  const nums = hslStr.replace(/hsl\(|\)|%|,/g, ' ').trim().split(/\s+/).map(Number);
  if (nums.length >= 3 && nums.every(n => !isNaN(n))) return hslToHex(nums[0], nums[1], nums[2]);
  return '#888888';
}

// ── Convert any CSS color string (rgb, hsl, hex) to hex ──
function cssColorToHex(str) {
  if (!str) return '#888888';
  str = str.trim();
  if (str.startsWith('#')) return str;
  // rgb(r, g, b) or rgb(r g b)
  const rgbMatch = str.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  if (rgbMatch) {
    const toHex = x => parseInt(x).toString(16).padStart(2, '0');
    return '#' + toHex(rgbMatch[1]) + toHex(rgbMatch[2]) + toHex(rgbMatch[3]);
  }
  // hsl(h, s%, l%) or hsl(h s% l%)
  const hslMatch = str.match(/hsla?\(\s*([\d.]+)[,\s]+([\d.]+)%?[,\s]+([\d.]+)%?/);
  if (hslMatch) return hslToHex(parseFloat(hslMatch[1]), parseFloat(hslMatch[2]), parseFloat(hslMatch[3]));
  return str; // fallback: return as-is (might already be hex or named)
}

// ── Hex to HSL ──
function hexToHSL(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  const r = parseInt(hex.substring(0,2), 16) / 255;
  const g = parseInt(hex.substring(2,4), 16) / 255;
  const b = parseInt(hex.substring(4,6), 16) / 255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h = 0, s = 0, l = (max+min)/2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    if (max === r) h = ((g-b)/d + (g<b?6:0))/6;
    else if (max === g) h = ((b-r)/d + 2)/6;
    else h = ((r-g)/d + 4)/6;
  }
  return { h: Math.round(h*360), s: Math.round(s*100), l: Math.round(l*100) };
}

// ── Copy / Download ──
function initExportButtons() {
  const copyBtn = $('#copy-css-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(buildCSSOutput()).then(() => {
        const orig = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        setTimeout(() => copyBtn.textContent = orig, 1500);
      });
    });
  }
  const downloadBtn = $('#download-css-btn');
  if (downloadBtn) downloadBtn.addEventListener('click', downloadCSS);

  const resetBtn = $('#reset-btn');
  if (resetBtn) resetBtn.addEventListener('click', resetTheme);
}

// ── Watch light/dark toggle ──
function watchThemeChanges() {
  new MutationObserver(() => {
    if (activePresetName !== 'default') {
      const preset = PRESETS.find(p => p.name === activePresetName);
      if (preset) {
        const darkCss = preset.cssDark ? '\n' + preset.cssDark.replace('[data-theme="dark"]', '[data-theme="dark"]:root') : '';
        const css = (preset.css || '') + darkCss;
        if (css.trim()) { injectStyle('snice-theme-preset', css); localStorage.setItem('snice-theme-preset', css); }
      }
    }
    // Re-render builder to update color pickers for new mode
    renderBuilderControls();
    updateExport();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

// ── Init ──
function init() {
  initVariantSelector();
  renderPresetCards();
  renderBuilderControls();
  initExportButtons();
  watchThemeChanges();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

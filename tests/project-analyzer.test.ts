import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  analyzeProject,
  analyzeSource,
  PROJECT_ANALYZER_RULES,
  PROJECT_ANALYZER_SCHEMA_VERSION
} from '../bin/project-analyzer.js';

interface FixtureCase {
  name: string;
  filename: string;
  source: string;
  expectedRuleIds: string[];
}

interface FixtureFile {
  schemaVersion: number;
  producer: string;
  cases: FixtureCase[];
}

const fixtureDirectory = resolve(__dirname, 'fixtures/project-analyzer');
const fixtures = readdirSync(fixtureDirectory)
  .filter(filename => filename.endsWith('.json'))
  .sort()
  .map(filename => {
    const contents = readFileSync(resolve(fixtureDirectory, filename), 'utf8');
    return { filename, fixture: JSON.parse(contents) as FixtureFile };
  });

describe('Snice project analyzer fixture registry', () => {
  for (const { filename, fixture } of fixtures) {
    describe(`${filename} (${fixture.producer})`, () => {
      it('uses the current fixture schema', () => {
        expect(fixture.schemaVersion).toBe(PROJECT_ANALYZER_SCHEMA_VERSION);
      });

      for (const testCase of fixture.cases) {
        it(testCase.name, () => {
          const diagnostics = analyzeSource(testCase.source, testCase.filename);
          expect(diagnostics.map(diagnostic => diagnostic.ruleId)).toEqual(testCase.expectedRuleIds);
        });
      }
    });
  }
});

describe('Snice project analyzer API', () => {
  it('publishes unique, stable rule metadata', () => {
    const ids = PROJECT_ANALYZER_RULES.map(rule => rule.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(PROJECT_ANALYZER_RULES.every(rule => rule.code === rule.id)).toBe(true);
    expect(PROJECT_ANALYZER_RULES).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'snice/no-lit-api',
          severity: 'error',
          category: 'framework'
        }),
        expect.objectContaining({
          id: 'snice/recommend-modal',
          severity: 'suggestion',
          category: 'recommendation'
        }),
        expect.objectContaining({
          id: 'snice/unused-dependency',
          severity: 'error',
          category: 'configuration'
        }),
        expect.objectContaining({
          id: 'snice/route-param-has-no-binding-target',
          severity: 'error',
          category: 'router'
        })
      ])
    );
  });

  it('returns stable JSON fields, ordering, source locations, and recommendations', () => {
    const source = "import { page } from 'snice';\nconst view = html`<dialog>Hi</dialog>`;";
    expect(JSON.parse(JSON.stringify(analyzeSource(source, 'src/home.ts')))).toEqual([
      {
        severity: 'error',
        code: 'snice/router-page-source',
        ruleId: 'snice/router-page-source',
        message: "The page decorator is returned by Router(); it is not exported from 'snice'.",
        fix: "Export { page } from the application's router module and import it from that local module.",
        file: 'src/home.ts',
        line: 1,
        column: 1
      },
      {
        severity: 'suggestion',
        code: 'snice/recommend-modal',
        ruleId: 'snice/recommend-modal',
        message: 'A native dialog is being used where Snice can provide focus trapping, backdrop dismissal, and accessible modal behavior.',
        fix: 'Review docs/ai/components/modal.md and replace the custom implementation when its contract fits.',
        file: 'src/home.ts',
        line: 2,
        column: 19,
        recommendation: {
          component: 'modal',
          tag: 'snice-modal',
          import: "import 'snice/components/modal/snice-modal';",
          docsPath: 'docs/ai/components/modal.md'
        }
      }
    ]);
  });

  it('rejects backslash-escaped quotes inside html attribute values', () => {
    const invalid = [
      "import { html } from 'snice';",
      'const view = html`<user-card description="say \\"${query}\\""></user-card>`;'
    ].join('\n');
    expect(
      analyzeSource(invalid, 'src/view.ts').map(diagnostic => diagnostic.ruleId)
    ).toContain('snice/escaped-quote-in-attribute');

    const valid = [
      "import { html } from 'snice';",
      'const view = html`<user-card .description=${`say "${query}"`}></user-card>`;'
    ].join('\n');
    expect(
      analyzeSource(valid, 'src/view.ts')
        .filter(diagnostic => diagnostic.ruleId === 'snice/escaped-quote-in-attribute')
    ).toEqual([]);
  });

  it('does not report examples that only appear in comments', () => {
    const source = [
      "// import { page } from 'snice';",
      '/* <dialog></dialog>',
      'experimentalDecorators: true */',
      "import 'snice/components/modal/snice-modal';"
    ].join('\n');
    expect(analyzeSource(source, 'src/commented.ts')).toEqual([]);
  });

  it('validates input types at the public boundary', () => {
    expect(() => analyzeSource(null as unknown as string)).toThrowError('source must be a string');
    expect(() => analyzeSource('', null as unknown as string)).toThrowError('filename must be a string');
  });
});

describe('snice/react-raw-custom-element', () => {
  const rule = (files: Record<string, string>) =>
    analyzeProject(files).filter(diagnostic => diagnostic.ruleId === 'snice/react-raw-custom-element');

  const reactManifest = JSON.stringify({
    name: 'app',
    dependencies: { react: '^19.0.0', 'react-dom': '^19.0.0', snice: '^6.0.0' }
  });

  it('fails the original Haiku pattern: raw released Snice JSX in a React app', () => {
    const diagnostics = rule({
      'package.json': reactManifest,
      'src/App.tsx': 'export function App() {\n  return <snice-button>Save</snice-button>;\n}'
    });
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toMatchObject({
      severity: 'error',
      file: 'src/App.tsx',
      line: 2
    });
    expect(diagnostics[0].message).toContain('<snice-button>');
    expect(diagnostics[0].message).toContain('Button');
    expect(diagnostics[0].fix).toContain("register 'snice/components/button/snice-button'");
  });

  it('diagnoses every distinct raw released tag once', () => {
    const diagnostics = rule({
      'package.json': reactManifest,
      'src/App.tsx': [
        'export function App() {',
        '  return (<div>',
        '    <snice-button>Save</snice-button>',
        '    <snice-button>Again</snice-button>',
        '    <snice-card />',
        '    <snice-modal open />',
        '  </div>);',
        '}'
      ].join('\n')
    });
    expect(diagnostics).toHaveLength(3);
    expect(diagnostics.map(diagnostic => diagnostic.message)).toEqual([
      expect.stringContaining('<snice-button>'),
      expect.stringContaining('<snice-card>'),
      expect.stringContaining('<snice-modal>')
    ]);
  });

  it('still diagnoses a raw wrapper-backed tag when runtime registration exists', () => {
    const diagnostics = rule({
      'package.json': reactManifest,
      'src/main.tsx': "import 'snice/components/button/snice-button';\nimport { App } from './App';",
      'src/App.tsx': 'export function App() {\n  return <snice-button>Save</snice-button>;\n}'
    });
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].message).toContain('Button');
  });

  it('still diagnoses a raw wrapper-backed tag when JSX typing and registration exist', () => {
    const diagnostics = rule({
      'package.json': reactManifest,
      'src/main.tsx': "import 'snice/components/button/snice-button';\nimport { App } from './App';",
      'src/snice-jsx.d.ts': [
        "declare namespace React {",
        '  namespace JSX {',
        '    interface IntrinsicElements {',
        "      'snice-button': any;",
        '    }',
        '  }',
        '}'
      ].join('\n'),
      'src/App.tsx': 'export function App() {\n  return <snice-button>Save</snice-button>;\n}'
    });
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].message).toContain('Button');
  });

  it('detects React usage from source evidence without a package.json', () => {
    const diagnostics = rule({
      'src/App.tsx': "import { useState } from 'react';\nexport function App() {\n  return <snice-badge>New</snice-badge>;\n}"
    });
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].message).toContain('<snice-badge>');
  });

  it('detects React from a tsconfig JSX compiler mode alone', () => {
    const diagnostics = rule({
      'tsconfig.json': JSON.stringify({ compilerOptions: { jsx: 'react-jsx', strict: true } }),
      'src/View.tsx': 'export function View() {\n  return <snice-alert>Hi</snice-alert>;\n}'
    });
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].message).toContain('<snice-alert>');
  });

  it('detects raw released tags in .jsx files without any other evidence', () => {
    const diagnostics = rule({
      'src/App.jsx': 'export function App() {\n  return <snice-progress value={40} />;\n}'
    });
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].message).toContain('<snice-progress>');
  });

  it('treats a react import in a .ts module as file-level React evidence', () => {
    const diagnostics = rule({
      'src/view.ts': "import { createElement } from 'react';\nexport const view = <snice-chip>One</snice-chip>;"
    });
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].message).toContain('<snice-chip>');
  });

  it('detects raw tags nested inside JSX expression containers', () => {
    const diagnostics = rule({
      'package.json': reactManifest,
      'src/App.tsx': [
        'export function App({ show }) {',
        '  return (<div>',
        '    {show && <snice-tooltip text="Hint" />}',
        '  </div>);',
        '}'
      ].join('\n')
    });
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].message).toContain('<snice-tooltip>');
    expect(diagnostics[0].line).toBe(3);
  });

  it('does not scan .ts modules without React evidence', () => {
    const diagnostics = rule({
      'src/view.ts': 'export const markup = `<snice-button>Save</snice-button>`;'
    });
    expect(diagnostics).toEqual([]);
  });

  it('does not scan Snice template markup as JSX', () => {
    const diagnostics = rule({
      'src/widget.ts': [
        "import { html } from 'snice';",
        'export const template = html`<snice-button>Save</snice-button>`;'
      ].join('\n')
    });
    expect(diagnostics).toEqual([]);
  });

  it('does not scan Snice markup inside html templates even in a React project', () => {
    const diagnostics = rule({
      'package.json': reactManifest,
      'src/template.ts': [
        "import { html } from 'snice';",
        'export const template = html`<snice-button>Save</snice-button>`;'
      ].join('\n')
    });
    expect(diagnostics).toEqual([]);
  });

  it('ignores raw tags inside strings and comments', () => {
    const diagnostics = rule({
      'package.json': reactManifest,
      'src/App.tsx': [
        '// <snice-button> in a comment',
        'const snippet = \'<snice-button>Save</snice-button>\';',
        'const template = `<snice-card></snice-card>`;',
        'export function App() { return <div />; }'
      ].join('\n')
    });
    expect(diagnostics).toEqual([]);
  });

  it('leaves valid wrapper usage with registration clean', () => {
    const diagnostics = analyzeProject({
      'package.json': reactManifest,
      'src/main.tsx': "import 'snice/components/button/snice-button';\nimport { App } from './App';",
      'src/App.tsx': [
        "import { Button } from 'snice/react';",
        'export function App() {',
        '  return <Button variant="primary">Save</Button>;',
        '}'
      ].join('\n')
    });
    expect(diagnostics.filter(diagnostic => diagnostic.ruleId.startsWith('snice/react-'))).toEqual([]);
  });

  it('ignores unreleased local custom elements with a snice- prefix', () => {
    const diagnostics = rule({
      'package.json': reactManifest,
      'src/App.tsx': 'export function App() {\n  return <snice-local-widget />;\n}'
    });
    expect(diagnostics).toEqual([]);
  });

  it('ignores raw tags in HTML documents of a React project', () => {
    const diagnostics = rule({
      'package.json': reactManifest,
      'index.html': '<html><body><snice-button>Save</snice-button></body></html>'
    });
    expect(diagnostics).toEqual([]);
  });

  it('leaves raw Tabs children to the nested-element rule without double reporting', () => {
    const diagnostics = analyzeProject({
      'package.json': reactManifest,
      'src/main.tsx': "import 'snice/components/tabs/snice-tabs';\nimport { App } from './App';",
      'src/App.tsx': [
        "import { Tabs } from 'snice/react';",
        'export function App() {',
        '  return (<Tabs>',
        '    <snice-tab>One</snice-tab>',
        '    <snice-tab-panel>First</snice-tab-panel>',
        '  </Tabs>);',
        '}'
      ].join('\n')
    });
    expect(diagnostics.filter(diagnostic => diagnostic.ruleId === 'snice/react-raw-custom-element')).toEqual([]);
    expect(
      diagnostics.filter(diagnostic => diagnostic.ruleId === 'snice/react-nested-element-contract')
    ).toHaveLength(2);
  });

  it('never counts a type-only import as custom-element registration', () => {
    const diagnostics = analyzeProject({
      'package.json': reactManifest,
      'src/main.tsx': "import type { SniceButton } from 'snice/components/button/snice-button';\nimport { App } from './App';",
      'src/App.tsx': [
        "import { Button } from 'snice/react';",
        'export function App() {',
        '  return <Button variant="primary">Save</Button>;',
        '}'
      ].join('\n')
    });
    const registration = diagnostics.filter(
      diagnostic => diagnostic.ruleId === 'snice/react-component-registration'
    );
    expect(registration).toHaveLength(1);
    expect(registration[0].message).toContain('<snice-button>');
  });

  it('publishes the rule in the registry', () => {
    expect(PROJECT_ANALYZER_RULES).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'snice/react-raw-custom-element',
          severity: 'error',
          category: 'react'
        })
      ])
    );
  });
});

describe('snice/react-prop-contract manifest coverage', () => {
  it('names the wrapper and unsupported prop, and suggests the closest contract member', () => {
    const unsupported = analyzeSource(
      "import { Button } from 'snice/react';\nexport const view = <Button form=\"ticket-form\">Save</Button>;",
      'src/form.tsx'
    ).filter(diagnostic => diagnostic.ruleId === 'snice/react-prop-contract');
    expect(unsupported).toHaveLength(1);
    expect(unsupported[0].message).toBe('Button has no form prop in the generated React adapter contract.');
    expect(unsupported[0].line).toBe(2);
    expect(unsupported[0].fix).toContain('form');

    const suggestion = analyzeSource(
      "import { Plan } from 'snice/react';\nexport const view = <Plan annualPrice=\"99\" />;",
      'src/pricing.tsx'
    ).filter(diagnostic => diagnostic.ruleId === 'snice/react-prop-contract');
    expect(suggestion).toHaveLength(1);
    expect(suggestion[0].message).toBe('Plan has no annualPrice prop in the generated React adapter contract.');
    expect(suggestion[0].fix).toContain('Did you mean annual-price?');
  });

  it('accepts every generated wrapper property and event prop', async () => {
    const { ANALYZER_CONTRACTS } = await import('../bin/analyzer-contracts.js');
    const wrappers = Object.values(ANALYZER_CONTRACTS.react.wrappers) as Array<{
      exportName: string;
      properties: string[];
      interfaceProps?: string[];
      events: Record<string, string>;
    }>;
    expect(wrappers.length).toBeGreaterThan(0);

    for (const wrapper of wrappers) {
      const props = [...new Set([...wrapper.properties, ...(wrapper.interfaceProps ?? [])])];
      const eventProps = Object.values(wrapper.events);
      const attributes = [
        ...props.map(name => `${name}={1}`),
        ...eventProps.map(name => `${name}={handler}`)
      ].join(' ');
      const source = `import { ${wrapper.exportName} } from 'snice/react';\nconst view = <${wrapper.exportName} ${attributes} />;`;
      const diagnostics = analyzeSource(source, 'src/contracts.tsx')
        .filter(diagnostic => diagnostic.ruleId === 'snice/react-prop-contract');
      expect(
        diagnostics,
        `${wrapper.exportName}: ${diagnostics.map(diagnostic => diagnostic.message).join('; ')}`
      ).toEqual([]);
    }
  });
});

describe('snice/react-type-export-as-component manifest coverage', () => {
  it('flags every type-only snice/react export used as a JSX component', async () => {
    const { ANALYZER_CONTRACTS } = await import('../bin/analyzer-contracts.js');
    const typeExports = ANALYZER_CONTRACTS.react.typeExports as string[];
    const allExports = new Set(ANALYZER_CONTRACTS.react.exports);

    expect(typeExports.length).toBeGreaterThan(0);
    expect(typeExports).toContain('Placard');
    for (const name of typeExports) {
      expect(allExports.has(name), `${name} must also be a declared export`).toBe(true);
    }
    for (const valueName of ['SniceRouter', 'Route', 'Button', 'createReactAdapter', 'useSniceFormValue']) {
      expect(typeExports, `${valueName} is a value export`).not.toContain(valueName);
    }

    for (const name of typeExports) {
      const source = `import { ${name} } from 'snice/react';\nconst view = <${name} />;`;
      const diagnostics = analyzeSource(source, 'src/contracts.tsx')
        .filter(diagnostic => diagnostic.ruleId === 'snice/react-type-export-as-component');
      expect(diagnostics, `${name} used as JSX must be flagged`).toHaveLength(1);
    }
  });
});

describe('element recommendation docs pointers', () => {
  const triggers: Array<[string, string]> = [
    ['snice/recommend-modal', 'export const view = html`<dialog>Hi</dialog>`;'],
    ['snice/recommend-table', 'export const view = html`<table></table>`;'],
    ['snice/recommend-toast', "export function notify() {\n  showToast('Saved');\n}"],
    ['snice/recommend-notification-center', "export class Center {\n  unreadCount = 3;\n  markAllAsRead() { this.unreadCount = 0; }\n}"],
    ['snice/recommend-checkbox', 'export const view = html`<input type="checkbox" />`;'],
    ['snice/recommend-radio', 'export const view = html`<input type="radio" />`;'],
    ['snice/recommend-input', 'export const view = html`<input type="text" />`;'],
    ['snice/recommend-textarea', 'export const view = html`<textarea></textarea>`;'],
    ['snice/recommend-select', 'export const view = html`<select></select>`;'],
    ['snice/recommend-tabs', 'export const view = html`<div role="tablist"></div>`;'],
    ['snice/recommend-pagination', 'export const view = html`<nav aria-label="pagination"></nav>`;']
  ];

  it('every element recommendation links an existing AI doc in fix and structured fields', () => {
    for (const [ruleId, source] of triggers) {
      const diagnostics = analyzeSource(source, 'src/view.ts')
        .filter(diagnostic => diagnostic.ruleId === ruleId);
      expect(diagnostics, `${ruleId} must fire on its trigger`).toHaveLength(1);
      const [diagnostic] = diagnostics;
      expect(diagnostic.fix, `${ruleId} fix must reference the AI docs`).toMatch(
        /Review docs\/ai\/components\/[a-z0-9-]+\.md/
      );
      expect(diagnostic.recommendation?.docsPath, `${ruleId} structured docsPath`).toMatch(
        /^docs\/ai\/components\/[a-z0-9-]+\.md$/
      );
      expect(
        existsSync(join(process.cwd(), diagnostic.recommendation!.docsPath)),
        `${ruleId} docsPath must exist: ${diagnostic.recommendation!.docsPath}`
      ).toBe(true);
    }
  });

  it('substitution and syntax rules link the AI docs too', () => {
    const select = analyzeSource(
      "import { html } from 'snice';\nexport const view = html`<snice-select><option value=\"a\">A</option></snice-select>`;",
      'src/form.ts'
    ).find(diagnostic => diagnostic.ruleId === 'snice/select-native-option');
    expect(select?.fix).toContain('docs/ai/components/select.md');
    expect(select?.recommendation?.docsPath).toBe('docs/ai/components/select.md');

    const keyFilter = analyzeSource(
      "class F {\n  @on('keydown')\n  handleKey(event: KeyboardEvent) {\n    if (event.key === 'Enter') this.save();\n  }\n}",
      'src/f.ts'
    ).find(diagnostic => diagnostic.ruleId === 'snice/recommend-key-filter');
    expect(keyFilter?.fix).toContain('docs/ai/api.md');

    const templateKeyFilter = analyzeSource(
      "import { html } from 'snice';\nclass F {\n  render() { return html`<div @keydown=${this.handleKey}></div>`; }\n  handleKey(event: KeyboardEvent) {\n    if (event.key === 'Escape') this.close();\n  }\n}",
      'src/f.ts'
    ).find(diagnostic => diagnostic.ruleId === 'snice/recommend-key-filter');
    expect(templateKeyFilter?.fix).toContain('docs/ai/bindings.md');

    const typeExport = analyzeSource(
      "import { Placard } from 'snice/react';\nexport const view = <Placard />;",
      'src/app.tsx'
    ).find(diagnostic => diagnostic.ruleId === 'snice/react-type-export-as-component');
    expect(typeExport?.fix).toContain('docs/ai/react-integration.md');
  });
});

describe('snice/request-respond-pairing', () => {
  const rule = (files: Record<string, string>) =>
    analyzeProject(files).filter(diagnostic => diagnostic.ruleId === 'snice/request-respond-pairing');

  it('rejects a request with no responder anywhere in the project', () => {
    const diagnostics = rule({
      'src/pages/plants.ts': [
        "import { element, request } from 'snice';",
        "@element('plants-page')",
        'class PlantsPage extends HTMLElement {',
        "  @request('get-plants')",
        '  async fetchPlants() {}',
        '}'
      ].join('\n')
    });
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].message).toContain("get-plants");
    expect(diagnostics[0].message).toContain('50ms');
    expect(diagnostics[0].fix).toContain('docs/ai/decorators.md');
  });

  it('accepts a request paired with a responder in another file', () => {
    const diagnostics = rule({
      'src/pages/plants.ts': "@element('plants-page')\nclass PlantsPage extends HTMLElement {\n  @request('get-plants')\n  async fetchPlants() {}\n}",
      'src/controllers/plants.ts': "@controller('plants')\nclass PlantController {\n  @respond('get-plants')\n  async handlePlants() {}\n}"
    });
    expect(diagnostics).toEqual([]);
  });

  it('accepts an explicitly optional request without a responder', () => {
    const diagnostics = rule({
      'src/pages/plants.ts': "@element('plants-page')\nclass PlantsPage extends HTMLElement {\n  @request('get-plants', { optional: true })\n  async fetchPlants() {}\n}"
    });
    expect(diagnostics).toEqual([]);
  });

  it('ignores dynamically named requests', () => {
    const diagnostics = rule({
      'src/pages/plants.ts': "@element('plants-page')\nclass PlantsPage extends HTMLElement {\n  @request(channel)\n  async fetch() {}\n}"
    });
    expect(diagnostics).toEqual([]);
  });

  it('reports once per channel per file', () => {
    const diagnostics = rule({
      'src/pages/plants.ts': "@element('plants-page')\nclass PlantsPage extends HTMLElement {\n  @request('get-plants')\n  async one() {}\n  @request('get-plants')\n  async two() {}\n  @request('get-history')\n  async three() {}\n}"
    });
    expect(diagnostics).toHaveLength(2);
  });
});

describe('router construction and project architecture guidance', () => {
  const byRule = (files: Record<string, string>, ruleId: string) =>
    analyzeProject(files).filter(diagnostic => diagnostic.ruleId === ruleId);

  it('requires a Router target as well as its navigation type', () => {
    const diagnostics = analyzeSource(
      "import { Router } from 'snice';\nexport const { page, initialize } = Router({ type: 'hash' });",
      'src/router.ts'
    ).filter(diagnostic => diagnostic.ruleId === 'snice/router-config');
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].message).toContain('target selector');
  });

  it('accepts a shorthand Router target property', () => {
    const diagnostics = analyzeSource(
      "import { Router } from 'snice';\nconst target = '#app';\nRouter({ target, type: 'hash' }).initialize();",
      'src/router.ts'
    ).filter(diagnostic => diagnostic.ruleId === 'snice/router-config');
    expect(diagnostics).toEqual([]);
  });

  it('requires the Router-returned initialize function to be called project-wide', () => {
    const diagnostics = byRule({
      'src/router.ts': "import { Router } from 'snice';\nexport const { page, initialize } = Router({ target: '#app', type: 'hash' });",
      'src/pages/home-page.ts': "import { page } from '../router';\n@page({ tag: 'home-page', routes: ['/'] })\nclass HomePage extends HTMLElement {}"
    }, 'snice/router-initialization');
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].fix).toContain('call initialize()');
  });

  it('accepts conventional multi-file Router construction and initialization', () => {
    expect(byRule({
      'src/router.ts': "import { Router } from 'snice';\nexport const { page, initialize, navigate } = Router({ target: '#app', type: 'hash' });",
      'src/main.ts': "import './pages/home-page';\nimport { initialize } from './router';\ninitialize();",
      'src/pages/home-page.ts': "import { page } from '../router';\n@page({ tag: 'home-page', routes: ['/'] })\nclass HomePage extends HTMLElement {}"
    }, 'snice/router-initialization')).toEqual([]);
  });

  it('accepts initialize destructured from a named Router instance', () => {
    expect(byRule({
      'src/router.ts': "import { Router } from 'snice';\nconst router = Router({ target: '#app', type: 'hash' });\nexport const { page, initialize: startRouter } = router;",
      'src/main.ts': "import './pages/home-page';\nimport { startRouter } from './router';\nstartRouter();",
      'src/pages/home-page.ts': "import { page } from '../router';\n@page({ tag: 'home-page', routes: ['/'] })\nclass HomePage extends HTMLElement {}"
    }, 'snice/router-initialization')).toEqual([]);
  });

  it('rejects combining @page and @element without suggesting that the page move to components', () => {
    const files = {
      'src/pages/home-page.ts': [
        "import { element } from 'snice';",
        "import { page } from '../router';",
        "@page({ tag: 'home-page', routes: ['/'] })",
        "@element('home-page')",
        'class HomePage extends HTMLElement {}'
      ].join('\n')
    };
    const diagnostics = byRule(files, 'snice/page-element-double-decoration');
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].fix).toContain('Remove @element');
    expect(byRule(files, 'snice/recommend-project-structure')).toEqual([]);
  });

  it('accepts a routed class decorated only with the Router page decorator', () => {
    expect(byRule({
      'src/pages/home-page.ts': "import { page } from '../router';\n@page({ tag: 'home-page', routes: ['/'] })\nclass HomePage extends HTMLElement {}"
    }, 'snice/page-element-double-decoration')).toEqual([]);
  });

  it('recommends conventional folders for every application role', () => {
    const diagnostics = byRule({
      'src/main.ts': [
        "@page({ tag: 'home-page', routes: ['/'] })",
        'class HomePage extends HTMLElement {}',
        "@element('user-card')",
        'class UserCard extends HTMLElement {}',
        "@controller('session-controller')",
        'class SessionController {}',
        '@daemon',
        'class SessionDaemon {}'
      ].join('\n')
    }, 'snice/recommend-project-structure');
    expect(diagnostics).toHaveLength(4);
    expect(diagnostics.map(diagnostic => diagnostic.fix)).toEqual(expect.arrayContaining([
      expect.stringContaining('src/pages/home-page.ts'),
      expect.stringContaining('src/components/user-card.ts'),
      expect.stringContaining('src/controllers/session-controller.ts'),
      expect.stringContaining('src/daemons/session-daemon.ts')
    ]));
  });

  it('does not recommend moves for classes already in conventional folders', () => {
    expect(byRule({
      'src/pages/home-page.ts': "@page({ tag: 'home-page', routes: ['/'] })\nclass HomePage extends HTMLElement {}",
      'src/components/user-card.ts': "@element('user-card')\nclass UserCard extends HTMLElement {}",
      'src/controllers/session-controller.ts': "@controller('session-controller')\nclass SessionController {}",
      'src/daemons/session-daemon.ts': '@daemon\nclass SessionDaemon {}'
    }, 'snice/recommend-project-structure')).toEqual([]);
  });

  it('recommends a controller only for clearly service-heavy page logic', () => {
    const heavy = [
      "@page({ tag: 'orders-page', routes: ['/orders'] })",
      'class OrdersPage extends HTMLElement {',
      "  async loadOrders() { const a = await fetch('/orders'); localStorage.setItem('orders', await a.text()); }",
      "  async loadCustomers() { const a = await fetch('/customers'); sessionStorage.setItem('customers', await a.text()); }",
      "  async loadInvoices() { const a = await fetch('/invoices'); localStorage.setItem('invoices', await a.text()); }",
      "  async loadShipments() { const a = await fetch('/shipments'); sessionStorage.setItem('shipments', await a.text()); }",
      '}'
    ].join('\n');
    const diagnostics = byRule({ 'src/pages/orders-page.ts': heavy }, 'snice/recommend-page-decomposition');
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].message).toContain('4 effectful methods');

    const lean = [
      "@page({ tag: 'profile-page', routes: ['/profile'] })",
      'class ProfilePage extends HTMLElement {',
      "  async load() { return fetch('/profile'); }",
      "  render() { return html`<h1>Profile</h1>`; }",
      '}'
    ].join('\n');
    expect(byRule({ 'src/pages/profile-page.ts': lean }, 'snice/recommend-page-decomposition')).toEqual([]);
  });

  it('detects substantial logic copied across page files', () => {
    const shared = [
      '  normalizeRows(rows: Array<{ active: boolean; name: string }>) {',
      '    const active = rows.filter(row => row.active);',
      '    const sorted = active.sort((left, right) => left.name.localeCompare(right.name));',
      '    const names = sorted.map(row => row.name.trim());',
      "    if (names.length === 0) return ['No results'];",
      "    return names.reduce((all, name) => [...all, name], [] as string[]);",
      '  }'
    ].join('\n');
    const diagnostics = byRule({
      'src/pages/alpha-page.ts': "@page({ tag: 'alpha-page', routes: ['/a'] })\nclass AlphaPage extends HTMLElement {\n" + shared + '\n}',
      'src/pages/beta-page.ts': "@page({ tag: 'beta-page', routes: ['/b'] })\nclass BetaPage extends HTMLElement {\n" + shared + '\n}'
    }, 'snice/recommend-page-decomposition');
    expect(diagnostics).toHaveLength(2);
    expect(diagnostics.every(diagnostic => diagnostic.message.includes('across 2 page files'))).toBe(true);
  });

  it('publishes the architecture rules in the public registry', () => {
    expect(PROJECT_ANALYZER_RULES).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'snice/router-initialization', severity: 'error', category: 'router' }),
      expect.objectContaining({ id: 'snice/page-element-double-decoration', severity: 'error', category: 'router' }),
      expect.objectContaining({ id: 'snice/recommend-project-structure', severity: 'suggestion', category: 'architecture' }),
      expect.objectContaining({ id: 'snice/recommend-page-decomposition', severity: 'suggestion', category: 'architecture' }),
      expect.objectContaining({ id: 'snice/controller-on-page-host', severity: 'warning', category: 'architecture' }),
      expect.objectContaining({ id: 'snice/imperative-controller-attach', severity: 'suggestion', category: 'architecture' }),
      expect.objectContaining({ id: 'snice/element-member-shadows-native-idl', severity: 'warning', category: 'properties' }),
      expect.objectContaining({ id: 'snice/recommend-route-params', severity: 'suggestion', category: 'router' })
    ]));
  });
});

describe('controller and native IDL architecture checks', () => {
  it('prefers declarative controller bindings in application code but permits test attachment', () => {
    const source = [
      "import { attachController as bindController } from 'snice';",
      'export async function bind(host: HTMLElement) {',
      '  await bindController(host, OrdersController);',
      '}'
    ].join('\n');

    const applicationDiagnostics = analyzeSource(source, 'src/pages/orders-page.ts')
      .filter(diagnostic => diagnostic.ruleId === 'snice/imperative-controller-attach');
    expect(applicationDiagnostics).toHaveLength(1);
    expect(applicationDiagnostics[0].fix).toContain('controller=${ControllerClass}');

    const testDiagnostics = analyzeSource(source, 'src/pages/orders-page.test.ts')
      .filter(diagnostic => diagnostic.ruleId === 'snice/imperative-controller-attach');
    expect(testDiagnostics).toEqual([]);

    // Shared test fixtures live in test directories without .test/.spec
    // suffixes — they are the "focused framework tests only" case the rule
    // carves out, so they must not be flagged either.
    const fixtureDiagnostics = analyzeSource(source, 'tests/fixtures/mount-controller-host.ts')
      .filter(diagnostic => diagnostic.ruleId === 'snice/imperative-controller-attach');
    expect(fixtureDiagnostics).toEqual([]);
  });

  it('warns when element state shadows inherited HTMLElement IDL members', () => {
    const source = [
      "import { element, property } from 'snice';",
      "@element('account-card')",
      'class AccountCard extends HTMLElement {',
      '  @property({ attribute: false }) role: { id: string } | null = null;',
      '  private inert = false;',
      "  @property() accountTitle = '';",
      '}'
    ].join('\n');

    const diagnostics = analyzeSource(source, 'src/components/account-card.ts')
      .filter(diagnostic => diagnostic.ruleId === 'snice/element-member-shadows-native-idl');
    expect(diagnostics).toHaveLength(2);
    expect(diagnostics.map(diagnostic => diagnostic.message)).toEqual(expect.arrayContaining([
      expect.stringContaining('.role shadows HTMLElement.role'),
      expect.stringContaining('.inert shadows HTMLElement.inert')
    ]));
    expect(diagnostics.some(diagnostic => diagnostic.message.includes('accountTitle'))).toBe(false);
  });
});

describe('local reactive contract checks', () => {
  const byRule = (files: Record<string, string>, ruleId: string) =>
    analyzeProject(files).filter(diagnostic => diagnostic.ruleId === ruleId);

  it('flags render reads from mutable plain fields but not reactive or readonly fields', () => {
    const diagnostics = byRule({
      'src/components/result-list.ts': [
        "@element('result-list')",
        'class ResultList extends HTMLElement {',
        '  items: string[] = [];',
        '  readonly heading = "Results";',
        '  handleSelect = () => this.items[0];',
        '  @state() selected = 0;',
        '  @render() template() {',
        '    return html`<h2>${this.heading}</h2><button @click=${this.handleSelect}>${this.items.length}:${this.selected}</button>`;',
        '  }',
        '}'
      ].join('\n')
    }, 'snice/template-reads-nonreactive-field');

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].message).toContain('this.items');
  });

  it('checks routed @page classes as render owners too', () => {
    const diagnostics = byRule({
      'src/pages/results-page.ts': [
        "@page({ tag: 'results-page', routes: ['/results'] })",
        'class ResultsPage extends HTMLElement {',
        '  rows: string[] = [];',
        '  @render() template() { return html`<p>${this.rows.length}</p>`; }',
        '}'
      ].join('\n')
    }, 'snice/template-reads-nonreactive-field');

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].message).toContain('this.rows');
  });

  it('flags property bindings to local undecorated fields and accessors', () => {
    const diagnostics = byRule({
      'src/components/result-list.ts': [
        "@element('result-list')",
        'class ResultList extends HTMLElement {',
        '  items: string[] = [];',
        '  get filter() { return "all"; }',
        '  set filter(value: string) {}',
        '  @property({ attribute: false }) selected: string[] = [];',
        '  @render() template() { return html`<p>${this.items.length}</p>`; }',
        '}'
      ].join('\n'),
      'src/pages/results-page.ts': [
        'const view = html`<result-list',
        '  .items=${items}',
        '  .filter=${filter}',
        '  .selected=${selected}',
        '></result-list>`;'
      ].join('\n')
    }, 'snice/prop-binding-to-undecorated-member');

    expect(diagnostics).toHaveLength(2);
    expect(diagnostics.map(diagnostic => diagnostic.message)).toEqual(expect.arrayContaining([
      expect.stringContaining('.items'),
      expect.stringContaining('.filter')
    ]));
  });

  it('accepts a custom accessor that invalidates through reactive backing state', () => {
    const diagnostics = byRule({
      'src/components/native-like-input.ts': [
        "@element('native-like-input')",
        'class NativeLikeInput extends HTMLElement {',
        '  @state() private valueState = "";',
        '  get value() { return this.valueState; }',
        '  set value(next: string) { this.setValue(next); }',
        '  private setValue(next: string) { this.valueState = next; }',
        '  @render() template() { return html`<span>${this.valueState}</span>`; }',
        '}'
      ].join('\n'),
      'src/pages/form-page.ts': 'html`<native-like-input .value=${name}></native-like-input>`;'
    }, 'snice/prop-binding-to-undecorated-member');

    expect(diagnostics).toEqual([]);
  });
});

describe('declarative architecture smell checks', () => {
  it('prefers @dispatch for replaceable manual host CustomEvents', () => {
    const element = [
      "@element('filter-panel')",
      'class FilterPanel extends HTMLElement {',
      '  emit(value: string) {',
      '    this.dispatchEvent(',
      "      new CustomEvent<FilterChangeDetail>('filter-change', {",
      '        detail: { value }, bubbles: true, composed: true',
      '      })',
      '    );',
      '  }',
      '}'
    ].join('\n');
    expect(analyzeSource(element, 'src/components/filter-panel.ts'))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({
          code: 'snice/prefer-dispatch-decorator',
          ruleId: 'snice/prefer-dispatch-decorator',
          severity: 'suggestion'
        })
      ]));

    const controller = [
      "@controller('filter-controller')",
      'class FilterController {',
      '  element: HTMLElement | null = null;',
      '  emit(value: string) {',
      "    this.element?.dispatchEvent(new CustomEvent('filter-change', { detail: { value } }));",
      '  }',
      '}'
    ].join('\n');
    expect(analyzeSource(controller, 'src/controllers/filter.ts'))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ ruleId: 'snice/prefer-dispatch-decorator' })
      ]));
  });

  it('keeps manual dispatch valid when code uses low-level dispatch semantics', () => {
    const source = [
      "@element('cancelable-panel')",
      'class CancelablePanel extends HTMLElement {',
      '  emit(name: string) {',
      "    return this.dispatchEvent(new CustomEvent('before-save', { cancelable: true }));",
      '  }',
      '  emitDynamic(name: string) {',
      '    this.dispatchEvent(new CustomEvent(name));',
      '  }',
      '}'
    ].join('\n');
    expect(analyzeSource(source, 'src/components/cancelable-panel.ts')
      .filter(diagnostic => diagnostic.ruleId === 'snice/prefer-dispatch-decorator')).toEqual([]);
  });

  it('recommends live property bindings for controlled self-mutating values', () => {
    const controlled = [
      '@render()',
      'template() {',
      '  return html`<snice-input value=${this.name}></snice-input>',
      '    <snice-textarea value="${this.notes}"></snice-textarea>',
      '    <snice-segmented-control value=${this.period}></snice-segmented-control>`;',
      '}'
    ].join('\n');
    const diagnostics = analyzeSource(controlled, 'src/components/editor.ts')
      .filter(diagnostic => diagnostic.ruleId === 'snice/live-control-value-binding');
    expect(diagnostics).toHaveLength(3);
    expect(diagnostics.every(diagnostic => diagnostic.fix.includes('.value=${live(value)}'))).toBe(true);

    const authoredDefault = "html`<snice-input value=\"initial\"></snice-input>`";
    expect(analyzeSource(authoredDefault, 'src/components/editor.ts')
      .filter(diagnostic => diagnostic.ruleId === 'snice/live-control-value-binding')).toEqual([]);

    const liveBinding = "html`<snice-input .value=${live(this.name)}></snice-input>`";
    expect(analyzeSource(liveBinding, 'src/components/editor.ts')
      .filter(diagnostic => diagnostic.ruleId === 'snice/live-control-value-binding')).toEqual([]);
  });

  it('detects imperative reseeding, once-painting, DOM building, and timer focus', () => {
    const source = [
      "import { element, html, query, render } from 'snice';",
      "@element('legacy-panel')",
      'class LegacyPanel extends HTMLElement {',
      "  @query('input') seedInput!: HTMLInputElement;",
      "  @query('input') input!: HTMLInputElement;",
      '  @render({ once: true }) template() { return html`<input>`; }',
      '  paint() {',
      '    this.seedInput.value = "seed";',
      '    this.input.hidden = false;',
      '    const option = document.createElement("option");',
      '    this.input.replaceChildren(option);',
      '    requestAnimationFrame(() => this.input.focus());',
      '  }',
      '}'
    ].join('\n');
    const ids = analyzeSource(source, 'src/components/legacy-panel.ts')
      .map(diagnostic => diagnostic.ruleId);
    expect(ids).toEqual(expect.arrayContaining([
      'snice/imperative-reseed-instead-of-live',
      'snice/paint-method-smell',
      'snice/dom-building-in-element',
      'snice/raf-focus'
    ]));
  });

  it('warns when tag-only delegation can match two instances', () => {
    const source = [
      "@element('range-page')",
      'class RangePage extends HTMLElement {',
      "  @on('daterange-change', 'snice-date-range-picker') changed() {}",
      '  @render() template() {',
      '    return html`<snice-date-range-picker></snice-date-range-picker>',
      '      <snice-modal><snice-date-range-picker></snice-date-range-picker></snice-modal>`;',
      '  }',
      '}'
    ].join('\n');
    const diagnostics = analyzeSource(source, 'src/pages/range-page.ts')
      .filter(diagnostic => diagnostic.ruleId === 'snice/ambiguous-delegation-selector');
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].message).toContain('2 matching instances');
  });

  it('detects stale-response guards only when repeated across files', () => {
    const guarded = (name: string, decorator = '') => [
      decorator,
      `class ${name} {`,
      '  requestVersion = 0;',
      '  async load() {',
      '    const version = ++this.requestVersion;',
      '    const response = await fetch("/api/data");',
      '    if (version !== this.requestVersion) return;',
      '    return response.json();',
      '  }',
      '}'
    ].join('\n');
    const one = analyzeProject({ 'src/pages/a-page.ts': guarded('A', "@page({ tag: 'a-page', routes: ['/a'] })") })
      .filter(diagnostic => diagnostic.ruleId === 'snice/duplicated-stale-guard');
    expect(one).toEqual([]);
    const two = analyzeProject({
      'src/pages/a-page.ts': guarded('A', "@page({ tag: 'a-page', routes: ['/a'] })"),
      'src/pages/b-page.ts': guarded('B', "@page({ tag: 'b-page', routes: ['/b'] })")
    }).filter(diagnostic => diagnostic.ruleId === 'snice/duplicated-stale-guard');
    expect(two).toHaveLength(2);

    const shared = analyzeProject({
      'src/shared/paged-collection.ts': guarded('PagedCollection'),
      'src/pages/a-page.ts': guarded('A', "@page({ tag: 'a-page', routes: ['/a'] })")
    }).filter(diagnostic => diagnostic.ruleId === 'snice/duplicated-stale-guard');
    expect(shared).toHaveLength(1);
    expect(shared[0].file).toBe('src/pages/a-page.ts');

    const plainModules = analyzeProject({
      'src/anything/paged-collection.ts': guarded('PagedCollection'),
      'src/elsewhere/latest-request.ts': guarded('LatestRequest')
    }).filter(diagnostic => diagnostic.ruleId === 'snice/duplicated-stale-guard');
    expect(plainModules).toEqual([]);
  });

  it('flags styled light roots but accepts explicit light-only renderers', () => {
    const styled = [
      "@element('flat-card', { renderRoot: 'light' })",
      'class FlatCard extends HTMLElement {',
      '  @styles() theme() { return css`:host { display: block; }`; }',
      '  @render() template() { return html`<p>flat</p>`; }',
      '}'
    ].join('\n');
    expect(analyzeSource(styled, 'src/components/flat-card.ts'))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ ruleId: 'snice/light-render-root-with-styles', severity: 'suggestion' })
      ]));

    const nativeFragment = [
      "@element('table-rows', { renderRoot: 'light' })",
      'class TableRows extends HTMLElement {',
      '  @render() template() { return html`<tr><td>row</td></tr>`; }',
      '}'
    ].join('\n');
    expect(analyzeSource(nativeFragment, 'src/components/table-rows.ts')
      .filter(diagnostic => diagnostic.ruleId === 'snice/light-render-root-with-styles')).toEqual([]);
  });

  it('flags translator-only controllers but not controllers with external behavior', () => {
    const translator = [
      "@controller('search-translator')",
      'class SearchTranslator {',
      "  @on('input') input(event: Event) { this.changed(event); }",
      "  @dispatch('search-change') changed(event: Event) { return event; }",
      '}'
    ].join('\n');
    expect(analyzeSource(translator, 'src/controllers/search-translator.ts'))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ ruleId: 'snice/translator-controller', severity: 'suggestion' })
      ]));

    const fetching = translator.replace(
      'class SearchTranslator {',
      "class SearchTranslator {\n  async load() { return fetch('/search'); }"
    );
    expect(analyzeSource(fetching, 'src/controllers/search.ts')
      .filter(diagnostic => diagnostic.ruleId === 'snice/translator-controller')).toEqual([]);

    const stateful = translator.replace(
      'class SearchTranslator {',
      'class SearchTranslator {\n  private lastQuery = "";'
    );
    expect(analyzeSource(stateful, 'src/controllers/search.ts')
      .filter(diagnostic => diagnostic.ruleId === 'snice/translator-controller')).toEqual([]);
  });

  it('requires an origin guard when a controller listens for an event it dispatches', () => {
    const controller = (guard: string, on = "@on('data-load')") => [
      "@controller('paged-fetch')",
      'class PagedFetch {',
      `  ${on} load(event: Event) { ${guard} this.dataLoad(); }`,
      "  @dispatch('data-load') dataLoad() { return {}; }",
      '}'
    ].join('\n');
    expect(analyzeSource(controller(''), 'src/controllers/paged-fetch.ts'))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ ruleId: 'snice/controller-event-origin', severity: 'warning' })
      ]));
    expect(analyzeSource(
      controller('if (event.target !== this.element) return;'),
      'src/controllers/paged-fetch.ts'
    ).filter(diagnostic => diagnostic.ruleId === 'snice/controller-event-origin')).toEqual([]);

    expect(analyzeSource(
      controller('', "@on(['data-load', 'data-reload'], { capture: true })"),
      'src/controllers/paged-fetch.ts'
    )).toEqual(expect.arrayContaining([
      expect.objectContaining({ ruleId: 'snice/controller-event-origin' })
    ]));

    expect(analyzeSource(
      controller('', "@on('data-load', '.reload-button')"),
      'src/controllers/paged-fetch.ts'
    ).filter(diagnostic => diagnostic.ruleId === 'snice/controller-event-origin')).toEqual([]);
  });

  it('keeps URL ownership out of controllers', () => {
    const source = [
      "@controller('url-params')",
      'class UrlParamsController {',
      "  read() { return new URLSearchParams(window.location.search).get('q'); }",
      '}'
    ].join('\n');
    expect(analyzeSource(source, 'src/controllers/url-params.ts'))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ ruleId: 'snice/controller-owns-routing', severity: 'warning' })
      ]));
  });

  it('rejects self-ready waits without mislabeling same-host controller attach as a deadlock', () => {
    const deadlock = [
      "@element('dead-host')",
      'class DeadHost extends HTMLElement {',
      '  @ready() async initialize() { await this.ready; }',
      '}'
    ].join('\n');
    expect(analyzeSource(deadlock, 'src/components/dead-host.ts'))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ ruleId: 'snice/self-ready-await', severity: 'error' })
      ]));

    const supported = [
      "@element('supported-host')",
      'class SupportedHost extends HTMLElement {',
      '  @ready() async initialize() { await attachController(this, HostController); }',
      '}'
    ].join('\n');
    expect(analyzeSource(supported, 'src/components/supported-host.ts')
      .filter(diagnostic => diagnostic.ruleId === 'snice/self-ready-await')).toEqual([]);
  });

  it('flags trivially true diagnostic probes only in test files', () => {
    const probe = "it('probe', () => { console.log(document.body); expect(true).toBe(true); });";
    expect(analyzeSource(probe, 'src/probe.test.ts'))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ ruleId: 'snice/stray-probe-test', severity: 'warning' })
      ]));
    expect(analyzeSource(probe, 'src/probe.ts')
      .filter(diagnostic => diagnostic.ruleId === 'snice/stray-probe-test')).toEqual([]);
  });

  it('flags user-input helpers that only poke a value property', () => {
    const weak = [
      'function enterSearch(control: HTMLInputElement, value: string) {',
      '  control.value = value;',
      '}',
      "it('searches', () => enterSearch(input, 'query'));"
    ].join('\n');
    expect(analyzeSource(weak, 'src/search.test.ts'))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ ruleId: 'snice/test-helper-value-without-event', severity: 'suggestion' })
      ]));

    const realistic = weak.replace(
      '  control.value = value;',
      "  control.value = value;\n  control.dispatchEvent(new Event('input', { bubbles: true }));"
    );
    expect(analyzeSource(realistic, 'src/search.test.ts')
      .filter(diagnostic => diagnostic.ruleId === 'snice/test-helper-value-without-event')).toEqual([]);

    const propertyContract = "it('sets value', () => { control.value = 'programmatic'; expect(control.value).toBe('programmatic'); });";
    expect(analyzeSource(propertyContract, 'src/control.test.ts')
      .filter(diagnostic => diagnostic.ruleId === 'snice/test-helper-value-without-event')).toEqual([]);
  });
});

describe('page orchestration checks', () => {
  const byRule = (source: string, ruleId: string) => analyzeProject({
    'src/pages/search-page.ts': source
  }).filter(diagnostic => diagnostic.ruleId === ruleId);

  it('warns when a page attaches a controller to its own host', () => {
    const source = [
      "@page({ tag: 'search-page', routes: ['/search?q=:query'] })",
      'class SearchPage extends HTMLElement {',
      '  @ready() async boot() { await attachController(this, SearchController); }',
      '}'
    ].join('\n');
    const diagnostics = byRule(source, 'snice/controller-on-page-host');
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].fix).toContain('Keep element orchestration in the page');
  });

  it('recommends declared route params for manual page query plumbing', () => {
    const source = [
      "@page({ tag: 'search-page', routes: ['/search'] })",
      'class SearchPage extends HTMLElement {',
      "  read() { return new URLSearchParams(location.search).get('q'); }",
      "  write(q: string) { history.replaceState(null, '', '?q=' + q); }",
      '}'
    ].join('\n');
    const diagnostics = byRule(source, 'snice/recommend-route-params');
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].fix).toContain("?q=:query");
  });

  it('accepts route properties and page-owned orchestration', () => {
    const source = [
      "@page({ tag: 'search-page', routes: ['/search?q=:query'] })",
      'class SearchPage extends HTMLElement {',
      "  @property() query = '';",
      "  @ready() async load() { await fetch('/search?q=' + this.query); }",
      '}'
    ].join('\n');
    expect(byRule(source, 'snice/controller-on-page-host')).toEqual([]);
    expect(byRule(source, 'snice/recommend-route-params')).toEqual([]);
  });

  describe('route parameter binding targets', () => {
    const ruleId = 'snice/route-param-has-no-binding-target';

    it('requires binding targets for path and query params in string and object routes', () => {
      const source = [
        "@page({ tag: 'search-page', routes: [",
        "  '/teams/:teamId?view=:view',",
        "  { path: '/orders/:orderId?tab=:tab', order: -10 },",
        "  '/teams/:teamId/archive'",
        '] })',
        'class SearchPage extends HTMLElement {',
        "  @property() teamId = '';",
        "  @property({ reflect: false }) orderId = '';",
        '}'
      ].join('\n');
      const diagnostics = byRule(source, ruleId);

      expect(diagnostics).toHaveLength(2);
      expect(diagnostics.map(diagnostic => diagnostic.message)).toEqual([
        expect.stringContaining('view'),
        expect.stringContaining('tab')
      ]);
      expect(diagnostics[0]).toMatchObject({
        code: ruleId,
        line: 2,
        column: source.split('\n')[1].indexOf(':view') + 1
      });
      expect(diagnostics[0].fix).toContain('@property() view');
    });

    it('rejects undecorated fields, @state, attribute:false, and unreachable aliases', () => {
      const source = [
        "@page({ tag: 'search-page', routes: ['/catalog/:plain/:internal/:disabled/:userId'] })",
        'class SearchPage extends HTMLElement {',
        "  plain = '';",
        "  @state() internal = '';",
        "  @property({ attribute: false }) disabled = '';",
        "  @property({ attribute: 'user-id' }) userId = '';",
        '}'
      ].join('\n');
      const diagnostics = byRule(source, ruleId);

      expect(diagnostics).toHaveLength(4);
      expect(diagnostics.find(diagnostic => diagnostic.message.includes('disabled'))?.message)
        .toContain('attribute: false');
      const alias = diagnostics.find(diagnostic => diagnostic.message.includes('userId'))!;
      expect(alias.message).toContain('user-id');
      expect(alias.fix).toContain(':user-id');
      expect(alias.fix).toContain('remove the explicit attribute alias');
    });

    it('accepts explicit aliases when the Router attribute reaches the property', () => {
      const source = [
        "@page({ tag: 'search-page', routes: ['/:account-id?term=:q'] })",
        'class SearchPage extends HTMLElement {',
        "  @property({ attribute: 'account-id' }) accountId = '';",
        "  @property({ attribute: 'q', reflect: false }) query = '';",
        '}'
      ].join('\n');

      expect(byRule(source, ruleId)).toEqual([]);
    });

    it('accounts for SniceElement kebab-case implicit attributes', () => {
      const mismatched = [
        "import { SniceElement } from 'snice';",
        "@page({ tag: 'search-page', routes: ['/:userId'] })",
        'class SearchPage extends SniceElement {',
        "  @property() userId = '';",
        '}'
      ].join('\n');
      const diagnostics = byRule(mismatched, ruleId);
      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].message).toContain('user-id');
      expect(diagnostics[0].fix).toContain(':user-id');

      const matched = mismatched.replace(':userId', ':user-id');
      expect(byRule(matched, ruleId)).toEqual([]);
    });

    it('resolves bindable properties inherited from local project classes', () => {
      const diagnostics = analyzeProject({
        'src/pages/routed-base.ts': [
          'export class RoutedBase extends HTMLElement {',
          "  @property() accountId = '';",
          '}'
        ].join('\n'),
        'src/pages/account-page.ts': [
          "import { RoutedBase } from './routed-base';",
          "@page({ tag: 'account-page', routes: ['/accounts/:accountId'] })",
          'class AccountPage extends RoutedBase {}'
        ].join('\n')
      }).filter(diagnostic => diagnostic.ruleId === ruleId);

      expect(diagnostics).toEqual([]);
    });

    it('does not guess when an external base class may own the binding target', () => {
      const source = [
        "@page({ tag: 'search-page', routes: ['/accounts/:accountId'] })",
        'class SearchPage extends ExternalPage {}'
      ].join('\n');

      expect(byRule(source, ruleId)).toEqual([]);
    });

    it('handles literals, splats, optional groups, and duplicate params without false positives', () => {
      const supported = [
        "@page({ tag: 'search-page', routes: [",
        "  '/literal/fixed?mode=list',",
        "  '/files/*path',",
        "  '/topics(/:section)/:section'",
        '] })',
        'class SearchPage extends HTMLElement {',
        "  @property() path = '';",
        "  @property() section = '';",
        '}'
      ].join('\n');
      expect(byRule(supported, ruleId)).toEqual([]);

      const duplicatedMissing = [
        "@page({ tag: 'search-page', routes: ['/:itemKey/:itemKey', { path: '/again/:itemKey', order: 2 }] })",
        'class SearchPage extends HTMLElement {}'
      ].join('\n');
      expect(byRule(duplicatedMissing, ruleId)).toHaveLength(1);
    });

    it('uses Snice decorator import provenance, including aliases', () => {
      const diagnostics = analyzeProject({
        'src/router.ts': "import { Router } from 'snice'; export const { page } = Router({ type: 'hash' });",
        'src/pages/aliased.ts': [
          "import { page as routePage } from '../router';",
          "import { property as routeProperty } from 'snice';",
          "import { property as foreignProperty } from 'other-framework';",
          "@routePage({ tag: 'aliased-page', routes: ['/:good/:bad'] })",
          'class AliasedPage extends HTMLElement {',
          "  @routeProperty() good = '';",
          "  @foreignProperty() bad = '';",
          '}'
        ].join('\n')
      }).filter(diagnostic => diagnostic.ruleId === ruleId);
      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].message).toContain(':bad');

      const unrelated = [
        "import { page } from 'other-framework';",
        "@page({ routes: ['/:missing'] }) class NotASnicePage extends HTMLElement {}"
      ].join('\n');
      expect(byRule(unrelated, ruleId)).toEqual([]);

      const localForeignProperty = [
        'const property = () => () => {};',
        "@page({ routes: ['/:missing'] }) class LocalDecoratorPage extends HTMLElement {",
        "  @property() missing = '';",
        '}'
      ].join('\n');
      expect(byRule(localForeignProperty, ruleId)).toHaveLength(1);

      const localForeignPage = [
        'const page = () => () => {};',
        "@page({ routes: ['/:missing'] }) class LocalPage extends HTMLElement {}"
      ].join('\n');
      expect(byRule(localForeignPage, ruleId)).toEqual([]);

      const sniceAlias = [
        "import { SniceElement as BaseElement, property as routeProperty } from 'snice';",
        "@page({ routes: ['/:account-id'] }) class AliasBasePage extends BaseElement {",
        "  @routeProperty() accountId = '';",
        '}'
      ].join('\n');
      expect(byRule(sniceAlias, ruleId)).toEqual([]);
    });

    it('models subclass overrides using the transformed decorator semantics', () => {
      for (const override of ["accountId = '';", 'get accountId() { return super.accountId; }']) {
        const source = [
          "import { property, state as routeState } from 'snice';",
          "class Base extends HTMLElement { @property() accountId = ''; }",
          "@page({ routes: ['/:accountId'] }) class Child extends Base {",
          `  ${override}`,
          '}'
        ].join('\n');
        expect(byRule(source, ruleId)).toEqual([]);
      }

      const stateOverride = [
        "import { property, state as routeState } from 'snice';",
        "class Base extends HTMLElement { @property() accountId = ''; }",
        "@page({ routes: ['/:accountId'] }) class Child extends Base {",
        "  @routeState() accountId = '';",
        '}'
      ].join('\n');
      expect(byRule(stateOverride, ruleId)).toHaveLength(1);
    });

    it('checks explicit id property options before the native IDL fallback', () => {
      for (const declaration of [
        "@property({ attribute: false }) id = '';",
        "@property({ attribute: 'route-id' }) id = '';",
        "@state() id = '';"
      ]) {
        const source = [
          "@page({ routes: ['/:id'] }) class IdPage extends HTMLElement {",
          `  ${declaration}`,
          '}'
        ].join('\n');
        expect(byRule(source, ruleId)).toHaveLength(1);
      }
      expect(byRule("@page({ routes: ['/:id'] }) class NativeIdPage extends HTMLElement {}", ruleId)).toEqual([]);
    });

    it('requires named splat and optional-splat binding targets', () => {
      const source = [
        "@page({ routes: ['/files/*path', '/archive(/*rest)'] })",
        'class FilesPage extends HTMLElement {}'
      ].join('\n');
      expect(byRule(source, ruleId).map(item => item.message)).toEqual([
        expect.stringContaining('*path'),
        expect.stringContaining('*rest')
      ]);
    });

    it('resolves the imported base declaration without guessing by class name', () => {
      const files = {
        'src/good/base.ts': "import { property } from 'snice'; export class Base extends HTMLElement { @property() accountId = ''; }",
        'src/bad/base.ts': 'export class Base extends HTMLElement {}',
        'src/pages/page.ts': [
          "import { Base as RoutedBase } from '../good/base';",
          "@page({ routes: ['/:accountId'] }) class RoutedPage extends RoutedBase {}"
        ].join('\n')
      };
      expect(analyzeProject(files).filter(item => item.ruleId === ruleId)).toEqual([]);
      files['src/pages/page.ts'] = files['src/pages/page.ts'].replace('../good/base', '../bad/base');
      expect(analyzeProject(files).filter(item => item.ruleId === ruleId)).toHaveLength(1);
    });

    it('parses only static top-level page routes and cooks string escapes', () => {
      const source = [
        "@page(({ nested: { routes: ['/:ghost'] }, 'routes': ([",
        "  '/users/:user\\x49d',",
        "  { 'path': '/files/*file\\u0049d', meta: { path: '/:nested' } }",
        '] as const) } as const))',
        'class StaticPage extends HTMLElement {',
        "  @property() userId = '';",
        "  @property() fileId = '';",
        '}'
      ].join('\n');
      expect(byRule(source, ruleId)).toEqual([]);
    });

    it('supports namespace decorators and direct relative re-exports', () => {
      const diagnostics = analyzeProject({
        'src/router-core.ts': "import { Router } from 'snice'; export const { page } = Router({ type: 'hash' });",
        'src/router.ts': "export { page as routedPage } from './router-core';",
        'src/snice-barrel.ts': "export { property as routeProperty, SniceElement as RouteElement } from 'snice';",
        'src/base.ts': [
          "import { routeProperty, RouteElement } from './snice-barrel';",
          'export class Base extends RouteElement {',
          "  @routeProperty() accountId = '';",
          '}'
        ].join('\n'),
        'src/barrel.ts': "export { Base as RoutedBase } from './base';",
        'src/page.ts': [
          "import * as routes from './router';",
          "import { RoutedBase } from './barrel';",
          "@routes.routedPage({ routes: ['/:account-id/:missing'] })",
          'class ReexportedPage extends RoutedBase {}'
        ].join('\n'),
        'src/direct-page.ts': [
          "import * as snice from 'snice';",
          "const router = snice.Router({ type: 'hash' });",
          "@router.page({ routes: ['/:direct-id/:directMissing'] })",
          'class DirectNamespacePage extends snice.SniceElement {',
          "  @snice.property() directId = '';",
          '}'
        ].join('\n')
      }).filter(item => item.ruleId === ruleId);
      expect(diagnostics).toHaveLength(2);
      expect(diagnostics.map(item => item.message)).toEqual(expect.arrayContaining([
        expect.stringContaining(':missing'),
        expect.stringContaining(':directMissing')
      ]));

      const unresolved = {
        'src/page.ts': [
          "import * as routes from './missing-router';",
          "@routes.page({ routes: ['/:unknown'] }) class UnknownPage extends HTMLElement {}"
        ].join('\n')
      };
      expect(analyzeProject(unresolved).filter(item => item.ruleId === ruleId)).toEqual([]);

      const unresolvedProperty = [
        "import { property as maybeProperty } from './missing-decorators';",
        "@page({ routes: ['/:unknown'] }) class UnknownPropertyPage extends HTMLElement {",
        "  @maybeProperty() unknown = '';",
        '}'
      ].join('\n');
      expect(byRule(unresolvedProperty, ruleId)).toEqual([]);
    });

    it('ignores forged Snice provenance inside documentation strings and templates', () => {
      const foreignPage = analyzeProject({
        'src/foreign-router.ts': [
          'export const page = () => () => {};',
          'export const docs = `',
          '${`nested documentation`}',
          "import { Router } from 'snice';",
          "export const { page } = Router({ type: 'hash' });",
          '`;'
        ].join('\n'),
        'src/foreign-page.ts': [
          "import { page } from './foreign-router';",
          "@page({ routes: ['/:not-a-snice-route'] }) class ForeignPage extends HTMLElement {}"
        ].join('\n')
      }).filter(item => item.ruleId === ruleId);
      expect(foreignPage).toEqual([]);

      const realPage = analyzeProject({
        'src/router.ts': "import { Router } from 'snice'; export const { page } = Router({ type: 'hash' });",
        'src/foreign-decorators.ts': [
          'export const property = () => () => {};',
          `export const docs = "export * from 'snice';";`
        ].join('\n'),
        'src/foreign-property-page.ts': [
          "import { page } from './router';",
          "import { property as foreignProperty } from './foreign-decorators';",
          "@page({ routes: ['/:claimed'] }) class ForeignPropertyPage extends HTMLElement {",
          "  @foreignProperty({ attribute: false }) claimed = '';",
          '}'
        ].join('\n'),
        'src/real-page.ts': [
          "import { page } from './router';",
          "@page({ routes: ['/:separateMissing'] }) class RealPage extends HTMLElement {}"
        ].join('\n')
      }).filter(item => item.ruleId === ruleId);
      expect(realPage.map(item => item.message)).toEqual([expect.stringContaining(':separateMissing')]);
    });

    it('uses last-key semantics and defers route objects made uncertain by spreads', () => {
      const source = [
        "@page({ routes: ['/:ignored'], ...unknown, routes: [",
        "  { path: '/:old', path: '/:duplicateWinner' },",
        "  { path: '/:spreadAfter', ...route },",
        "  { ...route, path: '/:spreadBefore' },",
        "  { path: '/:methodOverridden', path() {} }",
        '] })',
        'class SpreadPage extends HTMLElement {}'
      ].join('\n');
      expect(byRule(source, ruleId).map(item => item.message)).toEqual([
        expect.stringContaining(':duplicateWinner'),
        expect.stringContaining(':spreadBefore')
      ]);

      const trailingSpread = "@page({ routes: ['/:uncertain'], ...unknown }) class UnknownRoutes extends HTMLElement {}";
      expect(byRule(trailingSpread, ruleId)).toEqual([]);
    });

    it('parses only structurally bounded observedAttributes members', () => {
      const valid = [
        "@page({ routes: ['/:tenant-id'] }) class ObservedPage extends HTMLElement {",
        "  static get observedAttributes() { return ['tenant-id']; }",
        '  attributeChangedCallback() {}',
        '}'
      ].join('\n');
      expect(byRule(valid, ruleId)).toEqual([]);

      for (const invalid of [
        valid.replace('static get observedAttributes()', 'method()').replace("return ['tenant-id'];", "return ['tenant-id'];"),
        valid.replace("static get observedAttributes() { return ['tenant-id']; }", "label = 'static get observedAttributes() { return [\\\"tenant-id\\\"]; }';"),
        valid.replace("static get observedAttributes() { return ['tenant-id']; }", "/* static get observedAttributes() { return ['tenant-id']; } */"),
        valid.replace('  attributeChangedCallback() {}', "  label = 'attributeChangedCallback() {}';"),
        valid.replace('  attributeChangedCallback() {}', '  value = attributeChangedCallback();')
      ]) expect(byRule(invalid, ruleId)).toHaveLength(1);

      const unrelatedArray = valid.replace("return ['tenant-id'];", "const unrelated = ['tenant-id']; return getNames();");
      expect(byRule(unrelatedArray, ruleId)).toEqual([]);
      const dynamic = valid.replace("return ['tenant-id'];", 'return this.names;');
      expect(byRule(dynamic, ruleId)).toEqual([]);
    });

    it('cooks unicode escapes in aliases and route strings', () => {
      const source = [
        "@page({ routes: ['/users/:user\\u{2d}id/:account-id'] }) class EscapedPage extends HTMLElement {",
        "  @property({ attribute: 'user\\u{2d}id' }) userId = '';",
        "  @property({ attribute: 'account-\\u0069d' }) accountId = '';",
        '}'
      ].join('\n');
      expect(byRule(source, ruleId)).toEqual([]);
    });

    it('maps route parameter locations after astral unicode escapes by UTF-16 code unit', () => {
      const source = [
        "@page({ routes: ['/emoji/\\u{1F600}/:missing',",
        "  '/archive/\\u{1F4C1}/*rest'] })",
        'class EscapedLocationPage extends HTMLElement {}'
      ].join('\n');
      const diagnostics = byRule(source, ruleId);

      expect(diagnostics).toHaveLength(2);
      expect(diagnostics[0]).toMatchObject({
        line: 1,
        column: source.split('\n')[0].indexOf(':missing') + 1
      });
      expect(diagnostics[1]).toMatchObject({
        line: 2,
        column: source.split('\n')[1].indexOf('*rest') + 1
      });
    });

    it('only applies SniceElement naming to proven Snice bases', () => {
      const localLookalike = [
        'class SniceElement extends HTMLElement {}',
        "@page({ routes: ['/:userId'] }) class LookalikePage extends SniceElement {",
        "  @property() userId = '';",
        '}'
      ].join('\n');
      expect(byRule(localLookalike, ruleId)).toEqual([]);
      expect(byRule(localLookalike.replace(':userId', ':user-id'), ruleId)).toHaveLength(1);

      const foreign = [
        "import { SniceElement } from 'other-framework';",
        "@page({ routes: ['/:user-id'] }) class ForeignPage extends SniceElement {}"
      ].join('\n');
      expect(byRule(foreign, ruleId)).toEqual([]);
    });

    it('accepts native and statically-known custom attribute targets', () => {
      const valid = [
        "@page({ routes: ['/:id/:tenant-id'] })",
        'class AttributePage extends HTMLElement {',
        "  static get observedAttributes() { return ['tenant-id']; }",
        '  attributeChangedCallback(name: string, oldValue: string | null, value: string | null) {}',
        '}'
      ].join('\n');
      expect(byRule(valid, ruleId)).toEqual([]);

      const invalid = valid.replace("  attributeChangedCallback(name: string, oldValue: string | null, value: string | null) {}\n", '');
      expect(byRule(invalid, ruleId)).toHaveLength(1);
    });

    it('catches the same disabled binding defect across nine page classes', () => {
      const files = Object.fromEntries(Array.from({ length: 9 }, (_, index) => {
        const number = index + 1;
        return [`src/pages/item-${number}-page.ts`, [
          `@page({ tag: 'item-${number}-page', routes: ['/items/${number}/:itemId'] })`,
          `class Item${number}Page extends HTMLElement {`,
          "  @property({ attribute: false }) itemId = '';",
          '}'
        ].join('\n')];
      }));
      const diagnostics = analyzeProject(files)
        .filter(diagnostic => diagnostic.ruleId === ruleId);

      expect(diagnostics).toHaveLength(9);
      expect(diagnostics.every(diagnostic => diagnostic.message.includes('attribute: false'))).toBe(true);
    });
  });

  it('warns when a bare same-page route shadows a later query variant', () => {
    const shadowed = [
      "@page({ tag: 'search-page', routes: ['/search', '/search?q=:query&page=:page'] })",
      'class SearchPage extends HTMLElement {}'
    ].join('\n');
    const diagnostics = byRule(shadowed, 'snice/shadowed-query-route');
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].message).toContain('never bind');
    expect(diagnostics[0].fix).toContain('Move "/search?q=:query&page=:page" before "/search"');

    const queryFirst = [
      "@page({ tag: 'search-page', routes: ['/search?q=:query&page=:page', '/search'] })",
      'class SearchPage extends HTMLElement {}'
    ].join('\n');
    expect(byRule(queryFirst, 'snice/shadowed-query-route')).toEqual([]);

    const explicitlyOrdered = [
      "@page({ tag: 'search-page', routes: [{ path: '/search', order: 10 }, { path: '/search?q=:query', order: -10 }] })",
      'class SearchPage extends HTMLElement {}'
    ].join('\n');
    expect(byRule(explicitlyOrdered, 'snice/shadowed-query-route')).toEqual([]);
  });
});

describe('non-source content detection', () => {
  it('reports only the non-source error and suppresses other rules', () => {
    const transcript = "User:\nWrite a modal.\n\nAssistant:\n```typescript\nexport const view = html`<dialog>Hi</dialog>`;\n```";
    const diagnostics = analyzeSource(transcript, 'src/app.tsx');
    expect(diagnostics.map(diagnostic => diagnostic.ruleId)).toEqual(['snice/non-source-content']);
    expect(diagnostics[0]).toMatchObject({ severity: 'error', line: 1, column: 1 });
  });

  it('does not flag "User:" and "Assistant:" that only appear in strings', () => {
    const source = [
      "const speaker = 'User:';",
      'const other = "Assistant:";',
      "const md = `\\`\\`\\`typescript\\nexample();\\n\\`\\`\\``;"
    ].join('\n');
    expect(
      analyzeSource(source, 'src/labels.ts')
        .filter(diagnostic => diagnostic.ruleId === 'snice/non-source-content')
    ).toEqual([]);
  });

  it('does not flag chat labels or fences that only appear in comments', () => {
    const source = [
      '// User: please review',
      '// Assistant: done',
      '/* ```typescript',
      'ignored();',
      '``` */',
      "export const value = 1;"
    ].join('\n');
    expect(
      analyzeSource(source, 'src/commented.ts')
        .filter(diagnostic => diagnostic.ruleId === 'snice/non-source-content')
    ).toEqual([]);
  });

  it('requires both a User and an Assistant label before flagging a transcript', () => {
    const source = "User: some ordinary heading text\nexport const heading = 'User';";
    expect(
      analyzeSource(source, 'src/one-label.ts')
        .filter(diagnostic => diagnostic.ruleId === 'snice/non-source-content')
    ).toEqual([]);
  });

  it('only inspects JavaScript and TypeScript source files', () => {
    const markdown = "User:\nhello\n\nAssistant:\n```ts\ncode();\n```";
    expect(
      analyzeSource(markdown, 'README.md')
        .filter(diagnostic => diagnostic.ruleId === 'snice/non-source-content')
    ).toEqual([]);
  });

  it('publishes the non-source rule in the registry', () => {
    expect(PROJECT_ANALYZER_RULES).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'snice/non-source-content',
          severity: 'error',
          category: 'source'
        })
      ])
    );
  });
});

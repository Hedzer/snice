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
        })
      ])
    );
  });

  it('returns stable JSON fields, ordering, source locations, and recommendations', () => {
    const source = "import { page } from 'snice';\nconst view = html`<dialog>Hi</dialog>`;";
    expect(JSON.parse(JSON.stringify(analyzeSource(source, 'src/home.ts')))).toEqual([
      {
        severity: 'error',
        ruleId: 'snice/router-page-source',
        message: "The page decorator is returned by Router(); it is not exported from 'snice'.",
        fix: "Export { page } from the application's router module and import it from that local module.",
        file: 'src/home.ts',
        line: 1,
        column: 1
      },
      {
        severity: 'suggestion',
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

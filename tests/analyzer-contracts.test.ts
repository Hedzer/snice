import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { ANALYZER_CONTRACTS } from '../bin/analyzer-contracts.js';
import { analyzeProject, analyzeSource } from '../bin/project-analyzer.js';
import {
  buildAnalyzerContracts,
  generateAnalyzerContracts,
  renderAnalyzerContracts
} from '../tooling/generators/generate-analyzer-contracts.js';

const projectRoot = resolve(__dirname, '..');

describe('generated analyzer contracts', () => {
  it('is deterministic and current', () => {
    const rebuilt = buildAnalyzerContracts(projectRoot);
    expect(renderAnalyzerContracts(rebuilt)).toBe(
      readFileSync(resolve(projectRoot, 'bin/analyzer-contracts.js'), 'utf8')
    );
    expect(() => generateAnalyzerContracts({ check: true, root: projectRoot })).not.toThrow();
  });

  it('covers every released custom-element definition and exact module path', () => {
    const manifest = JSON.parse(
      readFileSync(resolve(projectRoot, 'custom-elements.json'), 'utf8')
    );
    const expected = new Map<string, { modulePath: string; declaration: any }>();
    for (const module of manifest.modules) {
      for (const declaration of module.declarations ?? []) {
        if (!declaration.customElement || !declaration.tagName) continue;
        expected.set(declaration.tagName, {
          modulePath: `snice/${module.path.slice('dist/'.length, -'.js'.length)}`,
          declaration
        });
      }
    }

    expect(Object.keys(ANALYZER_CONTRACTS.components).sort()).toEqual(
      [...expected.keys()].sort()
    );
    for (const [tagName, { modulePath, declaration }] of expected) {
      const contract = ANALYZER_CONTRACTS.components[tagName];
      expect(contract.modulePath, tagName).toBe(modulePath);
      expect(Object.keys(contract.attributes), tagName).toEqual(
        (declaration.attributes ?? []).map((attribute: any) => attribute.name).sort()
      );
      expect(contract.events.map((event: any) => event.name), tagName).toEqual(
        (declaration.events ?? []).map((event: any) => event.name).sort()
      );
      expect(contract.slots, tagName).toEqual(
        (declaration.slots ?? []).map((slot: any) => slot.name ?? '').sort()
      );
    }
  });

  it('accepts every generated component module and rejects an invented one', () => {
    for (const modulePath of ANALYZER_CONTRACTS.componentModulePaths) {
      const errors = analyzeSource(`import '${modulePath}';`, 'src/main.ts')
        .filter(diagnostic => diagnostic.ruleId === 'snice/component-import-path');
      expect(errors, modulePath).toEqual([]);
    }
    expect(
      analyzeSource("import 'snice/components/button/not-a-button';", 'src/main.ts')
        .map(diagnostic => diagnostic.ruleId)
    ).toContain('snice/component-import-path');
  });

  it('accepts every generated package-root export', () => {
    for (const exports of chunks(ANALYZER_CONTRACTS.rootExports, 30)) {
      const source = `import type { ${exports.join(', ')} } from 'snice';`;
      expect(
        analyzeSource(source, 'src/contracts.ts')
          .filter(diagnostic => diagnostic.ruleId === 'snice/root-api-contract')
      ).toEqual([]);
    }
    expect(
      analyzeSource("import { DefinitelyInvented } from 'snice';", 'src/contracts.ts')
        .map(diagnostic => diagnostic.ruleId)
    ).toContain('snice/root-api-contract');
  });

  it('accepts every generated React export and maps every wrapper to a component', () => {
    for (const exports of chunks(ANALYZER_CONTRACTS.react.exports, 25)) {
      const source = `import type { ${exports.join(', ')} } from 'snice/react';`;
      expect(
        analyzeSource(source, 'src/contracts.tsx')
          .filter(diagnostic => diagnostic.ruleId === 'snice/react-import-contract')
      ).toEqual([]);
    }

    const wrappers = Object.values(ANALYZER_CONTRACTS.react.wrappers);
    expect(wrappers.length).toBe(ANALYZER_CONTRACTS.stats.reactWrappers);
    for (const wrapper of wrappers) {
      const component = ANALYZER_CONTRACTS.components[wrapper.tagName];
      expect(component, wrapper.exportName).toBeDefined();
      expect(wrapper.componentModulePath, wrapper.exportName).toBe(component.modulePath);
      expect(wrapper.family, wrapper.exportName).toBe(component.family);
      for (const property of wrapper.properties) {
        expect(component.properties[property], `${wrapper.exportName}.${property}`).toBeDefined();
      }
      for (const eventName of Object.keys(wrapper.events)) {
        expect(
          component.events.some((event: any) => event.name === eventName),
          `${wrapper.exportName}.${eventName}`
        ).toBe(true);
      }
    }
  });
});

describe('component type-module import gating', () => {
  const typePaths = ANALYZER_CONTRACTS.componentTypeModulePaths;

  it('accepts type-only imports from every generated .types module', () => {
    for (const typePath of typePaths) {
      const declaration = `import type { Placeholder } from '${typePath}';`;
      expect(
        analyzeSource(declaration, 'src/controller.ts')
          .filter(diagnostic => diagnostic.ruleId === 'snice/component-import-path'),
        typePath
      ).toEqual([]);

      const inline = `import { type Placeholder } from '${typePath}';`;
      expect(
        analyzeSource(inline, 'src/controller.ts')
          .filter(diagnostic => diagnostic.ruleId === 'snice/component-import-path'),
        typePath
      ).toEqual([]);
    }
  });

  it('rejects value and side-effect imports from a .types module', () => {
    const typePath = typePaths[0];

    const value = `import { Placeholder } from '${typePath}';`;
    expect(
      analyzeSource(value, 'src/controller.ts').map(diagnostic => diagnostic.ruleId)
    ).toContain('snice/component-import-path');

    const sideEffect = `import '${typePath}';`;
    expect(
      analyzeSource(sideEffect, 'src/main.ts').map(diagnostic => diagnostic.ruleId)
    ).toContain('snice/component-import-path');

    const defaultImport = `import Placeholder from '${typePath}';`;
    expect(
      analyzeSource(defaultImport, 'src/controller.ts').map(diagnostic => diagnostic.ruleId)
    ).toContain('snice/component-import-path');

    const mixed = `import Value, { type Placeholder } from '${typePath}';`;
    expect(
      analyzeSource(mixed, 'src/controller.ts').map(diagnostic => diagnostic.ruleId)
    ).toContain('snice/component-import-path');
  });
});

describe('manifest-parametric analyzer checks', () => {
  const literalContracts = Object.values(ANALYZER_CONTRACTS.components)
    .flatMap(component => Object.entries(component.attributes)
      .filter(([, attribute]: any) => attribute.literals.length)
      .map(([attributeName, attribute]: any) => ({ component, attributeName, attribute })));

  it.each(literalContracts)(
    'validates $component.tagName $attributeName against its closed literal union',
    ({ component, attributeName, attribute }) => {
      const valid = `<${component.tagName} ${attributeName}="${attribute.literals[0]}"></${component.tagName}>`;
      expect(
        analyzeSource(valid, 'src/view.ts')
          .filter(diagnostic => diagnostic.ruleId === 'snice/component-prop-contract')
      ).toEqual([]);

      const invalid = `<${component.tagName} ${attributeName}="__invented__"></${component.tagName}>`;
      expect(
        analyzeSource(invalid, 'src/view.ts')
          .map(diagnostic => diagnostic.ruleId)
      ).toContain('snice/component-prop-contract');
    }
  );

  const structuredContracts = Object.values(ANALYZER_CONTRACTS.components)
    .flatMap(component => component.structuredProperties.map(propertyName => {
      const attributeName = Object.entries(component.attributes)
        .find(([, attribute]: any) => attribute.property === propertyName)?.[0] ??
        propertyName.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
      return { component, propertyName, attributeName };
    }));

  it.each(structuredContracts)(
    'requires property binding for $component.tagName.$propertyName',
    ({ component, attributeName }) => {
      const source = `html\`<${component.tagName} ${attributeName}="\${value}"></${component.tagName}>\``;
      expect(
        analyzeSource(source, 'src/view.ts')
          .map(diagnostic => diagnostic.ruleId)
      ).toContain('snice/object-property-binding');
    }
  );

  it('accepts all wrapper event props and rejects model-style onSnice event inventions', () => {
    for (const wrapper of Object.values(ANALYZER_CONTRACTS.react.wrappers)) {
      const eventProps = Object.values(wrapper.events);
      const authored = eventProps.map(prop => `${prop}={() => {}}`).join(' ');
      const source = `import { ${wrapper.exportName} as Subject } from 'snice/react';\n<Subject ${authored} />;`;
      expect(
        analyzeSource(source, 'src/view.tsx')
          .filter(diagnostic =>
            diagnostic.ruleId === 'snice/react-import-contract' ||
            diagnostic.message.includes('event prop in the generated React adapter contract')
          )
      ).toEqual([]);

      const invented = `import { ${wrapper.exportName} as Subject } from 'snice/react';\n<Subject onSniceInvented={() => {}} />;`;
      expect(
        analyzeSource(invented, 'src/view.tsx')
          .some(diagnostic => diagnostic.message.includes('onSniceInvented event prop'))
      ).toBe(true);
    }
  });

  it('checks registration project-wide for every React wrapper', () => {
    const wrappers = Object.values(ANALYZER_CONTRACTS.react.wrappers);
    const imports = wrappers
      .map((wrapper, index) => `import { ${wrapper.exportName} as W${index} } from 'snice/react';`)
      .join('\n');
    const registrations = [...new Set(wrappers.map(wrapper => wrapper.componentModulePath))]
      .map(modulePath => `import '${modulePath}';`)
      .join('\n');
    const uses = wrappers.map((_, index) => `<W${index} />`).join('\n');
    const diagnostics = analyzeProject({
      'src/main.ts': registrations,
      'src/view.tsx': `${imports}\n${uses}`
    });
    expect(
      diagnostics.filter(diagnostic => diagnostic.ruleId === 'snice/react-component-registration')
    ).toEqual([]);
  });
});

describe('React red-team regressions', () => {
  const app = `
    import { Badge, Input, Modal, Select, Tabs, Toast } from 'snice/react';
    export function App({ notice }) {
      return <>
        <Toast variant={notice.kind} open duration={3500}
          onSniceAfterHide={() => {}}>{notice.message}</Toast>
        <Input onSniceInput={(event) => event.detail.value} />
        <Select onSniceChange={(event) => event.detail.value}>
          <option value="open">Open</option>
        </Select>
        <Modal onSniceRequestClose={() => {}} />
        <Badge variant="success">Resolved</Badge>
        <Tabs selected={0}>
          <snice-tab slot="nav">All</snice-tab>
          <snice-tab-panel name="all">Panel</snice-tab-panel>
        </Tabs>
      </>;
    }
  `;

  it('catches generated event, Toast, Select, and nested React contract errors', () => {
    const diagnostics = analyzeProject({
      'src/App.tsx': app,
      'src/main.tsx': [
        "import 'snice/components/badge/snice-badge';",
        "import 'snice/components/input/snice-input';",
        "import 'snice/components/modal/snice-modal';",
        "import 'snice/components/select/snice-select';",
        "import 'snice/components/tabs/snice-tabs';",
        "import 'snice/components/toast/snice-toast';"
      ].join('\n')
    });
    const messages = diagnostics.map(diagnostic => diagnostic.message);
    for (const needle of [
      'no variant prop',
      'no open prop',
      'no duration prop',
      'onSniceAfterHide event prop',
      'declares no default slot',
      'onSniceInput event prop',
      'onSniceChange event prop',
      'Native <option>',
      'onSniceRequestClose event prop',
      '<snice-tab>',
      '<snice-tab-panel>'
    ]) {
      expect(messages.some(message => message.includes(needle)), needle).toBe(true);
    }
    expect(messages.some(message => message.includes('Badge') && message.includes('children'))).toBe(false);
  });

  it('does not mistake local or third-party names for Snice APIs', () => {
    const source = `
      import { Route } from 'react-router-dom';
      function Input() {}
      function Router() {}
      function Context() {}
      const icon = <div icon="home" />;
      const route = <Route element={<Input />} />;
      window.addEventListener('ticket-created', event => console.log(event));
    `;
    expect(analyzeSource(source, 'src/local.tsx').filter(diagnostic => diagnostic.severity === 'error'))
      .toEqual([]);
  });
});

describe('shipped templates', () => {
  it.each(['default', 'react'])('%s template has zero analyzer errors project-wide', template => {
    const root = resolve(projectRoot, 'bin/templates', template);
    const files = Object.fromEntries(
      walkFiles(root)
        .filter(path => /\.(?:[cm]?[jt]sx?|html|json)$/.test(path))
        .map(path => [relative(root, path), readFileSync(path, 'utf8')])
    );
    expect(analyzeProject(files).filter(diagnostic => diagnostic.severity === 'error')).toEqual([]);
  });
});

describe('Snice dependency usage (project-level)', () => {
  const manifest = (extra: Record<string, unknown> = {}) =>
    JSON.stringify({ name: 'field-service-scheduler', dependencies: { snice: '../../..', react: '^19.0.0' }, ...extra }, null, 2);
  const genericSource =
    "import React from 'react';\nexport default function App() { return <div className=\"app\" />; }";

  const hasUnused = (files: Record<string, string>) =>
    analyzeProject(files).some(diagnostic => diagnostic.ruleId === 'snice/unused-dependency');

  it('flags a package that declares snice but never imports, registers, or renders it', () => {
    const diagnostics = analyzeProject({
      'package.json': manifest(),
      'src/App.tsx': genericSource
    });
    const unused = diagnostics.filter(diagnostic => diagnostic.ruleId === 'snice/unused-dependency');
    expect(unused).toHaveLength(1);
    expect(unused[0]).toMatchObject({ severity: 'error', file: 'package.json' });
  });

  it('flags a namespace import that is never referenced', () => {
    expect(hasUnused({
      'package.json': manifest(),
      'src/main.ts': "import * as snice from 'snice';\nexport class SessionDaemon {}"
    })).toBe(true);
  });

  it('does not flag a referenced namespace import', () => {
    expect(hasUnused({
      'package.json': manifest(),
      'src/main.ts': "import * as snice from 'snice';\nexport const view = snice.html`<p>Ready</p>`;"
    })).toBe(false);
  });

  it('does not flag a referenced root import from snice', () => {
    expect(hasUnused({
      'package.json': manifest(),
      'src/main.ts': "import { html } from 'snice';\nexport const view = html`<p>Ready</p>`;"
    })).toBe(false);
  });

  it('does not mistake a namespace name inside a string for code usage', () => {
    expect(hasUnused({
      'package.json': manifest(),
      'src/main.ts': "import * as snice from 'snice';\nexport const label = 'snice';"
    })).toBe(true);
  });

  it('counts a namespace used inside a template expression', () => {
    expect(hasUnused({
      'package.json': manifest(),
      'src/main.ts': "import * as snice from 'snice';\nexport const view = otherTemplate`value: ${snice}`;"
    })).toBe(false);
  });

  it('does not flag a referenced snice/react import', () => {
    expect(hasUnused({
      'package.json': manifest(),
      'src/main.tsx': "import { SniceProvider } from 'snice/react';\nexport const Provider = SniceProvider;"
    })).toBe(false);
  });

  it('does not flag a deep component registration import', () => {
    expect(hasUnused({ 'package.json': manifest(), 'src/main.ts': "import 'snice/components/modal/snice-modal';" })).toBe(false);
  });

  it('does not flag an authored released custom-element tag', () => {
    expect(hasUnused({ 'package.json': manifest(), 'src/view.ts': 'export const view = html`<snice-button>Go</snice-button>`;' })).toBe(false);
  });

  it('exempts the Snice package itself', () => {
    expect(hasUnused({ 'package.json': manifest({ name: 'snice' }), 'src/index.ts': genericSource })).toBe(false);
  });

  it('does not flag a project with no package.json', () => {
    expect(hasUnused({ 'src/App.tsx': genericSource })).toBe(false);
  });
});

function chunks<T>(values: T[], size: number): T[][] {
  const output: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    output.push(values.slice(index, index + size));
  }
  return output;
}

function walkFiles(directory: string): string[] {
  return readdirSync(directory).flatMap(entry => {
    const path = resolve(directory, entry);
    return statSync(path).isDirectory() ? walkFiles(path) : [path];
  });
}

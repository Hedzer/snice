// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');

describe('Snice agent guidance', () => {
  it('ships one concise workflow skill that routes to versioned docs', () => {
    const skill = read('.agents/skills/snice/SKILL.md');
    expect(skill).toMatch(/^---\nname: snice\ndescription:/);
    expect(skill).toContain('docs/ai/');
    expect(skill).toContain('node_modules/snice/docs/ai/');
    expect(skill).toContain('references/core-kitchen-sink.ts');
    expect(skill.split('\n').length).toBeLessThan(100);
  });

  it('points AI docs and generated guides to the skill without duplicating APIs', () => {
    const overview = read('docs/ai/README.md');
    const guidance = read('bin/templates/AI_GUIDANCE.md');
    expect(overview).toContain('.agents/skills/snice/SKILL.md');
    expect(overview).toContain('npx snice init-ai');
    expect(guidance).toContain('.agents/skills/snice/SKILL.md');
    expect(guidance).not.toContain('@property');
    expect(guidance).not.toContain('@state');
    expect(guidance).not.toContain('@observe');
  });

  it('nudges agents toward version-matched guidance on every discovery surface', () => {
    const command = 'npx snice init-ai';
    const pkg = JSON.parse(read('package.json'));
    for (const surface of [
      pkg.description,
      read('README.md'),
      read('llms.txt'),
      read('llms-full.txt'),
      read('bin/snice.js'),
      read('bin/postinstall.js'),
      read('.agents/skills/snice/SKILL.md'),
      read('docs/ai/README.md'),
      read('docs/ai/cli.md'),
      read('website/guide/ai.html')
    ]) {
      expect(surface).toContain(command);
    }
  });

  it('keeps the complete core example syntactically compilable', () => {
    const source = read('.agents/skills/snice/references/core-kitchen-sink.ts');
    const result = ts.transpileModule(source, {
      reportDiagnostics: true,
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        experimentalDecorators: false,
        useDefineForClassFields: false
      }
    });
    const errors = result.diagnostics?.filter(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error) ?? [];
    expect(errors).toEqual([]);
    for (const category of [
      '@element', '@page', '@layout', '@controller', '@property', '@state',
      '@watch', '@context', '@render', '@ready', '@reconnect', '@dispose',
      '@moved', '@adopted', '@query', '@queryAll', '@on', '@dispatch',
      '@request', '@respond', '@observe', '@debounce', '@throttle', '@once',
      '@memoize', 'ContextAwareFetcher', 'Router(', 'createRequestHandler(',
      'classMap(', 'styleMap(', 'repeat(', 'live(', 'unsafeHTML(', 'svg`',
      'nothing', 'noChange', 'waitForElementDefined(', 'waitForElementReady(',
      'waitForAllCustomElements(', 'trackRenders(', 'renderNow(',
      'lockBodyScroll(', 'unlockBodyScroll(', 'parseDuration(', 'escapeHtml(',
      'escapeAttr(', 'setStrictRenderErrors(', 'setDisableElementReadyWarnings('
    ]) {
      expect(source, `missing kitchen-sink category ${category}`).toContain(category);
    }
  });

  it('ships a strict no-emit tsconfig for the kitchen sink', () => {
    const config = JSON.parse(read('.agents/skills/snice/references/tsconfig.kitchen-sink.json'));
    expect(config.compilerOptions.strict).toBe(true);
    expect(config.compilerOptions.noEmit).toBe(true);
    expect(config.compilerOptions.experimentalDecorators).toBeUndefined();
    expect(config.files).toContain('core-kitchen-sink.ts');
  });

  it('does not reintroduce retired contradictory guidance', () => {
    const files = [
      read('.agents/skills/snice/SKILL.md'),
      read('bin/templates/AI_GUIDANCE.md'),
      read('docs/ai/README.md'),
      read('.ai/style.md')
    ].join('\n');
    expect(files).not.toMatch(/No [`]?@state/);
    expect(files).not.toMatch(/No [`]?reflect/);
    expect(files).not.toContain('@observe(() =>');
  });
});

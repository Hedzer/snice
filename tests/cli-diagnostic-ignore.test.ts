// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const cli = join(process.cwd(), 'bin/snice.js');

describe('.sniceignore diagnostic suppression', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), 'snice-ignore-'));
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it('suppresses an exact instance, one file, or a rule globally', async () => {
    const sourceDirectory = join(projectRoot, 'src/components');
    await mkdir(sourceDirectory, { recursive: true });
    await writeFile(join(sourceDirectory, 'filter-panel.ts'), [
      "@element('filter-panel')",
      'class FilterPanel extends HTMLElement {',
      '  first(value: string) {',
      "    this.dispatchEvent(new CustomEvent('filter-change', { detail: { value } }));",
      '  }',
      '  second(value: string) {',
      "    this.dispatchEvent(new CustomEvent('filter-reset', { detail: { value } }));",
      '  }',
      '}'
    ].join('\n'));

    const baseline = await validate(projectRoot);
    const code = 'snice/prefer-dispatch-decorator';
    const suggestions = baseline.issues.filter((issue: any) => issue.code === code);
    expect(suggestions).toHaveLength(2);

    const first = suggestions[0];
    await writeFile(
      join(projectRoot, '.sniceignore'),
      `${code} src/components/filter-panel.ts:${first.line}:${first.column} # accepted legacy instance\n`
    );
    const exact = await validate(projectRoot);
    expect(exact.issues.filter((issue: any) => issue.code === code)).toHaveLength(1);

    await writeFile(join(projectRoot, '.sniceignore'), `${code} src/components/filter-panel.ts\n`);
    const file = await validate(projectRoot);
    expect(file.issues.filter((issue: any) => issue.code === code)).toEqual([]);

    await writeFile(join(projectRoot, '.sniceignore'), `${code}\n`);
    const global = await validate(projectRoot);
    expect(global.issues.filter((issue: any) => issue.code === code)).toEqual([]);
  });

  it('uses the same code suppression for doctor findings', async () => {
    const baseline = await doctor(projectRoot);
    expect(baseline.findings.map((finding: any) => finding.code)).toEqual(expect.arrayContaining([
      'package-json',
      'snice-install',
      'tsconfig',
      'snice-skill'
    ]));

    await writeFile(join(projectRoot, '.sniceignore'), [
      'package-json',
      'snice-install',
      'tsconfig',
      'snice-skill',
      ''
    ].join('\n'));
    const ignored = await doctor(projectRoot);
    expect(ignored.ok).toBe(true);
    expect(ignored.findings).toEqual([]);

    const combined = await check(projectRoot);
    expect(combined.ok).toBe(true);
    expect(combined.findings).toEqual([]);
    expect(combined.issues).toEqual([]);
  });

  it('suppresses a route parameter binding-target warning by exact location', async () => {
    const sourceDirectory = join(projectRoot, 'src/pages');
    await mkdir(sourceDirectory, { recursive: true });
    await writeFile(join(sourceDirectory, 'order-page.ts'), [
      "@page({ tag: 'order-page', routes: ['/orders/:orderId'] })",
      'class OrderPage extends HTMLElement {}'
    ].join('\n'));

    const code = 'snice/route-param-has-no-binding-target';
    const baseline = await validate(projectRoot);
    const issue = baseline.issues.find((candidate: any) => candidate.code === code);
    expect(issue).toMatchObject({ file: join(sourceDirectory, 'order-page.ts'), line: 1 });

    await writeFile(
      join(projectRoot, '.sniceignore'),
      `${code} src/pages/order-page.ts:${issue.line}:${issue.column}\n`
    );
    const ignored = await validate(projectRoot);
    expect(ignored.issues.filter((candidate: any) => candidate.code === code)).toEqual([]);
  });

  it('suppresses an exact route warning after an astral unicode escape', async () => {
    const sourceDirectory = join(projectRoot, 'src/pages');
    await mkdir(sourceDirectory, { recursive: true });
    const source = [
      "@page({ routes: ['/emoji/\\u{1F600}/:missing'] })",
      'class EmojiPage extends HTMLElement {}'
    ].join('\n');
    await writeFile(join(sourceDirectory, 'emoji-page.ts'), source);

    const code = 'snice/route-param-has-no-binding-target';
    const baseline = await validate(projectRoot);
    const issue = baseline.issues.find((candidate: any) => candidate.code === code);
    expect(issue).toMatchObject({
      file: join(sourceDirectory, 'emoji-page.ts'),
      line: 1,
      column: source.split('\n')[0].indexOf(':missing') + 1
    });

    await writeFile(
      join(projectRoot, '.sniceignore'),
      `${code} src/pages/emoji-page.ts:${issue.line}:${issue.column}\n`
    );
    const ignored = await validate(projectRoot);
    expect(ignored.issues.filter((candidate: any) => candidate.code === code)).toEqual([]);
  });

  it('ignores forged Router provenance in templates while retaining real routes', async () => {
    const sourceDirectory = join(projectRoot, 'src/pages');
    await mkdir(sourceDirectory, { recursive: true });
    await writeFile(join(projectRoot, 'src/foreign-router.ts'), [
      'export const page = () => () => {};',
      'export const docs = `',
      '${`nested documentation`}',
      "import { Router } from 'snice';",
      "export const { page } = Router({ type: 'hash' });",
      '`;'
    ].join('\n'));
    await writeFile(join(projectRoot, 'src/router.ts'), [
      "import { Router } from 'snice';",
      "export const { page } = Router({ type: 'hash' });"
    ].join('\n'));
    await writeFile(join(sourceDirectory, 'foreign-page.ts'), [
      "import { page } from '../foreign-router';",
      "@page({ routes: ['/:forged'] }) class ForeignPage extends HTMLElement {}"
    ].join('\n'));
    await writeFile(join(sourceDirectory, 'real-page.ts'), [
      "import { page } from '../router';",
      "@page({ routes: ['/:realMissing'] }) class RealPage extends HTMLElement {}"
    ].join('\n'));

    const code = 'snice/route-param-has-no-binding-target';
    const result = await validate(projectRoot);
    expect(result.issues.filter((candidate: any) => candidate.code === code)).toEqual([
      expect.objectContaining({
        file: join(sourceDirectory, 'real-page.ts'),
        message: expect.stringContaining(':realMissing')
      })
    ]);
  });

  it('retains real Router provenance after regex and division expressions', async () => {
    const sourceDirectory = join(projectRoot, 'src/pages');
    await mkdir(sourceDirectory, { recursive: true });
    await writeFile(join(projectRoot, 'src/router.ts'), [
      "const single = /'/g, double = /\"/i, tick = /`/u, bracket = /[']/, escaped = /\\'/;",
      'let total = 12, count = 3;',
      'const ratio = total / count;',
      'total /= count;',
      "const url = 'https://snice.dev/a//b';",
      'const docs = `${/[/\'\"`]/giu.test(url)}`;',
      "const trailing = /[']/; // comment",
      "import { Router as makeRouter } from 'snice';",
      "export const { page: routePage } = makeRouter({ type: 'hash' });"
    ].join('\n'));
    await writeFile(join(sourceDirectory, 'regex-page.ts'), [
      "import { routePage } from '../router';",
      "@routePage({ routes: ['/:regexMissing'] }) class RegexPage extends HTMLElement {}"
    ].join('\n'));

    const code = 'snice/route-param-has-no-binding-target';
    const result = await validate(projectRoot);
    expect(result.issues.filter((candidate: any) => candidate.code === code)).toEqual([
      expect.objectContaining({ message: expect.stringContaining(':regexMissing') })
    ]);
  });

  it('handles control-body and divisor regexes in real and foreign Router provenance', async () => {
    const sourceDirectory = join(projectRoot, 'src/pages');
    await mkdir(sourceDirectory, { recursive: true });
    await writeFile(join(projectRoot, 'src/router.ts'), [
      "const text = '', condition = false, values = [];",
      "if (condition) /'/.test(text);",
      'while (condition) /"/.test(text);',
      'for (const value of values) /`/.test(value);',
      "do /[']/.test(text); while (condition);",
      "if (condition) /x/.test(text); else /\\'/.test(text);",
      'const ratio = 12 / /["\'`]/.test(text);',
      "import { Router as makeRouter } from 'snice';",
      "export const { page: routePage, initialize } = makeRouter({ target: '#app', type: 'hash' });",
      'initialize();'
    ].join('\n'));
    await writeFile(join(projectRoot, 'src/foreign-router.ts'), [
      "const text = '', condition = false;",
      "if (condition) /'/.test(text);",
      "const docs = 'import { Router as makeRouter } from \"snice\"; export const { page: routePage } = makeRouter({ type: \"hash\" });';",
      'export const routePage = () => () => {};'
    ].join('\n'));
    await writeFile(join(sourceDirectory, 'control-page.ts'), [
      "import { routePage } from '../router';",
      "@routePage({ routes: ['/:controlMissing'] }) class ControlPage extends HTMLElement {}"
    ].join('\n'));
    await writeFile(join(sourceDirectory, 'foreign-control-page.ts'), [
      "import { routePage } from '../foreign-router';",
      "@routePage({ routes: ['/:foreignControl'] }) class ForeignPage extends HTMLElement {}"
    ].join('\n'));

    const code = 'snice/route-param-has-no-binding-target';
    const result = await validate(projectRoot);
    expect(result.valid).toBe(true);
    expect(result.issues.filter((candidate: any) => candidate.code === code)).toEqual([
      expect.objectContaining({
        severity: 'warning',
        message: expect.stringContaining(':controlMissing')
      })
    ]);
  });

  it('reports named splats on an aliased local page decorator', async () => {
    const sourceDirectory = join(projectRoot, 'src/pages');
    await mkdir(sourceDirectory, { recursive: true });
    await writeFile(join(projectRoot, 'src/router-core.ts'), [
      "import { Router } from 'snice';",
      "export const { page } = Router({ type: 'hash' });"
    ].join('\n'));
    await writeFile(join(projectRoot, 'src/router.ts'), "export { page } from './router-core';\n");
    await writeFile(join(sourceDirectory, 'files-page.ts'), [
      "import * as routes from '../router';",
      "@routes.page({ tag: 'files-page', routes: ['/files/*path'] })",
      'class FilesPage extends HTMLElement {}'
    ].join('\n'));

    const result = await validate(projectRoot);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'snice/route-param-has-no-binding-target',
        line: 2,
        message: expect.stringContaining('*path')
      })
    ]));
  });
});

async function validate(root: string) {
  return runJson(['validate', root, '--json']);
}

async function doctor(root: string) {
  return runJson(['doctor', root, '--json']);
}

async function check(root: string) {
  return runJson(['check', root, '--json']);
}

async function runJson(args: string[]) {
  try {
    const result = await execFileAsync(process.execPath, [cli, ...args]);
    return JSON.parse(result.stdout);
  } catch (error: any) {
    if (!error.stdout) throw error;
    return JSON.parse(error.stdout);
  }
}

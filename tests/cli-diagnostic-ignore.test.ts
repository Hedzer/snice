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

  it('suppresses a route parameter binding-target error by exact location', async () => {
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

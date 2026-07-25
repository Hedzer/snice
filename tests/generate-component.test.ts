import { describe, expect, it, afterAll } from 'vitest';
import { execFileSync } from 'child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { transform } from 'esbuild';
import * as snice from './test-imports';

/**
 * `snice generate-component` prints a scaffold. A scaffold that does not
 * compile and mount is worse than no scaffold, so this exercises the real CLI
 * and then runs what it produced.
 */

const cli = join(process.cwd(), 'bin/snice.js');
const run = (args: string[], cwd = process.cwd()) =>
  execFileSync('node', [cli, ...args], { cwd, encoding: 'utf8' });

const temps: string[] = [];
const tempDir = () => {
  const dir = mkdtempSync(join(tmpdir(), 'snice-generate-'));
  temps.push(dir);
  return dir;
};
afterAll(() => temps.forEach(dir => rmSync(dir, { recursive: true, force: true })));

describe('snice generate-component', () => {
  it('is advertised in the CLI help', () => {
    const help = run(['--help']);
    expect(help).toContain('generate-component');
  });

  it('prints a scaffold to stdout without writing files', () => {
    const dir = tempDir();
    const out = run(['generate-component', 'task-item'], dir);

    expect(out).toContain("@element('task-item')");
    expect(out).toContain('export class TaskItem extends HTMLElement');
    expect(out).toContain("from 'snice'");
    expect(require('fs').readdirSync(dir)).toEqual([]);
  });

  it('declares the properties it is given, with the right types', () => {
    const out = run(['generate-component', 'task-item', '--props=label:string,count:number,done:boolean']);

    expect(out).toContain('@property({ type: String }) label = ');
    expect(out).toContain('@property({ type: Number }) count = 0;');
    expect(out).toContain('@property({ type: Boolean }) done = false;');
  });

  it('adds a @dispatch method per requested event', () => {
    const out = run(['generate-component', 'task-item', '--events=status-changed,item-removed']);

    expect(out).toContain("@dispatch('status-changed')");
    expect(out).toContain('emitStatusChanged');
    expect(out).toContain("@dispatch('item-removed')");
    expect(out).toContain('emitItemRemoved');
  });

  it('omits styles with --no-styles', () => {
    expect(run(['generate-component', 'task-item'])).toContain('@styles()');

    const bare = run(['generate-component', 'task-item', '--no-styles']);
    expect(bare).not.toContain('@styles()');
    expect(bare).not.toContain('css`');
  });

  it('writes to a file with --out', () => {
    const dir = tempDir();
    run(['generate-component', 'task-item', '--out=src/task-item.ts'], dir);

    const written = join(dir, 'src/task-item.ts');
    expect(existsSync(written), '--out did not create the file').toBe(true);
    expect(readFileSync(written, 'utf8')).toContain("@element('task-item')");
  });

  it('refuses to overwrite an existing file', () => {
    const dir = tempDir();
    writeFileSync(join(dir, 'taken.ts'), 'keep me');

    expect(() => run(['generate-component', 'task-item', '--out=taken.ts'], dir)).toThrow();
    expect(readFileSync(join(dir, 'taken.ts'), 'utf8')).toBe('keep me');
  });

  it('rejects a name that is not a valid custom element', () => {
    for (const bad of ['NoHyphen', 'nohyphen', '1-leading-digit']) {
      expect(() => run(['generate-component', bad]), `accepted invalid name ${bad}`).toThrow();
    }
  });

  it('rejects more than one name', () => {
    expect(() => run(['generate-component', 'a-b', 'c-d'])).toThrow();
  });

  it('rejects unknown options', () => {
    expect(() => run(['generate-component', 'task-item', '--nope=1'])).toThrow();
  });
});

describe('the generated component actually works', () => {
  it('compiles and mounts, with its properties reactive', async () => {
    const source = run(['generate-component', 'demo-widget', '--props=label:string,done:boolean', '--events=status-changed'])
      .replace(/^\s*import[^\n]*\n/gm, '')
      // The scaffold is a module (`export class`); evaluate it as a script.
      .replace(/^export class /m, 'class ')
      .replace(/@element\('demo-widget'\)/, "@element('demo-widget-generated')");

    const { code } = await transform(source, {
      loader: 'ts',
      target: 'es2022',
      tsconfigRaw: { compilerOptions: { experimentalDecorators: false, useDefineForClassFields: false } },
    });

    const names = Object.keys(snice).filter(k => /^[a-zA-Z_$][\w$]*$/.test(k));
    const values = names.map(k => (snice as any)[k]);
    expect(() => new Function(...names, `"use strict";\n${code}`)(...values)).not.toThrow();

    const el = document.createElement('demo-widget-generated') as any;
    document.body.appendChild(el);
    await el.ready;

    expect(el.label).toBe('');
    expect(el.done).toBe(false);
    expect(el.shadowRoot, 'generated component has no shadow root').toBeTruthy();

    el.label = 'Buy groceries';
    await el.rendered;
    expect(el.label).toBe('Buy groceries');

    // The generated @dispatch method emits its event.
    const seen: any[] = [];
    el.addEventListener('status-changed', (e: any) => seen.push(e.detail));
    el.emitStatusChanged({ done: true });
    await el.rendered;
    expect(seen).toEqual([{ done: true }]);

    el.remove();
  });
});

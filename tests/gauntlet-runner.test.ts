// @vitest-environment node
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { createServer } from 'node:http';
import { chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { afterEach, describe, expect, it } from 'vitest';
import { GAUNTLET_MODELS, LLAMA_CPP_RUNTIMES } from '../tooling/gauntlet/manifest.js';
import {
  downloadVerified,
  extractProjectFiles,
  extractTypeScript,
  listSamples,
  parseGauntletArgs,
  repeatedOutput,
  runModel
} from '../tooling/gauntlet/runner.js';

const execFileAsync = promisify(execFile);
const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map(path => rm(path, { recursive: true, force: true })));
});

describe('dumb-agent gauntlet', () => {
  it('parses prompt sources and execution controls', () => {
    expect(parseGauntletArgs([
      '--prompt', 'build it',
      '--models=qwen3-0.6b,lfm2.5-350m',
      '--concurrency', '2',
      '--threads=6'
    ])).toEqual({
      prompt: 'build it',
      models: 'qwen3-0.6b,lfm2.5-350m',
      concurrency: 2,
      threads: 6
    });
    expect(() => parseGauntletArgs(['--sample', 'daemon', '--prompt-file', 'prompt.txt']))
      .toThrow('mutually exclusive');
    expect(() => parseGauntletArgs(['--concurrency', '0'])).toThrow('positive integer');
    expect(() => parseGauntletArgs(['--invented'])).toThrow('unknown option');
  });

  it('ships multiple blind prompt samples', () => {
    expect(listSamples()).toEqual(['application', 'daemon', 'events', 'request-response', 'router']);
  });

  it('pins every artifact to a size and SHA-256 digest', () => {
    const ids = GAUNTLET_MODELS.map(model => model.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(expect.arrayContaining([
      'lfm2.5-350m',
      'gemma3-270m',
      'qwen3-0.6b',
      'deepseek-r1-1.5b'
    ]));
    for (const model of GAUNTLET_MODELS) {
      expect(model.url).toMatch(/^https:\/\//);
      expect(model.bytes).toBeGreaterThan(1_000_000);
      expect(model.sha256).toMatch(/^[a-f0-9]{64}$/);
    }
    for (const runtime of Object.values(LLAMA_CPP_RUNTIMES)) {
      expect(runtime.bytes).toBeGreaterThan(1_000_000);
      expect(runtime.sha256).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it('extracts code without leaking the echoed prompt or thinking trace', () => {
    const raw = `User:\nBuild a thing.\n\nAssistant:\n[Start thinking]\nMaybe invent it.\n[End thinking]\n\`\`\`typescript\nimport { html } from 'snice';\nconsole.log(html);\n\`\`\``;
    expect(extractTypeScript(raw)).toBe("import { html } from 'snice';\nconsole.log(html);");

    const exact = `User:\nBuild a thing.\n\nAssistant:\nimport { daemon } from 'snice';\n@daemon class Store {}`;
    expect(extractTypeScript(exact)).toBe("import { daemon } from 'snice';\n@daemon class Store {}");

    const multiple = `Assistant:\n\`\`\`json\n{"wrong": true}\n\`\`\`\n\`\`\`ts\nimport { html } from 'snice';\nexport const view = html\`ok\`;\n\`\`\``;
    expect(extractTypeScript(multiple)).toBe("import { html } from 'snice';\nexport const view = html`ok`;");
  });

  it('extracts a safely bounded multi-file source tree', () => {
    const raw = `Assistant:
Here is the project.
<<<FILE: src/main.ts>>>
\`\`\`ts
import './pages/home-page.js';
\`\`\`
<<<END FILE>>>
<<<FILE: src/pages/home-page.ts>>>
import { html } from 'snice';
export const view = html\`home\`;
<<<END FILE>>>`;

    expect(extractProjectFiles(raw)).toEqual([
      { path: 'src/main.ts', source: "import './pages/home-page.js';" },
      { path: 'src/pages/home-page.ts', source: "import { html } from 'snice';\nexport const view = html`home`;" }
    ]);
  });

  it('uses the next file header as an unambiguous boundary when end markers are omitted', () => {
    const raw = `User:\nThe format is <<<FILE: src/path.ts>>>.\nAssistant:
<<<FILE: src/main.ts>>>
import './router';
<<<FILE: src/router.ts>>>
export const route = '/';`;

    expect(extractProjectFiles(raw)).toEqual([
      { path: 'src/main.ts', source: "import './router';" },
      { path: 'src/router.ts', source: "export const route = '/';" }
    ]);
  });

  it('keeps single-file prompts backward compatible', () => {
    expect(extractProjectFiles("Assistant:\nimport { html } from 'snice';"))
      .toEqual([{ path: 'src/main.ts', source: "import { html } from 'snice';" }]);
  });

  it('rejects unsafe, duplicate, and unsupported generated paths', () => {
    expect(() => extractProjectFiles('<<<FILE: ../main.ts>>>\ncode\n<<<END FILE>>>'))
      .toThrow('safe path below src');
    expect(() => extractProjectFiles(
      '<<<FILE: src/main.ts>>>\none\n<<<END FILE>>>\n' +
      '<<<FILE: src/main.ts>>>\ntwo\n<<<END FILE>>>'
    )).toThrow('duplicate generated file path');
    expect(() => extractProjectFiles('<<<FILE: src/package.json>>>\n{}\n<<<END FILE>>>'))
      .toThrow('unsupported source extension');
  });

  it('recognizes degenerate exact-output repetition without a token limit', () => {
    const line = '// Browser Side Session';
    expect(repeatedOutput(`${'useful output\n'.repeat(700)}${`${line}\n`.repeat(20)}`))
      .toContain('line repeated');
    const phrase = 'The page decorator must come from the constructed router and create the app target.';
    const unaligned = Array.from({ length: 140 }, (_, index) => `${index}: ${phrase}`).join(' ');
    expect(repeatedOutput(unaligned)).toContain('substring repeated');
    expect(repeatedOutput('const value = 1;\n'.repeat(20))).toBeNull();
  });

  it('stops repetition from the live llama stream before the output file flushes', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'snice-gauntlet-stream-'));
    temporaryDirectories.push(directory);
    const runtime = join(directory, 'fake-llama');
    await writeFile(runtime, `#!/usr/bin/env node
const line = '// exact repeated generated line that must terminate the process\\n';
for (let index = 0; index < 1000; index++) process.stdout.write(line);
setInterval(() => process.stdout.write(line), 10);
`);
    await chmod(runtime, 0o755);

    const result = await runModel({
      runtime,
      modelPath: join(directory, 'fake.gguf'),
      projectDirectory: directory,
      threads: 1
    });

    expect(result.repetition).toMatch(/repeated/);
    expect(await readFile(join(directory, 'generation.log'), 'utf8')).toContain('exact repeated generated line');
  }, 10_000);

  it('resumes, verifies, and reuses downloads', async () => {
    const payload = Buffer.from('snice-gauntlet-download\n'.repeat(4096));
    const sha256 = createHash('sha256').update(payload).digest('hex');
    let requests = 0;
    const server = createServer((request, response) => {
      requests++;
      const range = request.headers.range?.match(/^bytes=(\d+)-$/);
      const start = range ? Number(range[1]) : 0;
      response.statusCode = start ? 206 : 200;
      response.setHeader('content-length', payload.length - start);
      if (start) response.setHeader('content-range', `bytes ${start}-${payload.length - 1}/${payload.length}`);
      response.end(payload.subarray(start));
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('test server did not bind a TCP port');

    const directory = await mkdtemp(join(tmpdir(), 'snice-gauntlet-'));
    temporaryDirectories.push(directory);
    const target = join(directory, 'model.gguf');
    await writeFile(`${target}.part`, payload.subarray(0, 137));
    const expected = {
      bytes: payload.length,
      sha256,
      url: `http://127.0.0.1:${address.port}/model.gguf`
    };

    try {
      await downloadVerified(expected, target, () => {});
      expect(await readFile(target)).toEqual(payload);
      expect(requests).toBe(1);
      await downloadVerified(expected, target, () => {});
      expect(requests).toBe(1);

      await writeFile(target, Buffer.alloc(payload.length, 0xff));
      await downloadVerified(expected, target, () => {});
      expect(requests).toBe(2);
      expect(await readFile(target)).toEqual(payload);
    } finally {
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
  });

  it('resolves a dry run without network or generated files', async () => {
    const { stdout, stderr } = await execFileAsync(process.execPath, [
      join(process.cwd(), 'tooling/testing/run-gauntlet.js'),
      '--dry-run',
      '--models', 'gemma3-270m'
    ]);
    expect(stderr).toBe('');
    expect(stdout).toContain('models: gemma3-270m');
    expect(stdout).toContain('prompt: sample:application');
    expect(stdout).toContain('processes: 1');
  });
});

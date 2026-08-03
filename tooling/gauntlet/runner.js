import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  chmodSync,
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync
} from 'node:fs';
import { availableParallelism } from 'node:os';
import { basename, dirname, join, relative, resolve } from 'node:path';
import process from 'node:process';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import {
  GAUNTLET_MODELS,
  LLAMA_CPP_RUNTIMES,
  LLAMA_CPP_VERSION,
  llamaRuntimeUrl
} from './manifest.js';

const moduleDirectory = dirname(fileURLToPath(import.meta.url));
export const packageRoot = resolve(moduleDirectory, '..', '..');
export const samplesDirectory = join(moduleDirectory, 'samples');
export const localRoot = join(packageRoot, '.local', 'gauntlet');

const activeChildren = new Set();
let stopping = false;

const valueOptions = new Set([
  'prompt',
  'prompt-file',
  'sample',
  'models',
  'output',
  'runtime',
  'concurrency',
  'threads'
]);
const booleanOptions = new Set([
  'help',
  'list-samples',
  'download-only',
  'dry-run',
  'skip-framework-build'
]);

export function printHelp() {
  console.log(`Snice dumb-agent gauntlet

Usage:
  npm run gauntlet
  npm run gauntlet -- --sample daemon
  npm run gauntlet -- --prompt "Build a strict TypeScript Snice app ..."
  npm run gauntlet -- --prompt-file ./my-prompt.txt

Options:
  --sample <name>              Use a committed prompt sample (default: application)
  --prompt <text>              Pass an inline prompt verbatim
  --prompt-file <path>         Read a prompt verbatim from a file
  --models <id,id,...|all>     Select models (default: all)
  --concurrency <number>       Concurrent model processes (default: up to 4)
  --threads <number>           llama.cpp threads per model (default: CPU-aware)
  --output <path>              New run directory (default: .local/gauntlet/runs/...)
  --runtime <path>             Use an existing llama-cli instead of the pinned runtime
  --download-only              Verify/download the runtime and selected models, then stop
  --skip-framework-build       Reuse the current dist/ instead of rebuilding it
  --dry-run                    Print the resolved plan without downloading or running
  --list-samples               List committed prompt samples
  --help                       Show this help

Environment:
  SNICE_GAUNTLET_LLAMA         Same purpose as --runtime

There is deliberately no token or time limit. Exact-output repetition is
classified as a failed generation and stopped; all raw output is preserved.`);
}

export function parseGauntletArgs(input) {
  const options = {};
  for (let index = 0; index < input.length; index++) {
    const argument = input[index];
    if (!argument.startsWith('--')) {
      throw new TypeError(`unexpected positional argument: ${argument}`);
    }

    const equals = argument.indexOf('=');
    const key = argument.slice(2, equals === -1 ? undefined : equals);
    if (!valueOptions.has(key) && !booleanOptions.has(key)) {
      throw new TypeError(`unknown option --${key}`);
    }
    if (booleanOptions.has(key)) {
      if (equals !== -1) throw new TypeError(`--${key} does not accept a value`);
      options[key] = true;
      continue;
    }

    const value = equals === -1 ? input[++index] : argument.slice(equals + 1);
    if (!value || value.startsWith('--')) throw new TypeError(`--${key} requires a value`);
    options[key] = value;
  }

  const promptOptions = ['prompt', 'prompt-file', 'sample'].filter(key => options[key] !== undefined);
  if (promptOptions.length > 1) {
    throw new TypeError('--prompt, --prompt-file, and --sample are mutually exclusive');
  }

  for (const key of ['concurrency', 'threads']) {
    if (options[key] === undefined) continue;
    const parsed = Number.parseInt(options[key], 10);
    if (!Number.isSafeInteger(parsed) || parsed < 1) throw new TypeError(`--${key} must be a positive integer`);
    options[key] = parsed;
  }
  return options;
}

export function listSamples() {
  return readdirSync(samplesDirectory)
    .filter(filename => filename.endsWith('.txt'))
    .map(filename => filename.slice(0, -4))
    .sort();
}

function readPrompt(options) {
  if (options.prompt !== undefined) {
    return { text: options.prompt.trim(), source: 'inline prompt', slug: 'prompt' };
  }
  if (options['prompt-file'] !== undefined) {
    const path = resolve(process.cwd(), options['prompt-file']);
    if (!existsSync(path)) throw new Error(`prompt file does not exist: ${path}`);
    return { text: readFileSync(path, 'utf8').trim(), source: path, slug: basename(path).replace(/\.[^.]+$/, '') };
  }

  const sample = options.sample ?? 'application';
  if (!/^[a-z0-9-]+$/.test(sample)) throw new TypeError(`invalid sample name: ${sample}`);
  const path = join(samplesDirectory, `${sample}.txt`);
  if (!existsSync(path)) {
    throw new Error(`unknown sample "${sample}"; available samples: ${listSamples().join(', ')}`);
  }
  return { text: readFileSync(path, 'utf8').trim(), source: `sample:${sample}`, slug: sample };
}

function selectModels(value) {
  if (!value || value === 'all') return [...GAUNTLET_MODELS];
  const ids = [...new Set(value.split(',').map(part => part.trim()).filter(Boolean))];
  const selected = ids.map(id => {
    const model = GAUNTLET_MODELS.find(candidate => candidate.id === id);
    if (!model) {
      throw new Error(`unknown model "${id}"; available models: ${GAUNTLET_MODELS.map(item => item.id).join(', ')}`);
    }
    return model;
  });
  if (!selected.length) throw new Error('--models selected no models');
  return selected;
}

function safeSlug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'prompt';
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function formatBytes(bytes) {
  const units = ['B', 'KiB', 'MiB', 'GiB'];
  let value = bytes;
  let unit = units[0];
  for (const next of units.slice(1)) {
    if (value < 1024) break;
    value /= 1024;
    unit = next;
  }
  return `${value.toFixed(unit === 'B' ? 0 : 1)} ${unit}`;
}

export async function sha256File(path) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}

async function isVerified(path, expected) {
  if (!existsSync(path) || statSync(path).size !== expected.bytes) return false;
  return await sha256File(path) === expected.sha256;
}

export async function downloadVerified(expected, target, logger = console.log) {
  mkdirSync(dirname(target), { recursive: true });
  if (await isVerified(target, expected)) {
    logger(`[gauntlet] ✓ ${basename(target)} (${formatBytes(expected.bytes)}, verified)`);
    return target;
  }

  const partial = `${target}.part`;
  let offset = existsSync(partial) ? statSync(partial).size : 0;
  if (offset > expected.bytes) {
    rmSync(partial, { force: true });
    offset = 0;
  }

  logger(`[gauntlet] ↓ ${basename(target)} (${formatBytes(expected.bytes)}${offset ? `, resuming at ${formatBytes(offset)}` : ''})`);
  const headers = offset ? { Range: `bytes=${offset}-` } : undefined;
  const response = await fetch(expected.url, { headers, redirect: 'follow' });
  if (!response.ok) throw new Error(`download failed for ${expected.url}: HTTP ${response.status}`);
  if (!response.body) throw new Error(`download returned no body for ${expected.url}`);

  const append = offset > 0 && response.status === 206;
  if (!append) offset = 0;
  await pipeline(Readable.fromWeb(response.body), createWriteStream(partial, { flags: append ? 'a' : 'w' }));

  const actualBytes = statSync(partial).size;
  const actualHash = actualBytes === expected.bytes ? await sha256File(partial) : null;
  if (actualBytes !== expected.bytes || actualHash !== expected.sha256) {
    rmSync(partial, { force: true });
    throw new Error(
      `verification failed for ${basename(target)}: expected ${expected.bytes} bytes / ${expected.sha256}, ` +
      `received ${actualBytes} bytes / ${actualHash ?? 'size mismatch'}`
    );
  }

  if (existsSync(target)) rmSync(target, { force: true });
  renameSync(partial, target);
  logger(`[gauntlet] ✓ ${basename(target)} (${formatBytes(expected.bytes)}, verified)`);
  return target;
}

function terminateChild(child, signal = 'SIGTERM') {
  try {
    if (process.platform === 'win32') child.kill(signal);
    else process.kill(-child.pid, signal);
  } catch {}
}

function stopChildren() {
  if (stopping) return;
  stopping = true;
  for (const child of activeChildren) terminateChild(child);
}

function spawnCaptured(command, args, options = {}) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? packageRoot,
      env: { ...process.env, ...options.env },
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: process.platform !== 'win32'
    });
    activeChildren.add(child);
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.once('error', error => {
      activeChildren.delete(child);
      rejectPromise(error);
    });
    child.once('exit', (code, signal) => {
      activeChildren.delete(child);
      resolvePromise({ code: code ?? 1, signal, stdout, stderr });
    });
  });
}

function spawnInherited(command, args, options = {}) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? packageRoot,
      env: { ...process.env, ...options.env },
      stdio: 'inherit',
      detached: process.platform !== 'win32'
    });
    activeChildren.add(child);
    child.once('error', error => {
      activeChildren.delete(child);
      rejectPromise(error);
    });
    child.once('exit', (code, signal) => {
      activeChildren.delete(child);
      if (code === 0) resolvePromise();
      else rejectPromise(new Error(`${command} ${args.join(' ')} failed (${signal ?? `exit ${code}`})`));
    });
  });
}

async function ensureRuntime(options) {
  const explicit = options.runtime ?? process.env.SNICE_GAUNTLET_LLAMA;
  if (explicit) {
    const path = resolve(process.cwd(), explicit);
    if (!existsSync(path)) throw new Error(`llama-cli does not exist: ${path}`);
    return path;
  }

  const platformKey = `${process.platform}:${process.arch}`;
  const artifact = LLAMA_CPP_RUNTIMES[platformKey];
  if (!artifact) {
    throw new Error(
      `automatic llama.cpp setup is not available for ${platformKey}; install llama-cli and pass --runtime <path>`
    );
  }

  const versionRoot = join(localRoot, 'runtime', LLAMA_CPP_VERSION);
  const executable = join(versionRoot, `llama-${LLAMA_CPP_VERSION}`, 'llama-cli');
  if (existsSync(executable)) {
    const verification = await spawnCaptured(executable, ['--version'], {
      env: { LD_LIBRARY_PATH: dirname(executable), DYLD_LIBRARY_PATH: dirname(executable) }
    });
    if (
      verification.code === 0 &&
      `${verification.stdout}\n${verification.stderr}`.includes(LLAMA_CPP_VERSION.slice(1))
    ) {
      console.log(`[gauntlet] ✓ llama.cpp ${LLAMA_CPP_VERSION} (${platformKey}, executable verified)`);
      return executable;
    }
    console.warn(`[gauntlet] ! local llama.cpp runtime failed its version check; extracting a clean copy`);
  }

  const archive = join(localRoot, 'downloads', artifact.filename);
  await downloadVerified({ ...artifact, url: llamaRuntimeUrl(artifact.filename) }, archive);

  const staging = `${versionRoot}.extracting-${process.pid}`;
  rmSync(staging, { recursive: true, force: true });
  mkdirSync(staging, { recursive: true });
  const extraction = await spawnCaptured('tar', ['-xzf', archive, '-C', staging]);
  if (extraction.code !== 0) {
    rmSync(staging, { recursive: true, force: true });
    throw new Error(`could not extract llama.cpp runtime: ${extraction.stderr || extraction.stdout}`);
  }
  const stagedExecutable = join(staging, `llama-${LLAMA_CPP_VERSION}`, 'llama-cli');
  if (!existsSync(stagedExecutable)) {
    rmSync(staging, { recursive: true, force: true });
    throw new Error(`llama.cpp archive did not contain llama-${LLAMA_CPP_VERSION}/llama-cli`);
  }

  rmSync(versionRoot, { recursive: true, force: true });
  renameSync(staging, versionRoot);
  chmodSync(executable, 0o755);
  console.log(`[gauntlet] ✓ llama.cpp ${LLAMA_CPP_VERSION} (${platformKey})`);
  return executable;
}

async function mapConcurrent(items, concurrency, operation) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (true) {
      const index = next++;
      if (index >= items.length) return;
      results[index] = await operation(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

async function ensureModels(models) {
  const modelDirectory = join(localRoot, 'models');
  const paths = await mapConcurrent(models, Math.min(3, models.length), async model => {
    const target = join(modelDirectory, model.filename);
    const legacyTarget = join(packageRoot, '.local', 'local-model', 'model', model.filename);
    if (await isVerified(legacyTarget, model)) {
      console.log(`[gauntlet] ✓ ${model.filename} (${formatBytes(model.bytes)}, verified legacy cache)`);
      return [model.id, legacyTarget];
    }
    await downloadVerified(model, target);
    return [model.id, target];
  });
  return new Map(paths);
}

function makeProject(projectDirectory, prompt, model) {
  mkdirSync(join(projectDirectory, 'src'), { recursive: true });
  mkdirSync(join(projectDirectory, 'node_modules'), { recursive: true });
  const sniceLink = join(projectDirectory, 'node_modules', 'snice');
  if (!existsSync(sniceLink)) {
    symlinkSync(packageRoot, sniceLink, process.platform === 'win32' ? 'junction' : 'dir');
  }

  const sniceFilePath = relative(projectDirectory, packageRoot).replaceAll('\\', '/');
  writeFileSync(join(projectDirectory, 'package.json'), `${JSON.stringify({
    name: `snice-gauntlet-${model.id}`,
    private: true,
    version: '0.0.0',
    type: 'module',
    scripts: {
      'type-check': 'tsc --noEmit',
      build: 'vite build'
    },
    dependencies: { snice: `file:${sniceFilePath}` },
    devDependencies: {
      typescript: '^5.3.3',
      'unplugin-swc': '^1.5.7',
      vite: '^5.0.10'
    }
  }, null, 2)}\n`);
  writeFileSync(join(projectDirectory, 'tsconfig.json'), `${JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      lib: ['ES2022', 'DOM', 'DOM.Iterable'],
      skipLibCheck: true,
      moduleResolution: 'bundler',
      isolatedModules: true,
      noEmit: true,
      strict: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noFallthroughCasesInSwitch: true,
      experimentalDecorators: false,
      emitDecoratorMetadata: false,
      useDefineForClassFields: false,
      types: ['vite/client']
    },
    include: ['src']
  }, null, 2)}\n`);
  writeFileSync(join(projectDirectory, 'vite.config.ts'), `import { defineConfig } from 'vite';
import swc from 'unplugin-swc';

export default defineConfig({
  plugins: [
    swc.vite({
      jsc: {
        parser: { syntax: 'typescript', decorators: true },
        target: 'es2022',
        transform: {
          decoratorMetadata: false,
          decoratorVersion: '2022-03',
          useDefineForClassFields: false,
        },
      },
    }),
  ],
});
`);
  writeFileSync(join(projectDirectory, 'index.html'), `<!doctype html>
<html lang="en">
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Snice gauntlet</title></head>
  <body><script type="module" src="/src/main.ts"></script></body>
</html>
`);
  writeFileSync(join(projectDirectory, 'prompt.txt'), `${prompt.trim()}\n`);
}

export function repeatedOutput(text) {
  if (text.length < 8_192) return null;
  const tail = text.slice(-16_384);
  const lines = tail.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (lines.length >= 12) {
    const last = lines.at(-1);
    let count = 0;
    for (let index = lines.length - 1; index >= 0 && lines[index] === last; index--) count++;
    if (last.length >= 8 && count >= 12) return `line repeated ${count} times`;
  }

  for (const width of [32, 64, 128, 256, 512]) {
    const unit = tail.slice(-width);
    if (unit.trim().length < width / 4) continue;
    let count = 1;
    while (count < 12 && tail.slice(-(count + 1) * width, -count * width) === unit) count++;
    if (count >= 8) return `${width}-character block repeated ${count} times`;
  }

  // A model can repeat the same phrase with changing indentation, counters,
  // or short prefixes. That is still exact repetition, but the repeated unit
  // is no longer aligned with the end of the stream. Sample recent substrings
  // and count their non-overlapping occurrences anywhere in the tail.
  for (const width of [48, 96, 192]) {
    for (let offset = 0; offset <= 480 && offset + width <= tail.length; offset += 32) {
      const end = tail.length - offset;
      const unit = tail.slice(end - width, end);
      if (unit.trim().length < width / 2) continue;
      let occurrences = 0;
      let position = 0;
      while (occurrences < 10) {
        const found = tail.indexOf(unit, position);
        if (found === -1) break;
        occurrences++;
        position = found + width;
      }
      if (occurrences >= 10) return `${width}-character substring repeated ${occurrences} times`;
    }
  }
  return null;
}

export function runModel({ runtime, modelPath, projectDirectory, threads }) {
  const logPath = join(projectDirectory, 'generation.log');
  const log = createWriteStream(logPath, { flags: 'w' });
  const runtimeDirectory = dirname(runtime);
  const libraryVariable = process.platform === 'darwin' ? 'DYLD_LIBRARY_PATH' : 'LD_LIBRARY_PATH';
  const currentLibraryPath = process.env[libraryVariable];
  const startedAt = Date.now();

  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(runtime, [
      '-m', modelPath,
      '-f', 'prompt.txt',
      '-t', String(threads),
      '--single-turn',
      '--simple-io',
      '--no-display-prompt',
      '--color', 'off',
      '-o', 'raw-output.txt'
    ], {
      cwd: projectDirectory,
      env: {
        ...process.env,
        [libraryVariable]: currentLibraryPath ? `${runtimeDirectory}:${currentLibraryPath}` : runtimeDirectory
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: process.platform !== 'win32'
    });
    activeChildren.add(child);
    let repetition = null;
    let liveOutput = '';
    const recordOutput = chunk => {
      log.write(chunk);
      liveOutput = `${liveOutput}${chunk}`.slice(-32_768);
      if (repetition) return;
      repetition = repeatedOutput(liveOutput);
      if (repetition) terminateChild(child);
    };
    child.stdout.on('data', recordOutput);
    child.stderr.on('data', recordOutput);

    child.once('error', error => {
      activeChildren.delete(child);
      log.end();
      rejectPromise(error);
    });
    child.once('close', (code, signal) => {
      activeChildren.delete(child);
      log.end();
      resolvePromise({
        code: code ?? 1,
        signal,
        repetition,
        durationMs: Date.now() - startedAt
      });
    });
  });
}

export function extractTypeScript(raw) {
  let text = raw.replace(/\u001b\[[0-9;]*m/g, '').trim();
  const assistantMarker = text.lastIndexOf('\nAssistant:');
  if (assistantMarker !== -1) text = text.slice(assistantMarker + '\nAssistant:'.length).trim();
  else if (text.startsWith('Assistant:')) text = text.slice('Assistant:'.length).trim();
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  text = text.replace(/\[Start thinking\][\s\S]*?\[End thinking\]/gi, '').trim();
  const acceptedFenceLabels = new Set(['', 'typescript', 'ts', 'tsx', 'javascript', 'js']);
  const fences = [...text.matchAll(/^[ \t]*```([^\r\n]*)\r?\n([\s\S]*?)^[ \t]*```[ \t]*$/gm)]
    .filter(match => acceptedFenceLabels.has(match[1].trim().toLowerCase()))
    .map(match => match[2].trim())
    .filter(Boolean)
    .sort((left, right) => right.length - left.length);
  if (fences.length) text = fences[0];
  text = text.replace(/^```[^\n]*\n?/, '').replace(/\n?```$/, '').trim();
  return text;
}

const generatedSourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.css']);

function generatedSourcePath(value) {
  const path = value.trim();
  if (
    !path.startsWith('src/') ||
    path.includes('\\') ||
    path.includes('\0') ||
    path.split('/').some(part => !part || part === '.' || part === '..')
  ) {
    throw new TypeError(`generated file path must be a safe path below src/: ${value}`);
  }
  const extension = [...generatedSourceExtensions].find(candidate => path.endsWith(candidate));
  if (!extension) {
    throw new TypeError(`generated file path has an unsupported source extension: ${path}`);
  }
  return path;
}

function unwrapSourceFence(source) {
  const text = source.trim();
  const match = text.match(/^```(?:typescript|ts|tsx|javascript|js|css)?[ \t]*\r?\n([\s\S]*?)\r?\n```$/i);
  return (match?.[1] ?? text).trim();
}

/**
 * Extracts a generated source tree while retaining the one-file protocol used
 * by older samples and arbitrary prompts. Multi-file prompts use explicit file
 * markers so paths can be validated before anything is written to disk.
 */
export function extractProjectFiles(raw) {
  let text = raw.replace(/\u001b\[[0-9;]*m/g, '').trim();
  const assistantMarker = text.lastIndexOf('\nAssistant:');
  if (assistantMarker !== -1) text = text.slice(assistantMarker + '\nAssistant:'.length).trim();
  else if (text.startsWith('Assistant:')) text = text.slice('Assistant:'.length).trim();
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  text = text.replace(/\[Start thinking\][\s\S]*?\[End thinking\]/gi, '').trim();
  if (!text.includes('<<<FILE:') && !text.includes('<<<END FILE>>>')) {
    const source = extractTypeScript(raw);
    return source ? [{ path: 'src/main.ts', source }] : [];
  }

  const files = [];
  const paths = new Set();
  const headers = [...text.matchAll(/^[ \t]*<<<FILE:[ \t]*([^>\r\n]+?)[ \t]*>>>[ \t]*$/gm)];
  for (let index = 0; index < headers.length; index++) {
    const header = headers[index];
    const path = generatedSourcePath(header[1]);
    if (paths.has(path)) throw new TypeError(`duplicate generated file path: ${path}`);
    const start = header.index + header[0].length;
    const next = headers[index + 1]?.index ?? text.length;
    let section = text.slice(start, next);
    const endMarker = section.search(/^[ \t]*<<<END FILE>>>[ \t]*$/m);
    if (endMarker !== -1) section = section.slice(0, endMarker);
    const source = unwrapSourceFence(section);
    if (!source) throw new TypeError(`generated file is empty: ${path}`);
    paths.add(path);
    files.push({ path, source });
  }

  if (!files.length) {
    throw new TypeError('multi-file markers were present but no complete source file could be extracted');
  }
  return files;
}

async function runChecks(projectDirectory) {
  const checks = [
    {
      name: 'checker',
      command: process.execPath,
      args: [join(packageRoot, 'bin', 'snice.js'), 'check', '.', '--json']
    },
    {
      name: 'typecheck',
      command: process.execPath,
      args: [join(packageRoot, 'node_modules', 'typescript', 'bin', 'tsc'), '--noEmit', '--project', 'tsconfig.json']
    },
    {
      name: 'build',
      command: process.execPath,
      args: [join(packageRoot, 'node_modules', 'vite', 'bin', 'vite.js'), 'build']
    }
  ];
  const results = {};
  for (const check of checks) {
    const startedAt = Date.now();
    const result = await spawnCaptured(check.command, check.args, { cwd: projectDirectory });
    const log = `${result.stdout}${result.stderr ? `${result.stdout ? '\n' : ''}${result.stderr}` : ''}`;
    writeFileSync(join(projectDirectory, `${check.name}.log`), log);
    results[check.name] = {
      code: result.code,
      signal: result.signal,
      durationMs: Date.now() - startedAt
    };
  }
  return results;
}

function status(result) {
  if (!result) return 'skipped';
  if (result.repetition) return 'repetition';
  return result.code === 0 ? 'pass' : 'fail';
}

function writeSummary(runDirectory, prompt, results) {
  const lines = [
    '# Snice dumb-agent gauntlet',
    '',
    `Prompt: ${prompt.source}`,
    '',
    '| Model | Generation | Extraction | Checker | TypeScript | Build |',
    '|---|---:|---:|---:|---:|---:|'
  ];
  for (const result of results) {
    lines.push(
      `| ${result.model.id} | ${status(result.generation)} | ${result.extraction.ok ? 'pass' : 'fail'} | ` +
      `${status(result.checks?.checker)} | ` +
      `${status(result.checks?.typecheck)} | ${status(result.checks?.build)} |`
    );
  }
  lines.push('', 'Raw output and exact logs live in each model directory.', '');
  writeFileSync(join(runDirectory, 'summary.md'), lines.join('\n'));
}

async function runModelRound(context, model) {
  const projectDirectory = join(context.runDirectory, model.id);
  makeProject(projectDirectory, context.prompt.text, model);
  console.log(`[gauntlet] ▶ ${model.id}`);
  const generation = await runModel({
    runtime: context.runtime,
    modelPath: context.modelPaths.get(model.id),
    model,
    projectDirectory,
    threads: context.threads
  });

  const rawPath = join(projectDirectory, 'raw-output.txt');
  const raw = existsSync(rawPath) ? readFileSync(rawPath, 'utf8') : '';
  let files = [];
  let extractionError = null;
  try {
    files = extractProjectFiles(raw);
  } catch (error) {
    extractionError = error instanceof Error ? error.message : String(error);
  }
  let checks = null;
  if (files.length) {
    for (const file of files) {
      const target = join(projectDirectory, file.path);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, `${file.source}\n`);
    }
    checks = await runChecks(projectDirectory);
  } else {
    writeFileSync(
      join(projectDirectory, 'extraction.log'),
      `${extractionError ?? 'No TypeScript source could be extracted from raw-output.txt.'}\n`
    );
  }

  const result = {
    model: { id: model.id, label: model.label, family: model.family, source: model.source },
    generation,
    extraction: {
      ok: files.length > 0,
      files: files.map(file => file.path),
      bytes: files.reduce((total, file) => total + Buffer.byteLength(file.source), 0),
      ...(extractionError ? { error: extractionError } : {})
    },
    checks
  };
  writeFileSync(join(projectDirectory, 'result.json'), `${JSON.stringify(result, null, 2)}\n`);
  console.log(
    `[gauntlet] ${generation.repetition ? '✗' : '✓'} ${model.id}: generation=${status(generation)}, ` +
    `checker=${status(checks?.checker)}, typecheck=${status(checks?.typecheck)}, build=${status(checks?.build)}`
  );
  return result;
}

function validateRunDirectory(path) {
  if (!existsSync(path)) return;
  if (readdirSync(path).length) throw new Error(`output directory is not empty: ${path}`);
}

export async function runGauntlet(options) {
  const models = selectModels(options.models);
  const prompt = options['download-only'] ? null : readPrompt(options);
  const concurrency = options.concurrency ?? Math.min(4, models.length);
  const threads = options.threads ?? Math.max(2, Math.floor(availableParallelism() / concurrency));
  const runDirectory = options.output
    ? resolve(process.cwd(), options.output)
    : join(localRoot, 'runs', `${timestamp()}-${safeSlug(prompt?.slug ?? 'download')}`);

  console.log(`[gauntlet] models: ${models.map(model => model.id).join(', ')}`);
  console.log(`[gauntlet] model storage: ${join(localRoot, 'models')}`);
  if (prompt) console.log(`[gauntlet] prompt: ${prompt.source}`);
  if (!options['download-only']) {
    console.log(`[gauntlet] processes: ${concurrency}; threads per model: ${threads}`);
    console.log(`[gauntlet] output: ${runDirectory}`);
  }

  if (options['dry-run']) return { models, prompt, concurrency, threads, runDirectory };

  const runtime = await ensureRuntime(options);
  const modelPaths = await ensureModels(models);
  if (options['download-only']) return { models, runtime, modelPaths };

  if (!options['skip-framework-build']) {
    console.log('[gauntlet] building the current distribution used by generated projects');
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    await spawnInherited(npm, ['run', 'build:distribution']);
  } else if (!existsSync(join(packageRoot, 'dist', 'index.d.ts'))) {
    throw new Error('--skip-framework-build requires an existing dist/index.d.ts');
  }

  validateRunDirectory(runDirectory);
  mkdirSync(runDirectory, { recursive: true });
  writeFileSync(join(runDirectory, 'prompt.txt'), `${prompt.text}\n`);
  writeFileSync(join(runDirectory, 'run.json'), `${JSON.stringify({
    createdAt: new Date().toISOString(),
    prompt: { source: prompt.source },
    models: models.map(model => ({ id: model.id, label: model.label, sha256: model.sha256, source: model.source })),
    runtime: { version: LLAMA_CPP_VERSION, path: runtime },
    concurrency,
    threads
  }, null, 2)}\n`);

  const results = await mapConcurrent(models, concurrency, model => runModelRound({
    runDirectory,
    prompt,
    runtime,
    modelPaths,
    threads
  }, model));
  writeSummary(runDirectory, prompt, results);
  console.log(`[gauntlet] complete: ${join(runDirectory, 'summary.md')}`);
  return { models, prompt, runtime, modelPaths, runDirectory, results };
}

export async function main(input = process.argv.slice(2)) {
  const options = parseGauntletArgs(input);
  if (options.help) {
    printHelp();
    return;
  }
  if (options['list-samples']) {
    for (const sample of listSamples()) console.log(sample);
    return;
  }
  await runGauntlet(options);
}

process.once('SIGINT', () => {
  stopChildren();
  process.exitCode = 130;
});
process.once('SIGTERM', () => {
  stopChildren();
  process.exitCode = 143;
});

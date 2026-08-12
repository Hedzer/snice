#!/usr/bin/env node

import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync
} from 'node:fs';
import { execFile } from 'node:child_process';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { analyzeProject, findImports, isTypeOnlyImport, maskComments } from './project-analyzer.js';
import { generateComponentSource } from './component-scaffold.js';

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(__dirname, '..');
const packageJson = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));
const argv = process.argv.slice(2);
const command = argv[0];
const DIAGNOSTIC_IGNORE_FILENAME = '.sniceignore';

function help() {
  console.log(`Snice CLI ${packageJson.version}

Usage:
  snice create-app <path> [--template=default|react]
  snice init-ai [path] [--force]
  snice check [path] [--json]
  snice doctor [path] [--json]
  snice validate [path] [--json]
  snice generate-component <name> [--props=a:string,b:number] [--events=x-changed] [--no-styles] [--out=path]
  snice build-component <name> [options]
  snice --version

Commands:
  create-app       Create a complete Vanilla or React application.
  init-ai          Install the version-matched Snice skill and agent pointers.
  check             Run all package, configuration, and source checks.
  doctor           Diagnose configuration, imports, dependencies, and AI setup.
  validate         Run the source analyzer only.
  generate-component  Print a current Snice element scaffold (use --out to write it).
  build-component  Build a CDN component from a Snice source checkout.

AI setup:
  npx snice init-ai   Install version-matched guidance before an agent writes Snice code.

Diagnostics:
  .sniceignore        Suppress diagnostic codes globally or at an exact source location.

Build options:
  --output=<dir>       Output directory (default: ./dist/cdn)
  --format=iife,es     Output formats (default: iife; table: iife,es)
  --no-minify          Disable minification
  --with-theme         Include theme.css
`);
}

function fail(message, showHelp = false) {
  console.error(`Error: ${message}`);
  if (showHelp) help();
  process.exitCode = 1;
}

function parseArgs(input, allowed) {
  const positional = [];
  const options = {};
  for (let index = 0; index < input.length; index++) {
    const arg = input[index];
    if (!arg.startsWith('--')) {
      positional.push(arg);
      continue;
    }

    const equals = arg.indexOf('=');
    let key = arg.slice(2, equals === -1 ? undefined : equals);
    let value = equals === -1 ? true : arg.slice(equals + 1);
    if (key.startsWith('no-')) {
      key = key.slice(3);
      value = false;
    } else if (equals === -1 && input[index + 1] && !input[index + 1].startsWith('-') && allowed.values?.has(key)) {
      value = input[++index];
    }
    if (!allowed.keys.has(key)) throw new TypeError(`unknown option --${key}`);
    options[key] = value;
  }
  return { positional, options };
}

function copyTemplateFiles(sourceDir, targetDir, projectName) {
  for (const entry of readdirSync(sourceDir, { withFileTypes: true })) {
    const source = join(sourceDir, entry.name);
    const target = join(targetDir, entry.name);
    if (entry.isDirectory()) {
      mkdirSync(target, { recursive: true });
      copyTemplateFiles(source, target, projectName);
      continue;
    }
    const content = readFileSync(source, 'utf8').replace(/\{\{projectName\}\}/g, projectName);
    writeFileSync(target, content);
  }
}

/**
 * Print a current Snice element scaffold, or write it to a file.
 *
 * Prints by default so the output can be piped or reviewed before it lands;
 * `--out` is the explicit opt-in to touching the filesystem, and never
 * overwrites an existing file.
 */
function generateComponent(name, options = {}) {
  const parseList = (value) =>
    typeof value === 'string' ? value.split(',').map(part => part.trim()).filter(Boolean) : [];

  const properties = parseList(options.props).map(entry => {
    const [propertyName, type] = entry.split(':').map(part => part.trim());
    return type ? { name: propertyName, type } : { name: propertyName };
  });

  const source = generateComponentSource({
    name,
    properties,
    withEvents: parseList(options.events),
    withStyles: options.styles !== false
  });

  if (typeof options.out !== 'string') {
    process.stdout.write(source);
    return;
  }

  const target = resolve(process.cwd(), options.out);
  if (existsSync(target)) {
    throw new Error(`refusing to overwrite ${options.out}`);
  }
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, source);
  console.log(`  wrote ${options.out}`);
}

function installAiSupport(targetDir, force = false) {
  const sourceSkill = join(packageRoot, '.agents', 'skills', 'snice');
  const targetSkill = join(targetDir, '.agents', 'skills', 'snice');
  if (!existsSync(sourceSkill)) throw new Error(`shipped Snice skill is missing: ${sourceSkill}`);
  if (!existsSync(targetSkill) || force) {
    mkdirSync(dirname(targetSkill), { recursive: true });
    cpSync(sourceSkill, targetSkill, { recursive: true, force: true });
    console.log('  installed .agents/skills/snice');
  } else {
    console.log('  kept existing .agents/skills/snice (use --force to replace)');
  }

  const guidance = readFileSync(join(__dirname, 'templates', 'AI_GUIDANCE.md'), 'utf8');
  for (const filename of ['AGENTS.md', 'CLAUDE.md']) {
    const target = join(targetDir, filename);
    if (!existsSync(target) || force) {
      writeFileSync(target, guidance);
      console.log(`  wrote ${filename}`);
    } else {
      console.log(`  kept existing ${filename}`);
    }
  }
}

function createApp(projectPath, template) {
  if (!projectPath) throw new TypeError('create-app requires a project path; use "." for the current directory');
  if (projectPath.includes('\0')) throw new TypeError('project path contains a null byte');
  if (!['default', 'react'].includes(template)) throw new TypeError(`unknown template "${template}"`);

  const targetDir = resolve(process.cwd(), projectPath);
  const projectName = projectPath === '.' ? basename(targetDir) : basename(projectPath);
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(projectName)) {
    throw new TypeError(`"${projectName}" is not a valid npm package name`);
  }

  if (existsSync(targetDir)) {
    const blocking = readdirSync(targetDir).filter(name => !name.startsWith('.') && name !== 'node_modules');
    if (blocking.length) throw new Error(`directory is not empty: ${targetDir}`);
  } else {
    mkdirSync(targetDir, { recursive: true });
  }

  console.log(`Creating Snice app (${template === 'react' ? 'React' : 'Vanilla'}) in ${targetDir}`);
  copyTemplateFiles(join(__dirname, 'templates', template), targetDir, projectName);
  // Stored without the leading dot: npm strips .gitignore from published
  // tarballs, so a dotted source file is missing for every installed user.
  const gitignore = readFileSync(join(__dirname, 'templates', 'gitignore'), 'utf8');
  writeFileSync(join(targetDir, '.gitignore'), gitignore);
  installAiSupport(targetDir, true);
  console.log(`\nNext:\n  ${projectPath === '.' ? '' : `cd ${projectPath}\n  `}npm install\n  npm run type-check\n  npm run dev`);
}

function walkSource(root) {
  if (!existsSync(root)) return [];
  const files = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || ['node_modules', 'dist', 'coverage'].includes(entry.name)) continue;
    const path = join(root, entry.name);
    if (entry.isDirectory()) files.push(...walkSource(path));
    else if (/\.(?:[cm]?[jt]sx?|html)$/.test(entry.name)) files.push(path);
  }
  return files;
}

function validateProject(targetDir, json = false) {
  const ignored = readDiagnosticIgnores(targetDir);
  const issues = collectValidationIssues(targetDir, ignored);
  renderValidation(issues, json);
  return issues;
}

function collectValidationIssues(targetDir, ignored = readDiagnosticIgnores(targetDir)) {
  const sourceRoot = existsSync(join(targetDir, 'src')) ? join(targetDir, 'src') : targetDir;
  const projectFiles = ['package.json', 'tsconfig.json', 'index.html']
    .map(filename => join(targetDir, filename))
    .filter(existsSync);
  const files = [...new Set([...projectFiles, ...walkSource(sourceRoot)])].sort();
  const issues = analyzeProject(files.map(file => ({
    filename: file,
    source: readFileSync(file, 'utf8')
  })));
  return filterIgnoredDiagnostics(issues, ignored, targetDir);
}

function readDiagnosticIgnores(targetDir) {
  const path = join(targetDir, DIAGNOSTIC_IGNORE_FILENAME);
  if (!existsSync(path)) return [];

  const entries = [];
  for (const authoredLine of readFileSync(path, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const line = authoredLine.replace(/\s+#.*$/, '').trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.search(/\s/);
    const code = separator < 0 ? line : line.slice(0, separator);
    const locator = separator < 0 ? '' : line.slice(separator).trim();
    if (!locator) {
      entries.push({ code });
      continue;
    }

    let file = locator;
    let lineNumber;
    let column;
    const exact = /^(.*):(\d+):(\d+)$/.exec(locator);
    const lineOnly = exact ? null : /^(.*):(\d+)$/.exec(locator);
    if (exact) {
      file = exact[1];
      lineNumber = Number(exact[2]);
      column = Number(exact[3]);
    } else if (lineOnly) {
      file = lineOnly[1];
      lineNumber = Number(lineOnly[2]);
    }
    if (!file) continue;
    entries.push({ code, file: normalizeDiagnosticPath(file), line: lineNumber, column });
  }
  return entries;
}

function filterIgnoredDiagnostics(diagnostics, ignored, targetDir) {
  if (!ignored.length) return diagnostics;
  return diagnostics.filter(diagnostic => !ignored.some(entry => {
    const code = diagnostic.code ?? diagnostic.ruleId;
    if (entry.code !== code) return false;
    if (!entry.file) return true;
    if (!diagnostic.file) return false;
    const absolute = isAbsolute(diagnostic.file)
      ? diagnostic.file
      : resolve(targetDir, diagnostic.file);
    if (normalizeDiagnosticPath(relative(targetDir, absolute)) !== entry.file) return false;
    if (entry.line !== undefined && diagnostic.line !== entry.line) return false;
    if (entry.column !== undefined && diagnostic.column !== entry.column) return false;
    return true;
  }));
}

function normalizeDiagnosticPath(path) {
  return path.replaceAll('\\', '/').replace(/^\.\//, '');
}

function renderValidation(issues, json = false) {
  if (json) console.log(JSON.stringify({ valid: !issues.some(issue => issue.severity === 'error'), issues }, null, 2));
  else if (!issues.length) console.log('No Snice authoring issues found.');
  else {
    for (const issue of issues) {
      console.log(
        `[${issue.severity.toUpperCase()}] ${issue.file ?? ''}:${issue.line}:${issue.column} ${issue.code}\n` +
        `  ${issue.message}\n  ${issue.fix}`
      );
    }
  }
  if (issues.some(issue => issue.severity === 'error')) process.exitCode = 1;
  return issues;
}

function parseJsonc(source) {
  let withoutComments = '';
  let inString = false;
  let escaped = false;

  for (let index = source.charCodeAt(0) === 0xFEFF ? 1 : 0; index < source.length; index++) {
    const character = source[index];
    const next = source[index + 1];

    if (inString) {
      withoutComments += character;
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') inString = false;
      continue;
    }

    if (character === '"') {
      inString = true;
      withoutComments += character;
      continue;
    }

    if (character === '/' && next === '/') {
      withoutComments += '  ';
      index += 2;
      while (index < source.length && source[index] !== '\n' && source[index] !== '\r') {
        withoutComments += ' ';
        index++;
      }
      if (index < source.length) withoutComments += source[index];
      continue;
    }

    if (character === '/' && next === '*') {
      withoutComments += '  ';
      index += 2;
      while (index < source.length && !(source[index] === '*' && source[index + 1] === '/')) {
        withoutComments += source[index] === '\n' || source[index] === '\r' ? source[index] : ' ';
        index++;
      }
      if (index >= source.length) throw new SyntaxError('unterminated JSON block comment');
      withoutComments += '  ';
      index++;
      continue;
    }

    withoutComments += character;
  }

  let withoutTrailingCommas = '';
  inString = false;
  escaped = false;
  for (let index = 0; index < withoutComments.length; index++) {
    const character = withoutComments[index];
    if (inString) {
      withoutTrailingCommas += character;
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') {
      inString = true;
      withoutTrailingCommas += character;
      continue;
    }
    if (character === ',') {
      let nextIndex = index + 1;
      while (/\s/.test(withoutComments[nextIndex] ?? '')) nextIndex++;
      if (withoutComments[nextIndex] === '}' || withoutComments[nextIndex] === ']') {
        withoutTrailingCommas += ' ';
        continue;
      }
    }
    withoutTrailingCommas += character;
  }

  return JSON.parse(withoutTrailingCommas);
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function readJsonc(path) {
  try {
    return parseJsonc(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Collect a project's tsconfig chain: the root tsconfig.json plus the configs
 * it references (composite solution files) and their relative `extends`
 * bases. Vite-style projects put compiler flags in tsconfig.app.json and
 * leave the root as a references-only solution file, so reading only the
 * root produces false "set useDefineForClassFields" guidance.
 */
function resolveTsconfigChain(dir, entry = 'tsconfig.json', seen = new Set()) {
  const configs = [];
  const target = resolve(dir, entry);
  if (seen.has(target)) return configs;
  seen.add(target);
  const data = readJsonc(target);
  if (!data) return configs;
  configs.push(data);
  const configDir = dirname(target);

  if (typeof data.extends === 'string' && (data.extends.startsWith('.') || isAbsolute(data.extends))) {
    const base = data.extends.endsWith('.json') ? data.extends : `${data.extends}.json`;
    configs.push(...resolveTsconfigChain(configDir, base, seen));
  }
  if (Array.isArray(data.references)) {
    for (const reference of data.references) {
      if (!reference || typeof reference.path !== 'string') continue;
      const referenced = reference.path.endsWith('.json')
        ? reference.path
        : join(reference.path, 'tsconfig.json');
      configs.push(...resolveTsconfigChain(configDir, referenced, seen));
    }
  }
  return configs;
}

async function doctor(targetDir, json = false) {
  const ignored = readDiagnosticIgnores(targetDir);
  const findings = await collectDoctorFindings(targetDir, ignored);
  renderDoctor(findings, json);
  return findings;
}

/**
 * Empirical decorator-transform probe. Config inspection (experimentalDecorators,
 * useDefineForClassFields) cannot see what the build pipeline actually does with
 * TC39 decorators: a default Vite/esbuild build silently drops field decorators
 * (@query/@state/@property), leaving elements without their decorated accessors.
 * Build a tiny module through the project's own Vite setup and check a field
 * decorator marker survives. Skipped unless the project uses field decorators
 * in source and has a locally installed Vite.
 */
const FIELD_DECORATOR_PATTERN = /@(?:query|queryAll|state|property|watch|observe|context|dispatch|on|request|respond)\s*\(/;

const DECORATOR_PROBE_SOURCE = `function probeClass(tag) {
  return (cls) => cls;
}
function probeField(marker) {
  return (value, ctx) =>
    function (initial) {
      this.constructor.prototype[marker] = true;
      return initial;
    };
}

@probeClass('probe-class')
class SniceDoctorProbe extends HTMLElement {
  @probeField('snice-doctor-probe-installed')
  $probe;
}
export { SniceDoctorProbe };
`;

async function probeDecoratorTransform(targetDir, add, projectPackage) {
  const declaresVite = Boolean(
    projectPackage?.dependencies?.vite || projectPackage?.devDependencies?.vite
  );
  const configFile = ['vite.config.ts', 'vite.config.js', 'vite.config.mts', 'vite.config.mjs']
    .map(name => join(targetDir, name))
    .find(existsSync);
  // Only projects that actually build with Vite — vite resolvable merely
  // through a transitive install is not a build setup.
  if (!declaresVite && !configFile) return;

  const sourceRoot = join(targetDir, 'src');
  const usesFieldDecorators = walkSource(sourceRoot).some(file =>
    /\.[cm]?ts$/.test(file) && FIELD_DECORATOR_PATTERN.test(readFileSync(file, 'utf8'))
  );
  if (!usesFieldDecorators) return;

  let vite;
  try {
    const projectRequire = createRequire(join(targetDir, 'package.json'));
    const vitePackagePath = projectRequire.resolve('vite/package.json');
    const viteRoot = dirname(vitePackagePath);
    const viteManifest = JSON.parse(readFileSync(vitePackagePath, 'utf8'));
    const importExport = viteManifest.exports?.['.']?.import;
    const entry = (typeof importExport === 'string' ? importExport : importExport?.default)
      ?? viteManifest.module ?? 'dist/node/index.js';
    vite = await import(pathToFileURL(join(viteRoot, entry)).href);
  } catch {
    return; // No local Vite install — the transform cannot be probed here.
  }

  const probeDir = mkdtempSync(join(tmpdir(), 'snice-doctor-probe-'));
  try {
    writeFileSync(join(probeDir, 'index.html'), '<script type="module" src="/probe.ts"></script>');
    writeFileSync(join(probeDir, 'probe.ts'), DECORATOR_PROBE_SOURCE);
    const outDir = join(probeDir, 'dist');
    await vite.build({
      root: probeDir,
      configFile: configFile ?? false,
      logLevel: 'silent',
      build: {
        outDir,
        emptyOutDir: true,
        minify: false,
        write: true,
        // Neutralize app-level output shaping (e.g. the create-app template's
        // manualChunks vendor entry) that cannot resolve in the probe root.
        rollupOptions: { output: { manualChunks: () => undefined } }
      }
    });
    const bundle = readdirSync(join(outDir, 'assets'))
      .filter(name => name.endsWith('.js'))
      .map(name => readFileSync(join(outDir, 'assets', name), 'utf8'))
      .join('\n');
    if (!bundle.includes('snice-doctor-probe-installed')) {
      add('error', 'decorator-transform',
        'the project build does not preserve TC39 field decorators (@query/@state/@property), so Snice elements silently lose their decorated accessors; use the create-app build setup (unplugin-swc with decoratorVersion 2022-03 and useDefineForClassFields: false) or an equivalent decorator transform');
    }
  } catch {
    // The probe only reports when a bundle could actually be inspected; a
    // failed probe build is the project's build problem, not Doctor's finding.
  } finally {
    rmSync(probeDir, { recursive: true, force: true });
  }
}

async function collectDoctorFindings(targetDir, ignored = readDiagnosticIgnores(targetDir)) {
  const findings = [];
  const add = (severity, code, message) => findings.push({ severity, code, message });
  const projectPackage = readJson(join(targetDir, 'package.json'));
  if (!projectPackage) add('error', 'package-json', 'package.json is missing or invalid');
  else if (projectPackage.name !== 'snice' && !projectPackage.dependencies?.snice && !projectPackage.devDependencies?.snice) {
    add('error', 'snice-dependency', 'snice is not declared as a project dependency');
  }

  const installedRoot = projectPackage?.name === 'snice' ? targetDir : join(targetDir, 'node_modules', 'snice');
  const installedPackage = readJson(join(installedRoot, 'package.json'));
  if (!installedPackage) add('error', 'snice-install', 'the declared Snice package is not installed');
  else add('info', 'snice-version', `using snice ${installedPackage.version}`);

  const tsconfigs = resolveTsconfigChain(targetDir);
  if (!tsconfigs.length) add('warning', 'tsconfig', 'tsconfig.json is missing or invalid');
  else {
    const compilers = tsconfigs.map(config => config.compilerOptions ?? {});
    if (compilers.some(compiler => compiler.experimentalDecorators === true)) {
      add('error', 'decorators', 'experimentalDecorators must be false');
    }
    if (!compilers.some(compiler => compiler.useDefineForClassFields === false)) {
      add('warning', 'class-fields', 'set useDefineForClassFields to false for the documented Snice field semantics');
    }
  }

  const sourceRoot = join(targetDir, 'src');
  for (const file of walkSource(sourceRoot)) {
    // Parse real imports from comment-masked source instead of scanning every
    // quoted string: an `import type` is erased by TypeScript and cannot
    // register a custom element, so it never receives the runtime .js check.
    const code = maskComments(readFileSync(file, 'utf8'));
    const specifiers = [];
    for (const entry of findImports(code)) {
      if (!entry.path.startsWith('snice/components/')) continue;
      if (isTypeOnlyImport(entry)) continue;
      specifiers.push({ index: entry.index, path: entry.path });
    }
    for (const match of code.matchAll(/\bimport\s*\(\s*(['"])(snice\/components\/[^'"]+)\1\s*\)/g)) {
      specifiers.push({ index: match.index, path: match[2] });
    }
    specifiers.sort((left, right) => left.index - right.index);
    for (const { path: specifier } of specifiers) {
      const segments = specifier.slice('snice/components/'.length).split('/');
      const component = segments[0];
      const leaf = segments.length > 1 ? segments.slice(1).join('/') : undefined;
      if (!leaf && component !== 'custom-elements') {
        add('error', 'component-import', `${specifier} is incomplete; use the documented deep side-effect import`);
        continue;
      }
      if (!installedPackage || component === 'theme') continue;
      const expected = join(installedRoot, 'dist', 'components', component, `${leaf}.js`);
      if (!existsSync(expected)) add('error', 'component-export', `${specifier} targets a missing package file`);
    }
  }

  if (!existsSync(join(targetDir, '.agents', 'skills', 'snice', 'SKILL.md'))) {
    add('warning', 'snice-skill', 'Snice skill is not installed; run npx snice init-ai');
  }

  await probeDecoratorTransform(targetDir, add, projectPackage);

  return filterIgnoredDiagnostics(findings, ignored, targetDir);
}

function renderDoctor(findings, json = false) {
  const errors = findings.filter(item => item.severity === 'error').length;
  const warnings = findings.filter(item => item.severity === 'warning').length;
  if (json) console.log(JSON.stringify({ ok: errors === 0, findings }, null, 2));
  else {
    for (const finding of findings) console.log(`[${finding.severity.toUpperCase()}] ${finding.code} ${finding.message}`);
    console.log(`Doctor finished with ${errors} error(s) and ${warnings} warning(s).`);
  }
  if (errors) process.exitCode = 1;
}

async function checkProject(targetDir, json = false) {
  const ignored = readDiagnosticIgnores(targetDir);
  const findings = await collectDoctorFindings(targetDir, ignored);
  const issues = collectValidationIssues(targetDir, ignored);
  const ok = !findings.some(item => item.severity === 'error') &&
    !issues.some(item => item.severity === 'error');

  if (json) {
    console.log(JSON.stringify({ ok, findings, issues }, null, 2));
  } else {
    console.log('Project configuration:');
    for (const finding of findings) console.log(`[${finding.severity.toUpperCase()}] ${finding.code} ${finding.message}`);
    console.log('\nSnice source:');
    if (!issues.length) console.log('No Snice authoring issues found.');
    for (const issue of issues) {
      console.log(
        `[${issue.severity.toUpperCase()}] ${issue.file ?? ''}:${issue.line}:${issue.column} ${issue.code}\n` +
        `  ${issue.message}\n  ${issue.fix}`
      );
    }
    console.log(`\nCheck ${ok ? 'passed' : 'failed'}.`);
  }
  if (!ok) process.exitCode = 1;
  return { ok, findings, issues };
}

async function buildComponent(componentName, options) {
  if (!componentName || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(componentName)) {
    throw new TypeError('build-component requires a kebab-case component name');
  }
  const componentsDir = join(process.cwd(), 'packages', 'components', 'src');
  const componentPath = join(componentsDir, componentName, `snice-${componentName}.ts`);
  const rollupConfig = join(process.cwd(), 'rollup.config.cdn.js');
  if (!existsSync(componentPath) || !existsSync(rollupConfig)) {
    throw new Error('build-component must run from a Snice source checkout containing the component and rollup.config.cdn.js');
  }

  const formats = String(options.format ?? (componentName === 'table' ? 'iife,es' : 'iife')).split(',');
  if (formats.some(format => !['iife', 'es'].includes(format))) throw new TypeError('format must contain only iife or es');
  const outputDir = resolve(process.cwd(), String(options.output ?? './dist/cdn'), componentName);
  const temporaryDir = mkdtempSync(join(tmpdir(), 'snice-rollup-'));
  const temporaryConfig = join(temporaryDir, 'rollup.config.mjs');
  writeFileSync(temporaryConfig, `import { createCdnBuild } from ${JSON.stringify(pathToFileURL(rollupConfig).href)};
export default createCdnBuild(${JSON.stringify(componentName)}, {
  minify: ${options.minify !== false},
  withTheme: ${options['with-theme'] === true},
  formats: ${JSON.stringify(formats)},
  outputDir: ${JSON.stringify(outputDir)}
});
`);

  try {
    const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const { stdout, stderr } = await execFileAsync(npx, ['rollup', '-c', temporaryConfig], {
      cwd: process.cwd(),
      maxBuffer: 10 * 1024 * 1024
    });
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
  } finally {
    rmSync(temporaryDir, { recursive: true, force: true });
  }
}

async function main() {
  try {
    if (!command || ['help', '--help', '-h'].includes(command)) {
      help();
      return;
    }
    if (['--version', '-v', 'version'].includes(command)) {
      console.log(packageJson.version);
      return;
    }
    if (command === 'create-app') {
      const { positional, options } = parseArgs(argv.slice(1), {
        keys: new Set(['template']),
        values: new Set(['template'])
      });
      if (positional.length > 1) throw new TypeError('create-app accepts one project path');
      createApp(positional[0], String(options.template ?? 'default'));
      return;
    }
    if (command === 'init-ai') {
      const { positional, options } = parseArgs(argv.slice(1), {
        keys: new Set(['force']),
        values: new Set()
      });
      if (positional.length > 1) throw new TypeError('init-ai accepts at most one path');
      installAiSupport(resolve(process.cwd(), positional[0] ?? '.'), options.force === true);
      return;
    }
    if (command === 'check' || command === 'doctor' || command === 'validate') {
      const { positional, options } = parseArgs(argv.slice(1), {
        keys: new Set(['json']),
        values: new Set()
      });
      if (positional.length > 1) throw new TypeError(`${command} accepts at most one path`);
      const target = resolve(process.cwd(), positional[0] ?? '.');
      if (command === 'check') await checkProject(target, options.json === true);
      else if (command === 'doctor') await doctor(target, options.json === true);
      else validateProject(target, options.json === true);
      return;
    }
    if (command === 'generate-component') {
      const { positional, options } = parseArgs(argv.slice(1), {
        keys: new Set(['props', 'events', 'styles', 'out']),
        values: new Set(['props', 'events', 'out'])
      });
      if (positional.length !== 1) throw new TypeError('generate-component accepts one component name');
      generateComponent(positional[0], options);
      return;
    }
    if (command === 'build-component') {
      const { positional, options } = parseArgs(argv.slice(1), {
        keys: new Set(['output', 'format', 'minify', 'with-theme']),
        values: new Set(['output', 'format'])
      });
      if (positional.length !== 1) throw new TypeError('build-component accepts one component name');
      await buildComponent(positional[0], options);
      return;
    }
    throw new TypeError(`unknown command "${command}"`);
  } catch (error) {
    fail(error.message);
  }
}

await main();

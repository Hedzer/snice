#!/usr/bin/env node

import { spawn, execSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const children = [];

function cleanup() {
  for (const child of children) {
    try { child.kill('SIGTERM'); } catch {}
  }
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('uncaughtException', (err) => {
  console.error('[dev] Uncaught exception:', err.message);
  cleanup();
});

function prefix(stream, label, color) {
  let buffer = '';
  stream.on('data', (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (line.trim()) console.log(`\x1b[${color}m[${label}]\x1b[0m ${line}`);
    }
  });
}

function spawnChild(label, color, command, args) {
  const child = spawn(command, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, FORCE_COLOR: '1' },
  });
  prefix(child.stdout, label, color);
  prefix(child.stderr, label, color);
  child.on('exit', (code) => {
    if (code !== null && code !== 0) {
      console.log(`\x1b[${color}m[${label}]\x1b[0m exited with code ${code}`);
    }
  });
  children.push(child);
  return child;
}

// Run website:build first
console.log('\x1b[36m[dev]\x1b[0m Running website:build...');
try {
  execSync('npm run website:build', { stdio: 'inherit', cwd: ROOT, env: { ...process.env, FORCE_COLOR: '1' } });
  console.log('\x1b[36m[dev]\x1b[0m website:build complete\n');
} catch {
  console.error('\x1b[36m[dev]\x1b[0m website:build failed');
  process.exit(1);
}

// Spawn vite servers
spawnChild('dev', '33', 'npx', ['vite']);
spawnChild('web', '35', 'npx', ['vite', '--port', '52891']);

console.log('\x1b[36m[dev]\x1b[0m Servers started');
console.log('\x1b[36m[dev]\x1b[0m Framework:  http://localhost:5566');
console.log('\x1b[36m[dev]\x1b[0m Website:    http://localhost:52891');
console.log('');

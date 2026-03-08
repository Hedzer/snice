#!/usr/bin/env node

import { execSync } from 'child_process';

const output = execSync('npx semantic-release --dry-run --no-ci 2>&1', { encoding: 'utf8' });
const match = output.match(/The next release version is ([\d.]+)/);

if (match) {
	process.stdout.write(match[1]);
} else {
	// No new release needed — fall back to current version
	const { readFileSync } = await import('fs');
	const { join, dirname } = await import('path');
	const { fileURLToPath } = await import('url');
	const __dirname = dirname(fileURLToPath(import.meta.url));
	const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'));
	process.stdout.write(pkg.version);
}

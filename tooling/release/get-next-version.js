#!/usr/bin/env node

import { execSync } from 'child_process';

const output = execSync('npx semantic-release --dry-run --no-ci 2>&1', { encoding: 'utf8' });
const match = output.match(/The next release version is ([\d.]+)/);

if (!match) {
	console.error('Could not determine next version. No releasable commits or network error.');
	console.error(output.slice(-500));
	process.exit(1);
}

process.stdout.write(match[1]);

#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use CLI argument if provided, otherwise read from package.json
const mainPackageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'));
const currentVersion = process.argv[2] || mainPackageJson.version;
const majorVersion = currentVersion.split('.')[0];
const versionRange = `^${majorVersion}.0.0`;

console.log(`\nSyncing template versions to snice@${versionRange} (current: ${currentVersion})...\n`);

// Get all template directories
const templatesDir = join(__dirname, '../bin/templates');
const templates = readdirSync(templatesDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);

let updated = 0;

for (const template of templates) {
  const packageJsonPath = join(templatesDir, template, 'package.json');

  try {
    const templatePackageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

    if (templatePackageJson.dependencies && templatePackageJson.dependencies.snice) {
      const oldVersion = templatePackageJson.dependencies.snice;

      if (oldVersion !== versionRange) {
        templatePackageJson.dependencies.snice = versionRange;
        writeFileSync(packageJsonPath, JSON.stringify(templatePackageJson, null, 2) + '\n');
        console.log(`  ✓ ${template}: ${oldVersion} → ${versionRange}`);
        updated++;
      } else {
        console.log(`  - ${template}: already at ${versionRange}`);
      }
    }
  } catch (error) {
    console.error(`  ✗ ${template}: ${error.message}`);
  }
}

console.log(`\n${updated} template(s) updated.\n`);

// Also sync version in public HTML files
const publicDir = join(__dirname, '../public');
const htmlFiles = ['index.html', 'components.html', 'decorators.html'];
const versionPattern = /Snice v[\d.]+/g;
const newVersionString = `Snice v${currentVersion}`;

console.log(`Syncing website version to v${currentVersion}...\n`);

let htmlUpdated = 0;
for (const file of htmlFiles) {
  const filePath = join(publicDir, file);
  try {
    let content = readFileSync(filePath, 'utf8');
    if (content.match(versionPattern)) {
      const newContent = content.replace(versionPattern, newVersionString);
      if (newContent !== content) {
        writeFileSync(filePath, newContent);
        console.log(`  ✓ ${file}: updated to v${currentVersion}`);
        htmlUpdated++;
      } else {
        console.log(`  - ${file}: already at v${currentVersion}`);
      }
    }
  } catch (error) {
    console.error(`  ✗ ${file}: ${error.message}`);
  }
}

console.log(`\n${htmlUpdated} HTML file(s) updated.\n`);
